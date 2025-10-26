// Public/script.js (Frontend Logic)

const API_BASE = '/api/evaluations';
const selClasse = document.getElementById('classe');
const lblClasse = document.getElementById('lblClasse');
const formList = document.querySelectorAll('.box form');

// Petite utilité anti-injection (affichage)
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
}

// Fonction pour créer le DOM d'une évaluation enregistrée
function createEvaluationChip(eval) {
    const div = document.createElement('div');
    div.className = 'planned';
    div.dataset.id = eval._id; // Stocke l'ID MongoDB pour la suppression
    div.innerHTML = `
        <button class="del" title="Supprimer" data-id="${eval._id}">✖</button>
        <p><strong>Matière:</strong> ${escapeHtml(eval.matiere)}</p>
        <p><strong>Unité:</strong> ${escapeHtml(eval.unite)}</p>
        <p><strong>Critère:</strong> ${escapeHtml(eval.critere)}</p>
    `;
    return div;
}

// 1. Charger les évaluations depuis l'API pour la classe sélectionnée
async function loadEvaluations(classe) {
    // 1. Nettoyer les évaluations existantes dans le DOM
    document.querySelectorAll('.planned').forEach(el => el.remove());

    // 2. Récupérer les données
    try {
        const response = await fetch(`${API_BASE}?classe=${classe}`);
        if (!response.ok) throw new Error('Erreur de chargement des données');
        const evaluations = await response.json();

        // 3. Insérer dans le DOM
        evaluations.forEach(eval => {
            const cardElement = document.getElementById(eval.semaine);
            if (cardElement) {
                const newChip = createEvaluationChip(eval);
                const boxForm = cardElement.querySelector('.box');
                // Insérer le nouveau chip AVANT le formulaire d'ajout
                cardElement.insertBefore(newChip, boxForm);
            }
        });

    } catch (error) {
        console.error("Erreur de récupération des évaluations:", error);
        alert('Erreur lors du chargement des évaluations. Voir console.');
    }
}

// 2. Gestion de la soumission du formulaire (Ajout d'évaluation)
async function handleAddEvaluation(e) {
    e.preventDefault();
    const form = e.target;
    const classe = selClasse.value;
    const semaine = form.dataset.semaine;

    const data = {
        classe: classe,
        semaine: semaine,
        matiere: form.elements.namedItem('matiere')?.value?.trim(),
        unite: form.elements.namedItem('unite')?.value?.trim(),
        critere: form.elements.namedItem('critere')?.value?.trim()
    };

    if (!data.matiere || !data.unite || !data.critere) {
        alert('Veuillez remplir tous les champs.');
        return;
    }

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erreur côté serveur lors de l\'ajout.');
        const newEval = await response.json();

        // Ajout au DOM et reset
        const cardElement = document.getElementById(semaine);
        const newChip = createEvaluationChip(newEval);
        const boxForm = cardElement.querySelector('.box');
        cardElement.insertBefore(newChip, boxForm);

        form.reset();
        alert('Évaluation enregistrée avec succès!');

    } catch (error) {
        console.error("Erreur lors de l'ajout de l'évaluation:", error);
        alert('Échec de l\'enregistrement. Erreur réseau ou serveur.');
    }
}

// 3. Gestion de la suppression (Délégation d'événement)
document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.del');
    if (!btn) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette évaluation?')) return;

    const evalId = btn.dataset.id;
    const wrap = btn.closest('.planned');
    if (!evalId || !wrap) return;

    try {
        const response = await fetch(`${API_BASE}/${evalId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur lors de la suppression.');

        // Animation de sortie puis remove du DOM
        wrap.classList.add('fade-out');
        setTimeout(() => wrap.remove(), 180);

    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert('Échec de la suppression. Erreur réseau ou serveur.');
    }
});


// 4. Initialisation et gestion du changement de classe
document.addEventListener('DOMContentLoaded', () => {
    // Attacher l'événement de soumission à tous les formulaires
    formList.forEach(form => form.addEventListener('submit', handleAddEvaluation));

    // MAJ du libellé de classe et chargement des données
    const initialClasse = selClasse.value;
    lblClasse.innerHTML = `<strong>Classe :</strong> ${initialClasse}`;
    loadEvaluations(initialClasse);
    
    // Événement de changement de classe
    selClasse.addEventListener('change', (e) => {
        const nouvelleClasse = e.target.value;
        lblClasse.innerHTML = `<strong>Classe :</strong> ${nouvelleClasse}`;
        loadEvaluations(nouvelleClasse); // Recharger les données pour la nouvelle classe
    });
});
