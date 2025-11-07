let chart;
const ctx = document.getElementById("radarChart");

async function loadFile(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

function createChart(entry) {
  const labels = ["Persons", "Organisations", "Places", "Dates", "Events", "Other"];
  const royalData = [
    entry.Royal_Persons, entry.Royal_Orgs, entry.Royal_Places,
    entry.Royal_Dates, entry.Royal_Events, entry.Royal_Other
  ];
  const museumData = [
    entry.Museum_Persons, entry.Museum_Orgs, entry.Museum_Places,
    entry.Museum_Dates, entry.Museum_Events, entry.Museum_Other
  ];

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Royal Society',
          data: royalData,
          fill: true,
          backgroundColor: 'rgba(54,162,235,0.3)',
          borderColor: 'rgb(54,162,235)',
          pointBackgroundColor: 'rgb(54,162,235)',
        },
        {
          label: 'Science Museum',
          data: museumData,
          fill: true,
          backgroundColor: 'rgba(255,99,132,0.3)',
          borderColor: 'rgb(255,99,132)',
          pointBackgroundColor: 'rgb(255,99,132)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: Math.max(...royalData.concat(museumData)) + 2,
        },
      },
    },
  });

  // Display unique entities
  showDifferences(entry);
}

function showDifferences(entry) {
  const details = document.getElementById("details");
  details.classList.remove("hidden");

  const royalList = document.getElementById("royalList");
  const museumList = document.getElementById("museumList");

  const royal = JSON.parse(entry.Unique_to_Royal || "{}");
  const museum = JSON.parse(entry.Unique_to_Museum || "{}");

  const formatList = (obj) =>
    Object.entries(obj)
      .map(([key, values]) =>
        values && values.length
          ? `<li><b>${key}:</b> ${values.slice(0, 10).join(", ")}</li>`
          : ""
      )
      .join("") || "<li><i>No unique entities listed</i></li>";

  royalList.innerHTML = formatList(royal);
  museumList.innerHTML = formatList(museum);
}

// Handle file upload and entry selection
document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const data = await loadFile(file);
  window.dataset = data;

  const select = document.getElementById("entrySelect");
  select.innerHTML = data
    .map(
      (d, i) =>
        `<option value="${i}">Entry #${d.RowIndex} — Royal=${d.Royal_Total} | Museum=${d.Museum_Total}</option>`
    )
    .join("");
  select.onchange = () => createChart(data[select.value]);
  createChart(data[0]);
});
