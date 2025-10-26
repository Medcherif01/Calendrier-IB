import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const mongoUrl = process.env.MONGO_URL;
const client = new MongoClient(mongoUrl);
let db;

async function initDB() {
  await client.connect();
  db = client.db("EvaluationsDB");
  console.log("✅ MongoDB connecté !");
}
initDB();

// 📌 Sauvegarde d’une évaluation
app.post("/api/save", async (req, res) => {
  try {
    const { classe, semaine, matiere, unite, critere } = req.body;
    if (!classe || !semaine || !matiere || !unite || !critere)
      return res.status(400).json({ error: "Champs manquants" });

    const coll = db.collection("evaluations");
    await coll.insertOne({ classe, semaine, matiere, unite, critere, date: new Date() });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 📌 Lecture par classe
app.get("/api/evaluations/:classe", async (req, res) => {
  const coll = db.collection("evaluations");
  const data = await coll.find({ classe: req.params.classe }).toArray();
  res.json(data);
});

// 📌 Suppression d’une évaluation
app.delete("/api/evaluations/:id", async (req, res) => {
  const { ObjectId } = await import("mongodb");
  const coll = db.collection("evaluations");
  await coll.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ ok: true });
});

// 📄 Génération d’un fichier Word dynamique
app.get("/api/generate-word/:classe", async (req, res) => {
  try {
    const classe = req.params.classe;
    const coll = db.collection("evaluations");
    const evals = await coll.find({ classe }).toArray();

    // Récupération du modèle distant
    const templateURL = process.env.WORD_TEMPLATE_URL;
    const response = await fetch(templateURL);
    const content = await response.arrayBuffer();

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render({
      classe,
      evaluations: evals.map((e, i) => ({
        num: i + 1,
        semaine: e.semaine,
        matiere: e.matiere,
        unite: e.unite,
        critere: e.critere
      }))
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    // Envoi direct du buffer au client
    res.setHeader("Content-Disposition", `attachment; filename="${classe}_Evaluations.docx"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur prêt sur le port ${PORT}`));
