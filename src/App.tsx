import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  cases, dailyCase, localDateKey, emptyProgress, availableClues, discoverClue,
  accuse, hint, STORAGE_KEY, loadProgress, saveProgress,
} from './game';
import type { CaseProgress, Clue } from './game';
import './styles.css';

type IconName = 'mark' | 'arrow' | 'pin' | 'check' | 'lock' | 'scene' | 'interview' | 'record' | 'spark' | 'reset';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    mark: <><path d="M12 3 3 7v10l9 4 9-4V7Z" /><path d="m3 7 9 4 9-4M12 11v10M7 5l10 4" /><circle cx="12" cy="7" r="1" /></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    pin: <><path d="m15 3 6 6-4 1-3 5-2-2-6 6-1-1 6-6-2-2 5-3Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>,
    scene: <><path d="M3 9h4l2-4h6l2 4h4v11H3Z" /><circle cx="12" cy="14" r="3" /></>,
    interview: <><path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z" /><path d="M8 10h8m-8 4h5" /></>,
    record: <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h4M9 12h6m-6 4h6" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function DeskIllustration() {
  return <svg className="desk-art" viewBox="0 0 440 270" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="window-glow" x1="180" y1="0" x2="370" y2="250" gradientUnits="userSpaceOnUse"><stop stopColor="#e9b86c" stopOpacity=".5" /><stop offset="1" stopColor="#e9b86c" stopOpacity="0" /></linearGradient>
      <pattern id="rain" width="29" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><path d="M5 0v9m15 8v7" stroke="#cdba91" strokeOpacity=".3" /></pattern>
    </defs>
    <path d="M205 13h147v195H205z" fill="#263832" stroke="#a89a76" strokeWidth="3" />
    <path d="M213 21h131v179H213z" fill="url(#rain)" />
    <path d="M278 17v189m-69-98h139" stroke="#a89a76" strokeWidth="5" />
    <path d="m211 112-76 142h295l-86-142" fill="url(#window-glow)" />
    <path d="M91 231h322M97 237h310" stroke="#8c7755" strokeWidth="2" />
    <path d="m119 161 105-18 17 81-105 7Z" fill="#bcaa83" transform="rotate(-7 175 185)" />
    <path d="m154 157 100 8-5 66-100-8Z" fill="#eadfc4" />
    <path d="m167 177 68 6m-69 4 47 4m-48 5 61 5m-62 4 34 3" stroke="#9e9177" strokeWidth="2" />
    <circle cx="241" cy="170" r="33" fill="#2a3831" fillOpacity=".15" stroke="#b48b47" strokeWidth="6" />
    <circle cx="241" cy="170" r="27" stroke="#eadfc4" strokeOpacity=".6" strokeWidth="2" />
    <path d="m265 195 30 31" stroke="#b48b47" strokeWidth="12" strokeLinecap="round" />
    <path d="M109 226v-88m-23 89h47M86 137h62l-16-44h-29Z" stroke="#c6a367" strokeWidth="3" />
    <path d="m86 137 17-44h29l16 44Z" fill="#c6a367" />
    <path d="M321 199h31v28h-31z" fill="#697064" /><path d="M352 204h7a8 8 0 0 1 0 16h-7" stroke="#697064" strokeWidth="4" />
    <path d="M329 190c-8-10 8-12 0-22m13 24c-7-10 7-11 0-20" stroke="#c6b89a" strokeOpacity=".6" strokeWidth="2" />
    <path d="M59 249h330" stroke="#8c7755" strokeOpacity=".45" />
    <circle cx="375" cy="48" r="2" fill="#c6a367" /><path d="M61 74h18m-9-9v18" stroke="#c6a367" strokeOpacity=".5" />
  </svg>;
}

function readSavedProgress() {
  try {
    return { records: loadProgress(window.localStorage.getItem(STORAGE_KEY)), failed: false };
  } catch {
    return { records: {} as Record<string, CaseProgress>, failed: true };
  }
}

