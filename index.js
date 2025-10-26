// index.js

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Pour charger les variables d'environnement localement (sur Vercel, elles sont injectées)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // pour analyser les corps de requête JSON

// --- Connexion MongoDB ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("Erreur: MONGO_URI n'est pas défini. Assurez-vous d'avoir un fichier .env ou des variables Vercel.");
    // En production sur Vercel, on laisse l'app démarrer, mais l'API échouera.
} else {
    mongoose.connect(MONGO_URI)
      .then(() => console.log('Connexion à MongoDB réussie!'))
      .catch(err => console.error('Erreur de connexion à MongoDB:', err));
}

// --- Modèle Mongoose ---
const evaluationSchema = new mongoose.Schema({
    classe: { type: String, required: true },
    semaineId: { type: String, required: true }, // ex: S2, S30
    matiere: { type: String, required: true },
    unite: { type: String, required: true },
    critere: { type: String, required: true },
    dateCreation: { type: Date, default: Date.now }
});

const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);

// --- Routes API (/api/...) ---

// 1. GET: Récupérer les évaluations pour une classe donnée
app.get('/api/evaluations', async (req, res) => {
    try {
        const { classe } = req.query;
        if (!classe) {
            return res.status(400).json({ message: 'Le paramètre "classe" est requis.' });
        }
        const evaluations = await Evaluation.find({ classe }).sort({ semaineId: 1, matiere: 1 });
        res.json(evaluations);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des évaluations', error: err.message });
    }
});

// 2. POST: Ajouter une nouvelle évaluation
app.post('/api/evaluations', async (req, res) => {
    try {
        const { classe, semaineId, matiere, unite, critere } = req.body;
        if (!classe || !semaineId || !matiere || !unite || !critere) {
            return res.status(400).json({ message: 'Tous les champs sont requis.' });
        }
        const newEvaluation = new Evaluation({ classe, semaineId, matiere, unite, critere });
        await newEvaluation.save();
        res.status(201).json(newEvaluation);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de l'enregistrement de l'évaluation", error: err.message });
    }
});

// 3. DELETE: Supprimer une évaluation par son ID
app.delete('/api/evaluations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Evaluation.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Évaluation non trouvée.' });
        }
        res.status(200).json({ message: 'Évaluation supprimée.' });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression de l'évaluation", error: err.message });
    }
});

// --- Servir les fichiers statiques (pour le développement local) ---
// Vercel gère déjà les routes statiques via vercel.json, mais ceci est utile pour tester localement.
app.use(express.static(path.join(__dirname, 'public')));

// Point d'entrée pour Vercel (doit exporter l'application Express)
module.exports = app;

// Démarrer le serveur uniquement en développement local
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Serveur démarré sur http://localhost:${port}`);
    });
}
