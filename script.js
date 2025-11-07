let dataset = [];
let currentStart = 0;
const chartsPerPage = 8;
let detailChart = null;

// Load default file automatically
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const resp = await fetch("entity_comparison_results.xlsx");
    const arrayBuffer = await resp.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    dataset = XLSX.utils.sheet_to_json(sheet);
    renderGrid();
  } catch (err) {
    console.warn("⚠️ Could not auto-load Excel file:", err);
  }
});

// Allow manual upload override
document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  dataset = XLSX.utils.sheet_to_json(sheet);
  currentStart = 0;
  renderGrid();
});

// Navigation buttons
document.getElementById("prevBtn").onclick = () => {
  if (currentStart - chartsPerPage >= 0) {
    currentStart -= chartsPerPage;
    renderGrid();
  }
};
document.getElementById("nextBtn").onclick = () => {
  if (currentStart + chartsPerPage < dataset.length) {
    currentStart += chartsPerPage;
    renderGrid();
  }
};

function renderGrid() {
  const grid = document.getElementById("chartGrid");
  grid.innerHTML = "";

  const slice = dataset.slice(currentStart, currentStart + chartsPerPage);

  slice.forEach((entry, i) => {
    const canvas = document.createElement("canvas");
    grid.appendChild(canvas);
    createMiniChart(canvas, entry, currentStart + i);
  });
}

function createMiniChart(canvas, entry, index) {
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
      scales: {
        r: { ticks: { display: false }, grid: { color: "#ddd" } },
      },
    },
  });

  // Click handler for detailed view
  canvas.addEventListener("click", () => showDetail(entry, index));
}

function showDetail(entry, index) {
  document.getElementById("detail-section").classList.remove("hidden");

  const ctx = document.getElementById("detailChart");
  if (detailChart) detailChart.destroy();

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
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: Math.max(...royalData.concat(museumData)) + 2,
        },
      },
    },
  });

  // Display unique entities
  const royalList = document.getElementById("royalList");
  const museumList = document.getElementById("museumList");

  const royal = JSON.parse(entry.Unique_to_Royal || "{}");
  const museum = JSON.parse(entry.Unique_to_Museum || "{}");

  const formatList = (obj) =>
    Object.entries(obj)
      .map(([key, vals]) =>
        vals && vals.length
          ? `<li><b>${key}:</b> ${vals.slice(0, 8).join(", ")}</li>`
          : ""
      )
      .join("") || "<li><i>No unique entities</i></li>";

  royalList.innerHTML = formatList(royal);
  museumList.innerHTML = formatList(museum);

  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
