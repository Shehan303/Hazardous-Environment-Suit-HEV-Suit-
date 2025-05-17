// Initialize data arrays with 30 entries
const dataLogs = {
  bpm: Array(30).fill(null),
  temp: Array(30).fill(null),
  humidity: Array(30).fill(null),
  timestamps: Array(30).fill(null),
};

let map;
let marker;
let gpsInterval;
const gpsHistory = [];
const MAX_GPS_HISTORY = 50; // Store last 50 locations

// Initialize charts with first page's styling
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: {
        display: false,
        color: "rgba(100, 255, 218, 0.1)",
      },
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
        color: "#ccd6f6",
      },
    },
    y: {
      grid: {
        color: "rgba(100, 255, 218, 0.1)",
      },
      ticks: {
        color: "#ccd6f6",
      },
    },
  },
  elements: {
    point: {
      radius: 0,
    },
    line: {
      borderWidth: 2,
      tension: 0.3,
    },
  },
};

// Initialize BPM chart with first page's color scheme
const bpmCtx = document.getElementById("bpmChart").getContext("2d");
const bpmChart = new Chart(bpmCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "BPM",
        data: [],
        borderColor: "#ff5555",
        backgroundColor: "rgba(255, 85, 85, 0.1)",
        fill: true,
      },
    ],
  },
  options: {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 50,
        max: 120,
      },
    },
  },
});

// Initialize Temperature chart with first page's color scheme
const tempCtx = document.getElementById("tempChart").getContext("2d");
const tempChart = new Chart(tempCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperature",
        data: [],
        borderColor: "#64ffda",
        backgroundColor: "rgba(100, 255, 218, 0.1)",
        fill: true,
      },
    ],
  },
  options: {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 20,
        max: 40,
      },
    },
  },
});

// Initialize Humidity chart with first page's color scheme
const humidityCtx = document.getElementById("humidityChart").getContext("2d");
const humidityChart = new Chart(humidityCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Humidity",
        data: [],
        borderColor: "#1e88e5",
        backgroundColor: "rgba(30, 136, 229, 0.1)",
        fill: true,
      },
    ],
  },
  options: {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 30,
        max: 80,
      },
    },
  },
});

// Data log panels (from second page)
function createDataLogPanels() {
  const cardsWithCharts = [
    { id: "heartRate", panelId: "bpmLog", label: "BPM" },
    { id: "body-temp", panelId: "tempLog", label: "Temp" },
    { id: "humidity", panelId: "humidityLog", label: "Humidity" },
  ];

  cardsWithCharts.forEach((card) => {
    const chartCard = document.getElementById(card.id).closest(".status-card");
    if (chartCard) {
      const logPanel = document.createElement("div");
      logPanel.className = "data-log-panel";
      logPanel.id = card.panelId;
      logPanel.style.border = "1px solid #233554";
      logPanel.style.color = "#ccd6f6";
      chartCard.appendChild(logPanel);
    }
  });
}

// Initialize data logs with timestamps
function initializeDataLogs() {
  for (let i = 0; i < 30; i++) {
    const time = new Date(Date.now() - (30 - i) * 1000);
    dataLogs.timestamps[i] =
      time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
    dataLogs.bpm[i] = 70 + Math.sin(i / 3) * 10;
    dataLogs.temp[i] = 36.5 + Math.sin(i / 5) * 0.7;
    dataLogs.humidity[i] = 50 + Math.sin(i / 4) * 10;
  }
}

// Update log panels (from second page)
function updateLogPanel(panelId, label, values, timestamps) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  panel.innerHTML = "";

  // Show last 5 entries in reverse order (newest first)
  for (let i = values.length - 1; i >= Math.max(values.length - 5, 0); i--) {
    if (values[i] !== null) {
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.style.borderBottom = "1px solid #233554";
      entry.style.padding = "0.25rem 0";
      entry.textContent = `${timestamps[i]}: ${label} ${values[i].toFixed(
        label === "Temp" ? 1 : 0
      )}${label === "Temp" ? "°C" : label === "Humidity" ? "%" : ""}`;
      panel.appendChild(entry);
    }
  }
}

