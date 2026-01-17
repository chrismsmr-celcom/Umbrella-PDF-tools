import express from "express";
import multer from "multer";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

// Endpoint PDF → Word
app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("Aucun fichier reçu");

    // Pour l'instant, on ne fait que recevoir le fichier et renvoyer un message
    // Plus tard : ici tu brancheras Adobe PDF Services pour convertir en DOCX

    res.json({
      message: "PDF reçu côté backend. Prêt pour conversion.",
      filename: file.originalname,
      size: file.size
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'upload");
  }
});

// Optionnel : endpoint de test pour vérifier que le serveur est vivant
app.get("/", (req, res) => {
  res.send("PDF backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
