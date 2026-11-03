export type Suspect = { id: string; name: string; role: string; statement: string };
export type Clue = {
  id: string;
  title: string;
  kind: 'scene' | 'interview' | 'record';
  text: string;
  requires: string[];
};
export type Case = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  brief: string;
  opening: string;
  suspects: Suspect[];
  clues: Clue[];
  motives: { id: string; label: string }[];
  solution: {
    suspectId: string;
    motiveId: string;
    evidenceIds: string[];
    explanation: string;
  };
  ending: string;
};
export type CaseProgress = {
  discovered: string[];
  notes: string;
  pinned: string[];
  attempts: number;
  solved: boolean;
  hintLevel: number;
};

export const cases: Case[] = [
  {
    id: 'lantern-lane',
    title: 'The Star That Stepped Out',
    subtitle: 'A lantern-walk mystery',
    location: 'Bramblewick Village Green',
    brief: 'The handmade star lantern has vanished just before the village walk.',
    opening:
      'At six o’clock, the ribbon over the green still holds five little moons—but the big star is missing. Nobody is hurt, and the walk has not begun. Find who moved the star, and why.',
    suspects: [
      { id: 'mira', name: 'Mira Moss', role: 'Walk organiser', statement: 'I was checking the bridge route before the walkers arrived.' },
      { id: 'otis', name: 'Otis Reed', role: 'Lantern maker', statement: 'I spent the afternoon getting the lanterns ready.' },
      { id: 'fern', name: 'Fern Finch', role: 'Market stallholder', statement: 'My stall faces the green. I was setting out my baskets.' },
    ],
    clues: [
      { id: 'empty-hook', title: 'An unbroken ribbon', kind: 'scene', text: 'The star’s hook is unbent and its ribbon has been carefully untied. The star was lifted down, not blown away.', requires: [] },
      { id: 'walk-programme', title: 'The walk programme', kind: 'record', text: 'The star was hanging at the 5:40 inspection. Rehearsal starts at 6:10. A weather notice forecasts gusts from 5:50.', requires: [] },
      { id: 'mira-interview', title: 'Mira’s bridge check', kind: 'interview', text: 'Mira shows a bridge checklist countersigned by the ranger every five minutes from 5:45 to 6:05. She could not have been at the green when the star disappeared.', requires: ['empty-hook'] },
      { id: 'fern-interview', title: 'A cart behind the bunting', kind: 'interview', text: 'Fern saw a covered, broad-wheeled cart leave the star’s hook shortly before six. The bunting hid its handler. Her neighbour confirms she stayed at her stall.', requires: ['walk-programme'] },
      { id: 'cart-tracks', title: 'Two chalky wheel tracks', kind: 'scene', text: 'Two broad chalk tracks run from beneath the empty hook to the workshop lane. Narrow market barrows could not have made them.', requires: ['empty-hook', 'fern-interview'] },
      { id: 'otis-interview', title: 'Otis’s afternoon repair', kind: 'interview', text: 'Otis says the star needed a new silk seam that afternoon. He wrote the drying instructions on its repair ticket, as he does for every repair.', requires: ['walk-programme'] },
      { id: 'cart-ledger', title: 'The cart checkout ledger', kind: 'record', text: 'The green has just one broad-wheeled cart. The attendant recorded Otis collecting it at 5:55, using it himself throughout, and returning it at 6:05. Nobody else handled it.', requires: ['cart-tracks', 'mira-interview'] },
      { id: 'sheltered-star', title: 'The workshop drying alcove', kind: 'scene', text: 'The star is safe on the cart’s padded stand inside the drying alcove. Its repair ticket reads: “New silk seam: shelter from gusts until 6:30; wind before then will split the damp seam.” The stand is marked “Return to the walk when dry.”', requires: ['cart-ledger', 'otis-interview'] },
    ],
    motives: [
      { id: 'shorter-walk', label: 'Shorten the lantern walk' },
      { id: 'protect-seam', label: 'Protect the newly repaired lantern from the wind' },
      { id: 'stall-decoration', label: 'Borrow a decoration for a market stall' },
    ],
    solution: {
      suspectId: 'otis',
      motiveId: 'protect-seam',
      evidenceIds: ['cart-ledger', 'sheltered-star'],
      explanation: 'The attendant’s ledger places the only suitable cart in Otis’s hands throughout the move. The star’s location and drying ticket explain why: he sheltered its damp repair from the gusts, intending to return it.',
    },
    ending: 'Otis apologises for forgetting to tell Mira. The villagers wait for the seam to dry, share warm apple juice, and set off beneath a whole little sky of lanterns.',
  },
  {
    id: 'biscuit-board',
    title: 'The Chalkboard Change',
    subtitle: 'A village bake-table mystery',
    location: 'Clover Hall Community Kitchen',
    brief: 'Someone changed the biscuit topping on the fair’s chalkboard.',
    opening: 'The printed menu says “almond crunch,” but the chalkboard now says “toasted oat sprinkle.” A neat line has replaced the old words. Before the bake table opens, discover who made the change and what prompted it.',
    suspects: [
      { id: 'theo', name: 'Theo Thistle', role: 'Baker', statement: 'I have been preparing the bowls and checking kitchen messages.' },
      { id: 'lila', name: 'Lila Wren', role: 'Sign illustrator', statement: 'I drew the border around the menu yesterday.' },
      { id: 'sam', name: 'Sam Brook', role: 'Hall steward', statement: 'I have been welcoming stallholders at the front desk.' },
    ],
    clues: [
      { id: 'menu-board', title: 'Fresh blue lettering', kind: 'scene', text: 'Only the topping has changed. Its new pale-blue letters sit inside an untouched green border. There are no other edits to the menu.', requires: [] },
      { id: 'prep-timetable', title: 'The morning timetable', kind: 'record', text: 'The kitchen opened at 9:00. A photograph at 9:10 still shows “almond crunch”; another at 9:30 shows “toasted oat sprinkle.” Nobody has served any biscuits yet.', requires: [] },
      { id: 'lila-interview', title: 'Lila’s mural session', kind: 'interview', text: 'Lila was painting a mural in the courtyard from 9:00 to 9:40. The supervised art group’s dated photographs show her there throughout. She uses green sign chalk, not pale blue.', requires: ['menu-board'] },
      { id: 'sam-interview', title: 'A sealed kitchen message', kind: 'interview', text: 'Sam received a last-minute envelope for the baker and sent it through the kitchen message slot at 9:15. He did not open it. His front-desk log and a waiting stallholder place him at the desk all morning.', requires: ['prep-timetable'] },
      { id: 'chalk-kit', title: 'The kitchen chalk kit', kind: 'scene', text: 'Pale-blue chalk dust on the board’s ledge matches the kitchen kit. The courtyard and front desk have only green chalk. Kitchen kit loans and board changes must be signed in the counter ledger.', requires: ['menu-board', 'lila-interview'] },
      { id: 'theo-interview', title: 'Theo’s message routine', kind: 'interview', text: 'Theo explains that kitchen messages are filed after they are acted on. The file is behind the counter, beside the signed board-change ledger.', requires: ['prep-timetable'] },
      { id: 'board-ledger', title: 'The signed board-change ledger', kind: 'record', text: 'At 9:22, Theo signed: “Kitchen pale-blue chalk collected; biscuit topping line amended by me; chalk returned.” The ledger records no other board changes that morning.', requires: ['chalk-kit', 'theo-interview'] },
      { id: 'guest-note', title: 'The filed guest request', kind: 'record', text: 'The 9:15 envelope asks the baker to honour a guest’s nut-free topping request by using the already-prepared oat sprinkle instead of almond crunch. Theo’s filed response says the topping and displayed menu were updated together before service.', requires: ['sam-interview', 'board-ledger'] },
    ],
    motives: [
      { id: 'match-art', label: 'Make the menu match the mural' },
      { id: 'easy-cleanup', label: 'Reduce the washing-up' },
      { id: 'guest-request', label: 'Honour a guest’s nut-free topping request' },
    ],
    solution: {
      suspectId: 'theo',
      motiveId: 'guest-request',
      evidenceIds: ['board-ledger', 'guest-note'],
      explanation: 'Theo’s signed ledger identifies the person who changed the board. The filed request and his response establish the reason: a guest requested the alternative topping, and he updated both the preparation and the menu.',
    },
    ending: 'Theo adds a clear update to the printed menus, and Sam thanks him for catching the late request. Lila draws a tiny oat stalk beside the new lettering. The fair opens with everyone in the loop.',
  },
  {
    id: 'fountain-song',
    title: 'The Fountain’s Unexpected Tune',
    subtitle: 'A gentle garden mystery',
    location: 'Willowmere Pocket Garden',
    brief: 'The fountain played a soft lullaby instead of its usual morning march.',
    opening: 'At ten o’clock, the garden fountain’s speaker plays “Moon Over the Meadow,” not the cheerful march printed on the noticeboard. The equipment is working. Who changed today’s selection, and why?',
    suspects: [
      { id: 'elio', name: 'Elio Bell', role: 'Sound volunteer', statement: 'I checked the sound booth before the garden opened.' },
      { id: 'tess', name: 'Tess Vale', role: 'Band conductor', statement: 'My band has been practising in the hall across the lane.' },
      { id: 'rowan', name: 'Rowan Ash', role: 'Garden keeper', statement: 'I have been tending the sheltered corner of the garden.' },
    ],
    clues: [
      { id: 'speaker-check', title: 'A working speaker', kind: 'scene', text: 'The speaker plays cleanly. The dial is set to the normal daily programme, not shuffle. The lullaby is a deliberate selection, not an equipment fault.', requires: [] },
      { id: 'garden-programme', title: 'Today’s garden programme', kind: 'record', text: 'The march was scheduled for 10:00, with no public rehearsal or special performance planned. Track changes require a signed entry in the locked booth register.', requires: [] },
      { id: 'tess-interview', title: 'Tess’s rehearsal recording', kind: 'interview', text: 'Tess’s continuous rehearsal recording runs from 9:30 to 10:05 in the hall. Her voice is heard conducting throughout. She says the band did not request a different fountain track.', requires: ['garden-programme'] },
      { id: 'rowan-interview', title: 'Rowan’s early delivery', kind: 'interview', text: 'Rowan says a small covered care pen arrived from the wildlife carer at 9:20. She delivered its care instructions to the sound booth, then stayed beside the pen. The visiting carer confirms this.', requires: ['speaker-check'] },
      { id: 'booth-display', title: 'The playback display', kind: 'scene', text: 'The booth display shows a manual replacement at 9:42: today’s march was exchanged for the quieter lullaby, at reduced volume. No other settings changed.', requires: ['speaker-check', 'tess-interview'] },
      { id: 'elio-interview', title: 'Elio’s booth routine', kind: 'interview', text: 'Elio says all manual changes go in the booth register. Supporting requests are clipped beneath the matching entry, so the next volunteer knows when to restore the usual programme.', requires: ['garden-programme'] },
      { id: 'booth-register', title: 'The signed override entry', kind: 'record', text: 'Elio’s signed 9:42 entry reads: “I replaced today’s march with the quiet lullaby and lowered the volume. Usual programme resumes tomorrow.” The booth attendant countersigned after watching him make the change.', requires: ['booth-display', 'elio-interview'] },
      { id: 'care-instructions', title: 'The clipped care instructions', kind: 'record', text: 'The wildlife carer’s note explains that a rescued hedgehog is resting in the garden’s care pen until evening. It requests gentle, low-volume sound rather than the startling march. Elio wrote “temporary sound change made for the resting guest” beneath the request.', requires: ['booth-register', 'rowan-interview'] },
    ],
    motives: [
      { id: 'band-surprise', label: 'Announce a surprise band performance' },
      { id: 'quiet-rest', label: 'Avoid disturbing the resting rescued hedgehog' },
      { id: 'test-speaker', label: 'Test a faulty speaker' },
    ],
    solution: {
      suspectId: 'elio',
      motiveId: 'quiet-rest',
      evidenceIds: ['booth-register', 'care-instructions'],
      explanation: 'The witnessed, signed register identifies Elio as the person who selected the lullaby. The attached care request explains his temporary change: gentler sound for the rescued hedgehog resting nearby.',
    },
    ending: 'A small notice explains the softer music without inviting visitors near the care pen. Tess’s band saves its march for another day, and the garden enjoys one unusually peaceful morning.',
  },
];

