import { computeComparisonRoutes, getAllNeighborhoods, getAllRoads } from '../lib/graph-queries.js';

async function diagnose() {
  const nodes = await getAllNeighborhoods();
  const nodeNames = nodes.map(n => n.name);

  let totalPairs = 0;
  let sameAllThree = 0;
  let differentRoutes = 0;
  const sameExamples = [];
  const differentExamples = [];

  // Sample pairs across different zones (North, South, East, West, Central, NCR)
  for (let i = 0; i < nodeNames.length; i += 2) {
    for (let j = i + 1; j < nodeNames.length; j += 3) {
      const src = nodeNames[i];
      const tgt = nodeNames[j];
      totalPairs++;

      try {
        const res = await computeComparisonRoutes({ source: src, target: tgt, mood: 'Reflective', serenityWeight: 1.0 });
        const fPath = res.fastest.path?.join('->');
        const sPath = res.shadeSeeker.path?.join('->');
        const mPath = res.moodCalibrated.path?.join('->');

        const isSame = (fPath === sPath && sPath === mPath);
        if (isSame) {
          sameAllThree++;
          if (sameExamples.length < 15) {
            sameExamples.push({
              source: src,
              target: tgt,
              path: res.fastest.path,
              hops: res.fastest.path.length,
              distance: res.fastest.totalDistance,
              canopy: res.fastest.avgCanopyIndex,
              noise: res.fastest.avgNoiseDb
            });
          }
        } else {
          differentRoutes++;
          if (differentExamples.length < 15) {
            differentExamples.push({
              source: src,
              target: tgt,
              fastest: { path: res.fastest.path, dist: res.fastest.totalDistance, canopy: res.fastest.avgCanopyIndex },
              shade: { path: res.shadeSeeker.path, dist: res.shadeSeeker.totalDistance, canopy: res.shadeSeeker.avgCanopyIndex },
              mood: { path: res.moodCalibrated.path, dist: res.moodCalibrated.totalDistance, canopy: res.moodCalibrated.avgCanopyIndex }
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  console.log(`\n================ PAIR DIAGNOSIS SUMMARY ================`);
  console.log(`Total pairs tested: ${totalPairs}`);
  console.log(`Pairs with identical routes across all 3 modes: ${sameAllThree} (${Math.round((sameAllThree / totalPairs) * 100)}%)`);
  console.log(`Pairs with DIFFERENT routes: ${differentRoutes} (${Math.round((differentRoutes / totalPairs) * 100)}%)`);

  console.log(`\n--- EXAMPLES WHERE ALL 3 ROUTES ARE IDENTICAL (BORING / NO CHOICE) ---`);
  sameExamples.slice(0, 10).forEach(ex => {
    console.log(`- ${ex.source} -> ${ex.target} (${ex.distance} km, ${ex.hops} hops, canopy: ${ex.canopy}%, noise: ${ex.noise}dB)`);
    console.log(`  Path: ${ex.path.join(' -> ')}`);
  });

  console.log(`\n--- EXAMPLES WHERE ROUTES ARE DIFFERENT (WORKING AS INTENDED) ---`);
  differentExamples.slice(0, 10).forEach(ex => {
    console.log(`- ${ex.source} -> ${ex.target}`);
    console.log(`  ⚡ Fastest: ${ex.fastest.dist}km (${ex.fastest.canopy}% canopy): ${ex.fastest.path.join(' -> ')}`);
    console.log(`  🌳 Shade:   ${ex.shade.dist}km (${ex.shade.canopy}% canopy): ${ex.shade.path.join(' -> ')}`);
    console.log(`  🧘 Mood:    ${ex.mood.dist}km (${ex.mood.canopy}% canopy): ${ex.mood.path.join(' -> ')}`);
  });
}

diagnose().catch(console.error);
