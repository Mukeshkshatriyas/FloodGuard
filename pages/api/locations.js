// API endpoint for fetching live map locations
// pages/api/locations.js

const API_KEY = process.env.NEXT_PUBLIC_MAP_API_KEY;

// Comprehensive Karnataka district location data
// These values represent realistic seasonal conditions for the region.
const sampleLocations = {
  monitoring_stations: [
    { id: 1,  name: 'Kodagu Station',        lat: 12.3375, lng: 75.8069, level: 4.2, status: 'active' },
    { id: 2,  name: 'Chikmagalur Station',   lat: 13.3161, lng: 75.7720, level: 3.8, status: 'active' },
    { id: 3,  name: 'Hassan Station',        lat: 13.0068, lng: 76.1004, level: 3.5, status: 'active' },
    { id: 4,  name: 'Uttara Kannada Stn.',   lat: 14.6144, lng: 74.6819, level: 4.9, status: 'active' },
    { id: 5,  name: 'Dakshina Kannada Stn.', lat: 12.8438, lng: 75.2479, level: 3.1, status: 'active' },
    { id: 6,  name: 'Shivamogga Station',    lat: 13.9299, lng: 75.5681, level: 3.7, status: 'active' },
    { id: 7,  name: 'Belagavi Station',      lat: 15.8497, lng: 74.4977, level: 2.9, status: 'active' },
    { id: 8,  name: 'Udupi Station',         lat: 13.3409, lng: 74.7421, level: 4.5, status: 'active' },
  ],
  rainfall: [
    { id: 101, district: 'Kodagu',           lat: 12.3375, lng: 75.8069, rainfall_24h: 112.4, rainfall_3h: 18.2, intensity: 'high' },
    { id: 102, district: 'Chikmagalur',      lat: 13.3161, lng: 75.7720, rainfall_24h: 78.3,  rainfall_3h: 11.6, intensity: 'moderate' },
    { id: 103, district: 'Hassan',           lat: 13.0068, lng: 76.1004, rainfall_24h: 45.3,  rainfall_3h: 5.1,  intensity: 'low' },
    { id: 104, district: 'Uttara Kannada',   lat: 14.6144, lng: 74.6819, rainfall_24h: 135.6, rainfall_3h: 24.1, intensity: 'high' },
    { id: 105, district: 'Dakshina Kannada', lat: 12.8438, lng: 75.2479, rainfall_24h: 98.2,  rainfall_3h: 14.7, intensity: 'high' },
    { id: 106, district: 'Shivamogga',       lat: 13.9299, lng: 75.5681, rainfall_24h: 67.5,  rainfall_3h: 9.3,  intensity: 'moderate' },
    { id: 107, district: 'Belagavi',         lat: 15.8497, lng: 74.4977, rainfall_24h: 38.4,  rainfall_3h: 4.2,  intensity: 'low' },
    { id: 108, district: 'Udupi',            lat: 13.3409, lng: 74.7421, rainfall_24h: 118.9, rainfall_3h: 20.5, intensity: 'high' },
    { id: 109, district: 'Mangaluru',        lat: 12.9141, lng: 74.8560, rainfall_24h: 95.6,  rainfall_3h: 13.8, intensity: 'moderate' },
    { id: 110, district: 'Mysuru',           lat: 12.2958, lng: 76.6394, rainfall_24h: 28.7,  rainfall_3h: 2.9,  intensity: 'low' },
    { id: 111, district: 'Bengaluru Urban',  lat: 12.9716, lng: 77.5946, rainfall_24h: 35.2,  rainfall_3h: 4.8,  intensity: 'low' },
    { id: 112, district: 'Tumkur',           lat: 13.3409, lng: 77.1010, rainfall_24h: 22.1,  rainfall_3h: 1.8,  intensity: 'low' },
    { id: 113, district: 'Dharwad',          lat: 15.4589, lng: 75.0078, rainfall_24h: 44.8,  rainfall_3h: 6.1,  intensity: 'low' },
    { id: 114, district: 'Kalaburagi',       lat: 17.3297, lng: 76.8343, rainfall_24h: 18.3,  rainfall_3h: 1.2,  intensity: 'low' },
    { id: 115, district: 'Raichur',          lat: 16.2076, lng: 77.3463, rainfall_24h: 14.7,  rainfall_3h: 0.9,  intensity: 'low' },
    { id: 116, district: 'Ballari',          lat: 15.1394, lng: 76.9214, rainfall_24h: 21.5,  rainfall_3h: 2.3,  intensity: 'low' },
    { id: 117, district: 'Chitradurga',      lat: 14.2266, lng: 76.4006, rainfall_24h: 31.8,  rainfall_3h: 3.5,  intensity: 'low' },
    { id: 118, district: 'Davangere',        lat: 14.4644, lng: 75.9218, rainfall_24h: 42.6,  rainfall_3h: 5.4,  intensity: 'low' },
    { id: 119, district: 'Mandya',           lat: 12.5223, lng: 76.8951, rainfall_24h: 33.4,  rainfall_3h: 3.8,  intensity: 'low' },
    { id: 120, district: 'Gadag',            lat: 15.4324, lng: 75.6381, rainfall_24h: 26.9,  rainfall_3h: 2.6,  intensity: 'low' },
  ],
  river_stations: [
    { id: 201, river: 'Kaveri',       location: 'Kodagu',         lat: 12.3375, lng: 75.8069, level: 4.2, normal_level: 3.5, alert_level: 4.5, danger_level: 5.0 },
    { id: 202, river: 'Bhadra',       location: 'Chikmagalur',    lat: 13.3161, lng: 75.7720, level: 3.8, normal_level: 3.0, alert_level: 4.0, danger_level: 4.8 },
    { id: 203, river: 'Hemavati',     location: 'Hassan',         lat: 13.0068, lng: 76.1004, level: 3.5, normal_level: 2.8, alert_level: 3.8, danger_level: 4.5 },
    { id: 204, river: 'Kali',         location: 'Uttara Kannada', lat: 14.6144, lng: 74.6819, level: 4.9, normal_level: 3.2, alert_level: 4.2, danger_level: 5.5 },
    { id: 205, river: 'Nethravati',   location: 'Dakshina Kannada',lat:12.8438, lng: 75.2479, level: 3.1, normal_level: 2.5, alert_level: 3.5, danger_level: 4.2 },
    { id: 206, river: 'Tunga',        location: 'Shivamogga',     lat: 13.9299, lng: 75.5681, level: 3.7, normal_level: 3.0, alert_level: 4.0, danger_level: 4.8 },
    { id: 207, river: 'Tungabhadra',  location: 'Ballari',        lat: 15.1394, lng: 76.9214, level: 4.8, normal_level: 3.5, alert_level: 4.5, danger_level: 5.5 },
    { id: 208, river: 'Malaprabha',   location: 'Dharwad',        lat: 15.4589, lng: 75.0078, level: 2.6, normal_level: 2.0, alert_level: 3.0, danger_level: 3.8 },
    { id: 209, river: 'Krishna',      location: 'Vijayapura',     lat: 16.8302, lng: 75.7100, level: 5.2, normal_level: 3.8, alert_level: 5.0, danger_level: 6.0 },
    { id: 210, river: 'Kaveri',       location: 'Mysuru',         lat: 12.2958, lng: 76.6394, level: 2.9, normal_level: 2.5, alert_level: 3.5, danger_level: 4.2 },
  ],
  evacuation: [
    { id: 301, name: 'Kodagu Evacuation Center',      lat: 12.3375, lng: 75.8069, capacity: 500, occupied: 120, type: 'shelter' },
    { id: 302, name: 'Chikmagalur Relief Point',      lat: 13.3161, lng: 75.7720, capacity: 300, occupied: 45,  type: 'relief_point' },
    { id: 303, name: 'Hassan Emergency Station',      lat: 13.0068, lng: 76.1004, capacity: 400, occupied: 0,   type: 'shelter' },
    { id: 304, name: 'Shivamogga Dist. Shelter',      lat: 13.9299, lng: 75.5681, capacity: 600, occupied: 85,  type: 'shelter' },
    { id: 305, name: 'Uttara Kannada Relief Camp',    lat: 14.6144, lng: 74.6819, capacity: 350, occupied: 200, type: 'relief_point' },
    { id: 306, name: 'Dakshina Kannada High Ground',  lat: 12.8438, lng: 75.2479, capacity: 450, occupied: 30,  type: 'shelter' },
  ],
};

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key, type = 'monitoring_stations', district, limit = 50 } = req.query;

  // Verify API key — if NEXT_PUBLIC_MAP_API_KEY is not set, allow all requests
  if (API_KEY && key !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  try {
    let locations = sampleLocations[type] || [];

    // Filter by district if provided
    if (district && locations.length > 0) {
      locations = locations.filter(loc => 
        loc.district?.toLowerCase() === district.toLowerCase() ||
        loc.location?.toLowerCase() === district.toLowerCase()
      );
    }

    // Limit results
    locations = locations.slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      type,
      count: locations.length,
      locations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Location API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch locations' 
    });
  }
}
