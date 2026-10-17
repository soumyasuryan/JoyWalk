import { driver, getSession } from './neo4j.js';

// Haversine formula to compute great-circle distance between two coords in km
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * 52 Realistic Delhi NCR Pedestrian Wellness Nodes
 * 5 Scenic Promenade Gateways + 2 Iconic Heritage Gems + 45 Neighborhood Walking Hubs
 */
export const NEIGHBORHOODS = [
  // 5 Scenic Promenade Starting Gateways (repurposed from logistics hubs into pedestrian starting plazas)
  {
    name: 'Gurgaon Cyber Green Promenade',
    lat: 28.4950,
    lon: 77.0895,
    isPromenade: true,
    isWarehouse: true, // backward-compat
    zone: 'South-West NCR',
    greenCanopyIndex: 76.5,
    noiseLevelDb: 53.0,
    joyMomentDensity: 6,
    description: 'Elevated green walkway linking corporate eco-courtyards with tree canopy tunnels.'
  },
  {
    name: 'Okhla Bird Sanctuary & Forest Trails',
    lat: 28.5308,
    lon: 77.2711,
    isPromenade: true,
    isWarehouse: true,
    zone: 'South Delhi',
    greenCanopyIndex: 89.2,
    noiseLevelDb: 42.5,
    joyMomentDensity: 9,
    description: 'Wetland trails bordered by native neem and babool trees with tranquil bird hides.'
  },
  {
    name: 'Anand Vihar Eco-Breeze Promenade',
    lat: 28.6469,
    lon: 77.3160,
    isPromenade: true,
    isWarehouse: true,
    zone: 'East Delhi',
    greenCanopyIndex: 66.0,
    noiseLevelDb: 61.5,
    joyMomentDensity: 5,
    description: 'Sheltered pedestrian walkway buffered by tall dense bamboo screens and misting hubs.'
  },
  {
    name: 'Dwarka Swarna Jayanti Eco-Park',
    lat: 28.5523,
    lon: 77.0583,
    isPromenade: true,
    isWarehouse: true,
    zone: 'West Delhi',
    greenCanopyIndex: 83.5,
    noiseLevelDb: 47.0,
    joyMomentDensity: 7,
    description: 'Expansive landscaped park featuring water retention swales and shaded boulevards.'
  },
  {
    name: 'Alipur Northern Orchard Reserve',
    lat: 28.7983,
    lon: 77.1332,
    isPromenade: true,
    isWarehouse: true,
    zone: 'North Delhi',
    greenCanopyIndex: 85.0,
    noiseLevelDb: 43.0,
    joyMomentDensity: 6,
    description: 'Rustic countryside orchard trails lined with mango groves and wildflower corridors.'
  },

  // 2 Iconic Heritage & Wellness Centers
  {
    name: 'Lodhi Art District & Gardens',
    lat: 28.5893,
    lon: 77.2285,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 91.5,
    noiseLevelDb: 41.0,
    joyMomentDensity: 13,
    description: 'Open-air mural gallery nestled under sprawling jamun canopies and historic tomb gardens.'
  },
  {
    name: 'Sunder Nursery Heritage Park',
    lat: 28.5950,
    lon: 77.2435,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 96.0,
    noiseLevelDb: 37.5,
    joyMomentDensity: 15,
    description: 'UNESCO-restored botanical sanctuary with marble fountains, ancient banyans, and lotus ponds.'
  },

  // Central Delhi (7)
  {
    name: 'Connaught Place',
    lat: 28.6315,
    lon: 77.2167,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 56.0,
    noiseLevelDb: 64.5,
    joyMomentDensity: 9,
    description: 'Circular colonial colonnades with inner garden parks, vintage bookstores, and chai corners.'
  },
  {
    name: 'Chandni Chowk',
    lat: 28.6562,
    lon: 77.2304,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 34.0,
    noiseLevelDb: 74.0,
    joyMomentDensity: 11,
    description: 'Historic pedestrian-only heritage promenade bursting with spice aromas and Mughal archways.'
  },
  {
    name: 'Karol Bagh',
    lat: 28.6517,
    lon: 77.1906,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 49.0,
    noiseLevelDb: 69.0,
    joyMomentDensity: 5,
    description: 'Bustling commercial avenue with pedestrianized market plazas and street art benches.'
  },
  {
    name: 'Paharganj',
    lat: 28.6434,
    lon: 77.2150,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 32.5,
    noiseLevelDb: 73.0,
    joyMomentDensity: 6,
    description: 'Quirky backpacker alleys with rooftop terrace gardens, windchimes, and vibrant bakeries.'
  },
  {
    name: 'Civil Lines',
    lat: 28.6814,
    lon: 77.2227,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 84.5,
    noiseLevelDb: 47.0,
    joyMomentDensity: 8,
    description: 'Leafy colonial avenue shaded by century-old peepal and amaltas trees alongside the Northern Ridge.'
  },
  {
    name: 'Chanakyapuri',
    lat: 28.5983,
    lon: 77.1973,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 93.0,
    noiseLevelDb: 42.0,
    joyMomentDensity: 9,
    description: 'Wide diplomatic boulevard with dense shaded sidewalks, bougainvillea hedges, and tranquil fountains.'
  },
  {
    name: 'Patel Nagar',
    lat: 28.6575,
    lon: 77.1601,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Central Delhi',
    greenCanopyIndex: 51.5,
    noiseLevelDb: 65.0,
    joyMomentDensity: 4,
    description: 'Residential community lined with local neighborhood pocket parks and tea stalls.'
  },

  // South Delhi (12)
  {
    name: 'Hauz Khas',
    lat: 28.5494,
    lon: 77.2001,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 88.0,
    noiseLevelDb: 46.0,
    joyMomentDensity: 11,
    description: '13th-century reservoir ruins overlooking deer park forest paths and artisan galleries.'
  },
  {
    name: 'Saket',
    lat: 28.5245,
    lon: 77.2066,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 75.0,
    noiseLevelDb: 53.0,
    joyMomentDensity: 6,
    description: 'Modern neighborhood with landscaped pedestrian plazas and open-air amphitheaters.'
  },
  {
    name: 'Greater Kailash',
    lat: 28.5380,
    lon: 77.2415,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 81.0,
    noiseLevelDb: 49.0,
    joyMomentDensity: 8,
    description: 'Verdant residential blocks with shaded lane walks and boutique garden bistros.'
  },
  {
    name: 'Lajpat Nagar',
    lat: 28.5700,
    lon: 77.2400,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 54.0,
    noiseLevelDb: 67.5,
    joyMomentDensity: 7,
    description: 'Vibrant cultural market bordered by tree-lined neighborhood residential greens.'
  },
  {
    name: 'Vasant Kunj',
    lat: 28.5293,
    lon: 77.1524,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 85.5,
    noiseLevelDb: 46.5,
    joyMomentDensity: 6,
    description: 'Sprawling green sector adjoining the Southern Ridge biodiversity park trail network.'
  },
  {
    name: 'Nehru Place',
    lat: 28.5494,
    lon: 77.2530,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 48.0,
    noiseLevelDb: 70.0,
    joyMomentDensity: 5,
    description: 'Urban plaza with shaded elevated concourses adjacent to the iconic Lotus Temple grounds.'
  },
  {
    name: 'Malviya Nagar',
    lat: 28.5323,
    lon: 77.2086,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 70.0,
    noiseLevelDb: 54.5,
    joyMomentDensity: 6,
    description: 'Community pocket gardens, artisan bakeries, and quiet shaded residential lanes.'
  },
  {
    name: 'Defence Colony',
    lat: 28.5733,
    lon: 77.2312,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 84.0,
    noiseLevelDb: 46.0,
    joyMomentDensity: 8,
    description: 'Stately residential avenues with dense overarching canopy of neem, gulmohar, and jacaranda.'
  },
  {
    name: 'Mehrauli',
    lat: 28.5177,
    lon: 77.1852,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 83.0,
    noiseLevelDb: 48.0,
    joyMomentDensity: 10,
    description: 'Ancient Archaeological Park wandering paths through medieval stepwells and forested ruins.'
  },
  {
    name: 'Sarita Vihar',
    lat: 28.5284,
    lon: 77.2982,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 64.0,
    noiseLevelDb: 59.0,
    joyMomentDensity: 4,
    description: 'Wide pocket-park avenues connecting green residential clusters near the river bend.'
  },
  {
    name: 'Green Park',
    lat: 28.5588,
    lon: 77.2074,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 82.0,
    noiseLevelDb: 49.0,
    joyMomentDensity: 7,
    description: 'Peaceful garden neighborhood with direct tree-shaded walkways opening into Deer Park.'
  },
  {
    name: 'Chittaranjan Park',
    lat: 28.5398,
    lon: 77.2505,
    isPromenade: false,
    isWarehouse: false,
    zone: 'South Delhi',
    greenCanopyIndex: 79.0,
    noiseLevelDb: 48.5,
    joyMomentDensity: 8,
    description: 'Cultural quarter with leafy parks, neighborhood sweet shops, and fish market aromas.'
  },

  // West Delhi (9)
  {
    name: 'Dwarka',
    lat: 28.5921,
    lon: 77.0460,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 73.0,
    noiseLevelDb: 53.0,
    joyMomentDensity: 5,
    description: 'Planned sub-city with wide pedestrian green verges and district sports parks.'
  },
  {
    name: 'Janakpuri',
    lat: 28.6219,
    lon: 77.0878,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 84.0,
    noiseLevelDb: 44.0,
    joyMomentDensity: 8,
    description: 'Expansive 40-acre District Park, blooming rose gardens, and shaded suburban canopies.'
  },
  {
    name: 'Rajouri Garden',
    lat: 28.6415,
    lon: 77.1209,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 55.0,
    noiseLevelDb: 66.0,
    joyMomentDensity: 6,
    description: 'Lively urban district with landscaped mall courtyards and residential tree groves.'
  },
  {
    name: 'Punjabi Bagh',
    lat: 28.6692,
    lon: 77.1294,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 68.0,
    noiseLevelDb: 58.0,
    joyMomentDensity: 5,
    description: 'Generous bungalows surrounded by private foliage and community walking tracks.'
  },
  {
    name: 'Paschim Vihar',
    lat: 28.6695,
    lon: 77.0945,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 61.0,
    noiseLevelDb: 61.0,
    joyMomentDensity: 4,
    description: 'Serene housing blocks with internal jogging parks and evening tea kiosks.'
  },
  {
    name: 'Vikaspuri',
    lat: 28.6366,
    lon: 77.0711,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 59.0,
    noiseLevelDb: 62.0,
    joyMomentDensity: 4,
    description: 'Interconnected pocket parks and quiet interior neighborhood alleys.'
  },
  {
    name: 'Tilak Nagar',
    lat: 28.6366,
    lon: 77.0961,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 49.0,
    noiseLevelDb: 68.0,
    joyMomentDensity: 5,
    description: 'Warm community bazaar streets adorned with festival lanterns and street snacks.'
  },
  {
    name: 'Uttam Nagar',
    lat: 28.6219,
    lon: 77.0601,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 41.0,
    noiseLevelDb: 72.0,
    joyMomentDensity: 4,
    description: 'High-density artisanal pottery alleys (Kumhar Gram) with handmade clay lanterns.'
  },
  {
    name: 'Moti Nagar',
    lat: 28.6570,
    lon: 77.1420,
    isPromenade: false,
    isWarehouse: false,
    zone: 'West Delhi',
    greenCanopyIndex: 52.0,
    noiseLevelDb: 67.0,
    joyMomentDensity: 4,
    description: 'Transit-oriented residential neighborhood with linear sidewalk gardens.'
  },

  // North Delhi (6)
  {
    name: 'Rohini',
    lat: 28.7495,
    lon: 77.0736,
    isPromenade: false,
    isWarehouse: false,
    zone: 'North Delhi',
    greenCanopyIndex: 67.0,
    noiseLevelDb: 56.0,
    joyMomentDensity: 5,
    description: 'Vast district parks, Japanese Garden promenade, and boating lake trail.'
  },
  {
    name: 'Pitampura',
    lat: 28.6990,
    lon: 77.1384,
    isPromenade: false,
    isWarehouse: false,
    zone: 'North Delhi',
    greenCanopyIndex: 70.0,
    noiseLevelDb: 55.0,
    joyMomentDensity: 6,
    description: 'Landscaped Dilli Haat cultural promenade and serene TV tower garden perimeter.'
  },
  {
    name: 'Model Town',
    lat: 28.7027,
    lon: 77.1937,
    isPromenade: false,
    isWarehouse: false,
    zone: 'North Delhi',
    greenCanopyIndex: 74.0,
    noiseLevelDb: 51.5,
    joyMomentDensity: 6,
    description: 'Historic Naini Lake walking loop with lakeside weeping willows and paddle boats.'
  },
  {
    name: 'Shalimar Bagh',
    lat: 28.7166,
    lon: 77.1593,
    isPromenade: false,
    isWarehouse: false,
    zone: 'North Delhi',
    greenCanopyIndex: 72.0,
    noiseLevelDb: 52.5,
    joyMomentDensity: 6,
    description: 'Historic Mughal garden pavilion walkways surrounded by fruit orchards.'
  },
  {
    name: 'Ashok Vihar',
    lat: 28.6917,
    lon: 77.1724,
    isPromenade: false,
    isWarehouse: false,
    zone: 'North Delhi',
    greenCanopyIndex: 71.0,
    noiseLevelDb: 54.0,
    joyMomentDensity: 5,
    description: 'Lush neighborhood ring with dense neem trees and active morning walking clubs.'
  },
  {
    name: 'Burari',
    lat: 28.7540,
    lon: 77.1990,
    isPromenade: false,
    isWarehouse: false,
    zone: 'North Delhi',
    greenCanopyIndex: 57.0,
    noiseLevelDb: 62.0,
    joyMomentDensity: 4,
    description: 'Rustic floodplain boundary with open sky views and agricultural paths.'
  },

  // East Delhi (6)
  {
    name: 'Mayur Vihar',
    lat: 28.6078,
    lon: 77.2995,
    isPromenade: false,
    isWarehouse: false,
    zone: 'East Delhi',
    greenCanopyIndex: 72.5,
    noiseLevelDb: 55.0,
    joyMomentDensity: 6,
    description: 'Riverside pocket parks, birding wetlands, and peaceful residential lanes.'
  },
  {
    name: 'Laxmi Nagar',
    lat: 28.6312,
    lon: 77.2776,
    isPromenade: false,
    isWarehouse: false,
    zone: 'East Delhi',
    greenCanopyIndex: 44.0,
    noiseLevelDb: 73.0,
    joyMomentDensity: 5,
    description: 'Energetic student book market with colorful chai shops and street murals.'
  },
  {
    name: 'Preet Vihar',
    lat: 28.6411,
    lon: 77.2965,
    isPromenade: false,
    isWarehouse: false,
    zone: 'East Delhi',
    greenCanopyIndex: 63.0,
    noiseLevelDb: 60.5,
    joyMomentDensity: 5,
    description: 'Quiet colony parks and shaded sidewalk strolls with vibrant cafes.'
  },
  {
    name: 'Dilshad Garden',
    lat: 28.6811,
    lon: 77.3204,
    isPromenade: false,
    isWarehouse: false,
    zone: 'East Delhi',
    greenCanopyIndex: 65.5,
    noiseLevelDb: 59.0,
    joyMomentDensity: 4,
    description: 'Tree-bordered residential green belts and quiet afternoon plazas.'
  },
  {
    name: 'Shahdara',
    lat: 28.6738,
    lon: 77.2905,
    isPromenade: false,
    isWarehouse: false,
    zone: 'East Delhi',
    greenCanopyIndex: 39.0,
    noiseLevelDb: 74.5,
    joyMomentDensity: 4,
    description: 'Historical trans-Yamuna bazaar with ancient clock tower and sweetmeat stalls.'
  },
  {
    name: 'Patparganj',
    lat: 28.6263,
    lon: 77.3012,
    isPromenade: false,
    isWarehouse: false,
    zone: 'East Delhi',
    greenCanopyIndex: 60.0,
    noiseLevelDb: 62.0,
    joyMomentDensity: 4,
    description: 'Wide boulevards connecting cooperative residential housing green spaces.'
  },

  // NCR Satellites: Noida, Ghaziabad, Faridabad (7)
  {
    name: 'Noida Sector 18',
    lat: 28.5708,
    lon: 77.3260,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Noida NCR',
    greenCanopyIndex: 58.0,
    noiseLevelDb: 66.0,
    joyMomentDensity: 6,
    description: 'Bustling pedestrianized shopping plazas with water fountain features.'
  },
  {
    name: 'Noida Sector 62',
    lat: 28.6280,
    lon: 77.3649,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Noida NCR',
    greenCanopyIndex: 69.0,
    noiseLevelDb: 56.5,
    joyMomentDensity: 4,
    description: 'Modern university and tech park avenues with extensive pine and eucalyptus buffers.'
  },
  {
    name: 'Indirapuram',
    lat: 28.6434,
    lon: 77.3688,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Ghaziabad NCR',
    greenCanopyIndex: 61.0,
    noiseLevelDb: 63.0,
    joyMomentDensity: 4,
    description: 'Swarn Jayanti Park lake circuit with flowering bougainvillea arches.'
  },
  {
    name: 'Vaishali',
    lat: 28.6467,
    lon: 77.3400,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Ghaziabad NCR',
    greenCanopyIndex: 63.5,
    noiseLevelDb: 61.0,
    joyMomentDensity: 4,
    description: 'Lush sector parks with morning yoga gazebos and shaded footpaths.'
  },
  {
    name: 'Kaushambi',
    lat: 28.6462,
    lon: 77.3255,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Ghaziabad NCR',
    greenCanopyIndex: 55.0,
    noiseLevelDb: 65.5,
    joyMomentDensity: 4,
    description: 'Gateway neighborhood with elevated pedestrian walkways and garden verges.'
  },
  {
    name: 'Faridabad NIT',
    lat: 28.3962,
    lon: 77.3025,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Faridabad NCR',
    greenCanopyIndex: 54.0,
    noiseLevelDb: 66.0,
    joyMomentDensity: 4,
    description: 'Broad tree-lined heritage township avenues with central town park.'
  },
  {
    name: 'Old Faridabad',
    lat: 28.4237,
    lon: 77.3197,
    isPromenade: false,
    isWarehouse: false,
    zone: 'Faridabad NCR',
    greenCanopyIndex: 51.0,
    noiseLevelDb: 67.5,
    joyMomentDensity: 4,
    description: 'Historic bazaar pathways leading toward the scenic Badkhal lake ridge.'
  }
];

