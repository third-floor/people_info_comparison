let comparisonData = [];
let peopleData = [];
let currentStart = 0;
const chartsPerPage = 8;
let detailChart = null;

// Auto-load both Excel files
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const compResp = await fetch("entity_comparison_results.xlsx");
    const compArray = await compResp.arrayBuffer();
    const compBook = XLSX.read(compArray);
    const compSheet = compBook.Sheets[compBook.SheetNames[0]];
    comparisonData = XLSX.utils.sheet_to_json(compSheet);

    const peopleResp = await fetch("CO_CP_PEOPLE_ENTRIES_MATCHED_TO_RS_PAST_FELLOWS.xlsx");
    const peopleArray = await peopleResp.arrayBuffer();
    const peopleBook = XLSX.read(peopleArray);
    const peopleSheet = peopleBook.Sheets[peopleBook.SheetNames[0]];
    peopleData = XLSX.utils.sheet_to_json(peopleSheet);

    mergeAndRender();
  } catch (err) {
    console.warn("⚠️ Could not auto-load one or both Excel files:", err);
  }
});

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  comparisonData = XLSX.utils.sheet_to_json(sheet);
  currentStart = 0;
  mergeAndRender();
});

// Pagination
document.getElementById("prevBtn").onclick = () => {
  if (currentStart - chartsPerPage >= 0) {
    currentStart -= chartsPerPage;
    renderGrid();
  }
};
document.getElementById("nextBtn").onclick = () => {
  if (currentStart + chartsPerPage < comparisonData.length) {
    currentStart += chartsPerPage;
    renderGrid();
  }
};

// Merge based on RowIndex
function mergeAndRender() {
  if (!comparisonData.length || !peopleData.length) return;

  comparisonData = comparisonData.map((row) => {
    const idx = row.RowIndex;
    const personRow = peopleData[idx] || {};
    return { ...row, ...personRow };
  });

  renderGrid();
}

// Render grid
function renderGrid() {
  const grid = document.getElementById("chartGrid");
  grid.innerHTML = "";

  const slice = comparisonData.slice(currentStart, currentStart + chartsPerPage);

  slice.forEach((entry, i) => {
    const container = document.createElement("div");
    container.className = "chart-container";

    const nameDiv = document.createElement("div");
    nameDiv.className = "chart-name";
    nameDiv.innerText = entry["MatchedName"] || entry["InputName"] || `Entry #${entry.RowIndex}`;
    container.appendChild(nameDiv);

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const scoreDiv = document.createElement("div");
    scoreDiv.className = "score";
    scoreDiv.innerText = `Royal: ${entry.Royal_Total} | Museum: ${entry.Museum_Total}`;
    container.appendChild(scoreDiv);

    grid.appendChild(container);
    createMiniChart(canvas, entry);
  });
}

function createMiniChart(canvas, entry) {
  const labels = ["Persons", "Organisations", "Places", "Dates", "Events", "Other"];
  const royalData = [
    entry.Royal_Persons, entry.Royal_Orgs, entry.Royal_Places,
    entry.Royal_Dates, entry.Royal_Events, entry.Royal_Other
  ];
  const museumData = [
    entry.Museum_Persons, entry.Museum_Orgs, entry.Museum_Places,
    entry.Museum_Dates, entry.Museum_Events, entry.Museum_Other
  ];

  new Chart(canvas, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Royal Society",
          data: royalData,
          fill: true,
          backgroundColor: "rgba(54,162,235,0.2)",
          borderColor: "rgb(54,162,235)",
          pointRadius: 0,
        },
        {
          label: "Science Museum",
          data: museumData,
          fill: true,
          backgroundColor: "rgba(255,99,132,0.2)",
          borderColor: "rgb(255,99,132)",
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { r: { ticks: { display: false }, grid: { color: "#eee" } } },
    },
  });

  canvas.addEventListener("click", () => showDetail(entry));
}

// Show detailed view
function showDetail(entry) {
  document.getElementById("detail-section").classList.remove("hidden");

  const ctx = document.getElementById("detailChart");
  if (detailChart) detailChart.destroy();

  document.getElementById("detailTitle").innerText = `Detailed Comparison — ${entry["MatchedName"] || entry["InputName"] || "Unknown"}`;

  const labels = ["Persons", "Organisations", "Places", "Dates", "Events", "Other"];
  const royalData = [
    entry.Royal_Persons, entry.Royal_Orgs, entry.Royal_Places,
    entry.Royal_Dates, entry.Royal_Events, entry.Royal_Other
  ];
  const museumData = [
    entry.Museum_Persons, entry.Museum_Orgs, entry.Museum_Places,
    entry.Museum_Dates, entry.Museum_Events, entry.Museum_Other
  ];

  detailChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Royal Society",
          data: royalData,
          fill: true,
          backgroundColor: "rgba(54,162,235,0.3)",
          borderColor: "rgb(54,162,235)",
        },
        {
          label: "Science Museum",
          data: museumData,
          fill: true,
          backgroundColor: "rgba(255,99,132,0.3)",
          borderColor: "rgb(255,99,132)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { r: { beginAtZero: true, suggestedMax: Math.max(...royalData.concat(museumData)) + 2 } },
    },
  });

  // Populate dataset text
  const royalCols = Object.keys(entry).filter(c => c.startsWith("Input") || ["Activity", "OtherInfo"].includes(c));
  const museumCols = Object.keys(entry).filter(c => c.startsWith("Matched") || ["brief bio", "description"].includes(c));

  const royalText = royalCols.map(c => entry[c]).filter(Boolean).join("\n\n");
  const museumText = museumCols.map(c => entry[c]).filter(Boolean).join("\n\n");

  document.getElementById("royalText").innerText = royalText || "No text available.";
  document.getElementById("museumText").innerText = museumText || "No text available.";

  // Unique entities
  const royalList = document.getElementById("royalList");
  const museumList = document.getElementById("museumList");

  const royal = JSON.parse(entry.Unique_to_Royal || "{}");
  const museum = JSON.parse(entry.Unique_to_Museum || "{}");

  const formatList = (obj) =>
    Object.entries(obj)
      .map(([key, vals]) =>
        vals && vals.length ? `<li><b>${key}:</b> ${vals.slice(0, 8).join(", ")}</li>` : ""
      )
      .join("") || "<li><i>No unique entities</i></li>";

  royalList.innerHTML = formatList(royal);
  museumList.innerHTML = formatList(museum);

  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
