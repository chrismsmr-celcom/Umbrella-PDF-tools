import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const app = express();
const upload = multer({ dest: "uploads/" });

// __dirname pour module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Autoriser CORS pour toutes les requêtes
app.use(cors());

// Servir le frontend
app.use(express.static(path.join(__dirname, "public")));

// Route d’accueil pour ouvrir pdf-to-word.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route pour convertir PDF → DOCX
app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const pdfPath = req.file.path;

    // 1️⃣ Obtenir l’upload URL de PDF.co
    const uploadRes = await fetch("https://api.pdf.co/v1/file/upload", {
      method: "POST",
      headers: { "x-api-key": process.env.PDFCO_API_KEY }
    });
    const uploadData = await uploadRes.json();

    if (!uploadData.presignedUrl) {
      return res.status(400).json(uploadData);
    }

    // 2️⃣ Envoyer le PDF sur PDF.co
    await fetch(uploadData.presignedUrl, {
      method: "PUT",
      body: fs.createReadStream(pdfPath),
      headers: { "Content-Type": "application/pdf" }
    });

    // 3️⃣ Convertir PDF → DOCX
    const convertRes = await fetch("https://api.pdf.co/v1/pdf/convert/to/docx", {
      method: "POST",
      headers: {
        "x-api-key": process.env.PDFCO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: uploadData.url, async: false })
    });
    const result = await convertRes.json();

    if (!result.url) {
      return res.status(400).json(result);
    }

    // 4️⃣ Télécharger le DOCX et le renvoyer
    const docxRes = await fetch(result.url);
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=converted.docx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    docxRes.body.pipe(res);

    // 5️⃣ Nettoyage
    fs.unlinkSync(pdfPath);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Conversion failed", details: e.message });
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend PDF → Word running on port ${PORT}`);
});