/**
 * 88 Connected Corridor Pairs across Delhi NCR
 * Yielding exactly 176 bidirectional corridors
 */
export const ROAD_PAIRS = [
  // Gurgaon Hub & Gateway Connections
  ['Gurgaon Cyber Green Promenade', 'Vasant Kunj'],
  ['Gurgaon Cyber Green Promenade', 'Dwarka Swarna Jayanti Eco-Park'],
  ['Gurgaon Cyber Green Promenade', 'Mehrauli'],
  ['Gurgaon Cyber Green Promenade', 'Saket'],
  ['Gurgaon Cyber Green Promenade', 'Chanakyapuri'],
  ['Dwarka Swarna Jayanti Eco-Park', 'Dwarka'],
  ['Dwarka Swarna Jayanti Eco-Park', 'Uttam Nagar'],
  ['Dwarka Swarna Jayanti Eco-Park', 'Vasant Kunj'],
  ['Dwarka', 'Chanakyapuri'],

  // West Delhi Corridor
  ['Dwarka', 'Janakpuri'],
  ['Dwarka', 'Uttam Nagar'],
  ['Dwarka', 'Vasant Kunj'],
  ['Uttam Nagar', 'Tilak Nagar'],
  ['Tilak Nagar', 'Janakpuri'],
  ['Tilak Nagar', 'Rajouri Garden'],
  ['Tilak Nagar', 'Vikaspuri'],
  ['Janakpuri', 'Vikaspuri'],
  ['Janakpuri', 'Rajouri Garden'],
  ['Vikaspuri', 'Paschim Vihar'],
  ['Paschim Vihar', 'Punjabi Bagh'],
  ['Paschim Vihar', 'Rajouri Garden'],
  ['Rajouri Garden', 'Punjabi Bagh'],
  ['Rajouri Garden', 'Moti Nagar'],
  ['Rajouri Garden', 'Patel Nagar'],
  ['Moti Nagar', 'Patel Nagar'],
  ['Moti Nagar', 'Karol Bagh'],
  ['Patel Nagar', 'Karol Bagh'],
  ['Punjabi Bagh', 'Pitampura'],
  ['Punjabi Bagh', 'Ashok Vihar'],

  // North Delhi Corridor
  ['Alipur Northern Orchard Reserve', 'Burari'],
  ['Alipur Northern Orchard Reserve', 'Rohini'],
  ['Alipur Northern Orchard Reserve', 'Shalimar Bagh'],
  ['Rohini', 'Pitampura'],
  ['Rohini', 'Shalimar Bagh'],
  ['Pitampura', 'Shalimar Bagh'],
  ['Pitampura', 'Ashok Vihar'],
  ['Pitampura', 'Karol Bagh'],
  ['Shalimar Bagh', 'Model Town'],
  ['Ashok Vihar', 'Model Town'],
  ['Model Town', 'Civil Lines'],
  ['Model Town', 'Burari'],
  ['Burari', 'Civil Lines'],
  ['Rohini', 'Civil Lines'],

  // Central Delhi Ring & Heritage Links
  ['Civil Lines', 'Chandni Chowk'],
  ['Chandni Chowk', 'Paharganj'],
  ['Chandni Chowk', 'Connaught Place'],
  ['Karol Bagh', 'Paharganj'],
  ['Karol Bagh', 'Connaught Place'],
  ['Paharganj', 'Connaught Place'],
  ['Connaught Place', 'Chanakyapuri'],
  ['Connaught Place', 'Lodhi Art District & Gardens'],
  ['Chanakyapuri', 'Green Park'],
  ['Chanakyapuri', 'Hauz Khas'],
  ['Chanakyapuri', 'Lodhi Art District & Gardens'],

  // Lodhi & Sunder Nursery Scenic Drift Links
  ['Lodhi Art District & Gardens', 'Defence Colony'],
  ['Lodhi Art District & Gardens', 'Sunder Nursery Heritage Park'],
  ['Sunder Nursery Heritage Park', 'Lajpat Nagar'],
  ['Sunder Nursery Heritage Park', 'Hauz Khas'],
  ['Sunder Nursery Heritage Park', 'Mayur Vihar'],

  // South Delhi Arterials
  ['Vasant Kunj', 'Hauz Khas'],
  ['Vasant Kunj', 'Mehrauli'],
  ['Vasant Kunj', 'Dwarka Swarna Jayanti Eco-Park'],
  ['Mehrauli', 'Saket'],
  ['Saket', 'Malviya Nagar'],
  ['Saket', 'Greater Kailash'],
  ['Malviya Nagar', 'Hauz Khas'],
  ['Malviya Nagar', 'Green Park'],
  ['Malviya Nagar', 'Greater Kailash'],
  ['Hauz Khas', 'Green Park'],
  ['Green Park', 'Defence Colony'],
  ['Defence Colony', 'Lajpat Nagar'],
  ['Greater Kailash', 'Nehru Place'],
  ['Greater Kailash', 'Lajpat Nagar'],
  ['Chittaranjan Park', 'Greater Kailash'],
  ['Chittaranjan Park', 'Nehru Place'],
  ['Chittaranjan Park', 'Okhla Bird Sanctuary & Forest Trails'],
  ['Nehru Place', 'Okhla Bird Sanctuary & Forest Trails'],
  ['Nehru Place', 'Sarita Vihar'],
  ['Lajpat Nagar', 'Nehru Place'],
  ['Lajpat Nagar', 'Okhla Bird Sanctuary & Forest Trails'],

  // South-East & Faridabad Corridors
  ['Okhla Bird Sanctuary & Forest Trails', 'Sarita Vihar'],
  ['Okhla Bird Sanctuary & Forest Trails', 'Noida Sector 18'],
  ['Okhla Bird Sanctuary & Forest Trails', 'Mayur Vihar'],
  ['Sarita Vihar', 'Old Faridabad'],
  ['Old Faridabad', 'Faridabad NIT'],

  // Trans-Yamuna & East Delhi
  ['Chandni Chowk', 'Shahdara'],
  ['Civil Lines', 'Shahdara'],
  ['Shahdara', 'Dilshad Garden'],
  ['Shahdara', 'Anand Vihar Eco-Breeze Promenade'],
  ['Shahdara', 'Laxmi Nagar'],
  ['Dilshad Garden', 'Anand Vihar Eco-Breeze Promenade'],
  ['Dilshad Garden', 'Kaushambi'],
  ['Anand Vihar Eco-Breeze Promenade', 'Preet Vihar'],
  ['Anand Vihar Eco-Breeze Promenade', 'Kaushambi'],
  ['Anand Vihar Eco-Breeze Promenade', 'Vaishali'],
  ['Kaushambi', 'Preet Vihar'],
  ['Connaught Place', 'Laxmi Nagar'],
  ['Laxmi Nagar', 'Preet Vihar'],
  ['Laxmi Nagar', 'Patparganj'],
  ['Preet Vihar', 'Patparganj'],
  ['Patparganj', 'Mayur Vihar'],
  ['Mayur Vihar', 'Noida Sector 18'],
  ['Mayur Vihar', 'Anand Vihar Eco-Breeze Promenade'],

  // Ghaziabad & Noida NCR
  ['Kaushambi', 'Vaishali'],
  ['Kaushambi', 'Indirapuram'],
  ['Vaishali', 'Indirapuram'],
  ['Indirapuram', 'Noida Sector 62'],
  ['Noida Sector 62', 'Noida Sector 18'],
  ['Noida Sector 62', 'Patparganj'],
  ['Noida Sector 18', 'Preet Vihar']
];