// Simulate real-time data updates (from second page)
function simulateData() {
  const now = new Date();
  const timeLabel =
    now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

  // Generate random but realistic sensor data
  const bpm = Math.round(
    70 + Math.sin(Date.now() / 10000) * 10 + Math.random() * 8
  );
  const temp =
    36.5 + Math.sin(Date.now() / 15000) * 0.5 + (Math.random() - 0.5) * 0.3;
  const humidity =
    50 + Math.sin(Date.now() / 20000) * 8 + (Math.random() - 0.5) * 5;

  // Update data logs (shift out oldest, add newest)
  dataLogs.bpm.shift();
  dataLogs.bpm.push(bpm);
  dataLogs.temp.shift();
  dataLogs.temp.push(temp);
  dataLogs.humidity.shift();
  dataLogs.humidity.push(humidity);
  dataLogs.timestamps.shift();
  dataLogs.timestamps.push(timeLabel);

  // Update displays
  updateDisplays(bpm, temp, humidity, timeLabel);

  // Random status changes (10% chance)
  if (Math.random() < 0.1) {
    const tiltStatus = document.getElementById("tiltStatus");
    if (tiltStatus) {
      tiltStatus.textContent = Math.random() < 0.5 ? "No" : "Yes";
      tiltStatus.className =
        tiltStatus.textContent === "Yes"
          ? "sensor-status status-active"
          : "sensor-status status-inactive";
    }
  }

  if (Math.random() < 0.05) {
    const armDamageStatus = document.getElementById("armDamageStatus");
    if (armDamageStatus) {
      armDamageStatus.textContent = "Yes";
      armDamageStatus.className = "sensor-status status-active";
      addAlert(
        "Arm Damage Detected",
        "Immediate maintenance required",
        "danger"
      );
    }
  }

  // Check for abnormal values
  if (bpm > 100 || bpm < 50) {
    addAlert(
      bpm > 100 ? "High Heart Rate" : "Low Heart Rate",
      `Heart rate is ${bpm} bpm`,
      "danger"
    );
  }

  if (temp > 38 || temp < 35) {
    addAlert(
      temp > 38 ? "High Temperature" : "Low Temperature",
      `Temperature is ${temp.toFixed(1)}°C`,
      "warning"
    );
  }
}

// Update all displays (from second page)
function updateDisplays(bpm, temp, humidity, timeLabel) {
  // Update numeric displays
  const heartRateElement = document.getElementById("heart-rate");
  if (heartRateElement) heartRateElement.textContent = `${bpm} bpm`;

  const bodyTempElement = document.getElementById("body-temp");
  if (bodyTempElement) bodyTempElement.textContent = `${temp.toFixed(1)} °C`;

  const humidityElement = document.getElementById("humidity");
  if (humidityElement) humidityElement.textContent = `${humidity.toFixed(1)} %`;

  // Update charts
  bpmChart.data.labels = dataLogs.timestamps;
  bpmChart.data.datasets[0].data = dataLogs.bpm;
  bpmChart.update();

  tempChart.data.labels = dataLogs.timestamps;
  tempChart.data.datasets[0].data = dataLogs.temp;
  tempChart.update();

  humidityChart.data.labels = dataLogs.timestamps;
  humidityChart.data.datasets[0].data = dataLogs.humidity;
  humidityChart.update();

  // Update log panels
  updateLogPanel("bpmLog", "BPM", dataLogs.bpm, dataLogs.timestamps);
  updateLogPanel("tempLog", "Temp", dataLogs.temp, dataLogs.timestamps);
  updateLogPanel(
    "humidityLog",
    "Humidity",
    dataLogs.humidity,
    dataLogs.timestamps
  );
}

