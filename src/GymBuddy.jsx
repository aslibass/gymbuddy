import React, { useState, useEffect } from 'react';

export function GymBuddy() {
  const EX = [
    { id: 'legpress', name: 'Horizontal Leg Press', img: 'img/leg-press.png', start: 45, inc: 5, unit: 'kg',
      cues: ['Full range', 'No forced lockout', 'Control the return'] },
    { id: 'sldl', name: 'DB Straight Leg Deadlift', img: 'img/sldl.png', start: 7.5, inc: 2.5, unit: 'kg',
      cues: ['Hinge at hips', 'Dumbbells close', 'Slight knee bend'] },
    { id: 'row', name: 'Seated Row', img: 'img/seated-row.png', start: 25, inc: 5, unit: 'kg',
      cues: ['Elbows close', 'Squeeze blades', 'Control the return'] },
    { id: 'chest', name: 'Plate Loaded Chest Press', img: 'img/chest-press.png', start: 15, inc: 2.5, unit: 'kg',
      cues: ['Press smoothly', 'Shoulders relaxed', 'Watch the clicking'] },
    { id: 'lat', name: 'Lat Pull-down', img: 'img/lat-pulldown.png', start: 30, inc: 5, unit: 'kg',
      cues: ['To upper chest', 'No momentum', 'Control the return'] },
    { id: 'lateral', name: 'Lateral Dumbbell Raise', img: 'img/lateral-raise.png', start: 2.5, inc: 1.5, unit: 'kg',
      cues: ['Raise with control', 'No shrugging', 'Lower slowly'] },
    { id: 'curl', name: 'Biceps Curls', img: 'img/biceps-curl.png', start: 5, inc: 2, unit: 'kg',
      cues: ['Elbows by sides', 'No swinging', 'Slow lowering'] },
    { id: 'pallof', name: 'Standing Pallof Hold', img: 'img/pallof.png', hold: true, unit: 's',
      cues: ['Ribs down', 'Resist rotation', 'Each side'] },
    { id: 'legext', name: 'Supine Alt. Leg Extension', img: 'img/leg-extension.png', body: true, unit: '',
      cues: ['Ribs down', 'Neutral lower back', 'Slow and controlled'] }
  ];

  const BLOCKS = [
    { w: 2, sets: 2, reps: 10, step: 1 }, { w: 4, sets: 2, reps: 12, step: 1 }, { w: 6, sets: 2, reps: 15, step: 1 },
    { w: 9, sets: 3, reps: 10, step: 2 }, { w: 12, sets: 3, reps: 12, step: 2 }, { w: 15, sets: 3, reps: 15, step: 2 },
    { w: 18, sets: 3, reps: 10, step: 3 }, { w: 21, sets: 3, reps: 12, step: 3 }, { w: 24, sets: 3, reps: 15, step: 3 },
    { w: 99, sets: 3, reps: 10, step: 4 }
  ];

  const KEY = 'gymbuddy.v1';
  const [view, setView] = useState('list');
  const [i, setI] = useState(0);
  const [log, setLog] = useState({});
  const [bumps, setBumps] = useState({});
  const [banner, setBanner] = useState(null);
  const [week, setWeek] = useState(4);
  const [accent, setAccent] = useState('#5AA9E6');
  const [showCues, setShowCues] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionDay, setSessionDay] = useState(null);

  const dayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setLog(s.log || {});
        setBumps(s.bumps || {});
        setWeek(s.week || 4);
        setSessionDay(s.sessionDay || null);
      }
    } catch (e) {}
  }, []);

  const save = (patch) => {
    const newLog = patch.log ?? log;
    const newBumps = patch.bumps ?? bumps;
    const newWeek = patch.week ?? week;
    const newSessionDay = patch.sessionDay ?? sessionDay;
    setLog(newLog);
    setBumps(newBumps);
    if (patch.week !== undefined) setWeek(newWeek);
    if (patch.sessionDay !== undefined) setSessionDay(newSessionDay);
    try {
      localStorage.setItem(KEY, JSON.stringify({ log: newLog, bumps: newBumps, week: newWeek, sessionDay: newSessionDay }));
    } catch (e) {}
    if (patch.banner !== undefined) setBanner(patch.banner);
    if (patch.view !== undefined) setView(patch.view);
    if (patch.i !== undefined) setI(patch.i);
  };

  const isSessionLocked = sessionDay && sessionDay !== dayKey;

  const weekVal = Math.max(1, Math.min(26, Math.round(week)));
  const block = BLOCKS.find(b => weekVal <= b.w) || BLOCKS[BLOCKS.length - 1];

  const weightFor = (ex) => {
    if (!ex.inc) return null;
    const steps = (block.step - 1) + (bumps[ex.id] || 0);
    return Math.round((ex.start + ex.inc * steps) * 10) / 10;
  };

  const targetReps = (ex) => {
    if (ex.hold) return weekVal <= 6 ? 20 : 30;
    if (ex.body) return weekVal <= 6 ? 10 : weekVal <= 15 ? 12 : 15;
    return block.reps;
  };

  const sessionSets = (ex) => {
    const day = log[dayKey] || {};
    if (day[ex.id]) return day[ex.id];
    const n = block.sets;
    const kg = weightFor(ex);
    const reps = targetReps(ex);
    return Array.from({ length: n }, () => ({ kg, reps, done: false }));
  };

  const writeSets = (ex, sets, extra) => {
    if (isSessionLocked) {
      alert('Session from previous day is locked. Start a new workout.');
      return;
    }
    if (!sessionDay) {
      save({ sessionDay: dayKey, ...(extra || {}) });
    }
    const newLog = { ...log };
    newLog[dayKey] = { ...(newLog[dayKey] || {}), [ex.id]: sets };
    save({ log: newLog, ...(extra || {}) });
  };

  const day = log[dayKey] || {};
  const complete = (ex) => {
    const s = day[ex.id];
    return !!s && s.every(x => x.done);
  };

  const rows = EX.map((ex, idx) => {
    const kg = weightFor(ex);
    const done = complete(ex);
    const s = day[ex.id];
    const partial = s ? s.filter(x => x.done).length : 0;
    return {
      id: ex.id, name: ex.name, img: ex.img, dim: done ? 0.35 : 0.9,
      sub: block.sets + ' × ' + targetReps(ex) + (ex.hold ? 's each side' : ex.body ? ' each leg' : ''),
      right: done ? '✓' : kg != null ? kg + ' kg' : partial ? partial + '/' + block.sets : '–',
      tint: done ? '#57C08A' : kg != null ? '#F2F4F7' : 'rgba(242,244,247,.35)',
      open: () => {
        if (isSessionLocked) {
          alert('Session from previous day is locked. Start a new workout.');
          return;
        }
        if (!sessionDay) save({ sessionDay: dayKey });
        save({ view: 'ex', i: idx, banner: null });
      }
    };
  });

  const doneCount = EX.filter(complete).length;
  const ex = EX[i];
  const sets = sessionSets(ex);
  const step = ex.inc || 1;

  const patch = (idx, k, d) => {
    const ns = sets.map((s, j) => j === idx ? { ...s, [k]: Math.max(0, Math.round((s[k] + d) * 10) / 10) } : s);
    writeSets(ex, ns);
  };

  const toggle = (idx) => {
    const ns = sets.map((s, j) => j === idx ? { ...s, done: !s.done } : s);
    let newBanner = banner;
    let newBumps = bumps;
    const allDone = ns.every(s => s.done);
    const earned = allDone && ex.inc && block.reps === 15 && ns.every(s => s.reps >= 15);
    const bumpKey = 'bump_' + ex.id;
    const alreadyBumped = !!(log[dayKey] || {})[bumpKey];
    if (earned && !alreadyBumped) {
      const from = weightFor(ex);
      newBumps = { ...newBumps, [ex.id]: (newBumps[ex.id] || 0) + 1 };
      newBanner = from + ' → ' + Math.round((from + ex.inc) * 10) / 10 + ' kg next session';
    }
    const newLog = { ...log };
    newLog[dayKey] = { ...(newLog[dayKey] || {}), [ex.id]: ns };
    if (earned) newLog[dayKey][bumpKey] = true;
    writeSets(ex, ns, { log: newLog, bumps: newBumps, banner: newBanner });
  };

  const tgt = targetReps(ex);
  const kg = weightFor(ex);
  const summary = EX.map(e => {
    const s = day[e.id];
    const d = s ? s.filter(x => x.done) : [];
    return {
      name: e.name,
      val: d.length ? (e.inc ? d[0].kg + ' kg × ' + d.map(x => x.reps).join('/') : d.map(x => x.reps).join('/')) : '—',
      tint: d.length ? '#F2F4F7' : 'rgba(242,244,247,.25)'
    };
  });

  const weekLabel = 'WEEK ' + weekVal;
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E11', color: '#F2F4F7', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontVariantNumeric: 'tabular-nums', display: 'flex', flexDirection: 'column', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>

          {view === 'list' && (
            <div style={{ padding: 'max(16px, env(safe-area-inset-top)) 16px 48px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.18em', color: 'rgba(242,244,247,.42)' }}>{weekLabel}</div>
                <div onClick={() => setShowSettings(!showSettings)} style={{ fontSize: '11px', letterSpacing: '.18em', color: 'rgba(242,244,247,.42)', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', background: showSettings ? 'rgba(90,169,230,.2)' : 'transparent' }}>⚙️</div>
              </div>

              {showSettings && (
                <div style={{ background: '#15181D', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(242,244,247,.6)', letterSpacing: '.04em' }}>WEEK SELECTOR</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => save({ week: Math.max(1, week - 1) })} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0C0E11', border: 'none', color: '#F2F4F7', cursor: 'pointer', fontSize: '16px' }}>−</button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '600' }}>Week {week}</div>
                    <button onClick={() => save({ week: Math.min(26, week + 1) })} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0C0E11', border: 'none', color: '#F2F4F7', cursor: 'pointer', fontSize: '16px' }}>+</button>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(242,244,247,.4)', textAlign: 'center' }}>Block {block.step} • {block.sets}×{block.reps}</div>
                  {isSessionLocked && (
                    <div style={{ fontSize: '11px', color: '#E8B44D', textAlign: 'center', marginTop: '8px', padding: '8px', background: 'rgba(232,180,77,.1)', borderRadius: '8px' }}>
                      🔒 Yesterday's session locked
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.18em', color: 'rgba(242,244,247,.42)' }}>{dateLabel}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: '18px' }}>
                <div style={{ fontSize: '62px', fontWeight: '700', letterSpacing: '-.04em', lineHeight: '.86' }}>{block.sets} × {block.reps}</div>
                <div style={{ fontSize: '12px', color: 'rgba(242,244,247,.42)', letterSpacing: '.06em', paddingBottom: '6px' }}>{doneCount}/{EX.length}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rows.map((r, idx) => (
                  <div key={idx} onClick={r.open} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '14px', background: '#15181D', cursor: 'pointer', transition: 'background 0.2s', opacity: isSessionLocked ? 0.5 : 1 }} onMouseEnter={(e) => !isSessionLocked && (e.currentTarget.style.background = '#1C2027')} onMouseLeave={(e) => !isSessionLocked && (e.currentTarget.style.background = '#15181D')}>
                    <div style={{ width: '58px', height: '44px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: '#0C0E11' }}>
                      {r.img && <img src={r.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: r.dim }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(242,244,247,.4)', letterSpacing: '.04em' }}>{r.sub}</div>
                    </div>
                    <div style={{ fontSize: '19px', fontWeight: '600', letterSpacing: '-.02em', color: r.tint }}>{r.right}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'ex' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: 'max(16px, env(safe-area-inset-top)) 16px 10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div onClick={() => save({ view: 'list', banner: null })} style={{ width: '34px', height: '34px', borderRadius: '17px', background: '#15181D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', color: 'rgba(242,244,247,.7)', cursor: 'pointer', flexShrink: 0 }}>‹</div>
                <div style={{ flex: 1, fontSize: '11px', letterSpacing: '.18em', color: 'rgba(242,244,247,.42)' }}>{i + 1} / {EX.length}</div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#15181D' }}>
                  {ex.img && <img src={ex.img} alt="" style={{ width: '100%', height: '186px', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-.025em', lineHeight: 1.1 }}>{ex.name}</div>
                  <div style={{ fontSize: '34px', fontWeight: '700', letterSpacing: '-.03em', lineHeight: 1, whiteSpace: 'nowrap' }}>{kg != null ? kg + ' kg' : block.sets + ' × ' + tgt + (ex.hold ? 's' : '')}</div>
                </div>
                {banner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(87,192,138,.12)', border: '1px solid rgba(87,192,138,.3)', animation: 'pop .25s ease' }}>
                    <div style={{ fontSize: '16px', color: '#57C08A' }}>✓</div>
                    <div style={{ fontSize: '14px', color: '#57C08A', fontWeight: '500', letterSpacing: '-.01em' }}>{banner}</div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {showCues && ex.cues.map((c, idx) => (
                    <div key={idx} style={{ fontSize: '11px', color: 'rgba(242,244,247,.5)', background: '#15181D', padding: '6px 10px', borderRadius: '8px', letterSpacing: '.01em' }}>{c}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sets.map((s, idx) => (
                    <div key={idx} style={{ borderRadius: '16px', background: s.done ? 'rgba(87,192,138,.09)' : '#15181D', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '22px', fontSize: '12px', color: 'rgba(242,244,247,.35)', letterSpacing: '.06em' }}>{idx + 1}</div>
                      <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0C0E11', borderRadius: '11px', padding: '0 4px', height: '46px' }}>
                          <div onClick={() => s.kg != null && patch(idx, 'kg', -step)} style={{ width: '38px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', color: 'rgba(242,244,247,.45)', cursor: 'pointer' }}>−</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '-.02em' }}>{s.kg}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(242,244,247,.35)' }}>{ex.unit || 'kg'}</div>
                          </div>
                          <div onClick={() => s.kg != null && patch(idx, 'kg', step)} style={{ width: '38px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', color: 'rgba(242,244,247,.45)', cursor: 'pointer' }}>+</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0C0E11', borderRadius: '11px', padding: '0 4px', height: '46px' }}>
                          <div onClick={() => patch(idx, 'reps', -1)} style={{ width: '38px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', color: 'rgba(242,244,247,.45)', cursor: 'pointer' }}>−</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '-.02em' }}>{s.reps}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(242,244,247,.35)' }}>reps</div>
                          </div>
                          <div onClick={() => patch(idx, 'reps', 1)} style={{ width: '38px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', color: 'rgba(242,244,247,.45)', cursor: 'pointer' }}>+</div>
                        </div>
                      </div>
                      <div onClick={() => toggle(idx)} style={{ width: '46px', height: '46px', borderRadius: '23px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', cursor: 'pointer', background: s.done ? '#57C08A' : 'transparent', color: s.done ? '#0C0E11' : 'rgba(242,244,247,.3)', border: `1px solid ${s.done ? '#57C08A' : 'rgba(255,255,255,.12)'}` }}>✓</div>
                    </div>
                  ))}
                </div>
                <div onClick={() => {
                  if (i === EX.length - 1) {
                    save({ view: 'done', banner: null });
                  } else {
                    save({ i: i + 1, banner: null });
                  }
                }} style={{ marginTop: '2px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', letterSpacing: '-.01em', cursor: 'pointer', background: sets.every(s => s.done) ? accent : '#15181D', color: sets.every(s => s.done) ? '#0C0E11' : 'rgba(242,244,247,.6)' }}>{i === EX.length - 1 ? 'Finish' : 'Next'}</div>
              </div>
            </div>
          )}

          {view === 'done' && (
            <div style={{ padding: 'max(16px, env(safe-area-inset-top)) 16px 48px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.18em', color: 'rgba(242,244,247,.42)' }}>{weekLabel}</div>
                <div style={{ fontSize: '11px', letterSpacing: '.18em', color: 'rgba(242,244,247,.42)' }}>{dateLabel}</div>
              </div>
              <div style={{ fontSize: '62px', fontWeight: '700', letterSpacing: '-.04em', lineHeight: '.86' }}>{doneCount}/{EX.length}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '14px' }}>
                {summary.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(242,244,247,.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '12px' }}>{s.name}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '-.01em', color: s.tint, whiteSpace: 'nowrap' }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div onClick={() => {
                save({ view: 'list', banner: null, sessionDay: null });
                setShowSettings(false);
              }} style={{ marginTop: 'auto', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '500', background: '#15181D', color: 'rgba(242,244,247,.7)', cursor: 'pointer' }}>Back to List</div>
            </div>
          )}
        </div>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        html, body { margin: 0; padding: 0; background: #0C0E11; }
        a { color: #5AA9E6; text-decoration: none; }
        a:hover { color: #8CC6F0; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
