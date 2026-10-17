import { getAllNeighborhoods, getAllRoads } from '../lib/graph-queries.js';

function computeTestPath(roads, neighborhoods, source, target, mode, mood = 'Reflective', effectiveWeight = 1.0) {
  const adj = new Map();
  neighborhoods.forEach((n) => adj.set(n.name, []));

  for (const road of roads) {
    const { source: u, target: v, distance, greenCanopyIndex = 65, noiseLevelDb = 55, joyMomentDensity = 4 } = road;

    let edgeWeight = distance;

    if (mode === 'fastest') {
      edgeWeight = distance;
    } else if (mode === 'shade-seeker') {
      if (greenCanopyIndex >= 70) {
        // Generous canopy reward down to 0.40 for 95%+ canopy
        const canopyReward = Math.max(0.40, 1 - Math.pow((greenCanopyIndex - 65) / 50, 1.3));
        edgeWeight = distance * canopyReward;
      } else {
        // Progressive shade deficit penalty
        const deficit = (70 - greenCanopyIndex) / 12;
        const penaltyMultiplier = 1 + Math.pow(deficit, 2.2);
        edgeWeight = distance * penaltyMultiplier;
      }
    } else if (mode === 'mood-calibrated') {
      const normalizedMood = (mood || 'Reflective').toLowerCase();
      let moodMultiplier = 1.0;

      if (normalizedMood === 'stressed') {
        const noiseFactor = noiseLevelDb <= 48 ? 0.5 : Math.pow(noiseLevelDb / 48, 2.6);
        const canopyRelief = Math.max(0.45, Math.pow((120 - greenCanopyIndex) / 100, 1.8));
        moodMultiplier = noiseFactor * canopyRelief;
      } else if (normalizedMood === 'curious') {
        const joyDiscount = 1 / (1 + joyMomentDensity * 0.45);
        const shadeFactor = Math.max(0.5, (110 - greenCanopyIndex * 0.6) / 100);
        moodMultiplier = joyDiscount * shadeFactor;
      } else if (normalizedMood === 'energetic') {
        const noiseCheck = noiseLevelDb > 70 ? 1.4 : 0.85;
        const speedBonus = 1 - (greenCanopyIndex / 350);
        moodMultiplier = noiseCheck * speedBonus;
      } else {
        // Reflective
        const acousticComfort = noiseLevelDb <= 48 ? 0.45 : noiseLevelDb <= 58 ? 0.8 : 1 + Math.pow((noiseLevelDb - 55) / 10, 2.2);
        const contemplationCanopy = greenCanopyIndex >= 75 ? Math.max(0.40, (110 - greenCanopyIndex) / 100) : 1 + Math.pow((75 - greenCanopyIndex) / 15, 2.0);
        const serenityJoy = Math.max(0.65, 1 - (joyMomentDensity * 0.05));
        moodMultiplier = acousticComfort * contemplationCanopy * serenityJoy;
      }

      const blendedMultiplier = 1 + effectiveWeight * (moodMultiplier - 1);
      edgeWeight = distance * Math.max(0.25, blendedMultiplier);
    }

    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push({ target: v, distance, weight: edgeWeight, canopy: greenCanopyIndex, noise: noiseLevelDb });
  }

  const dist = {};
  const prev = {};
  const visited = new Set();
  neighborhoods.forEach(n => dist[n.name] = Infinity);
  dist[source] = 0;

  const pq = [{ node: source, dist: 0 }];
  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: curr, dist: cd } = pq.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    if (curr === target) break;

    const neighbors = adj.get(curr) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;
      const alt = cd + edge.weight;
      if (alt < dist[edge.target]) {
        dist[edge.target] = alt;
        prev[edge.target] = curr;
        pq.push({ node: edge.target, dist: alt });
      }
    }
  }

  if (dist[target] === Infinity) return null;
  const path = [];
  let c = target;
  while (c) {
    path.unshift(c);
    c = prev[c];
  }
  let totalKm = 0;
  let canopySum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = adj.get(path[i]).find(e => e.target === path[i+1]);
    totalKm += edge.distance;
    canopySum += edge.distance * edge.canopy;
  }
  return {
    path,
    totalDistance: Math.round(totalKm * 10) / 10,
    avgCanopy: Math.round((canopySum / totalKm) * 10) / 10
  };
}

async function run() {
  const [nodes, roads] = await Promise.all([getAllNeighborhoods(), getAllRoads()]);
  const nodeNames = nodes.map(n => n.name);

  let total = 0;
  let same = 0;
  let diff = 0;
  const interesting = [];

  for (let i = 0; i < nodeNames.length; i += 2) {
    for (let j = i + 1; j < nodeNames.length; j += 3) {
      const src = nodeNames[i];
      const tgt = nodeNames[j];
      total++;

      const f = computeTestPath(roads, nodes, src, tgt, 'fastest');
      const s = computeTestPath(roads, nodes, src, tgt, 'shade-seeker');
      const m = computeTestPath(roads, nodes, src, tgt, 'mood-calibrated', 'Reflective', 1.0);

      if (!f || !s || !m) continue;
      const fKey = f.path.join('->');
      const sKey = s.path.join('->');
      const mKey = m.path.join('->');

      if (fKey === sKey && sKey === mKey) {
        same++;
      } else {
        diff++;
        if (interesting.length < 15 && f.path.length >= 3) {
          interesting.push({ src, tgt, f, s, m });
        }
      }
    }
  }

  console.log(`With improved dynamic weighting:`);
  console.log(`Total pairs: ${total}`);
  console.log(`Different routes: ${diff} (${Math.round((diff / total) * 100)}%)`);
  console.log(`Identical routes: ${same} (${Math.round((same / total) * 100)}%)\n`);

  console.log(`Top 10 differentiated routes:`);
  interesting.slice(0, 10).forEach(({ src, tgt, f, s, m }) => {
    console.log(`\n📍 ${src} -> ${tgt}:`);
    console.log(`   ⚡ Fastest: ${f.totalDistance} km (${f.avgCanopy}% canopy): ${f.path.join(' -> ')}`);
    console.log(`   🌳 Shade:   ${s.totalDistance} km (${s.avgCanopy}% canopy): ${s.path.join(' -> ')}`);
    console.log(`   🧘 Mood:    ${m.totalDistance} km (${m.avgCanopy}% canopy): ${m.path.join(' -> ')}`);
  });
}

run().catch(console.error);