// PDF Report Generation (from second page)
async function generatePDFReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add GPS section
  doc.setFontSize(14);
  doc.text("GPS Location History:", 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.text("Time", 20, yPos);
  doc.text("Coordinates", 80, yPos);
  yPos += 7;

  // Show last 20 locations
  gpsHistory
    .slice()
    .reverse()
    .slice(0, 20)
    .forEach((entry) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(10);
        doc.text("Time", 20, yPos);
        doc.text("Coordinates", 80, yPos);
        yPos += 7;
      }

      doc.text(entry.timeString, 20, yPos);
      doc.text(`${entry.lat.toFixed(4)}, ${entry.lng.toFixed(4)}`, 80, yPos);
      yPos += 7;
    });

  // Add map image if we have locations
  if (gpsHistory.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("GPS Location Map:", 105, 15, { align: "center" });

    // Create a temporary map container
    const tempMapContainer = document.createElement("div");
    tempMapContainer.style.width = "600px";
    tempMapContainer.style.height = "400px";
    tempMapContainer.style.position = "absolute";
    tempMapContainer.style.left = "-1000px";
    document.body.appendChild(tempMapContainer);

    // Create map
    const tempMap = L.map(tempMapContainer).setView(
      [
        gpsHistory[gpsHistory.length - 1].lat,
        gpsHistory[gpsHistory.length - 1].lng,
      ],
      15
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      tempMap
    );

    // Add all points as a polyline
    const points = gpsHistory.map((entry) => [entry.lat, entry.lng]);
    L.polyline(points, { color: "#64ffda" }).addTo(tempMap);

    // Add marker for current position
    L.marker(points[points.length - 1]).addTo(tempMap);

    // Convert to image
    const imgData = await html2canvas(tempMapContainer).then((canvas) => {
      document.body.removeChild(tempMapContainer);
      return canvas.toDataURL("image/png");
    });

    doc.addImage(imgData, "PNG", 15, 25, 180, 120);
  }

  // Add title
  doc.setFontSize(18);
  doc.text("HEV Suit Monitoring Report", 105, 15, { align: "center" });

  // Add GPS section
  doc.setFontSize(14);
  doc.text("GPS Location History:", 14, 65);

  doc.setFontSize(12);
  let yPos = 72;
  gpsHistory
    .slice()
    .reverse()
    .forEach((loc, i) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      const timeStr = loc.timestamp.toLocaleTimeString();
      doc.text(
        `${timeStr}: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
        14,
        yPos
      );
      yPos += 7;
    });

  // Add date
  doc.setFontSize(12);
  doc.text(new Date().toLocaleString(), 105, 22, { align: "center" });

  // Add summary
  doc.setFontSize(14);
  doc.text("Latest Sensor Readings:", 14, 32);

  doc.setFontSize(12);
  doc.text(`Heart Rate: ${dataLogs.bpm[dataLogs.bpm.length - 1]} bpm`, 14, 40);
  doc.text(
    `Temperature: ${dataLogs.temp[dataLogs.temp.length - 1].toFixed(1)}°C`,
    14,
    48
  );
  doc.text(
    `Humidity: ${dataLogs.humidity[dataLogs.humidity.length - 1].toFixed(1)}%`,
    14,
    56
  );

  // Add charts (using html2canvas)
  const charts = [
    { id: "bpmChart", title: "Heart Rate (bpm)" },
    { id: "tempChart", title: "Temperature (°C)" },
    { id: "humidityChart", title: "Humidity (%)" },
  ];

  let yPosition = 70;

  for (const chart of charts) {
    const canvas = document.getElementById(chart.id);
    const imgData = await html2canvas(canvas).then((canvas) =>
      canvas.toDataURL("image/png")
    );

    doc.addPage();
    doc.setFontSize(14);
    doc.text(chart.title, 105, 15, { align: "center" });
    doc.addImage(imgData, "PNG", 15, 25, 180, 100);

    // Add data table
    doc.setFontSize(10);
    doc.text("Time", 20, 140);
    doc.text("Value", 100, 140);

    let tableY = 145;
    for (let i = dataLogs.timestamps.length - 1; i >= 0; i--) {
      if (tableY > 280) {
        doc.addPage();
        tableY = 20;
      }

      const value =
        chart.id === "bpmChart"
          ? dataLogs.bpm[i]
          : chart.id === "tempChart"
          ? dataLogs.temp[i].toFixed(1)
          : dataLogs.humidity[i].toFixed(1);

      doc.text(dataLogs.timestamps[i], 20, tableY);
      doc.text(value.toString(), 100, tableY);
      tableY += 7;
    }

    yPosition = tableY + 10;
  }

  // Save the PDF
  doc.save(`HEV_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function initMap(lat, lng) {
  if (!map) {
    map = L.map("map").setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }
  return map;
}

// Initialize map
function initMap(lat, lng) {
  if (!map) {
    map = L.map("map").setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }
  return map;
}

// Update GPS location and history
function updateGPSLocation(lat, lng) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const gpsElement = document.getElementById("gps-location");

  gpsElement.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  // Add to history
  const locationData = {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
    timestamp: now,
    timeString: timeStr,
  };

  gpsHistory.push(locationData);

  // Keep only the last MAX_GPS_HISTORY entries
  if (gpsHistory.length > MAX_GPS_HISTORY) {
    gpsHistory.shift();
  }

  // Update map if visible
  if (map) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }
    map.setView([lat, lng]);
  }

  // Update history panel if visible
  if (document.getElementById("gpsHistoryPanel").style.display !== "none") {
    updateGPSHistoryPanel();
  }
}