// Seeded Community Pockets of Joy
export const INITIAL_JOY_PINS = [
  {
    id: 'pin-1',
    title: 'Secret Jasmine & Bougainvillea Tunnel',
    category: 'Shaded Nooks',
    description: 'An arched pedestrian alley canopy covered in fragrant white jasmine and pink bougainvillea. Perfect for quiet contemplation.',
    neighborhood: 'Lodhi Art District & Gardens',
    lat: 28.5898,
    lon: 28.5898 ? 77.2291 : 77.2291,
    likes: 47,
    author: 'Aarav (Botanical Walker)',
    createdAt: '2026-10-15T14:20:00Z'
  },
  {
    id: 'pin-2',
    title: 'Acoustic Sitar Sessions under Ancient Banyan',
    category: 'Street Art & Music',
    description: 'Every evening around 5:30 PM, classical sitar and flute musicians gather on the heritage stone steps.',
    neighborhood: 'Sunder Nursery Heritage Park',
    lat: 28.5945,
    lon: 77.2440,
    likes: 83,
    author: 'Meera K.',
    createdAt: '2026-10-16T17:45:00Z'
  },
  {
    id: 'pin-3',
    title: 'Hauz Khas Medieval Reservoir Sunset Point',
    category: 'Sunset Views',
    description: 'Overlook the water reservoir as flocks of green parakeets return to the canopy during golden hour.',
    neighborhood: 'Hauz Khas',
    lat: 28.5510,
    lon: 77.2025,
    likes: 65,
    author: 'Devendra P.',
    createdAt: '2026-10-14T18:10:00Z'
  },
  {
    id: 'pin-4',
    title: 'Fountain-side Stone Bench with Bird Bath',
    category: 'Shaded Nooks',
    description: 'Carved sandstone bench shaded by a century-old jamun tree with running cool water sounds.',
    neighborhood: 'Chanakyapuri',
    lat: 28.5995,
    lon: 77.1985,
    likes: 39,
    author: 'Pooja V.',
    createdAt: '2026-10-15T09:30:00Z'
  },
  {
    id: 'pin-5',
    title: 'Old Books & Cardamom Chai Alcove',
    category: 'Indie Coffee & Chai',
    description: 'Tiny open-air courtyard selling pre-loved poetry books and clay cup cardamom chai.',
    neighborhood: 'Connaught Place',
    lat: 28.6322,
    lon: 77.2180,
    likes: 54,
    author: 'Kabir S.',
    createdAt: '2026-10-16T11:15:00Z'
  },
  {
    id: 'pin-6',
    title: 'Northern Ridge Wind Chime Grove',
    category: 'Shaded Nooks',
    description: 'Sheltered ridge path hanging handmade copper chimes that ring softly with the afternoon breeze.',
    neighborhood: 'Civil Lines',
    lat: 28.6825,
    lon: 77.2240,
    likes: 42,
    author: 'Simran R.',
    createdAt: '2026-10-13T16:00:00Z'
  }
];

