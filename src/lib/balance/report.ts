import type { DataPack } from '@/types';
import { goalTargetText } from '@/lib/goals';
import {
  DEV_SEEDS,
  EVALUATION_SEEDS,
  PROFILES,
  WEEK_CAP,
  type ProfileId,
  type RunResult,
  type RunSet,
} from './harness';
import { POLICY_RULES, type PolicyId } from './policies';

// The approved win window and share for the sensible policy (#45).
export const WIN_WEEKS = { from: 8, to: 16 };
export const MIN_WIN_SHARE = 0.8;
// A stress win share at or below this is flagged as a finding.
const NEAR_ZERO_SHARE = 0.05;

export interface SetSummary {
  policy: PolicyId;
  profile: ProfileId;
  runs: number;
  won: number;
  lost: number;
  timeout: number;
  winShare: number;
  winInWindow: number;
  winInWindowShare: number;
  weeks: Record<number, Partial<Record<RunResult['outcome'], number>>>;
  lossReasons: Record<string, number>;
  finalJobs: Record<string, number>;
}

export const summarize = (set: RunSet): SetSummary => {
  const count = (outcome: RunResult['outcome']) =>
    set.runs.filter((r) => r.outcome === outcome).length;
  const weeks: SetSummary['weeks'] = {};
  const lossReasons: Record<string, number> = {};
  const finalJobs: Record<string, number> = {};
  for (const run of set.runs) {
    const row = (weeks[run.endingWeek] ??= {});
    row[run.outcome] = (row[run.outcome] ?? 0) + 1;
    if (run.lossReason) {
      lossReasons[run.lossReason] = (lossReasons[run.lossReason] ?? 0) + 1;
    }
    const job = run.final.jobId ?? 'none';
    finalJobs[job] = (finalJobs[job] ?? 0) + 1;
  }
  const won = count('won');
  const winInWindow = set.runs.filter(
    (r) =>
      r.outcome === 'won' &&
      r.endingWeek >= WIN_WEEKS.from &&
      r.endingWeek <= WIN_WEEKS.to,
  ).length;
  return {
    policy: set.policy,
    profile: set.profile,
    runs: set.runs.length,
    won,
    lost: count('lost'),
    timeout: count('timeout'),
    winShare: won / set.runs.length,
    winInWindow,
    winInWindowShare: winInWindow / set.runs.length,
    weeks,
    lossReasons,
    finalJobs,
  };
};

export interface Criterion {
  id: string;
  text: string;
  pass: boolean;
  evidence: string;
}

const pct = (share: number) => `${(share * 100).toFixed(0)}%`;

const find = (sets: RunSet[], policy: PolicyId, profile: ProfileId) =>
  sets.find((s) => s.policy === policy && s.profile === profile)!;

const sameGoals = (set: RunSet) =>
  set.runs.every((r) =>
    (Object.keys(PROFILES[set.profile]) as (keyof typeof r.goals)[]).every(
      (id) => r.goals[id] === PROFILES[set.profile][id],
    ),
  );

