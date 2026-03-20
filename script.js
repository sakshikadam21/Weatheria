
const apiKey = "ypur-api-key-here";

const loader = document.getElementById("loader");
const bg = document.getElementById("bg");
const cityInput = document.getElementById("cityInput");
const mainWeather = document.getElementById("mainWeather");
const cityScroll = document.getElementById("cityScroll");
const recentScroll = document.getElementById("recentScroll");
const favScroll = document.getElementById("favScroll");


/* ================== GLOBAL STATE ================== */
let recent = [];
let unit = "C";
let currentCity = "";
let favorites = JSON.parse(localStorage.getItem("favCities")) || [];

/* ================== WEATHER EMOJI ================== */
function weatherEmoji(condition) {
    condition = condition.toLowerCase();

    if (condition.includes("clear") || condition.includes("sun")) return "☀️";
    if (condition.includes("cloud") || condition.includes("overcast")) return "☁️";
    if (condition.includes("rain")) return "🌧️";
    if (condition.includes("drizzle")) return "🌦️";
    if (condition.includes("thunder")) return "⛈️";
    if (condition.includes("snow")) return "❄️";
    if (
        condition.includes("mist") ||
        condition.includes("haze") ||
        condition.includes("fog") ||
        condition.includes("smoke")
    ) return "🌫️";

    return "🌤️";
}

/* ================== EFFECT LAYERS ================== */
const rainLayer = document.createElement("div");
rainLayer.className = "rain";
document.body.appendChild(rainLayer);

const cloudLayer = document.createElement("div");
cloudLayer.className = "cloud-layer";
document.body.appendChild(cloudLayer);

/* ================== POPULAR CITIES ================== */
const popularCities = [
    "Dubai","Riyadh","Jeddah",
    "London","Seattle","Dublin",
    "Singapore","Bangkok","Kuala Lumpur",
    "Moscow","Helsinki","Reykjavik",
    "Mumbai","Delhi","Bangalore","Hyderabad"
];

/* ================== ON LOAD ================== */
window.onload = () => {
    loadCity("Pune", true);
    popularCities.forEach(city => loadCity(city, false));
    renderRecent();
    renderFavorites();
};


/* ================== SEARCH ================== */
function searchCity() {
    const city = cityInput.value.trim();
    if (!city) return;
    loadCity(city, true);
    cityInput.value = "";
}

/* ================== API ================== */
function loadCity(city, main) {
    if (main) loader.style.display = "block";

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(d => {
            if (d.cod !== 200) return;

            if (main) {
                loader.style.display = "none";
                currentCity = d.name;
                renderMain(d);
                saveRecent(d.name);

                fetchAQI(d.coord.lat, d.coord.lon);
                //Above line foe AQI

                fetch5DayForecast(d.coord.lat, d.coord.lon);
                //For fetching 5 days records 



            } else {
                createCityCard(d);
            }
        });
}





function fetchAQI(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
        .then(res => {
            if (!res.ok) throw new Error("AQI fetch failed");
            return res.json();
        })
        .then(data => {
            renderAQI(data);
        })
        .catch(err => {
            console.error("AQI Error:", err);
        });
}





function fetch5DayForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => render5DayForecast(data))
        .catch(err => console.error("Forecast error", err));
}


function renderAQI(data) {
    const aqi = data.list[0].main.aqi;

    let label = "";
    let color = "";

    switch (aqi) {
        case 1: label = "Good 😊"; color = "#2ecc71"; break;
        case 2: label = "Fair 🙂"; color = "#f1c40f"; break;
        case 3: label = "Moderate 😐"; color = "#e67e22"; break;
        case 4: label = "Poor 😷"; color = "#e74c3c"; break;
        case 5: label = "Very Poor ☠️"; color = "#8e44ad"; break;
    }

    const aqiBox = document.getElementById("aqiBox");
    if (!aqiBox) return;

    aqiBox.innerHTML = `
        <h4>🌫 Air Quality</h4>
        <div class="aqi-value" style="color:${color}">
            AQI ${aqi} – ${label}
        </div>
    `;
}






