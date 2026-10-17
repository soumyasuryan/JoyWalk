import { computeShortestPath, computeComparisonRoutes, getAllRoads, getAllNeighborhoods } from '../lib/graph-queries.js';
import { NEIGHBORHOODS, ROAD_PAIRS, haversineDistance } from '../lib/seed-data.js';

// Independent brute-force JS Dijkstra implementation to cross-verify
function independentDijkstra(source, target, edges) {
  const adj = new Map();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source).push({ target: edge.target, distance: edge.distance });
  }

  const dist = {};
  const prev = {};
  const visited = new Set();
  const allNodes = new Set();
  for (const edge of edges) {
    allNodes.add(edge.source);
    allNodes.add(edge.target);
  }
  for (const n of allNodes) dist[n] = Infinity;
  dist[source] = 0;

  const pq = [{ node: source, dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: u, dist: d } = pq.shift();

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === target) break;

    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;
      const alt = d + edge.distance;
      if (alt < dist[edge.target]) {
        dist[edge.target] = alt;
        prev[edge.target] = u;
        pq.push({ node: edge.target, dist: alt });
      }
    }
  }

  if (dist[target] === Infinity) return { path: null, totalDistance: null };

  const path = [];
  let curr = target;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }

  return {
    path,
    totalDistance: Math.round(dist[target] * 10) / 10
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STEP 3: VERIFICATION TESTS FOR FASTEST MODE');
  console.log('====================================================\n');

  // 1. Check Moti Nagar -> Tilak Nagar
  console.log('--- 1. SPECIFIC BUG TEST: Moti Nagar -> Tilak Nagar ---');
  const motiToTilak = await computeShortestPath({
    source: 'Moti Nagar',
    target: 'Tilak Nagar',
    mode: 'fastest'
  });

  console.log('Path returned:', motiToTilak.path.join(' -> '));
  console.log(`Total Distance: ${motiToTilak.totalDistance} km`);

  const containsJanakpuri = motiToTilak.path.includes('Janakpuri');
  if (containsJanakpuri) {
    console.error('❌ FAIL: Path still contains Janakpuri!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Path no longer backtracks through Janakpuri.');
  }

  // 2. Cross-verify 10 random source-target pairs against independent Dijkstra
  console.log('\n--- 2. CROSS-VERIFYING 10 PAIRS AGAINST INDEPENDENT DIJKSTRA ---');
  const allRoads = await getAllRoads();
  const nodes = NEIGHBORHOODS.map(n => n.name);

  // Pick 10 deterministic varied pairs
  const testPairs = [
    ['Moti Nagar', 'Tilak Nagar'],
    ['Connaught Place', 'Dwarka'],
    ['Rohini', 'Hauz Khas'],
    ['Civil Lines', 'Saket'],
    ['Pitampura', 'Lajpat Nagar'],
    ['Karol Bagh', 'Noida Sector 18'],
    ['Punjabi Bagh', 'Mayur Vihar'],
    ['Chanakyapuri', 'Preet Vihar'],
    ['Alipur Northern Orchard Reserve', 'Connaught Place'],
    ['Vasant Kunj', 'Dilshad Garden']
  ];

  let allMatched = true;
  let allDistancesOptimal = true;

  for (let i = 0; i < testPairs.length; i++) {
    const [src, tgt] = testPairs[i];
    
    // Query JoyWalk fastest
    const fastestResult = await computeShortestPath({ source: src, target: tgt, mode: 'fastest' });
    
    // Independent Dijkstra
    const independentResult = independentDijkstra(src, tgt, allRoads);

    const match = Math.abs(fastestResult.totalDistance - independentResult.totalDistance) < 0.05;
    if (!match) {
      allMatched = false;
      console.error(`❌ Mismatch for ${src} -> ${tgt}: JoyWalk=${fastestResult.totalDistance}km, Independent=${independentResult.totalDistance}km`);
    } else {
      console.log(`[Pair ${i+1}] ${src} -> ${tgt}: ${fastestResult.totalDistance} km | Matched independent Dijkstra ✅`);
    }

    // Comparison routes test: fastest distance <= shadeSeeker & moodCalibrated
    const comparison = await computeComparisonRoutes({ source: src, target: tgt, mood: 'Reflective', serenityWeight: 1.0 });
    
    const isOptimalVsShade = fastestResult.totalDistance <= comparison.shadeSeeker.totalDistance + 0.05;
    const isOptimalVsMood = fastestResult.totalDistance <= comparison.moodCalibrated.totalDistance + 0.05;

    if (!isOptimalVsShade || !isOptimalVsMood) {
      allDistancesOptimal = false;
      console.error(`❌ Distance not minimal for ${src} -> ${tgt}: Fastest=${fastestResult.totalDistance}, Shade=${comparison.shadeSeeker.totalDistance}, Mood=${comparison.moodCalibrated.totalDistance}`);
    }
  }

  console.log('\n--- 3. COMPARISON CONSTRAINTS VERIFICATION ---');
  if (allMatched) {
    console.log('✅ PASS: All 10 pairs exactly matched independent Dijkstra distance.');
  }
  if (allDistancesOptimal) {
    console.log('✅ PASS: For all 10 pairs, Fastest distance <= Shade Seeker and Mood-Calibrated distance.');
  }

  console.log('\n====================================================');
  console.log('SUMMARY OF BEFORE VS AFTER FOR MOTI NAGAR -> TILAK NAGAR:');
  console.log('BEFORE: Moti Nagar -> Rajouri Garden -> Janakpuri -> Tilak Nagar (8.4 km)');
  console.log(`AFTER:  ${motiToTilak.path.join(' -> ')} (${motiToTilak.totalDistance} km)`);
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
