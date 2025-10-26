// Public/script.js

// Petite utilité anti-injection (affichage)
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, s => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    } [s]));
}

function getCurrentClasse() {
    return document.getElementById('classe').value;
}

// Fonction pour créer l'élément DOM d'une évaluation
function renderEvaluation(data) {
    const div = document.createElement('div');
    div.className = 'planned';
    // Stocke l'ID MongoDB pour la suppression
    div.setAttribute('data-id', data._id); 
    div.innerHTML = `
        <button class="del" title="Supprimer">✖</button>
        <p><strong>Matière:</strong> ${escapeHtml(data.matiere)}</p>
        <p><strong>Unité:</strong> ${escapeHtml(data.unite)}</p>
        <p><strong>Critère:</strong> ${escapeHtml(data.critere)}</p>
    `;
    return div;
}

// Fonction pour vider et recharger les évaluations pour la classe sélectionnée
async function fetchAndRenderEvaluations(classe) {
    console.log(`Chargement des évaluations pour la classe: ${classe}`);

    // 1. Supprimer toutes les évaluations existantes du DOM
    document.querySelectorAll('.planned').forEach(el => el.remove());

    // 2. Récupérer les données depuis l'API
    try {
        const response = await fetch(`/api/evaluations?classe=${classe}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des données.');
        
        const evaluations = await response.json();

        // 3. Rendre les nouvelles évaluations
        evaluations.forEach(evalData => {
            const cell = document.getElementById(evalData.semaineId);
            if (cell) {
                const box = cell.querySelector('.box');
                const newEvalElement = renderEvaluation(evalData);
                
                // Insérer avant le formulaire (s'il existe)
                if (box) {
                    cell.insertBefore(newEvalElement, box);
                } else {
                    cell.appendChild(newEvalElement);
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des évaluations:', error);
    }
}


// Ajout d’une évaluation (avec appel API)
async function addEvaluation(e, semaineId) {
    e.preventDefault();
    const f = e.target;
    const classe = getCurrentClasse();
    
    // Désactiver le bouton pendant l'attente
    const ctaButton = f.querySelector('.cta');
    ctaButton.disabled = true;

    const matiere = f.elements.namedItem('matiere')?.value?.trim();
    const unite = f.elements.namedItem('unite')?.value?.trim();
    const critere = f.elements.namedItem('critere')?.value?.trim();

    if (!matiere || !unite || !critere) {
        alert('Veuillez remplir tous les champs.');
        ctaButton.disabled = false;
        return;
    }

    const evaluationData = {
        classe,
        semaineId,
        matiere,
        unite,
        critere
    };

    try {
        const response = await fetch('/api/evaluations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(evaluationData),
        });

        if (!response.ok) throw new Error('Échec de l\'enregistrement de l\'évaluation.');

        const savedEvaluation = await response.json();

        // Ajout au DOM après succès de l'API
        const cell = document.getElementById(semaineId);
        const box = cell.querySelector('.box');
        const newEvalElement = renderEvaluation(savedEvaluation);
        
        if (box) cell.insertBefore(newEvalElement, box);
        else cell.appendChild(newEvalElement);

        f.reset();
        
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'évaluation:", error);
        alert(`Échec de l'enregistrement: ${error.message}`);
    } finally {
        ctaButton.disabled = false;
    }
}

// Suppression (délégation d’événement avec appel API)
document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.del');
    if (!btn) return;
    
    const wrap = btn.closest('.planned');
    const evaluationId = wrap.getAttribute('data-id');

    if (!evaluationId) {
        console.error("ID d'évaluation introuvable pour la suppression.");
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) return;

    // Désactiver le bouton pendant l'attente
    btn.disabled = true;

    try {
        const response = await fetch(`/api/evaluations/${evaluationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Échec de la suppression.');

        // Animation de sortie puis remove du DOM
        wrap.classList.add('fade-out');
        setTimeout(() => wrap.remove(), 180);

    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert(`Échec de la suppression: ${error.message}`);
    } finally {
        btn.disabled = false;
    }
});


// Initialisation de l'application
function initApp() {
    const sel = document.getElementById('classe');
    const lbl = document.getElementById('lblClasse');
    
    // MAJ du libellé de classe et rechargement des données
    function handleClassChange() {
        const nouvelleClasse = sel.value;
        lbl.innerHTML = '<strong>Classe :</strong> ' + nouvelleClasse;
        fetchAndRenderEvaluations(nouvelleClasse);
    }

    sel.addEventListener('change', handleClassChange);

    // Chargement initial pour la classe par défaut
    handleClassChange(); 
}