function render5DayForecast(data) {
    const container = document.getElementById("forecast5");
    container.innerHTML = "";

    const daily = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    ).slice(0, 5);

    daily.forEach((day, index) => {
        const date = new Date(day.dt * 1000);
        const emoji = weatherEmoji(day.weather[0].description);
        const isToday = index === 0;

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h4>${isToday ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}</h4>
            <div class="forecast-emoji">${emoji}</div>
            <p class="forecast-temp">${Math.round(day.main.temp)}°C</p>

            ${isToday ? `
              <p class="update-note">🕒 Updated every 3 hours</p>
            ` : ""}

            <p class="forecast-desc">${day.weather[0].main}</p>
        `;

        container.appendChild(card);
    });
}








/* ================== MAIN CARD ================== */
function renderMain(d) {
    applyTheme(d);

    const emoji = weatherEmoji(d.weather[0].description);
    const isFav = favorites.includes(d.name);
    const temp = getTemp(d.main.temp);

    mainWeather.innerHTML = `
        <div class="card big-card">
            <div class="top-row">
                <h2>${d.name}</h2>
                <span class="fav-btn" onclick="toggleFavorite('${d.name}')">
                    ${isFav ? "❤️" : "🤍"}
                </span>
            </div>

            <div class="floating-emoji">${emoji}</div>

            <h1 class="temp">${temp}°${unit}</h1>
            <p class="desc">${d.weather[0].description}</p>

            ${renderSunProgress(d)}

            <div class="glow-grid">
                <div class="glow-box">💧 Humidity<br><b>${d.main.humidity}%</b></div>
                <div class="glow-box">🌬 Wind<br><b>${d.wind.speed} m/s</b></div>
                <div class="glow-box">🔽 Pressure<br><b>${d.main.pressure} hPa</b></div>
                <div class="glow-box">👁 Visibility<br><b>${(d.visibility/1000).toFixed(1)} km</b></div>
            </div>

            <div class="aqi-inline" id="aqiBox">
    <h4>🌫 Air Quality</h4>
    <p class="aqi-loading">Loading AQI...</p>
</div>

            <button class="unit-btn" onclick="toggleUnit()">°C / °F</button>
        </div>
    `;

    rainLayer.style.display =
        d.weather[0].main.toLowerCase().includes("rain") ? "block" : "none";
}

/* ================== SUN PROGRESS (WITH TIMINGS BELOW) ================== */

          function renderSunProgress(d) {
    const now = d.dt;
    const sunrise = d.sys.sunrise;
    const sunset = d.sys.sunset;

    let progress = ((now - sunrise) / (sunset - sunrise)) * 100;
    progress = Math.min(Math.max(progress, 0), 100);

    const formatTime = (ts) =>
        new Date(ts * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    return `
        <div class="sun-bar-wrapper">
            <div class="sun-side">
                🌅
                <div class="sun-time">${formatTime(sunrise)}</div>
            </div>

            <div class="sun-bar">
                <div class="bar">
                    <div class="fill" style="width:${progress}%"></div>
                </div>
            </div>

            <div class="sun-side">
                🌇
                <div class="sun-time">${formatTime(sunset)}</div>
            </div>
        </div>
    `;
}



/* ================== TEMP UNIT ================== */
function toggleUnit() {
    unit = unit === "C" ? "F" : "C";
    loadCity(currentCity, true);
}

function getTemp(tempC) {
    return unit === "C"
        ? Math.round(tempC)
        : Math.round((tempC * 9/5) + 32);
}

/* ================== FAVORITES ================== */
function toggleFavorite(city) {
    if (favorites.includes(city)) {
        favorites = favorites.filter(c => c !== city);
    } else {
        favorites.push(city);
    }

    localStorage.setItem("favCities", JSON.stringify(favorites));
    renderFavorites();
    loadCity(city, true);
}


function renderFavorites() {
    favScroll.innerHTML = "";

    if (favorites.length === 0) {
        favScroll.innerHTML =
            `<p style="opacity:.6;padding-left:10px">No favorite cities</p>`;
        return;
    }

    favorites.forEach(city => {
        const card = document.createElement("div");
        card.className = "city-card fav-card";

        card.innerHTML = `
            <h4>${city}</h4>
            <div style="font-size:28px">❤️</div>
            <p style="font-size:.75rem;opacity:.7">Tap to remove</p>
        `;

        // 🔥 REMOVE from favorites on click
        card.onclick = () => {
            favorites = favorites.filter(c => c !== city);
            localStorage.setItem("favCities", JSON.stringify(favorites));
            renderFavorites();
        };

        favScroll.appendChild(card);
    });
}


/* ================== THEME ================== */
function applyTheme(d) {
    const isDay = d.dt > d.sys.sunrise && d.dt < d.sys.sunset;
    const timeClass = isDay ? "day" : "night";

    let tempClass = "normal";
    if (d.main.temp >= 30) tempClass = "hot";
    else if (d.main.temp <= 15) tempClass = "cold";

    bg.className = "bg-animation";
    bg.classList.add(timeClass, tempClass);
}

/* ================== POPULAR CARD ================== */
function createCityCard(d) {
    const card = document.createElement("div");
    card.className = "city-card";

    const emoji = weatherEmoji(d.weather[0].description);

    card.innerHTML = `
        <h4>${d.name}</h4>
        <div style="font-size:32px">${emoji}</div>
        <p>${Math.round(d.main.temp)}°C</p>
        <span class="badge">${d.weather[0].main}</span>
    `;

    card.onclick = () => loadCity(d.name, true);
    cityScroll.appendChild(card);
}

/* ================== RECENT ================== */
function saveRecent(city) {
    recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
    recent.unshift(city);
    if (recent.length > 6) recent.pop();
    renderRecent();
}

function renderRecent() {
    recentScroll.innerHTML = "";

    if (recent.length === 0) {
        recentScroll.innerHTML =
            `<p style="opacity:.7;padding-left:10px">No recent searches</p>`;
        return;
    }

    recent.forEach(city => {
        const card = document.createElement("div");
        card.className = "city-card";

        card.innerHTML = `
            <h4>${city}</h4>
            <div style="font-size:28px">🕘</div>
            <p style="font-size:.75rem;opacity:.6">Tap to view</p>
        `;

        card.onclick = () => loadCity(city, true);
        recentScroll.appendChild(card);
    });
}


function useMyLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            loadCityByCoords(lat, lon);
        },
        () => alert("Location permission denied")
    );
}


function loadCityByCoords(lat, lon) {
    loader.style.display = "block";

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(d => {
            loader.style.display = "none";
            currentCity = d.name;
            renderMain(d);
            saveRecent(d.name);
        });
}



window.addEventListener("load", () => {
    const gif = document.querySelector(".title-gif img");
    gif.src = gif.src; 
});






   

