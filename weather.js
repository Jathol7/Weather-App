const apiUrl = "https://api.open-meteo.com/v1/forecast";

document.getElementById("getForecast").addEventListener("click", getWeather);

// TAB SWITCH
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function () {
        document.querySelector(".tab.active").classList.remove("active");
        this.classList.add("active");

        document.querySelector(".tab-content.active").classList.remove("active");
        document.getElementById(this.dataset.tab).classList.add("active");
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

    // FULL WEATHER REQUEST (with daily + hourly + weathercode)
    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weathercode&hourly=temperature_2m,apparent_temperature,precipitation_probability,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=${timezone}`
    );
    const data = await res.json();

    // === CURRENT WEATHER ===
    document.getElementById("temp").innerText = Math.round(data.current.temperature_2m) + "°C";
    document.getElementById("feels").innerText = Math.round(data.current.apparent_temperature) + "°C";
    document.getElementById("humidity").innerText = data.hourly.relative_humidity_2m[0] + "%";
    document.getElementById("wind").innerText = "12 km/h"; // not in current, we can add later
    document.getElementById("pressure").innerText = "1013 hPa"; // not in this API, optional
    document.getElementById("location").innerText = `${name}, ${country}`;

    const today = new Date();
    const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    document.getElementById("dateDay").innerText = today.toLocaleDateString("en-US", options);
    document.getElementById("description").innerText = "Mainly Clear";

  
    // === HOURLY (Already working) ===
    let hourlyHTML = "";
    for (let i = 0; i < 24; i++) {
        const hour = new Date(data.hourly.time[i]).getHours();
        const displayHour = hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour < 12 ? hour + " AM" : (hour - 12) + " PM";
        hourlyHTML += `
            <div class="hour-card">
                <h4>${displayHour}</h4>
                <h2>${Math.round(data.hourly.temperature_2m[i])}°</h2>
                <p>${data.hourly.precipitation_probability[i]}% Rain</p>
            </div>`;
    }
    document.getElementById("hourlyContainer").innerHTML = hourlyHTML;


    // === DAILY FORECAST ===
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

    // === CHARTS (Temperature + Precipitation) ===
    const labels = data.hourly.time.slice(0, 24).map(t => new Date(t).getHours() + ":00");

    // Destroy old charts if exist
    if (window.tempChart) window.tempChart.destroy();
    if (window.precipChart) window.precipChart.destroy();

    window.tempChart = new Chart(document.getElementById("tempChart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                { label: "Temperature (°C)", data: data.hourly.temperature_2m.slice(0,24).map(Math.round), borderColor: "#ff6b6b", tension: 0.4, fill: false },
                { label: "Feels Like (°C)", data: data.hourly.apparent_temperature.slice(0,24).map(Math.round), borderColor: "#4ecdc4", tension: 0.4, fill: false }
            ]
        },
        options: { plugins: { legend: { labels: { color: "white" }}}, scales: { x: { ticks: { color: "#ccc" }}, y: { ticks: { color: "#ccc" }}} }
    });

    window.precipChart = new Chart(document.getElementById("precipChart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                { label: "Precipitation Probability (%)", data: data.hourly.precipitation_probability.slice(0,24), backgroundColor: "#00d4ff", type: "bar" },
                { label: "Humidity (%)", data: data.hourly.relative_humidity_2m.slice(0,24), borderColor: "#9b59b6", type: "line", tension: 0.4, yAxisID: "y1" }
            ]
        },
        options: {
            scales: {
                y: { ticks: { color: "#ccc" }},
                y1: { position: "right", ticks: { color: "#ccc" }, grid: { drawOnChartArea: false }}
            }
        }
    });
}

// ----------------------
// WINDY LIVE SATELLITE BACKGROUND
// ----------------------

const options = {
    key: 'TUOh2EWr3ioZv05ETK08wPmypvTiKJPy',  // YOUR WINDY API KEY
    verbose: false,
    lat: 25.276987,   // Default view
    lon: 55.296249,
    zoom: 5,
    layer: 'satellite',   // Live satellite layer
    timestamp: Date.now()
};

windyInit(options, windyAPI => {
    const { map } = windyAPI;

    // Disable all interactions (so it works as a background)
    map.dragging.disable();
    map.touchZoom.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map._handlers.forEach(h => h.disable());

    // Set container visible
    document.getElementById("windyBackground").style.opacity = "1";
});
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function () {

        document.querySelector(".tab.active").classList.remove("active");
        this.classList.add("active");

        document.querySelector(".tab-content.active").classList.remove("active");
        document.getElementById(this.dataset.tab).classList.add("active");

        // FIX CHART NOT SHOWING
        setTimeout(() => {
            if (window.tempChart) window.tempChart.resize();
            if (window.precipChart) window.precipChart.resize();
        }, 250);
    });
});