export const STORAGE_KEY = 'daily-detective:progress:v1';

export function emptyProgress(): CaseProgress {
  return { discovered: [], notes: '', pinned: [], attempts: 0, solved: false, hintLevel: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : [];
}

// Rebuild the dependency closure, even when saved discovery order is scrambled.
function validDiscoveries(c: Case, value: unknown): string[] {
  const requested = new Set(stringList(value));
  const accepted = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const clue of c.clues) {
      if (requested.has(clue.id) && !accepted.has(clue.id) && clue.requires.every((id) => accepted.has(id))) {
        accepted.add(clue.id);
        changed = true;
      }
    }
  }
  return [...accepted];
}

function nonnegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function cleanProgress(c: Case, value: unknown): CaseProgress {
  if (!isRecord(value)) return emptyProgress();
  const discovered = validDiscoveries(c, value.discovered);
  const known = new Set(discovered);
  return {
    discovered,
    notes: typeof value.notes === 'string' ? value.notes : '',
    pinned: stringList(value.pinned).filter((id) => known.has(id)),
    attempts: nonnegativeInteger(value.attempts),
    solved: value.solved === true && c.solution.evidenceIds.every((id) => known.has(id)),
    hintLevel: Math.min(3, nonnegativeInteger(value.hintLevel)),
  };
}

