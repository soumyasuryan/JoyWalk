import { computeComparisonRoutes } from '../lib/graph-queries.js';

async function test() {
  const pairs = [
    ['Moti Nagar', 'Tilak Nagar'],
    ['Connaught Place', 'Dwarka'],
    ['Rohini', 'Hauz Khas'],
    ['Lodhi Art District & Gardens', 'Sunder Nursery Heritage Park'],
    ['Civil Lines', 'Saket'],
    ['Alipur Northern Orchard Reserve', 'Connaught Place'],
    ['Vasant Kunj', 'Dilshad Garden'],
    ['Chandni Chowk', 'Greater Kailash'],
    ['Pitampura', 'Lajpat Nagar'],
    ['Karol Bagh', 'Noida Sector 18']
  ];
  for (const [src, tgt] of pairs) {
    const res = await computeComparisonRoutes({ source: src, target: tgt, mood: 'Reflective', serenityWeight: 1.0 });
    const fPath = res.fastest.path?.join(' -> ');
    const sPath = res.shadeSeeker.path?.join(' -> ');
    const mPath = res.moodCalibrated.path?.join(' -> ');
    const same = (fPath === sPath && sPath === mPath);
    console.log(`\n=== ${src} -> ${tgt} ===`);
    console.log('Same across all 3?', same);
    console.log('  Fastest:       ', fPath, `(${res.fastest.totalDistance} km, canopy: ${res.fastest.avgCanopyIndex}%)`);
    console.log('  Shade Seeker:  ', sPath, `(${res.shadeSeeker.totalDistance} km, canopy: ${res.shadeSeeker.avgCanopyIndex}%)`);
    console.log('  Mood-Calibrated:', mPath, `(${res.moodCalibrated.totalDistance} km, canopy: ${res.moodCalibrated.avgCanopyIndex}%)`);
  }
}
test().catch(console.error);
