import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    // ICI : appel API Adobe (plus tard)
    res.json({ status: "ok", message: "Backend prêt" });
  } catch (e) {
    res.status(500).json({ error: "Erreur conversion" });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);