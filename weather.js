const apiUrl = "https://api.open-meteo.com/v1/forecast";

document.getElementById("getForecast").addEventListener("click", getWeather);

// TAB SWITCH (ONLY ONE VERSION)
// TAB SWITCHING (safe resize)
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function () {
        document.querySelector(".tab.active").classList.remove("active");
        this.classList.add("active");
        document.querySelector(".tab-content.active").classList.remove("active");
        document.getElementById(this.dataset.tab).classList.add("active");

        // Safe resize after tab change
        setTimeout(() => {
            if (window.tempChart && typeof window.tempChart.resize === 'function') {
                window.tempChart.resize();
            }
            if (window.precipChart && typeof window.precipChart.resize === 'function') {
                window.precipChart.resize();
            }
        }, 100);
    });
});

// MAIN FUNCTION
async function getWeather() {
    let city = document.getElementById("cityInput").value || "Dubai";

    // GET COORDINATES
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
    const geoData = await geo.json();

    if (!geoData.results) return alert("City not found!");

    const { latitude, longitude, name, country, timezone } = geoData.results[0];

    // WEATHER REQUEST
  const res = await fetch(
    `${apiUrl}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,pressure_msl,weathercode` +
    `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weathercode` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&timezone=${encodeURIComponent(timezone)}`
);
    const data = await res.json();

    // CURRENT WEATHER
    document.getElementById("temp").innerText = Math.round(data.current.temperature_2m) + "°C";
    document.getElementById("feels").innerText = Math.round(data.current.apparent_temperature) + "°C";
    document.getElementById("humidity").innerText = data.hourly.relative_humidity_2m[0] + "%";
    document.getElementById("wind").innerText = "12 km/h";
    document.getElementById("pressure").innerText = "1013 hPa";
    document.getElementById("location").innerText = `${name}, ${country}`;

    const today = new Date();
    const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    document.getElementById("dateDay").innerText = today.toLocaleDateString("en-US", options);
    document.getElementById("description").innerText = "Mainly Clear";

    // HOURLY WEATHER
    let hourlyHTML = "";
    for (let i = 0; i < 24; i++) {
        const hour = new Date(data.hourly.time[i]).getHours();
        const ampm = hour < 12 ? "AM" : "PM";
        const displayHour = (hour % 12 || 12) + " " + ampm;

        hourlyHTML += `
            <div class="hour-card">
                <h4>${displayHour}</h4>
                <h2>${Math.round(data.hourly.temperature_2m[i])}°</h2>
                <p>${data.hourly.precipitation_probability[i]}% Rain</p>
            </div>`;
    }
    document.getElementById("hourlyContainer").innerHTML = hourlyHTML;

    // DAILY FORECAST
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let dailyHTML = "";
    data.daily.time.forEach((date, i) => {
        const dayName = days[new Date(date).getDay()];
        dailyHTML += `
            <div class="day-card">
                <h4>${dayName}</h4>
                <div class="temp-HL">
                    <div class="high">${Math.round(data.daily.temperature_2m_max[i])}°</div>
                    <div class="low">${Math.round(data.daily.temperature_2m_min[i])}°</div>
                </div>
                <div class="rain">${data.daily.precipitation_probability_max[i]}%</div>
            </div>`;
    });
    document.getElementById("dailyContainer").innerHTML = dailyHTML;

    // GRAPHS (TEMP + FEELS)
        // === CHARTS ===
    // 1. Create labels (this must come BEFORE the charts!)

    // Destroy old charts safely
// ---------------------------
//      GRAPH SECTION UPDATED
// ---------------------------

// Destroy previous charts
if (window.tempChart instanceof Chart) window.tempChart.destroy();
if (window.precipChart instanceof Chart) window.precipChart.destroy();

// Labels (24 hours)
const labels = data.hourly.time.slice(0, 24).map(t => {
    const h = new Date(t).getHours();
    return (h % 12 || 12) + (h < 12 ? " AM" : " PM");
});

// TEMP + FEELS CHART
window.tempChart = new Chart(document.getElementById("tempChart"), {
    type: "line",
    data: {
        labels,
        datasets: [
            {
                label: "Temperature (°C)",
                data: data.hourly.temperature_2m.slice(0, 24),
                borderColor: "rgba(255,255,255,0.9)",
                borderWidth: 3,
                tension: 0.45,
                pointRadius: 4,
                pointBackgroundColor: "#ffffff",
                fill: false,
            },
            {
                label: "Feels Like (°C)",
                data: data.hourly.apparent_temperature.slice(0, 24),
                borderColor: "rgba(255,120,120,1)",
                borderWidth: 3,
                tension: 0.45,
                pointRadius: 4,
                pointBackgroundColor: "rgba(255,120,120,1)",
                fill: false,
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: { ticks: { color: "white" } },
            y: { ticks: { color: "white" } }
        },
        plugins: {
            legend: {
                labels: { color: "white" }
            }
        }
    }
});

// PRECIPITATION + HUMIDITY CHART
// PRECIPITATION + HUMIDITY (LINE + LINE)
window.precipChart = new Chart(document.getElementById("precipChart"), {
    type: "line",
    data: {
        labels: labels,
        datasets: [
            {
                label: "Precipitation (%)",
                data: data.hourly.precipitation_probability.slice(0, 24),
                borderColor: "#4da6ff",
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#4da6ff",
                fill: false,
            },
            {
                label: "Humidity (%)",
                data: data.hourly.relative_humidity_2m.slice(0, 24),
                borderColor: "#ffdd55",
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#ffdd55",
                fill: false,
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: { ticks: { color: "white" } },
            y: { ticks: { color: "white" } }
        },
        plugins: {
            legend: {
                labels: { color: "white" }
            }
        }
    }
});


}