/** Accessible clues include discoveries, so the notebook can revisit them. */
export function availableClues(c: Case, p: CaseProgress): Clue[] {
  const discovered = new Set(validDiscoveries(c, p.discovered));
  return c.clues.filter((clue) => clue.requires.every((id) => discovered.has(id)));
}

export function discoverClue(c: Case, p: CaseProgress, id: string): CaseProgress {
  const progress = cleanProgress(c, p);
  if (progress.discovered.includes(id)) return progress;
  if (!availableClues(c, progress).some((clue) => clue.id === id)) return progress;
  return { ...progress, discovered: [...progress.discovered, id] };
}

export function accuse(
  c: Case,
  p: CaseProgress,
  suspectId: string,
  motiveId: string,
  evidenceIds: string[],
): { progress: CaseProgress; correct: boolean; feedback: string } {
  const progress = cleanProgress(c, p);
  const expected = c.solution.evidenceIds;
  const exactEvidence =
    evidenceIds.length === expected.length &&
    new Set(evidenceIds).size === expected.length &&
    expected.every((id) => evidenceIds.includes(id) && progress.discovered.includes(id));
  const correct = suspectId === c.solution.suspectId && motiveId === c.solution.motiveId && exactEvidence;
  if (correct) {
    return { progress: { ...progress, solved: true }, correct: true, feedback: c.solution.explanation };
  }
  return {
    progress: { ...progress, attempts: Math.min(Number.MAX_SAFE_INTEGER, progress.attempts + 1) },
    correct: false,
    feedback: 'That theory is not fully supported yet. Revisit the testimony, check the reason, and choose two clues you have discovered.',
  };
}