// Update GPS history panel display
function updateGPSHistoryPanel() {
  const panel = document.getElementById("gpsHistoryPanel");
  panel.innerHTML = "";

  // Show last 10 entries in reverse order (newest first)
  const entriesToShow = gpsHistory.slice().reverse().slice(0, 10);

  entriesToShow.forEach((entry) => {
    const entryElement = document.createElement("div");
    entryElement.className = "gps-history-entry";
    entryElement.innerHTML = `
            <span class="gps-history-time">${entry.timeString}</span>
            <span class="gps-history-coords">${entry.lat.toFixed(
              4
            )}, ${entry.lng.toFixed(4)}</span>
        `;
    panel.appendChild(entryElement);
  });
}

// Toggle map visibility
document.getElementById("showMapBtn").addEventListener("click", function () {
  const mapContainer = document.getElementById("mapContainer");
  const historyPanel = document.getElementById("gpsHistoryPanel");

  if (mapContainer.style.display === "none") {
    const lastLocation =
      gpsHistory.length > 0 ? gpsHistory[gpsHistory.length - 1] : null;
    if (lastLocation) {
      mapContainer.style.display = "block";
      historyPanel.style.display = "none";
      initMap(lastLocation.lat, lastLocation.lng);
      updateGPSLocation(lastLocation.lat, lastLocation.lng);
    } else {
      alert("No GPS data available yet");
    }
  } else {
    mapContainer.style.display = "none";
  }
});

// Toggle history panel visibility
document
  .getElementById("showHistoryBtn")
  .addEventListener("click", function () {
    const mapContainer = document.getElementById("mapContainer");
    const historyPanel = document.getElementById("gpsHistoryPanel");

    if (historyPanel.style.display === "none") {
      if (gpsHistory.length > 0) {
        mapContainer.style.display = "none";
        historyPanel.style.display = "block";
        updateGPSHistoryPanel();
      } else {
        alert("No GPS history available yet");
      }
    } else {
      historyPanel.style.display = "none";
    }
  });

// Simulate GPS movement (for testing)
function simulateGPSMovement() {
  if (gpsInterval) clearInterval(gpsInterval);

  // Start at Black Mesa coordinates (fictional)
  let lat = 36.0998;
  let lng = -115.1479;

  gpsInterval = setInterval(() => {
    // Add small random movement
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.5) * 0.001;

    updateGPSLocation(lat, lng);

    // Update Firebase if connected
    if (suitRef) {
      suitRef.child("environment/gps").set({
        coordinates: [lat, lng],
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });

      // Also save to history in Firebase
      const newEntry = {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      };

      suitRef.child("gpsHistory").push().set(newEntry);
    }
  }, 5000);
}

// Add this to your setupFirebaseListeners function:
function setupFirebaseListeners() {
  // ... existing listeners ...

  // GPS Location listener
  suitRef.child("environment/gps/coordinates").on("value", (snapshot) => {
    const coords = snapshot.val();
    if (coords && Array.isArray(coords)) {
      const [lat, lng] = coords;
      if (!isNaN(lat) && !isNaN(lng)) {
        updateGPSLocation(lat, lng);
      }
    }
  });

  // GPS History listener
  suitRef
    .child("gpsHistory")
    .orderByChild("timestamp")
    .limitToLast(MAX_GPS_HISTORY)
    .on("value", (snapshot) => {
      const historyData = snapshot.val();
      if (historyData) {
        // Clear local history
        gpsHistory.length = 0;

        // Convert Firebase object to array and sort by timestamp
        const historyArray = Object.values(historyData).sort(
          (a, b) => a.timestamp - b.timestamp
        );

        // Add to local history with formatted time strings
        historyArray.forEach((entry) => {
          const date = new Date(entry.timestamp);
          gpsHistory.push({
            ...entry,
            timestamp: date,
            timeString: date.toLocaleTimeString(),
          });
        });

        // Update history panel if visible
        if (
          document.getElementById("gpsHistoryPanel").style.display !== "none"
        ) {
          updateGPSHistoryPanel();
        }
      }
    });
}