export function evaluateCriteria(
  sets: RunSet[],
  reproduced: boolean,
): Criterion[] {
  const seedLists = sets.map((s) => s.runs.map((r) => r.seed).join(','));
  const sameSeeds =
    seedLists.every((list) => list === seedLists[0]) &&
    sets.every((s) => s.runs.length === 100);
  const primary = summarize(find(sets, 'sensible', 'primary'));
  const careless = sets.filter((s) => s.policy === 'careless');
  const carelessRentLosses = careless.map(
    (s) =>
      s.runs.filter(
        (r) => r.outcome === 'lost' && r.lossReason === 'rent owed limit',
      ).length,
  );
  return [
    {
      id: 'AC1',
      text: '100 fixed seeds per policy per profile, the same seed set everywhere',
      pass: sameSeeds,
      evidence: `${sets.length} run sets, each over seeds ${EVALUATION_SEEDS[0]}–${EVALUATION_SEEDS[EVALUATION_SEEDS.length - 1]}.`,
    },
    {
      id: 'AC2',
      text: 'Primary profile allocates 50 points to each Goal',
      pass: sets.filter((s) => s.profile === 'primary').every(sameGoals),
      evidence:
        'Every primary run started with Wealth 50, Happiness 50, Education 50, Career 50 (read back from the store).',
    },
    {
      id: 'AC3',
      text: 'Stress profile allocates Career 150, Wealth 50, Education 0, Happiness 0',
      pass: sets.filter((s) => s.profile === 'stress').every(sameGoals),
      evidence:
        'Every stress run started with Wealth 50, Happiness 0, Education 0, Career 150 (read back from the store).',
    },
    {
      id: 'AC4',
      text: `Sensible policy wins in Weeks ${WIN_WEEKS.from}–${WIN_WEEKS.to} in at least ${pct(MIN_WIN_SHARE)} of primary runs`,
      pass: primary.winInWindowShare >= MIN_WIN_SHARE,
      evidence: `${primary.winInWindow} of ${primary.runs} primary runs (${pct(primary.winInWindowShare)}) won in Weeks ${WIN_WEEKS.from}–${WIN_WEEKS.to}; ${primary.won} won in all (${pct(primary.winShare)}).`,
    },
    {
      id: 'AC5',
      text: 'Careless policy loses through the rent limit in every run of both profiles',
      pass: careless.every((s, i) => carelessRentLosses[i] === s.runs.length),
      evidence: careless
        .map(
          (s, i) =>
            `${s.profile}: ${carelessRentLosses[i]} of ${s.runs.length} lost through the rent owed limit`,
        )
        .join('; '),
    },
    {
      id: 'AC6',
      text: 'Rerunning a seed reproduces the same outcome',
      pass: reproduced,
      evidence: reproduced
        ? 'Every run was played a second time from its seed and gave an identical result.'
        : 'At least one rerun differed from its first run.',
    },
  ];
}

const table = (header: string[], rows: (string | number)[][]) =>
  [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');

const weekTable = (summary: SetSummary) =>
  table(
    ['Ending Week', 'Won', 'Lost', 'Timeout'],
    Object.keys(summary.weeks)
      .map(Number)
      .sort((a, b) => a - b)
      .map((week) => [
        week,
        summary.weeks[week].won ?? 0,
        summary.weeks[week].lost ?? 0,
        summary.weeks[week].timeout ?? 0,
      ]),
  );

const counts = (record: Record<string, number>) =>
  Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => `${key} (${n})`)
    .join(', ') || 'none';

const profileText = (pack: DataPack, profile: ProfileId) =>
  pack.goals
    .map((def) => {
      const points = PROFILES[profile][def.id];
      return `${def.label} ${points} (${points === 0 ? 'already met' : goalTargetText(def, points)})`;
    })
    .join(', ');

export interface ReportInput {
  pack: DataPack;
  evaluation: RunSet[];
  dev: RunSet[];
  reproduced: boolean;
}

