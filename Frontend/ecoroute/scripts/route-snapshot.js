import { computeShortestPath } from '../lib/graph-queries.js';
import fs from 'fs';
import path from 'path';

const pairs = [
  { label: 'Lodhi -> Sunder Nursery', from: 'Lodhi Art District & Gardens', to: 'Sunder Nursery Heritage Park' },
  {
    label: "Civil Lines -> Model Town (stand-in for the 'Northern Ridge' preset)",
    from: 'Civil Lines',
    to: 'Model Town'
  },
  { label: 'Chanakyapuri -> Hauz Khas', from: 'Chanakyapuri', to: 'Hauz Khas' },
  { label: 'Gurgaon Cyber Green Promenade -> Connaught Place', from: 'Gurgaon Cyber Green Promenade', to: 'Connaught Place' }
];

const modes = ['mood-calibrated', 'shade-seeker', 'fastest'];

async function runSnapshot() {
  const targetName = process.argv[2] || 'before';
  const outDir = path.resolve(process.cwd(), 'snapshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results = {};

  for (const pair of pairs) {
    results[pair.label] = {};
    for (const mode of modes) {
      const res = await computeShortestPath({
        source: pair.from,
        target: pair.to,
        mode,
        mood: 'Reflective',
        serenityWeight: 1.0
      });

      results[pair.label][mode] = {
        path: res.path,
        totalDistance: res.totalDistance
      };
    }
  }

  const outFile = path.join(outDir, `${targetName}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved snapshot to ${outFile}`);
}

runSnapshot().catch((err) => {
  console.error('Snapshot failed:', err);
  process.exit(1);
});
