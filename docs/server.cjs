var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.post("/api/extract-students", async (req, res) => {
    try {
      const { textData, fileData, mimeType } = req.body;
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey: key });
      let contents = [];
      const prompt = `You are a helpful assistant. I will provide you with a list of students (either as text or an image/file).
Extract all the student names. Separate each student's name into 'firstName' and 'lastName'. 
Usually, in Persian names, the last part is the last name and the rest is the first name, but use your best judgment for Persian names.
Return the result EXACTLY as a JSON array of objects with the keys 'firstName' and 'lastName'. 
Do not include any markdown formatting like \`\`\`json, just output the raw JSON array.
Sort the array alphabetically by lastName first, then firstName (in Persian alphabetical order).`;
      if (fileData && mimeType) {
        contents = [
          prompt,
          {
            inlineData: {
              data: fileData,
              mimeType
            }
          }
        ];
      } else if (textData) {
        contents = [prompt + "\n\nData:\n" + textData];
      } else {
        return res.status(400).json({ error: "No data provided" });
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents
      });
      let jsonStr = response.text || "[]";
      jsonStr = jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
      const students = JSON.parse(jsonStr);
      res.json({ students });
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      res.status(500).json({ error: error.message || "Failed to extract students" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