const kindLabels = { scene: 'At the scene', interview: 'Interview', record: 'Record' };

export default function App() {
  const [initial] = useState(readSavedProgress);
  const [records, setRecords] = useState(initial.records);
  const [storageFailed, setStorageFailed] = useState(initial.failed);
  const [today, setToday] = useState(() => new Date());
  const todaysCase = dailyCase(today);
  const [caseId, setCaseId] = useState(() => dailyCase(new Date()).id);
  const activeCase = cases.find((item) => item.id === caseId) ?? todaysCase;
  const progress = records[activeCase.id] ?? emptyProgress();
  const [filter, setFilter] = useState<'all' | Clue['kind']>('all');
  const [suspectId, setSuspectId] = useState('');
  const [motiveId, setMotiveId] = useState('');
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [restartOpen, setRestartOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstRender = useRef(true);
  const available = availableClues(activeCase, progress);
  const discovered = activeCase.clues.filter((clue) => progress.discovered.includes(clue.id));
  const readyIds = new Set(available.map((clue) => clue.id));
  const percent = Math.round(discovered.length / Math.max(activeCase.clues.length, 1) * 100);
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    try {
      window.localStorage.setItem(STORAGE_KEY, saveProgress(records));
      setStorageFailed(false);
    } catch { setStorageFailed(true); }
  }, [records]);

  useEffect(() => {
    if (restartOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [restartOpen]);

  function updateProgress(next: CaseProgress) {
    setRecords((previous) => ({ ...previous, [activeCase.id]: next }));
  }

  function chooseCase(id: string) {
    setCaseId(id);
    setSuspectId('');
    setMotiveId('');
    setEvidenceIds([]);
    setFeedback('');
    setAnnouncement('');
    setFilter('all');
  }

  function readClue(clue: Clue) {
    const next = discoverClue(activeCase, progress, clue.id);
    updateProgress(next);
    setAnnouncement(`${clue.title} added to your evidence. Check for newly unlocked leads.`);
    window.requestAnimationFrame(() => document.getElementById(`lead-${clue.id}`)?.focus({ preventScroll: true }));
  }

  function togglePin(id: string) {
    const pinned = progress.pinned.includes(id)
      ? progress.pinned.filter((item) => item !== id)
      : [...progress.pinned, id];
    updateProgress({ ...progress, pinned });
  }

  function submitAccusation(event: FormEvent) {
    event.preventDefault();
    if (!suspectId || !motiveId || evidenceIds.length !== 2) return;
    const result = accuse(activeCase, progress, suspectId, motiveId, evidenceIds);
    updateProgress(result.progress);
    setFeedback(result.feedback);
    setAnnouncement(result.correct ? 'Case closed. Your solution and the ending are now available.' : 'The case is not closed. Review the feedback beneath your accusation.');
  }

  function toggleEvidence(id: string) {
    setFeedback('');
    setEvidenceIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : previous.length < 2 ? [...previous, id] : previous);
  }

  function restart() {
    updateProgress(emptyProgress());
    setSuspectId('');
    setMotiveId('');
    setEvidenceIds([]);
    setFeedback('');
    setFilter('all');
    setRestartOpen(false);
    setAnnouncement('Case restarted. Your evidence, notes, and attempts have been cleared.');
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#case-file">Skip to investigation</a>
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Daily Detective home"><span className="brand-symbol"><Icon name="mark" size={27} /></span><span>DAILY<span className="brand-bottom">DETECTIVE</span></span></a>
        <span className="masthead-tagline">A little mystery. A sharper mind.</span>
        <div className="edition"><span className="live-dot" /> THE DAILY EDITION <span className="edition-date">{localDateKey(today)}</span></div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="small-rule" /> YOUR DAILY MOMENT OF INTRIGUE</div>
            <h1 id="hero-title">Every detail<br /> has a <em>tell.</em></h1>
            <p>A scene. A few stories. One truth.<br />Take your time. Follow the things that don’t quite fit.</p>
            <a className="hero-link" href="#case-file">Open the case file <Icon name="arrow" size={18} /></a>
          </div>
          <div className="hero-art"><DeskIllustration /><span className="art-caption">OBSERVE CLOSELY. ASSUME NOTHING.</span></div>
          <span className="hero-number">№ {String(cases.indexOf(todaysCase) + 1).padStart(3, '0')}</span>
        </section>

        <section className="edition-bar" aria-label="Daily case and archive">
          <div className="daily-date"><Icon name="spark" size={18} /><div><strong>{dateLabel}</strong><span>A daily selection, by your local date</span></div></div>
          <div className="archive-picker"><label htmlFor="case-select">THE CASE ARCHIVE</label><select id="case-select" data-testid="case-select" value={activeCase.id} onChange={(event) => chooseCase(event.target.value)}>{cases.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, '0')} · {item.title}{item.id === todaysCase.id ? ' — Today' : ''}{records[item.id]?.solved ? ' · Solved' : ''}</option>)}</select></div>
        </section>

        {storageFailed && <p className="storage-warning" role="status">Your browser couldn’t save this investigation. You can still play, but progress may be lost when you leave.</p>}
        <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

        <nav className="investigation-nav" aria-label="Investigation sections">
          <a href="#evidence">Clues <span>{discovered.length}/{activeCase.clues.length}</span></a>
          <a href="#suspects">People</a>
          <a href="#notebook">Notebook</a>
          <a href="#accusation">{progress.solved ? 'Solution' : 'Solve'}</a>
        </nav>

        <div className="investigation-layout" id="case-file">
          <div className="case-column">
            <section className="case-cover panel" aria-labelledby="case-title">
              <div className="case-topline"><span className="eyebrow">CASE FILE / {String(cases.indexOf(activeCase) + 1).padStart(3, '0')}</span><span className={`status-stamp ${progress.solved ? 'closed' : ''}`}>{progress.solved ? 'CASE CLOSED' : 'INVESTIGATION OPEN'}</span></div>
              <h2 id="case-title">{activeCase.title}</h2>
              <p className="case-subtitle">{activeCase.subtitle}</p>
              <div className="location-line"><span className="location-dot" />{activeCase.location}</div>
              <p className="case-brief">{activeCase.brief}</p>
              <div className="case-next-action"><a className="primary-button" href={progress.solved || discovered.length === activeCase.clues.length ? '#accusation' : '#evidence'}>{progress.solved ? 'View the solution' : discovered.length === activeCase.clues.length ? 'Connect your evidence' : discovered.length ? 'Continue investigating' : 'Read your first clue'}<Icon name="arrow" size={18} /></a><p>Read the leads. Choose a person, a motive and two supporting clues. No time limit.</p></div>
              <blockquote>{activeCase.opening}</blockquote>
              <div className="case-progress"><span>{discovered.length} of {activeCase.clues.length} clues read</span><span>{percent}% explored</span></div>
              <div className="progress-track" role="progressbar" aria-label="Case exploration" aria-valuenow={discovered.length} aria-valuemin={0} aria-valuemax={activeCase.clues.length}><span style={{ width: `${percent}%` }} /></div>
            </section>

            <section className="evidence-section" id="evidence" tabIndex={-1} aria-labelledby="evidence-title">
              <div className="section-heading"><h3 id="evidence-title">Follow the evidence</h3><span>{available.filter((clue) => !progress.discovered.includes(clue.id)).length} OPEN LEADS</span></div>
              <p className="section-intro">Read clues to unlock new leads. Pin useful details to your notebook, then connect the two that prove your theory.</p>
              {announcement && <p className="investigation-update">{announcement}</p>}
              <div className="evidence-filters" role="group" aria-label="Filter evidence">{(['all', 'scene', 'interview', 'record'] as const).map((value) => <button key={value} type="button" className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All leads' : value === 'scene' ? 'The scene' : value === 'interview' ? 'Interviews' : 'Records'}</button>)}</div>
              <div className="clue-list">{activeCase.clues.filter((clue) => filter === 'all' || clue.kind === filter).map((clue, index) => {
                const isRead = progress.discovered.includes(clue.id);
                const isAvailable = readyIds.has(clue.id);
                const missing = clue.requires.filter((id) => !progress.discovered.includes(id));
                return <article className={`clue-card ${isRead ? 'read' : ''} ${!isAvailable && !isRead ? 'locked' : ''}`} id={`lead-${clue.id}`} tabIndex={-1} aria-label={clue.title} key={clue.id}>
                  <div className="clue-icon"><Icon name={!isAvailable && !isRead ? 'lock' : clue.kind} size={21} /></div>
                  <div className="clue-body"><div className="clue-kicker">{kindLabels[clue.kind]} <span>· {String(index + 1).padStart(2, '0')}</span>{isRead && <span className="read-label"><Icon name="check" size={12} /> READ</span>}</div><h4>{clue.title}</h4>
                    {isRead ? <><p className="clue-text">{clue.text}</p><button type="button" className={`pin-button ${progress.pinned.includes(clue.id) ? 'is-pinned' : ''}`} aria-pressed={progress.pinned.includes(clue.id)} aria-label={`${progress.pinned.includes(clue.id) ? 'Unpin' : 'Pin'} ${clue.title}`} onClick={() => togglePin(clue.id)}><Icon name="pin" size={14} />{progress.pinned.includes(clue.id) ? 'Pinned to notebook' : 'Pin to notebook'}</button></> : isAvailable ? <><p className="clue-preview">A new detail is waiting. Take a closer look.</p><button type="button" className="read-button" data-testid={`clue-${clue.id}`} onClick={() => readClue(clue)}>Read {clue.kind === 'interview' ? 'interview' : clue.kind === 'record' ? 'record' : 'clue'}<Icon name="arrow" size={16} /></button></> : <><p className="locked-copy">Read {missing.map((id) => activeCase.clues.find((item) => item.id === id)?.title ?? 'the preceding clue').join(' and ')} to unlock this lead.</p><button type="button" className="locked-button" data-testid={`clue-${clue.id}`} disabled><Icon name="lock" size={13} /> Lead not yet available</button></>}
                  </div>
                </article>;
              })}</div>
              {activeCase.clues.filter((clue) => filter === 'all' || clue.kind === filter).length === 0 && <p className="empty-state">No leads in this category. Try another filter.</p>}
            </section>
            <section className="suspects-section" id="suspects" tabIndex={-1} aria-labelledby="suspects-title">
              <div className="section-heading"><h3 id="suspects-title">The people involved</h3><span>{activeCase.suspects.length} PERSONS OF INTEREST</span></div>
              <div className="suspect-grid">{activeCase.suspects.map((suspect, index) => <article className="suspect-card" key={suspect.id}><div className="suspect-portrait" aria-hidden="true"><span>{suspect.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><svg viewBox="0 0 90 90" fill="none"><circle cx="45" cy="34" r="15" /><path d="M18 88V76c0-17 12-26 27-26s27 9 27 26v12" /></svg><span className="portrait-index">0{index + 1}</span></div><h4>{suspect.name}</h4><p>{suspect.role}</p><details className="statement"><summary>Initial statement</summary><p>“{suspect.statement}”</p></details></article>)}</div>
            </section>
          </div>

          <aside className="detective-column" aria-label="Your investigation tools">
            <section className="notebook panel" id="notebook" tabIndex={-1} aria-labelledby="notebook-title">
              <div className="notebook-binding" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
              <div className="notebook-heading"><h3 id="notebook-title">Your notebook</h3><span className="handwritten">leave no loose ends</span></div>
              <label className="eyebrow" htmlFor="notes">THOUGHTS & CONNECTIONS</label>
              <textarea id="notes" data-testid="notes" value={progress.notes} onChange={(event) => updateProgress({ ...progress, notes: event.target.value })} placeholder="Who had something to gain? What doesn’t add up? Jot down your theory…" rows={5} />
              <p className="save-label"><span className={`save-dot ${storageFailed ? 'unsaved' : ''}`} />{storageFailed ? 'Kept for this session only' : 'Saved automatically on this device'}</p>
              <div className="pinned-heading"><Icon name="pin" size={15} /><h4>PINNED EVIDENCE</h4><span>{progress.pinned.length}</span></div>
              {progress.pinned.length === 0 ? <div className="pin-empty"><span className="empty-pin"><Icon name="pin" size={21} /></span><p>A place for the details that matter.</p><span>Read a clue and pin it here for reference.</span></div> : <ul className="pinned-list">{discovered.filter((clue) => progress.pinned.includes(clue.id)).map((clue) => <li key={clue.id}><div><strong>{clue.title}</strong><p>{clue.text}</p></div><button type="button" className="unpin" aria-label={`Unpin ${clue.title}`} onClick={() => togglePin(clue.id)}>×</button></li>)}</ul>}
            </section>

            <section className={`accusation panel ${progress.solved ? 'solved-panel' : ''}`} id="accusation" tabIndex={-1} aria-labelledby="accusation-title">
              {progress.solved ? <>
                <div className="solution-seal"><Icon name="check" size={27} /></div>
                <div className="eyebrow">THE TRUTH, UNCOVERED</div><h3 id="accusation-title">Case closed.</h3>
                <p className="solution-person">{activeCase.suspects.find((suspect) => suspect.id === activeCase.solution.suspectId)?.name}</p>
                <p className="solution-motive">{activeCase.motives.find((motive) => motive.id === activeCase.solution.motiveId)?.label}</p>
                <p>{activeCase.solution.explanation}</p>
                <h4 className="eyebrow">THE DECISIVE EVIDENCE</h4><ul className="solution-evidence">{activeCase.solution.evidenceIds.map((id) => <li key={id}><Icon name="check" size={14} />{activeCase.clues.find((clue) => clue.id === id)?.title}</li>)}</ul>
                <div className="ending"><h4>The final word</h4><p>{activeCase.ending}</p></div>
                <p className="attempt-count">Solved in {progress.attempts + 1} {progress.attempts === 0 ? 'accusation' : 'accusations'}. Nicely observed.</p>
                {cases.some((item) => item.id !== activeCase.id && !records[item.id]?.solved) && <button className="primary-button next-case" type="button" onClick={() => chooseCase(cases.find((item) => item.id !== activeCase.id && !records[item.id]?.solved)!.id)}>Explore another case <Icon name="arrow" size={17} /></button>}
              </> : <>
                <div className="eyebrow">WHEN THE PIECES COME TOGETHER</div><h3 id="accusation-title">Make your accusation.</h3>
                <p className="accusation-intro">Name the person, the reason, and the two clues that make your case.</p>
                <form onSubmit={submitAccusation}>
                  <label htmlFor="suspect">01 <span>Who is responsible?</span></label>
                  <select id="suspect" value={suspectId} required onChange={(event) => { setSuspectId(event.target.value); setFeedback(''); }}><option value="" disabled>Choose a suspect</option>{activeCase.suspects.map((suspect) => <option key={suspect.id} value={suspect.id}>{suspect.name}</option>)}</select>
                  <label htmlFor="motive">02 <span>What was the motive?</span></label>
                  <select id="motive" value={motiveId} required onChange={(event) => { setMotiveId(event.target.value); setFeedback(''); }}><option value="" disabled>Choose a motive</option>{activeCase.motives.map((motive) => <option key={motive.id} value={motive.id}>{motive.label}</option>)}</select>
                  <fieldset><legend><span>03</span> Which clues prove it?</legend><p className="evidence-help" id="evidence-help">Choose exactly two read clues. Pins are for reference only.</p><div className="selection-counter" aria-live="polite">{evidenceIds.length} / 2 SELECTED</div>
                    {discovered.length === 0 ? <div className="selection-empty"><Icon name="lock" size={18} /><p>Your evidence will appear here as you read clues.</p></div> : <div className="evidence-options">{discovered.map((clue) => <label key={clue.id} className={`evidence-option ${evidenceIds.includes(clue.id) ? 'selected' : ''}`}><input type="checkbox" checked={evidenceIds.includes(clue.id)} onChange={() => toggleEvidence(clue.id)} disabled={evidenceIds.length === 2 && !evidenceIds.includes(clue.id)} aria-describedby="evidence-help" /><span>{clue.title}</span></label>)}</div>}
                  </fieldset>
                  <button type="submit" className="primary-button" data-testid="accuse-submit" disabled={!suspectId || !motiveId || evidenceIds.length !== 2}>Submit accusation <Icon name="arrow" size={17} /></button>
                  <p className="no-penalty">No timer. No penalty for a wrong turn.</p>
                  {feedback && <div className="feedback" role="status"><strong>Not quite a closed case.</strong><p>{feedback}</p><span>Revisit your clues and try another connection.</span></div>}
                  {progress.attempts > 0 && <p className="attempt-count">{progress.attempts} {progress.attempts === 1 ? 'theory' : 'theories'} tested</p>}
                </form>
              </>}
            </section>

            {!progress.solved && <section className="hint-panel" aria-labelledby="hint-title"><div className="hint-heading"><Icon name="spark" size={20} /><h3 id="hint-title">A fresh pair of eyes?</h3></div><p>A gentle nudge, not the answer.</p>{progress.hintLevel > 0 && <div className="hint-copy" role="status">{hint(activeCase, { ...progress, hintLevel: progress.hintLevel - 1 })}</div>}<button type="button" onClick={() => updateProgress({ ...progress, hintLevel: Math.min(progress.hintLevel + 1, 3) })} disabled={progress.hintLevel >= 3}>{progress.hintLevel >= 3 ? 'All three hints revealed' : progress.hintLevel > 0 ? 'Reveal the next hint' : 'Reveal a hint'}<span>{Math.min(progress.hintLevel, 3)} / 3</span></button></section>}
            <button type="button" className="restart-button" data-testid="restart" onClick={() => setRestartOpen(true)}><Icon name="reset" size={14} /> Restart this case</button>
          </aside>
        </div>
        <section className="how-to" aria-labelledby="how-title"><span className="eyebrow" id="how-title">THE DETECTIVE’S METHOD</span><div><span>01</span><p><strong>Look closer.</strong> Read the scene and follow newly unlocked leads.</p></div><div><span>02</span><p><strong>Connect the dots.</strong> Compare interviews, pin evidence, and keep notes.</p></div><div><span>03</span><p><strong>Make your case.</strong> One suspect. One motive. Exactly two decisive clues.</p></div></section>
      </main>
      <footer><span className="footer-brand"><Icon name="mark" size={18} /> DAILY DETECTIVE</span><p>Small mysteries. Satisfying discoveries.</p><span>MADE FOR CURIOUS MINDS</span></footer>
      <dialog ref={dialogRef} onCancel={() => setRestartOpen(false)} aria-labelledby="restart-title" aria-describedby="restart-description"><div className="dialog-content"><span className="eyebrow">A CLEAN SLATE</span><h2 id="restart-title">Reopen the case?</h2><p id="restart-description">This clears your clues, notes, pins, hints, and attempts for “{activeCase.title}”. Your other cases won’t change.</p><div className="dialog-actions"><button type="button" className="secondary-button" autoFocus onClick={() => setRestartOpen(false)}>Keep investigating</button><button type="button" className="primary-button" onClick={restart}>Yes, restart case</button></div></div></dialog>
    </div>
  );
}