export function buildReport({
  pack,
  evaluation,
  dev,
  reproduced,
}: ReportInput): string {
  const criteria = evaluateCriteria(evaluation, reproduced);
  const summaries = evaluation.map(summarize);
  const stress = summarize(find(evaluation, 'sensible', 'stress'));
  const primary = summarize(find(evaluation, 'sensible', 'primary'));
  const earlyWins = find(evaluation, 'sensible', 'primary').runs.filter(
    (r) => r.outcome === 'won' && r.endingWeek < WIN_WEEKS.from,
  ).length;
  const lateWins = primary.won - primary.winInWindow - earlyWins;

  const findings: string[] = [];
  if (earlyWins > 0) {
    findings.push(
      `${earlyWins} of ${primary.runs} sensible primary runs won before Week ${WIN_WEEKS.from}, so they fall outside the approved window.`,
    );
  }
  if (lateWins > 0) {
    findings.push(
      `${lateWins} of ${primary.runs} sensible primary runs won after Week ${WIN_WEEKS.to}.`,
    );
  }
  if (primary.timeout > 0) {
    findings.push(
      `${primary.timeout} sensible primary runs reached the Week ${WEEK_CAP} cap without a result.`,
    );
  }
  if (stress.winShare <= NEAR_ZERO_SHARE) {
    findings.push(
      `Near-zero stress win share: the sensible policy won ${pct(stress.winShare)} of stress runs.`,
    );
  } else {
    findings.push(
      `Stress profile (report only): the sensible policy won ${pct(stress.winShare)} of runs; jobs held at the end: ${counts(stress.finalJobs)}.`,
    );
  }

  const runRows = evaluation.flatMap((set) =>
    set.runs.map((r) => [
      r.seed,
      r.policy,
      r.profile,
      r.outcome,
      r.endingWeek,
      r.lossReason ?? '—',
      `$${r.final.netWorth}`,
      r.final.measures.happiness,
      r.final.measures.education,
      r.final.measures.career,
    ]),
  );

  return [
    '# Balance report (T-15b)',
    '',
    'Generated by `npm run balance` (issue #45). Do not edit by hand; rerun the script.',
    '',
    '## Method',
    '',
    `- Each run plays a fresh headless game through the store’s public actions (\`createGameStore\` with \`createRandom(seed)\`), so the seed fixes the game’s price levels and stock.`,
    `- Evaluation seeds: ${EVALUATION_SEEDS[0]}–${EVALUATION_SEEDS[EVALUATION_SEEDS.length - 1]}, the same set for every policy and profile.`,
    `- A run that reaches the end of Week ${WEEK_CAP} without winning or losing ends as \`timeout\`, which counts as not a win.`,
    `- Primary profile: ${profileText(pack, 'primary')}.`,
    `- Stress profile: ${profileText(pack, 'stress')}.`,
    '- No Goal target, economy value or data was changed for this pass.',
    '',
    '## Policies',
    '',
    `The sensible policy was developed and tuned only on dev seeds ${DEV_SEEDS[0]}–${DEV_SEEDS[DEV_SEEDS.length - 1]}, then frozen before the evaluation seeds were run. It was not changed after the evaluation results were seen.`,
    '',
    '### Sensible',
    '',
    ...POLICY_RULES.sensible.map((rule) => `- ${rule}`),
    '',
    '### Careless',
    '',
    ...POLICY_RULES.careless.map((rule) => `- ${rule}`),
    '',
    '## Acceptance criteria',
    '',
    table(
      ['Criterion', 'Result', 'Evidence'],
      criteria.map((c) => [
        `${c.id}: ${c.text}`,
        c.pass ? 'PASS' : '**FAIL**',
        c.evidence,
      ]),
    ),
    '',
    'The stress-profile sensible results are reported only, with no pass/fail.',
    '',
    '## Findings',
    '',
    ...findings.map((f) => `- ${f}`),
    '',
    '## Run sets',
    '',
    table(
      [
        'Policy',
        'Profile',
        'Runs',
        'Won',
        'Lost',
        'Timeout',
        'Win share',
        `Won in Weeks ${WIN_WEEKS.from}–${WIN_WEEKS.to}`,
        'Loss reasons',
      ],
      summaries.map((s) => [
        s.policy,
        s.profile,
        s.runs,
        s.won,
        s.lost,
        s.timeout,
        pct(s.winShare),
        `${s.winInWindow} (${pct(s.winInWindowShare)})`,
        counts(s.lossReasons),
      ]),
    ),
    '',
    ...summaries.flatMap((s) => [
      `### ${s.policy} / ${s.profile}: Week distribution`,
      '',
      weekTable(s),
      '',
      `Jobs held at the end: ${counts(s.finalJobs)}.`,
      '',
    ]),
    '## Dev seeds (tuning only)',
    '',
    table(
      ['Policy', 'Profile', 'Runs', 'Won', 'Lost', 'Timeout', 'Ending Weeks'],
      dev
        .map(summarize)
        .map((s) => [
          s.policy,
          s.profile,
          s.runs,
          s.won,
          s.lost,
          s.timeout,
          Object.keys(s.weeks).join(', '),
        ]),
    ),
    '',
    '## Every evaluation run',
    '',
    'Final measures are at the end of the run: net worth, happiness points, education level and highest career rung.',
    '',
    table(
      [
        'Seed',
        'Policy',
        'Profile',
        'Outcome',
        'Ending Week',
        'Loss reason',
        'Net worth',
        'Happiness',
        'Education',
        'Career rung',
      ],
      runRows,
    ),
    '',
  ].join('\n');
}
