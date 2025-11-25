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
    let city = document.getElementById("cityInput").value;

    if (!city) return alert("Enter a city name!");

    // GET COORDINATES
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
    const geoData = await geo.json();

    if (!geoData.results) return alert("City not found!");

    const { latitude, longitude, name, country, } = geoData.results[0];

    // GET WEATHER
    const res = await fetch(`${apiUrl}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m`);
    const data = await res.json();

    // UPDATE CURRENT WEATHER
    document.getElementById("temp").innerText = data.current_weather.temperature + "°C";
    document.getElementById("wind").innerText = data.current_weather.windspeed + " km/h";
    document.getElementById("location").innerText = `${name}, ${country}`;
    document.getElementById('dateDay').innerText='today date';
    document.getElementById("description").innerText = "Mainly Clear";

    document.getElementById("feels").innerText = data.current_weather.temperature;
    document.getElementById("humidity").innerText = data.hourly.relative_humidity_2m[0] + "%";
    document.getElementById("pressure").innerText = Math.round(data.hourly.pressure_msl[0]) + " hPa";

    // HOURLY FORECAST
    let hourlyHTML = "";
    for (let i = 0; i < 24; i++) {
        hourlyHTML += `
        <div class="hour-card">
            <h4>${i}:00</h4>
            <h2>${data.hourly.temperature_2m[i]}°</h2>
            <p>${data.hourly.relative_humidity_2m[i]}% Humidity</p>
        </div>`;
    }
    document.getElementById("hourlyContainer").innerHTML = hourlyHTML;
}
