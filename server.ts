import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies (large limit for images)
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.post("/api/extract-students", async (req, res) => {
    try {
      const { textData, fileData, mimeType } = req.body;
      
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = new GoogleGenAI({ apiKey: key });

      let contents: any[] = [];
      const prompt = `You are a helpful assistant. I will provide you with a list of students (either as text or an image/file).
Extract all the student names. Separate each student's name into 'firstName' and 'lastName'. 
Usually, in Persian names, the last part is the last name and the rest is the first name, but use your best judgment for Persian names.
Return the result EXACTLY as a JSON array of objects with the keys 'firstName' and 'lastName'. 
Do not include any markdown formatting like \`\`\`json, just output the raw JSON array.
Sort the array alphabetically by lastName first, then firstName (in Persian alphabetical order).`;

      if (fileData && mimeType) {
        // fileData should be a base64 string without the data URI prefix
        contents = [
          prompt,
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          }
        ];
      } else if (textData) {
        contents = [prompt + "\n\nData:\n" + textData];
      } else {
        return res.status(400).json({ error: "No data provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });

      let jsonStr = response.text || "[]";
      // Clean up markdown just in case
      jsonStr = jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();

      const students = JSON.parse(jsonStr);
      res.json({ students });
    } catch (error: any) {
      console.error("Gemini Extraction Error:", error);
      res.status(500).json({ error: error.message || "Failed to extract students" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