// Update your pushTestData function:
function pushTestData() {
  // ... existing test data code ...

  // Add GPS test data
  const lat = 36.0998 + (Math.random() - 0.5) * 0.01;
  const lng = -115.1479 + (Math.random() - 0.5) * 0.01;

  suitRef.child("environment/gps").set({
    coordinates: [lat, lng],
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  });

  // Also add to history
  const newEntry = {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };

  suitRef.child("gpsHistory").push().set(newEntry);
}

// Simulate GPS movement (for testing)
function simulateGPSMovement() {
  if (gpsInterval) clearInterval(gpsInterval);

  // Start at Black Mesa coordinates (fictional)
  let lat = 36.0998;
  let lng = -115.1479;

  gpsInterval = setInterval(() => {
    // Add small random movement
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.5) * 0.001;

    updateGPSLocation(lat, lng);

    // Update Firebase if connected
    if (suitRef) {
      suitRef.child("environment/gps").set({
        coordinates: [lat, lng],
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });

      // Also save to history in Firebase
      const newEntry = {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      };

      suitRef.child("gpsHistory").push().set(newEntry);
    }
  }, 5000);
}

// Update GPS history panel display
function updateGPSHistoryPanel() {
  const panel = document.getElementById("gpsHistoryPanel");
  panel.innerHTML = "";

  // Show last 10 entries in reverse order (newest first)
  const entriesToShow = gpsHistory.slice().reverse().slice(0, 10);

  entriesToShow.forEach((entry) => {
    const entryElement = document.createElement("div");
    entryElement.className = "gps-history-entry";
    entryElement.innerHTML = `
            <span class="gps-history-time">${entry.timeString}</span>
            <span class="gps-history-coords">${entry.lat.toFixed(
              4
            )}, ${entry.lng.toFixed(4)}</span>
        `;
    panel.appendChild(entryElement);
  });
}

// Toggle map visibility
document.getElementById("showMapBtn").addEventListener("click", function () {
  const mapContainer = document.getElementById("mapContainer");
  const historyPanel = document.getElementById("gpsHistoryPanel");

  if (mapContainer.style.display === "none") {
    const lastLocation =
      gpsHistory.length > 0 ? gpsHistory[gpsHistory.length - 1] : null;
    if (lastLocation) {
      mapContainer.style.display = "block";
      historyPanel.style.display = "none";
      initMap(lastLocation.lat, lastLocation.lng);
      updateGPSLocation(lastLocation.lat, lastLocation.lng);
    } else {
      alert("No GPS data available yet");
    }
  } else {
    mapContainer.style.display = "none";
  }
});

// Toggle history panel visibility
document
  .getElementById("showHistoryBtn")
  .addEventListener("click", function () {
    const mapContainer = document.getElementById("mapContainer");
    const historyPanel = document.getElementById("gpsHistoryPanel");

    if (historyPanel.style.display === "none") {
      if (gpsHistory.length > 0) {
        mapContainer.style.display = "none";
        historyPanel.style.display = "block";
        updateGPSHistoryPanel();
      } else {
        alert("No GPS history available yet");
      }
    } else {
      historyPanel.style.display = "none";
    }
  });

// Update GPS location and history
function updateGPSLocation(lat, lng) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const gpsElement = document.getElementById("gps-location");

  gpsElement.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  // Add to history
  const locationData = {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
    timestamp: now,
    timeString: timeStr,
  };

  gpsHistory.push(locationData);

  // Keep only the last MAX_GPS_HISTORY entries
  if (gpsHistory.length > MAX_GPS_HISTORY) {
    gpsHistory.shift();
  }

  // Update map if visible
  if (map) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }
    map.setView([lat, lng]);
  }

  // Update history panel if visible
  if (document.getElementById("gpsHistoryPanel").style.display !== "none") {
    updateGPSHistoryPanel();
  }
}

// Toggle map visibility
document.getElementById("showMapBtn").addEventListener("click", function () {
  const mapContainer = document.getElementById("mapContainer");
  const isVisible = mapContainer.style.display !== "none";

  if (!isVisible) {
    const lastLocation =
      gpsHistory.length > 0 ? gpsHistory[gpsHistory.length - 1] : null;
    if (lastLocation) {
      mapContainer.style.display = "block";
      initMap(lastLocation.lat, lastLocation.lng);
      updateGPSLocation(lastLocation.lat, lastLocation.lng);
    } else {
      alert("No GPS data available yet");
    }
  } else {
    mapContainer.style.display = "none";
  }
});

