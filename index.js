import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import PDFServicesSdk from "@adobe/pdfservices-node-sdk";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

// Free / Premium simulation
const FREE_LIMIT = process.env.FREE_LIMIT === "true";

app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("Aucun fichier reçu");

    if (!FREE_LIMIT) {
      return res.status(403).json({ message: "Fonction Premium verrouillée 🔒" });
    }

    // Setup Adobe SDK
    const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
      .withClientId(process.env.ADOBE_CLIENT_ID)
      .withClientSecret(process.env.ADOBE_CLIENT_SECRET)
      .build();

    const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
    const ExportPDFOperation = PDFServicesSdk.ExportPDF.Operation;

    const inputPDF = PDFServicesSdk.FileRef.createFromLocalFile(file.path);

    const exportPDFOperation = ExportPDFOperation.createNew(ExportPDFOperation.SupportedTargetFormats.DOCX);
    exportPDFOperation.setInput(inputPDF);

    // Execute
    const result = await exportPDFOperation.execute(executionContext);

    // Sauvegarde temporaire
    fs.mkdirSync("outputs", { recursive: true });
    const outputPath = `outputs/${path.parse(file.originalname).name}.docx`;
    await result.saveAsFile(outputPath);

    // Envoi au frontend
    res.download(outputPath, `${path.parse(file.originalname).name}.docx`, err => {
      if (err) console.error(err);
      fs.unlinkSync(file.path);
      fs.unlinkSync(outputPath);
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la conversion PDF → Word");
  }
});

app.get("/", (req, res) => {
  res.send("PDF backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
