import { describe, expect, it } from 'vitest';
import {
  accuse,
  availableClues,
  cases,
  dailyCase,
  discoverClue,
  emptyProgress,
  hint,
  loadProgress,
  localDateKey,
  saveProgress,
  type Case,
  type CaseProgress,
} from './game';

function explore(c: Case): CaseProgress {
  let progress = emptyProgress();
  for (let step = 0; step < c.clues.length; step += 1) {
    const next = availableClues(c, progress).find((clue) => !progress.discovered.includes(clue.id));
    if (!next) break;
    progress = discoverClue(c, progress, next.id);
  }
  return progress;
}

describe.each(cases)('$title', (c) => {
  it('has reachable stages, extra testimony, and exactly two gated solution clues', () => {
    const ids = c.clues.map((clue) => clue.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(c.suspects.length).toBeGreaterThanOrEqual(3);
    expect(c.clues.length).toBeGreaterThanOrEqual(6);
    expect(c.clues.length).toBeLessThanOrEqual(8);
    expect(c.clues.some((clue) => clue.kind === 'interview' && clue.requires.length > 0)).toBe(true);
    expect(new Set(c.solution.evidenceIds).size).toBe(2);
    expect(c.suspects.some((suspect) => suspect.id === c.solution.suspectId)).toBe(true);
    expect(c.motives.some((motive) => motive.id === c.solution.motiveId)).toBe(true);
    for (const clue of c.clues) {
      for (const prerequisite of clue.requires) {
        expect(ids.indexOf(prerequisite)).toBeGreaterThanOrEqual(0);
        expect(ids.indexOf(prerequisite)).toBeLessThan(ids.indexOf(clue.id));
      }
    }
    const opening = availableClues(c, emptyProgress());
    expect(opening.length).toBeGreaterThan(0);
    for (const id of c.solution.evidenceIds) {
      expect(opening.some((clue) => clue.id === id)).toBe(false);
    }
    const progress = explore(c);
    expect(new Set(progress.discovered)).toEqual(new Set(ids));
    const result = accuse(c, progress, c.solution.suspectId, c.solution.motiveId, [...c.solution.evidenceIds].reverse());
    expect(result.correct).toBe(true);
    expect(result.progress.solved).toBe(true);
    expect(result.feedback).toBe(c.solution.explanation);
    expect(result.progress.attempts).toBe(0);
  });

  it('cannot discover locked or unknown clues, and keeps discovered clues accessible', () => {
    const initial = emptyProgress();
    expect(discoverClue(c, initial, c.solution.evidenceIds[0])).toEqual(initial);
    expect(discoverClue(c, initial, 'not-a-clue')).toEqual(initial);
    const first = availableClues(c, initial)[0];
    const next = discoverClue(c, initial, first.id);
    expect(initial.discovered).toEqual([]);
    expect(next.discovered).toEqual([first.id]);
    expect(availableClues(c, next)).toContain(first);
    expect(discoverClue(c, next, first.id)).toEqual(next);
  });

  it('rejects premature victory even if the answer is known', () => {
    let progress = emptyProgress();
    while (true) {
      if (!c.solution.evidenceIds.every((id) => progress.discovered.includes(id))) {
        const result = accuse(c, progress, c.solution.suspectId, c.solution.motiveId, c.solution.evidenceIds);
        expect(result.correct).toBe(false);
        expect(result.progress.solved).toBe(false);
        expect(result.progress.attempts).toBe(progress.attempts + 1);
        expect(result.feedback).not.toContain(c.solution.explanation);
      }
      const next = availableClues(c, progress).find((clue) => !progress.discovered.includes(clue.id));
      if (!next) break;
      progress = discoverClue(c, progress, next.id);
    }
  });

  it('rejects wrong people, motives, missing, duplicate, extra, and unrelated evidence', () => {
    const progress = { ...explore(c), notes: 'My working theory', pinned: [c.solution.evidenceIds[0]] };
    const otherSuspect = c.suspects.find((suspect) => suspect.id !== c.solution.suspectId)!.id;
    const otherMotive = c.motives.find((motive) => motive.id !== c.solution.motiveId)!.id;
    const unrelated = c.clues.find((clue) => !c.solution.evidenceIds.includes(clue.id))!.id;
    const theories: [string, string, string[]][] = [
      [otherSuspect, c.solution.motiveId, c.solution.evidenceIds],
      [c.solution.suspectId, otherMotive, c.solution.evidenceIds],
      [c.solution.suspectId, c.solution.motiveId, []],
      [c.solution.suspectId, c.solution.motiveId, [c.solution.evidenceIds[0]]],
      [c.solution.suspectId, c.solution.motiveId, [c.solution.evidenceIds[0], c.solution.evidenceIds[0]]],
      [c.solution.suspectId, c.solution.motiveId, [...c.solution.evidenceIds, unrelated]],
      [c.solution.suspectId, c.solution.motiveId, [c.solution.evidenceIds[0], unrelated]],
      ['unknown', 'unknown', ['unknown', 'unknown']],
    ];
    for (const [person, motive, evidence] of theories) {
      const result = accuse(c, progress, person, motive, evidence);
      expect(result.correct).toBe(false);
      expect(result.progress.solved).toBe(false);
      expect(result.progress.attempts).toBe(1);
      expect(result.progress.notes).toBe(progress.notes);
      expect(result.progress.pinned).toEqual(progress.pinned);
    }
    expect(progress.attempts).toBe(0);
    expect(progress.solved).toBe(false);
  });

  it('does not trust forged discoveries and provides progressive read-only hints', () => {
    const forged = { ...emptyProgress(), discovered: [...c.solution.evidenceIds], solved: true };
    expect(accuse(c, forged, c.solution.suspectId, c.solution.motiveId, c.solution.evidenceIds).correct).toBe(false);
    expect(availableClues(c, forged)).toEqual(availableClues(c, emptyProgress()));
    const initial = emptyProgress();
    const hints = [0, 1, 2, 3].map((hintLevel) => hint(c, { ...initial, hintLevel }));
    expect(new Set(hints).size).toBe(4);
    for (const text of hints) {
      expect(text.length).toBeGreaterThan(20);
      expect(text).not.toContain(c.solution.explanation);
      expect(text).not.toContain(c.suspects.find((suspect) => suspect.id === c.solution.suspectId)!.name);
    }
    expect(initial.hintLevel).toBe(0);
    expect(hint(c, explore(c))).toContain('Choose one piece of evidence');
    const solved = accuse(c, explore(c), c.solution.suspectId, c.solution.motiveId, c.solution.evidenceIds).progress;
    expect(hint(c, solved)).toContain('Case closed');
  });

  it('round-trips an earned solution and preserves notes, pins, and attempts', () => {
    const explored = { ...explore(c), notes: 'Two facts → one explanation.\nCheck timing.', pinned: [...c.solution.evidenceIds], attempts: 2, hintLevel: 2 };
    const solved = accuse(c, explored, c.solution.suspectId, c.solution.motiveId, c.solution.evidenceIds).progress;
    expect(loadProgress(saveProgress({ [c.id]: solved }))).toEqual({ [c.id]: solved });
  });

  it('repairs malformed saves and removes orphaned discoveries and pins', () => {
    const first = c.clues.find((clue) => clue.requires.length === 0)!;
    const raw = JSON.stringify({
      [c.id]: {
        discovered: [first.id, first.id, ...c.solution.evidenceIds, 'unknown', 12, null],
        pinned: [first.id, c.solution.evidenceIds[0], 'unknown', false],
        notes: { bad: true },
        attempts: -3,
        hintLevel: 99,
        solved: true,
      },
      unknown: emptyProgress(),
      __proto__: { solved: true },
    });
    expect(loadProgress(raw)).toEqual({
      [c.id]: { discovered: [first.id], pinned: [first.id], notes: '', attempts: 0, hintLevel: 3, solved: false },
    });
    const complete = explore(c);
    const reversed = { ...complete, discovered: [...complete.discovered].reverse(), solved: true };
    expect(loadProgress(JSON.stringify({ [c.id]: reversed }))[c.id].solved).toBe(true);
    expect(loadProgress(JSON.stringify({ [c.id]: { ...complete, solved: 'true', attempts: 1.5, hintLevel: -1 } }))[c.id]).toMatchObject({
      solved: false, attempts: 0, hintLevel: 0,
    });
  });

  it('removes transitive descendants when a saved prerequisite is missing', () => {
    const complete = explore(c);
    const removed = c.clues.find((clue) => clue.requires.length > 0)!;
    const damaged = {
      ...complete,
      discovered: complete.discovered.filter((id) => id !== removed.id),
      pinned: [...c.solution.evidenceIds],
      solved: true,
    };
    const repaired = loadProgress(JSON.stringify({ [c.id]: damaged }))[c.id];
    expect(repaired.solved).toBe(false);
    for (const clue of c.clues) {
      if (repaired.discovered.includes(clue.id)) {
        expect(clue.requires.every((id) => repaired.discovered.includes(id))).toBe(true);
      }
    }
    expect(repaired.pinned.every((id) => repaired.discovered.includes(id))).toBe(true);
    expect(complete.discovered).toHaveLength(c.clues.length);
  });
});

describe('storage boundaries', () => {
  it.each([null, '', '{', 'null', '[]', '1', '"hello"', 'true'])('handles unusable JSON: %s', (raw) => {
    expect(loadProgress(raw)).toEqual({});
  });

  it('ignores unknown cases and non-object entries', () => {
    expect(loadProgress(JSON.stringify({ unknown: emptyProgress(), [cases[0].id]: [], [cases[1].id]: null }))).toEqual({});
    expect(saveProgress({ unknown: emptyProgress() })).toBe('{}');
    expect(loadProgress(JSON.stringify({ [cases[0].id]: {} }))).toEqual({ [cases[0].id]: emptyProgress() });
  });

  it('sanitizes before saving as well as loading', () => {
    const c = cases[0];
    const invalid = { ...emptyProgress(), discovered: ['unknown'], pinned: ['unknown'], attempts: Infinity, solved: true };
    expect(JSON.parse(saveProgress({ [c.id]: invalid }))).toEqual({ [c.id]: emptyProgress() });
    const a = emptyProgress();
    const b = emptyProgress();
    a.discovered.push('example');
    expect(b.discovered).toEqual([]);
  });
});

describe('local calendar rotation', () => {
  it('formats local dates and pads month and day', () => {
    expect(localDateKey(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02');
    expect(localDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(localDateKey(new Date(2028, 1, 29, 12))).toBe('2028-02-29');
  });

  it('uses local getters rather than the UTC date', () => {
    const date = new Date('2026-01-01T23:30:00Z');
    // Explicit local getters make this regression independent of the test host timezone.
    date.getFullYear = () => 2026;
    date.getMonth = () => 0;
    date.getDate = () => 2;
    expect(localDateKey(date)).toBe('2026-01-02');
    expect(dailyCase(date)).toBe(dailyCase(new Date(2026, 0, 2, 12)));
  });

  it.each([[2026, 2, 8], [2026, 9, 4], [2026, 10, 1], [2026, 11, 31], [2028, 1, 29]])(
    'stays constant throughout local day %i/%i/%i and rotates at midnight',
    (year, month, day) => {
      const morning = new Date(year, month, day, 0, 0);
      const evening = new Date(year, month, day, 23, 59, 59);
      const tomorrow = new Date(year, month, day + 1, 0, 0);
      const index = cases.indexOf(dailyCase(morning));
      expect(dailyCase(evening)).toBe(cases[index]);
      expect(dailyCase(tomorrow)).toBe(cases[(index + 1) % cases.length]);
      expect(dailyCase(new Date(year, month, day + cases.length, 12))).toBe(cases[index]);
    },
  );

  it('supports dates before the Unix epoch', () => {
    const date = new Date(1969, 11, 31, 12);
    expect(cases).toContain(dailyCase(date));
    expect(dailyCase(new Date(1970, 0, 1))).toBe(cases[(cases.indexOf(dailyCase(date)) + 1) % cases.length]);
  });
});