/**
 * Helper to compute realistic edge well-being metrics between two nodes
 */
export function computeCorridorMetrics(sourceNode, targetNode) {
  const avgCanopy = (sourceNode.greenCanopyIndex + targetNode.greenCanopyIndex) / 2;
  const avgNoise = (sourceNode.noiseLevelDb + targetNode.noiseLevelDb) / 2;
  const combinedJoy = Math.round((sourceNode.joyMomentDensity + targetNode.joyMomentDensity) / 2);

  const pairKey = [sourceNode.name, targetNode.name].sort().join('::');

  // Commercial / elevated-metro concrete arterials with heavy motorized traffic and low pedestrian tree cover
  const CONCRETE_ARTERIALS = new Set([
    ['Rajouri Garden', 'Tilak Nagar'].sort().join('::'), // Shivaji Marg under Blue Line viaduct
    ['Moti Nagar', 'Patel Nagar'].sort().join('::'),
    ['Karol Bagh', 'Paharganj'].sort().join('::'),
    ['Paharganj', 'Connaught Place'].sort().join('::'),
    ['Chandni Chowk', 'Shahdara'].sort().join('::'),
    ['Gurgaon Cyber Green Promenade', 'Chanakyapuri'].sort().join('::'), // NH48 Highway express
    ['Pitampura', 'Karol Bagh'].sort().join('::'),                      // Rohtak Road commercial arterial
    ['Shahdara', 'Laxmi Nagar'].sort().join('::'),                      // Vikas Marg East
    ['Rohini', 'Civil Lines'].sort().join('::')                         // GT Karnal arterial
  ]);

  if (CONCRETE_ARTERIALS.has(pairKey)) {
    return {
      greenCanopyIndex: Math.min(36, Math.round(avgCanopy * 0.65)),
      noiseLevelDb: Math.max(73, Math.round(avgNoise * 1.08)),
      joyMomentDensity: Math.max(2, Math.round(combinedJoy * 0.6))
    };
  }

  // Corridor bonus/variance based on zone greenery or park haven presence
  const isHighGreenZone =
    sourceNode.zone === 'Central Delhi' ||
    sourceNode.zone === 'South Delhi' ||
    sourceNode.greenCanopyIndex >= 75 ||
    targetNode.greenCanopyIndex >= 75;

  const greenCanopyIndex = isHighGreenZone
    ? Math.min(98, Math.round((avgCanopy + 5) * 10) / 10)
    : Math.max(25, Math.round((avgCanopy - 2) * 10) / 10);

  const noiseLevelDb = isHighGreenZone
    ? Math.max(38, Math.round((avgNoise - 4) * 10) / 10)
    : Math.round(avgNoise * 10) / 10;

  const joyMomentDensity = isHighGreenZone ? Math.max(4, combinedJoy + 1) : Math.max(1, combinedJoy);

  return {
    greenCanopyIndex,
    noiseLevelDb,
    joyMomentDensity
  };
}

