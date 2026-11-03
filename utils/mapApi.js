// Utility for fetching live location data using the map API
const API_KEY = process.env.NEXT_PUBLIC_MAP_API_KEY;
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Karnataka district coordinates for weather API calls
const districtCoordinates = {
  'Bagalkot': { lat: 16.1817, lon: 75.6961 },
  'Ballari': { lat: 15.1394, lon: 76.9214 },
  'Belagavi': { lat: 15.8497, lon: 74.4977 },
  'Bengaluru Rural': { lat: 13.0827, lon: 77.5899 },
  'Bengaluru Urban': { lat: 12.9716, lon: 77.5946 },
  'Bijapur': { lat: 16.8302, lon: 75.7100 },
  'Chikballapur': { lat: 13.4324, lon: 77.7315 },
  'Chikmagalur': { lat: 13.3161, lon: 75.7720 },
  'Chitradurga': { lat: 14.2266, lon: 76.4006 },
  'Dakshina Kannada': { lat: 12.8438, lon: 75.2479 },
  'Davangere': { lat: 14.4644, lon: 75.9218 },
  'Dharwad': { lat: 15.4589, lon: 75.0078 },
  'Gadag': { lat: 15.4324, lon: 75.6381 },
  'Hassan': { lat: 13.0068, lon: 76.1004 },
  'Haveri': { lat: 14.7950, lon: 75.4003 },
  'Kalaburagi': { lat: 17.3297, lon: 76.8343 },
  'Kodagu': { lat: 12.3375, lon: 75.8069 },
  'Kolar': { lat: 13.1367, lon: 78.1291 },
  'Koppal': { lat: 15.3452, lon: 76.1548 },
  'Mandya': { lat: 12.5223, lon: 76.8951 },
  'Mangaluru': { lat: 12.9141, lon: 74.8560 },
  'Mysuru': { lat: 12.2958, lon: 76.6394 },
  'Raichur': { lat: 16.2076, lon: 77.3463 },
  'Ramanagara': { lat: 12.7150, lon: 77.2809 },
  'Shivamogga': { lat: 13.9299, lon: 75.5681 },
  'Tumkur': { lat: 13.3409, lon: 77.1010 },
  'Udupi': { lat: 13.3409, lon: 74.7421 },
  'Uttara Kannada': { lat: 14.6144, lon: 74.6819 },
  'Vijayapura': { lat: 16.8302, lon: 75.7100 },
  'Yadgir': { lat: 16.7695, lon: 77.1379 }
};

/**
 * Fetch live locations for flood monitoring stations
 * @returns {Promise<Array>} Array of monitoring station locations
 */
