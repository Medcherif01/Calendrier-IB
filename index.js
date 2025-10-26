import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URL = process.env.MONGO_URL;
mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const evaluationSchema = new mongoose.Schema({
  classe: String,
  semaine: String,
  matiere: String,
  unite: String,
  critere: String,
  date: { type: Date, default: Date.now },
});

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

// 🔹 Ajouter une évaluation
app.post("/api/evaluations", async (req, res) => {
  try {
    const data = await Evaluation.create(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Récupérer les évaluations d'une classe
app.get("/api/evaluations/:classe", async (req, res) => {
  const data = await Evaluation.find({ classe: req.params.classe });
  res.json(data);
});

// 🔹 Supprimer une évaluation
app.delete("/api/evaluations/:id", async (req, res) => {
  await Evaluation.findByIdAndDelete(req.params.id);
  res.json({ message: "Supprimée avec succès" });
});

// 🔹 Générer le Word
app.get("/api/generate-word/:classe", async (req, res) => {
  const classe = req.params.classe;
  const data = await Evaluation.find({ classe });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Répartition des évaluations – ${classe}`, bold: true, size: 32 })],
          }),
          ...data.map(
            (e) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${e.semaine}: ${e.matiere} – ${e.unite} [Critère ${e.critere}]`, size: 24 }),
                ],
              })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(__dirname, `public/${classe}_Evaluations.docx`);
  fs.writeFileSync(filePath, buffer);
  res.download(filePath);
});

// 🔹 Démarrer le serveur localement
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