/**
 * Seed the Neo4j AuraDB graph with all 52 neighborhoods, wellness properties, and 176 corridors
 */
export async function seedDatabase() {
  const session = getSession();
  console.log('🌱 Seeding Neo4j database for JoyWalk: The Scenic Drift Engine...');

  try {
    // 1. Clear existing graph data
    console.log('🧹 Clearing legacy graphs & riders...');
    await session.run(`MATCH (r:Rider) DETACH DELETE r`).catch(() => {});
    await session.run(`MATCH (p:JoyPin) DETACH DELETE p`).catch(() => {});
    await session.run(`MATCH (n:Neighborhood) DETACH DELETE n`).catch(() => {});

    // 2. Insert Neighborhood nodes with realistic well-being properties
    console.log(`📍 Inserting ${NEIGHBORHOODS.length} wellness nodes...`);
    const nodeMap = new Map();

    for (const n of NEIGHBORHOODS) {
      nodeMap.set(n.name, n);

      await session.run(
        `
        CREATE (n:Neighborhood {
          name: $name,
          lat: $lat,
          lon: $lon,
          greenCanopyIndex: $greenCanopyIndex,
          noiseLevelDb: $noiseLevelDb,
          joyMomentDensity: $joyMomentDensity,
          isPromenade: $isPromenade,
          isWarehouse: $isWarehouse,
          zone: $zone,
          description: $description
        })
        RETURN n
        `,
        {
          name: n.name,
          lat: n.lat,
          lon: n.lon,
          greenCanopyIndex: n.greenCanopyIndex,
          noiseLevelDb: n.noiseLevelDb,
          joyMomentDensity: n.joyMomentDensity,
          isPromenade: Boolean(n.isPromenade),
          isWarehouse: Boolean(n.isWarehouse),
          zone: n.zone || 'Delhi NCR',
          description: n.description || ''
        }
      );
    }

    // 3. Create bidirectional CORRIDOR and ROAD edges
    console.log(`🌿 Weaving 176 pedestrian corridors with canopy and acoustic indices...`);
    let edgeCount = 0;

    for (const [sourceName, targetName] of ROAD_PAIRS) {
      const source = nodeMap.get(sourceName);
      const target = nodeMap.get(targetName);

      if (!source || !target) {
        console.warn(`Skipping missing road pair: ${sourceName} - ${targetName}`);
        continue;
      }

      const distance = haversineDistance(source.lat, source.lon, target.lat, target.lon);
      const metrics = computeCorridorMetrics(source, target);

      // Create bidirectional edges
      await session.run(
        `
        MATCH (a:Neighborhood {name: $sourceName})
        MATCH (b:Neighborhood {name: $targetName})
        MERGE (a)-[r1:CORRIDOR {
          distance: $distance,
          greenCanopyIndex: $greenCanopyIndex,
          noiseLevelDb: $noiseLevelDb,
          joyMomentDensity: $joyMomentDensity
        }]->(b)
        MERGE (b)-[r2:CORRIDOR {
          distance: $distance,
          greenCanopyIndex: $greenCanopyIndex,
          noiseLevelDb: $noiseLevelDb,
          joyMomentDensity: $joyMomentDensity
        }]->(a)
        MERGE (a)-[r3:ROAD {
          distance: $distance,
          greenCanopyIndex: $greenCanopyIndex,
          noiseLevelDb: $noiseLevelDb,
          joyMomentDensity: $joyMomentDensity
        }]->(b)
        MERGE (b)-[r4:ROAD {
          distance: $distance,
          greenCanopyIndex: $greenCanopyIndex,
          noiseLevelDb: $noiseLevelDb,
          joyMomentDensity: $joyMomentDensity
        }]->(a)
        `,
        {
          sourceName,
          targetName,
          distance,
          greenCanopyIndex: metrics.greenCanopyIndex,
          noiseLevelDb: metrics.noiseLevelDb,
          joyMomentDensity: metrics.joyMomentDensity
        }
      );
      edgeCount += 2;
    }

    // 4. Seed sample Joy Pins
    console.log(`📌 Inserting crowd-sourced Pockets of Joy...`);
    for (const pin of INITIAL_JOY_PINS) {
      await session.run(
        `
        CREATE (p:JoyPin {
          id: $id,
          title: $title,
          category: $category,
          description: $description,
          neighborhood: $neighborhood,
          lat: $lat,
          lon: $lon,
          likes: $likes,
          author: $author,
          createdAt: $createdAt
        })
        `,
        pin
      );
    }

    console.log(`✅ Seeded ${NEIGHBORHOODS.length} nodes, ${edgeCount} directional corridors, and ${INITIAL_JOY_PINS.length} initial joy pins.`);
    console.log('✨ JoyWalk database seeding complete!');
  } catch (error) {
    console.error('❌ Error during JoyWalk seeding:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Auto-run when executed directly via Node
if (process.argv[1]?.endsWith('seed-data.js')) {
  seedDatabase()
    .then(() => driver?.close())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
