const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PDFServicesClient } = require("@adobe/pdfservices-node-sdk"); // adapte si nécessaire

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware pour servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(__dirname));

// --- Multer setup pour upload ---
const upload = multer({ dest: "uploads/" });

// --- Endpoint PDF → Word ---
app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Aucun fichier uploadé" });

    // --- Ici tu mets ton code Adobe PDF Services pour convertir ---
    // Exemple minimal (à adapter selon ton SDK / credentials)
    const outputPath = `outputs/${file.originalname.replace(".pdf", ".docx")}`;
    fs.mkdirSync("outputs", { recursive: true });

    // Simulation conversion pour test frontend
    fs.copyFileSync(file.path, outputPath);

    // Envoie le fichier DOCX au frontend
    res.download(outputPath, err => {
      // Supprime les fichiers temporaires
      fs.unlinkSync(file.path);
      fs.unlinkSync(outputPath);
      if (err) console.error(err);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la conversion" });
  }
});

// --- Démarrage du serveur ---
app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