// Simulate GPS movement (for testing)
function simulateGPSMovement() {
  if (gpsInterval) clearInterval(gpsInterval);

  // Start at Black Mesa coordinates (fictional)
  let lat = 36.0998;
  let lng = -115.1479;

  gpsInterval = setInterval(() => {
    // Add small random movement
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.5) * 0.001;

    updateGPSLocation(lat, lng);

    // Update Firebase if connected
    if (suitRef) {
      suitRef
        .child("environment/gps")
        .set(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, 5000);
}

// Add this to your setupFirebaseListeners function:
suitRef.child("environment/gps").on("value", (snapshot) => {
  const gps = snapshot.val();
  if (gps) {
    const [lat, lng] = gps.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      updateGPSLocation(lat, lng);
    }
  }
});

// GPS History listener
suitRef
  .child("gpsHistory")
  .orderByChild("timestamp")
  .limitToLast(MAX_GPS_HISTORY)
  .on("value", (snapshot) => {
    const historyData = snapshot.val();
    if (historyData) {
      // Clear local history
      gpsHistory.length = 0;

      // Convert Firebase object to array and sort by timestamp
      const historyArray = Object.values(historyData).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Add to local history with formatted time strings
      historyArray.forEach((entry) => {
        const date = new Date(entry.timestamp);
        gpsHistory.push({
          ...entry,
          timestamp: date,
          timeString: date.toLocaleTimeString(),
        });
      });

      // Update history panel if visible
      if (document.getElementById("gpsHistoryPanel").style.display !== "none") {
        updateGPSHistoryPanel();
      }
    }
  });

function setupFirebaseListeners() {
  // ... existing listeners ...

  // GPS Location listener
  suitRef.child("environment/gps/coordinates").on("value", (snapshot) => {
    const coords = snapshot.val();
    if (coords && Array.isArray(coords)) {
      const [lat, lng] = coords;
      if (!isNaN(lat) && !isNaN(lng)) {
        updateGPSLocation(lat, lng);
      }
    }
  });

  // Add download and emergency buttons (from second page)
  function addAdditionalButtons() {
    const header = document.querySelector("header");
    if (!header) return;

    // Create actions container if it doesn't exist
    let actionsContainer = document.querySelector(".header-actions");
    if (!actionsContainer) {
      actionsContainer = document.createElement("div");
      actionsContainer.className = "header-actions";
      header.appendChild(actionsContainer);
    }

    // Add download button if it doesn't exist
    if (!document.getElementById("downloadBtn")) {
      const downloadBtn = document.createElement("button");
      downloadBtn.id = "downloadBtn";
      downloadBtn.className = "action-button";
      downloadBtn.title = "Download Report";
      downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
      downloadBtn.addEventListener("click", generatePDFReport);
      actionsContainer.appendChild(downloadBtn);
    }

    // Add emergency button if it doesn't exist
    if (!document.getElementById("emergencyBtn")) {
      const emergencyBtn = document.createElement("button");
      emergencyBtn.id = "emergencyBtn";
      emergencyBtn.className = "btn btn-primary";
      emergencyBtn.style.marginTop = "1rem";
      emergencyBtn.innerHTML = '<i class="fas fa-bell"></i> Emergency Alert';
      emergencyBtn.addEventListener("click", () => {
        addAlert("EMERGENCY ALERT", "Emergency signal activated!", "danger");
      });

      // Find a suitable place to add the emergency button
      const statusCard = document.querySelector(".status-card");
      if (statusCard) {
        statusCard.appendChild(emergencyBtn);
      }
    }
  }

  // Initialize everything when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    createDataLogPanels();
    initializeDataLogs();
    addAdditionalButtons();

    // Start with current data
    updateDisplays(
      dataLogs.bpm[dataLogs.bpm.length - 1],
      dataLogs.temp[dataLogs.temp.length - 1],
      dataLogs.humidity[dataLogs.humidity.length - 1],
      dataLogs.timestamps[dataLogs.timestamps.length - 1]
    );

    // Start data simulation
    setInterval(simulateData, 2000);
  });

  // Make removeAlert available globally (if not already defined)
  if (typeof window.removeAlert === "undefined") {
    window.removeAlert = function (id) {
      const alert = document.getElementById(id);
      if (alert) {
        alert.style.opacity = "0";
        setTimeout(() => alert.remove(), 300);
      }
    };
  }
}
