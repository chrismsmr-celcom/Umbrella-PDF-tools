import express from "express";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";

const app = express();
const upload = multer({ dest: "uploads/" });

// Simple Free / Premium simulation
const FREE_LIMIT = true; // true = fichier Free, false = Premium

// Endpoint PDF → Word
app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("Aucun fichier reçu");

    if (!FREE_LIMIT) {
      return res.status(403).json({ message: "Fonction Premium verrouillée 🔒" });
    }

    // Appel Adobe PDF Services via REST
    const adobeForm = new FormData();
    adobeForm.append("file", fs.createReadStream(file.path));

    const adobeRes = await fetch(
      "https://pdf-services.adobe.io/operation/export/pdf",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.ADOBE_CLIENT_ID}:${process.env.ADOBE_CLIENT_SECRET}`
        },
        body: adobeForm
      }
    );

    if (!adobeRes.ok) {
      return res.status(500).send("Erreur conversion Adobe");
    }

    const buffer = Buffer.from(await adobeRes.arrayBuffer());

    // Envoi du fichier DOCX au frontend
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.parse(file.originalname).name}.docx"`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);

    // Supprime le PDF temporaire
    fs.unlinkSync(file.path);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la conversion PDF → Word");
  }
});

// Test serveur
app.get("/", (req, res) => {
  res.send("PDF backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
