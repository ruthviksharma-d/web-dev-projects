function getWeather() {
    const apiKey = '';        //paste the api key here from the website provided in the text file
    const city = document.getElementById('city').value;

    if (!city) {
        alert('Please enter a city');
        return;
    }

    const currentWeatherUrl = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
    const forecastUrl = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3`;

    fetch(currentWeatherUrl)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
        })
        .catch(error => {
            console.error('Error fetching current weather data:', error);
            alert('Error fetching current weather data. Please try again.');
        });

    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            displayHourlyForecast(data.forecast.forecastday[0].hour); // Access hourly data correctly
        })
        .catch(error => {
            console.error('Error fetching hourly forecast data:', error);
            alert('Error fetching hourly forecast data. Please try again.');
        });

    function displayWeather(data) {
        const tempDivInfo = document.getElementById('temp-div');
        const weatherInfoDiv = document.getElementById('weather-info');
        const weatherIcon = document.getElementById('weather-icon');

        // Clear previous content
        weatherInfoDiv.innerHTML = '';
        tempDivInfo.innerHTML = '';

        if (data.error) {
            weatherInfoDiv.innerHTML = `<p>${data.error.message}</p>`;
        } else {
            const cityName = data.location.name;
            const temperature = data.current.temp_c; // Temperature in Celsius
            const description = data.current.condition.text;
            const iconUrl = `http:${data.current.condition.icon}`; // WeatherAPI icon URL

            const temperatureHTML = `<p>${temperature}°C</p>`;
            const weatherHtml = `<p>${cityName}</p><p>${description}</p>`;

            tempDivInfo.innerHTML = temperatureHTML;
            weatherInfoDiv.innerHTML = weatherHtml;
            weatherIcon.src = iconUrl;
            weatherIcon.alt = description;

            showImage();
        }
    }

    function displayHourlyForecast(hourlyData) {
        const hourlyForecastDiv = document.getElementById('hourly-forecast');
        hourlyForecastDiv.innerHTML = ''; // Clear previous content

        hourlyData.slice(0, 8).forEach(item => { // Display next 8 hours
            const time = item.time.split(' ')[1]; // Extract hour from time string
            const temperature = item.temp_c;
            const iconUrl = `http:${item.condition.icon}`;

            const hourlyItemHtml = `
                <div class="hourly-item">
                    <span>${time}</span>
                    <img src="${iconUrl}" alt="Hourly Weather Icon">
                    <span>${temperature}°C</span>
                </div>
            `;

            hourlyForecastDiv.innerHTML += hourlyItemHtml;
        });
    }

    function showImage() {
        const weatherIcon = document.getElementById('weather-icon');
        weatherIcon.style.display = 'block';
    }
}