export const fetchMonitoringStations = async () => {
  try {
    // Format: /api/locations?key=API_KEY&type=stations
    const response = await fetch(
      `/api/locations?key=${API_KEY}&type=monitoring_stations`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching monitoring stations:', error);
    return [];
  }
};

/**
 * Fetch live rainfall data by location
 * @returns {Promise<Array>} Array of rainfall locations with intensity
 */
export const fetchRainfallLocations = async () => {
  try {
    const response = await fetch(
      `/api/locations?key=${API_KEY}&type=rainfall`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching rainfall locations:', error);
    return [];
  }
};

/**
 * Fetch river levels at different stations
 * @returns {Promise<Array>} Array of river station locations with water levels
 */
export const fetchRiverLocations = async () => {
  try {
    const response = await fetch(
      `/api/locations?key=${API_KEY}&type=river_stations`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching river locations:', error);
    return [];
  }
};

/**
 * Fetch evacuation routes and shelters
 * @returns {Promise<Array>} Array of evacuation points
 */
export const fetchEvacuationLocations = async () => {
  try {
    const response = await fetch(
      `/api/locations?key=${API_KEY}&type=evacuation`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching evacuation locations:', error);
    return [];
  }
};

/**
 * Fetch generic locations by type
 * @param {string} type - Location type (monitoring_stations, rainfall, river_stations, evacuation)
 * @param {object} filters - Additional filters (district, radius, etc.)
 * @returns {Promise<Array>} Array of locations
 */
export const fetchLocations = async (type = 'monitoring_stations', filters = {}) => {
  try {
    const params = new URLSearchParams({
      key: API_KEY,
      type,
      ...filters,
    });
    
    const response = await fetch(`/api/locations?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error(`Error fetching ${type} locations:`, error);
    return [];
  }
};

/**
 * Fetch current weather data for a district
 * @param {string} district - Karnataka district name
 * @returns {Promise<object>} Current weather data
 */
export const fetchCurrentWeather = async (district) => {
  try {
    const coords = districtCoordinates[district];
    if (!coords) {
      throw new Error(`Coordinates not found for district: ${district}`);
    }

    const response = await fetch(
      `${WEATHER_BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();

    return {
      district,
      lat: coords.lat,
      lon: coords.lon,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      weather: data.weather[0].main,
      description: data.weather[0].description,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0,
      timestamp: new Date(data.dt * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return null;
  }
};

/**
 * Fetch 5-day weather forecast for a district
 * @param {string} district - Karnataka district name
 * @returns {Promise<Array>} Array of forecast data
 */
export const fetchWeatherForecast = async (district) => {
  try {
    const coords = districtCoordinates[district];
    if (!coords) {
      throw new Error(`Coordinates not found for district: ${district}`);
    }

    const response = await fetch(
      `${WEATHER_BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();

    // Process 5-day forecast (3-hourly intervals)
    const forecast = data.list.map(item => ({
      district,
      timestamp: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: item.wind.speed,
      windDirection: item.wind.deg,
      weather: item.weather[0].main,
      description: item.weather[0].description,
      rainfall: item.rain ? item.rain['3h'] || 0 : 0,
      probability: item.pop * 100 // Precipitation probability as percentage
    }));

    return forecast;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return [];
  }
};

/**
 * Fetch current weather for all Karnataka districts
 * @returns {Promise<Array>} Array of weather data for all districts
 */
export const fetchAllDistrictsWeather = async () => {
  const districts = Object.keys(districtCoordinates);
  const weatherPromises = districts.map(district => fetchCurrentWeather(district));
  const results = await Promise.all(weatherPromises);
  return results.filter(result => result !== null);
};

/**
 * Calculate rainfall forecast for next 24 hours and 3 hours
 * @param {string} district - Karnataka district name
 * @returns {Promise<object>} Rainfall forecast data
 */
export const fetchRainfallForecast = async (district) => {
  try {
    const forecast = await fetchWeatherForecast(district);
    if (forecast.length === 0) return null;

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Filter forecast data for next 24 hours and 3 hours
    const forecast24h = forecast.filter(item => new Date(item.timestamp) <= next24Hours);
    const forecast3h = forecast.filter(item => new Date(item.timestamp) <= next3Hours);

    // Calculate total rainfall
    const rainfall24h = forecast24h.reduce((total, item) => total + (item.rainfall || 0), 0);
    const rainfall3h = forecast3h.reduce((total, item) => total + (item.rainfall || 0), 0);

    // Get current rainfall from first forecast item
    const currentRainfall = forecast.length > 0 ? forecast[0].rainfall || 0 : 0;

    return {
      district,
      rainfall24h: Math.round(rainfall24h * 10) / 10, // Round to 1 decimal
      rainfall3h: Math.round(rainfall3h * 10) / 10,
      currentRainfall: Math.round(currentRainfall * 10) / 10,
      forecast: forecast.slice(0, 8) // Next 24 hours (8 * 3-hour intervals)
    };
  } catch (error) {
    console.error('Error fetching rainfall forecast:', error);
    return null;
  }
};

export default {
  fetchMonitoringStations,
  fetchRainfallLocations,
  fetchRiverLocations,
  fetchEvacuationLocations,
  fetchLocations,
  fetchCurrentWeather,
  fetchWeatherForecast,
  fetchAllDistrictsWeather,
  fetchRainfallForecast,
};
