import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const pdfPath = req.file.path;

    // 1. Upload PDF to PDF.co
    const uploadRes = await fetch("https://api.pdf.co/v1/file/upload", {
      method: "POST",
      headers: {
        "x-api-key": process.env.PDFCO_API_KEY
      }
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.presignedUrl) {
      return res.status(400).json(uploadData);
    }

    await fetch(uploadData.presignedUrl, {
      method: "PUT",
      body: fs.createReadStream(pdfPath),
      headers: { "Content-Type": "application/pdf" }
    });

    // 2. Convert PDF → DOCX
    const convertRes = await fetch("https://api.pdf.co/v1/pdf/convert/to/docx", {
      method: "POST",
      headers: {
        "x-api-key": process.env.PDFCO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: uploadData.url,
        async: false
      })
    });

    const result = await convertRes.json();
    if (!result.url) {
      return res.status(400).json(result);
    }

    // 3. Download DOCX
    const docxRes = await fetch(result.url);
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=converted.docx"
    );
    docxRes.body.pipe(res);

    fs.unlinkSync(pdfPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