const reasoningHints: Record<string, [string, string]> = {
  'lantern-lane': [
    'Separate who could move something from why they would move it. Check the timeline and the transport records.',
    'An object can be moved for safekeeping. Compare the handling record with the condition and instructions where the object ended up.',
  ],
  'biscuit-board': [
    'Distinguish yesterday’s artwork from this morning’s amendment. A signed record can establish who made a change.',
    'A change record answers “who”; a message received before that change can answer “why.” Look for a request, not just a coincidence.',
  ],
  'fountain-song': [
    'First distinguish a deliberate selection from a fault. Then check who recorded the manual change.',
    'Compare the signed change with the request filed beside it. A temporary exception should have a specific reason.',
  ],
};

/** Read-only: callers advance and persist hintLevel when requesting another hint. */
export function hint(c: Case, p: CaseProgress): string {
  const progress = cleanProgress(c, p);
  if (progress.solved) return 'Case closed. Your notebook keeps the clues if you would like to revisit the reasoning.';
  const next = availableClues(c, progress).find((clue) => !progress.discovered.includes(clue.id));
  if (progress.hintLevel === 0) {
    return next ? `A useful next step: examine “${next.title}”.` : 'You have the clues. Choose one piece of evidence for who acted and one for why.';
  }
  const hints = reasoningHints[c.id];
  if (progress.hintLevel === 1 && hints) return hints[0];
  if (progress.hintLevel === 2 && hints) return hints[1];
  return next
    ? `Follow up “${next.title}”, then compare firsthand records with the reasons given. You need two supporting clues, not a guess.`
    : 'Test your theory against the records: can your two clues establish both the person’s action and their reason, while ruling out the alternatives?';
}

export function localDateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dailyCase(date: Date): Case {
  // Calendar components, rather than elapsed local milliseconds, avoid DST drift.
  const calendar = new Date(0);
  calendar.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  calendar.setUTCHours(0, 0, 0, 0);
  const day = Math.floor(calendar.getTime() / 86_400_000);
  return cases[((day % cases.length) + cases.length) % cases.length];
}

function cleanStore(value: unknown): Record<string, CaseProgress> {
  if (!isRecord(value)) return {};
  const result: Record<string, CaseProgress> = {};
  for (const c of cases) {
    if (Object.prototype.hasOwnProperty.call(value, c.id) && isRecord(value[c.id])) {
      result[c.id] = cleanProgress(c, value[c.id]);
    }
  }
  return result;
}

export function loadProgress(raw: string | null): Record<string, CaseProgress> {
  if (raw === null) return {};
  try {
    return cleanStore(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveProgress(progress: Record<string, CaseProgress>): string {
  return JSON.stringify(cleanStore(progress));
}
