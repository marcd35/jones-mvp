// npm run balance: plays the T-15b balance scenarios (#45) and writes
// docs/research/balance-report.md.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { defaultPack } from '@/data';
import { loadPack } from '@/data/loader';
import {
  DEV_SEEDS,
  EVALUATION_SEEDS,
  RUN_SETS,
  runSet,
} from '@/lib/balance/harness';
import { buildReport, evaluateCriteria, summarize } from '@/lib/balance/report';

const OUT = resolve('docs/research/balance-report.md');

const pretty = async (text: string, filepath: string) =>
  format(text, { ...(await resolveConfig(filepath)), filepath });

async function main() {
  const pack = loadPack(defaultPack);
  const play = (seeds: number[]) =>
    RUN_SETS.map(({ policy, profile }) => runSet(pack, seeds, policy, profile));

  const dev = play(DEV_SEEDS);
  const evaluation = play(EVALUATION_SEEDS);
  const rerun = play(EVALUATION_SEEDS);
  const reproduced = JSON.stringify(rerun) === JSON.stringify(evaluation);

  const report = buildReport({ pack, evaluation, dev, reproduced });
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, await pretty(report, OUT));
  const criteria = evaluateCriteria(evaluation, reproduced);

  for (const s of evaluation.map(summarize)) {
    console.log(
      `${s.policy}/${s.profile}: won ${s.won}, lost ${s.lost}, timeout ${s.timeout}, in window ${s.winInWindow}`,
    );
  }
  for (const c of criteria) {
    console.log(`${c.id} ${c.pass ? 'PASS' : 'FAIL'}: ${c.evidence}`);
  }
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
