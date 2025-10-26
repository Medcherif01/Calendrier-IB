const classeSelect = document.getElementById("classeSelect");
const tableContainer = document.getElementById("tableContainer");
const generateWordBtn = document.getElementById("generateWord");
let currentClasse = classeSelect.value;

async function loadEvaluations() {
  const res = await fetch(`/api/evaluations/${currentClasse}`);
  const data = await res.json();

  tableContainer.innerHTML = `
    <div class="table">
      ${Array.from({ length: 12 }, (_, i) => {
        const week = `Semaine ${i + 1}`;
        const evals = data.filter((e) => e.semaine === week);
        return `
          <div class="card">
            <h3>${week}</h3>
            ${evals.map((e) => `
              <p><b>${e.matiere}</b> – ${e.unite} [${e.critere}]
              <button onclick="deleteEval('${e._id}')">✖</button></p>
            `).join('')}
            <form onsubmit="addEvaluation(event, '${week}')">
              <input name="matiere" placeholder="Matière" required />
              <input name="unite" placeholder="Unité" required />
              <select name="critere" required>
                <option value="">Critère</option>
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
              <button>Ajouter</button>
            </form>
          </div>`;
      }).join('')}
    </div>`;
}

async function addEvaluation(e, semaine) {
  e.preventDefault();
  const form = e.target;
  const data = {
    classe: currentClasse,
    semaine,
    matiere: form.matiere.value,
    unite: form.unite.value,
    critere: form.critere.value,
  };
  await fetch("/api/evaluations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  form.reset();
  loadEvaluations();
}

async function deleteEval(id) {
  await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
  loadEvaluations();
}

generateWordBtn.onclick = () => {
  window.open(`/api/generate-word/${currentClasse}`, "_blank");
};

classeSelect.onchange = () => {
  currentClasse = classeSelect.value;
  loadEvaluations();
};

loadEvaluations();
