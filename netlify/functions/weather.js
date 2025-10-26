// netlify/functions/weather.js
exports.handler = async (event, context) => {
  // Pobierz parametry z query string
  const { endpoint, city } = event.queryStringParameters;

  // Walidacja parametrów
  if (!endpoint || !city) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing endpoint or city parameter' })
    };
  }

  // Dozwolone endpointy
  const allowedEndpoints = ['weather', 'forecast'];
  if (!allowedEndpoints.includes(endpoint)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid endpoint' })
    };
  }

  // Klucz API - będzie brany z environment variables
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    // Wywołaj OpenWeatherMap API
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endpoint}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Zwróć dane z odpowiednimi headerami CORS
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch weather data',
        message: error.message 
      })
    };
  }
};