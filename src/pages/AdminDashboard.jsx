// AdminDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc,
  onSnapshot,
  Timestamp,
  getDocs,         // added
  runTransaction   // added
  // removed arrayRemove
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import Footer from '../components/Footer';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewingUsers, setViewingUsers] = useState(null);
  const [usersInQueue, setUsersInQueue] = useState([]);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [now, setNow] = useState(Date.now());
  const endingRef = useRef(new Set());
  const [loggingOut, setLoggingOut] = useState(false); // NEW
  const [actionFor, setActionFor] = useState(null); // which queue shows the action menu

  // Prevent duplicate auto-advance transactions per queue
  const autoAdvancingRef = useRef(new Set()); // NEW

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) el.blur();
    }
  }, []);

  // Live updates for admin's queues
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'queues'), where('createdBy', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ ...d.data(), docId: d.id }));
      setQueues(data);
    });
    return () => unsub();
  }, [user]);

  // Ticker for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-clear expired breaks (once)
  useEffect(() => {
    const clearIfExpired = async () => {
      for (const q of queues) {
        const ends = q.breakEndsAt?.toMillis ? q.breakEndsAt.toMillis() : Number(q.breakEndsAt);
        if (q.isOnBreak && q.breakEndsAt && ends <= Date.now()) {
          if (endingRef.current.has(q.docId)) continue;
          endingRef.current.add(q.docId);
          try {
            await updateDoc(doc(db, 'queues', q.docId), {
              isOnBreak: false,
              breakEndsAt: null
            });
          } catch {
            // ignore
          } finally {
            setTimeout(() => endingRef.current.delete(q.docId), 3000);
          }
        }
      }
    };
    if (queues.length) clearIfExpired();
  }, [queues]);

  // Auto-advance when the "Awaiting arrival" countdown hits zero
  useEffect(() => {
    if (!queues?.length) return;

    const tryAutoAdvance = async (q) => {
      const id = q.docId;
      if (autoAdvancingRef.current.has(id)) return;
      autoAdvancingRef.current.add(id);
      const queueRef = doc(db, 'queues', id);

      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(queueRef);
          if (!snap.exists()) return;
          const curr = snap.data();

          if (!curr.hasStarted || curr.isOnBreak) return;

          const ends = curr.nextLockUntil?.toMillis
            ? curr.nextLockUntil.toMillis()
            : Number(curr.nextLockUntil);

          // Only proceed if a lock existed and is now expired
          if (!ends || ends > Date.now()) return;

          const users = Array.isArray(curr.users) ? curr.users : [];
          const total = users.length;
          const currIdx = Math.max(0, curr.currentIndex ?? 0);

          // Nothing to serve; clear lock
          if (total === 0 || currIdx >= total) {
            tx.update(queueRef, { nextLockUntil: null });
            return;
          }

          // Update rolling average
          const nowMs = Date.now();
          const prevMs = curr.lastAdvanceAt?.toMillis ? curr.lastAdvanceAt.toMillis() : null;
          let avg = curr.avgServeMs ?? 180000;
          let samples = curr.samples ?? 0;

          if (prevMs && nowMs > prevMs) {
            const diff = nowMs - prevMs;
            if (diff > 0 && diff < 4 * 60 * 60 * 1000) {
              avg = Math.round(((avg * samples) + diff) / (samples + 1));
              samples += 1;
            }
          }

          // Skip current; move pointer forward and start a new 2-min window for the new person
          const nextIndex = Math.min(currIdx + 1, total);
          const hasNext = nextIndex < total;
          const lock = hasNext ? Timestamp.fromMillis(nowMs + 2 * 60 * 1000) : null;

          tx.update(queueRef, {
            currentIndex: nextIndex,
            nextLockUntil: lock,
            lastAdvanceAt: Timestamp.fromMillis(nowMs),
            avgServeMs: avg,
            samples
          });
        });
      } finally {
        setTimeout(() => autoAdvancingRef.current.delete(id), 300);
      }
    };

    for (const q of queues) {
      if (!q.hasStarted || q.isOnBreak) continue;
      if (!q.nextLockUntil) continue;

      const ends = q.nextLockUntil?.toMillis ? q.nextLockUntil.toMillis() : Number(q.nextLockUntil);
      if (ends && ends <= Date.now()) {
        tryAutoAdvance(q);
      }
    }
  }, [queues, now]);

  const handleCreateQueue = async () => {
    if (!queueName.trim() || !user) return;
    setCreating(true);
    try {
      // Ensure unique 4-digit queue id (Q1000–Q9999), retry up to 10 times
      let candidate = '';
      for (let i = 0; i < 10; i++) {
        candidate = 'Q' + Math.floor(Math.random() * 9000 + 1000);
        const snap = await getDocs(query(collection(db, 'queues'), where('id', '==', candidate)));
        if (snap.empty) break;
        candidate = '';
      }
      if (!candidate) {
        alert('Could not generate a unique Queue ID. Please try again.');
        return;
      }

      const newQueue = {
        name: queueName.trim(),
        id: candidate,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        users: [],
        currentIndex: 0,
        hasStarted: false,
        isOnBreak: false,
        breakEndsAt: null,
        nextLockUntil: null,
      };
      await addDoc(collection(db, 'queues'), newQueue);
      setQueueName('');
    } catch (e) {
      alert('Failed to create queue. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEndQueue = async (docId) => {
    const confirmed = window.confirm('End this queue? This cannot be undone.');
    if (confirmed) {
      await deleteDoc(doc(db, 'queues', docId));
    }
  };

  const handleViewUsers = async (queue) => {
    const idx = queue.currentIndex ?? 0;
    const userData = await Promise.all(
      (queue.users || []).map(async (uid) => {
        const docSnap = await getDoc(doc(db, 'users', uid));
        return docSnap.exists() ? docSnap.data().name || 'Unknown' : 'Unknown';
      })
    );
    // Mark users before currentIndex as dismissed
    setUsersInQueue(userData.map((name, i) => ({ name, dismissed: i < idx })));
    setViewingUsers(queue.name);
  };

  // Break controls
  const handleStartBreak = async (queue, minutes) => {
    if (isNextLocked(queue)) return; // disabled during no-show lock
    const endsAt = Timestamp.fromMillis(Date.now() + minutes * 60 * 1000);
    await updateDoc(doc(db, 'queues', queue.docId), {
      isOnBreak: true,
      breakEndsAt: endsAt
    });
    setActionFor(null);
  };

  const handleEndBreak = async (queue) => {
    await updateDoc(doc(db, 'queues', queue.docId), {
      isOnBreak: false,
      breakEndsAt: null
    });
  };

  const handleExtendBreak = async (queue, minutes) => {
    if (!queue.breakEndsAt) return;
    const base = queue.breakEndsAt?.toMillis ? queue.breakEndsAt.toMillis() : Number(queue.breakEndsAt);
    const extended = Timestamp.fromMillis(base + minutes * 60 * 1000);
    await updateDoc(doc(db, 'queues', queue.docId), {
      breakEndsAt: extended
    });
  };

  // Allow proceeding immediately if the person arrives before countdown ends
  const handleProceedNow = async (queue) => {
    try {
      await updateDoc(doc(db, 'queues', queue.docId), { nextLockUntil: null });
    } catch (e) {
      alert('Failed to proceed. Please try again.');
    }
  };

  const timeRemaining = (queue) => {
    if (!queue.breakEndsAt) return 0;
    const ends = queue.breakEndsAt?.toMillis ? queue.breakEndsAt.toMillis() : Number(queue.breakEndsAt);
    return Math.max(0, ends - now);
  };

  const lockRemaining = (queue) => { // NEW: remaining ms for no-show lock
    if (!queue.nextLockUntil) return 0;
    const ends = queue.nextLockUntil.toMillis ? queue.nextLockUntil.toMillis() : Number(queue.nextLockUntil);
    return Math.max(0, ends - now);
  };

  const isNextLocked = (queue) => lockRemaining(queue) > 0; // NEW

  const fmt = (ms) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleLogout = async () => { // NEW
    try {
      setLoggingOut(true);
      await logout();
      // Usually navigates away via auth guard
    } catch (e) {
      setLoggingOut(false);
      alert('Logout failed. Please try again.');
    }
  };

  const handleStartQueue = async (queue) => {
    const initAvg = queue.avgServeMs ?? 180000; // default 3 min per person
    const initSamples = queue.samples ?? 0;
    await updateDoc(doc(db, 'queues', queue.docId), {
      hasStarted: true,
      lastAdvanceAt: Timestamp.now(),
      avgServeMs: initAvg,
      samples: initSamples,
    });
  };

  // Move to next: pointer-only, update rolling average and timing
  const handleMoveNext = async (queue) => {
    if (queue.isOnBreak || isNextLocked(queue)) return;

    const queueRef = doc(db, 'queues', queue.docId);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(queueRef);
        if (!snap.exists()) throw new Error('Queue not found');
        const q = snap.data();

        if (!q.hasStarted) throw new Error('Queue not started');
        if (q.isOnBreak) throw new Error('Queue on break');

        const lockUntil = q.nextLockUntil?.toMillis ? q.nextLockUntil.toMillis() : Number(q.nextLockUntil);
        if (lockUntil && lockUntil > Date.now()) throw new Error('Awaiting arrival (locked)');

        const users = Array.isArray(q.users) ? q.users : [];
        const total = users.length;
        const currIdx = Math.max(0, q.currentIndex ?? 0);

        if (total === 0 || currIdx >= total) throw new Error('No more users in the queue');

        // Update rolling average
        const nowMs = Date.now();
        const prevMs = q.lastAdvanceAt?.toMillis ? q.lastAdvanceAt.toMillis() : null;
        let avg = q.avgServeMs ?? 180000;
        let samples = q.samples ?? 0;

        if (prevMs && nowMs > prevMs) {
          const diff = nowMs - prevMs;
          if (diff > 0 && diff < 4 * 60 * 60 * 1000) {
            avg = Math.round(((avg * samples) + diff) / (samples + 1));
            samples += 1;
          }
        }

        // Advance pointer; clamp if someone left concurrently
        const nextIndex = Math.min(currIdx + 1, total);
        const hasNext = nextIndex < total;
        const lock = hasNext ? Timestamp.fromMillis(nowMs + 2 * 60 * 1000) : null;

        tx.update(queueRef, {
          currentIndex: nextIndex,
          nextLockUntil: lock,
          lastAdvanceAt: Timestamp.fromMillis(nowMs),
          avgServeMs: avg,
          samples
        });
      });
    } catch (e) {
      alert(e.message || 'Failed to move to next.');
      return;
    }
    setActionFor(null);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header reveal fade-in-down slow">
        <div className="brand" role="button">
          <img src="/queuetrackr-logo.png" alt="QueueTrackr" className="brand-logo" />
          <span className="brand-name">QueueTrackr Admin</span>
        </div>
        <div className="spacer" />
        <div className="admin-meta">
          <span className="admin-user">Hi, {user?.name || 'Admin'}</span>
          <span className="admin-role">{user?.role || 'Admin'}</span>
        </div>
        <button
          className="btn btn-text"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-busy={loggingOut ? 'true' : 'false'}
        >
          {loggingOut ? <span className="btn-spinner" aria-hidden="true" /> : null}
          {loggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </header>

      <main className="admin-main">
        <section className="panel panel-create reveal fade-in-up slow" style={{ animationDelay: '160ms' }}>
          <div className="panel-head">
            <h3>Create a Queue</h3>
          </div>
          <div className="panel-body">
            <div className="row">
              <input
                className="input"
                type="text"
                placeholder="Enter queue name"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
                aria-label="Queue name"
              />
              <button
                className="btn btn-primary"
                onClick={handleCreateQueue}
                disabled={!queueName.trim() || creating}
              >
                {creating ? 'Creating…' : 'Create Queue'}
              </button>
            </div>
          </div>
        </section>

        <section className="panel panel-queues reveal fade-in-up slow" style={{ animationDelay: '220ms' }}>
          <div className="panel-head">
            <h3>Active Queues</h3>
          </div>

          {queues.length === 0 ? (
            <p className="empty">No active queues yet.</p>
          ) : (
            <ul className="queue-grid">
              {queues.map((q) => {
                const hasStarted = Boolean(q.hasStarted);
                const onBreak = Boolean(q.isOnBreak);
                const remaining = onBreak ? timeRemaining(q) : 0;
                const locked = isNextLocked(q);
                const lockLeft = locked ? lockRemaining(q) : 0;

                const total = q.users?.length || 0;
                const currIdx = q.currentIndex ?? 0;
                const activeCount = Math.max(0, total - (hasStarted ? currIdx : 0)); // NEW

                const canServe =
                  hasStarted &&
                  !onBreak &&
                  !locked &&
                  total > 0 &&
                  currIdx < total;

                return (
                  <li key={q.docId} className="queue-card">
                    <div className="queue-card-head">
                      <h4 className="queue-name">{q.name}</h4>
                      <div className="badges">
                        {!hasStarted ? (
                          <span className="badge badge-pending">Not Started</span>
                        ) : onBreak ? (
                          <span className="badge badge-warn">On Break • {fmt(remaining)}</span>
                        ) : locked ? (
                          <span className="badge badge-info">Awaiting arrival • {fmt(lockLeft)}</span>
                        ) : (
                          <span className="badge">Active</span>
                        )}
                      </div>
                    </div>

                    <div className="queue-meta">
                      <div className="meta">
                        <span className="label">Queue ID</span>
                        <span className="value">
                          {q.id}{' '}
                          <button
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(q.id);
                              alert('Queue ID copied.');
                            }}
                            aria-label="Copy queue ID"
                          >
                            COPY
                          </button>
                        </span>
                      </div>

                      <div className="meta">
                        <span className="label">People in queue</span>
                        <span className="value">{activeCount}</span>
                      </div>

                      <div className="meta">
                        <span className="label">Currently serving</span>
                        <span className="value">
                          {!hasStarted
                            ? 'Not started yet'
                            : total > 0 && currIdx < total
                            ? `#${currIdx + 1}`
                            : 'None'}
                        </span>
                      </div>

                      <div className="meta">
                        <span className="label">Queue Speed</span>
                        <span className="value">
                          {q.samples > 0 && q.avgServeMs
                            ? `${fmt(q.avgServeMs)} / person`
                            : 'Learning…'}
                        </span>
                      </div>
                    </div>
                    <div className="divider" />

                    <div className="queue-actions">
                      <div className="left-actions">
                        {!hasStarted ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStartQueue(q)}
                            disabled={onBreak}
                            title={onBreak ? 'End break first' : 'Start this queue'}
                          >
                            Start Queue
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleViewUsers(q)}
                            >
                              View Users
                            </button>

                            <button
                              className="btn btn-danger"
                              onClick={() => handleEndQueue(q.docId)}
                            >
                              End Queue
                            </button>

                            <button
                              className="btn btn-primary"
                              onClick={() => setActionFor(actionFor === q.docId ? null : q.docId)}
                              disabled={!canServe}
                              title={
                                onBreak
                                  ? 'Unavailable during break'
                                  : locked
                                  ? 'Waiting for current person'
                                  : !hasStarted
                                  ? 'Start queue to serve'
                                  : canServe
                                  ? 'Choose to take break or move next'
                                  : 'No one to serve'
                              }
                            >
                              Dismiss Current
                            </button>
                          </>
                        )}
                      </div>

                      <div className="right-actions">
                        {/* Break controls disabled while locked */}
                        {!onBreak ? (
                          <div className={`break-controls ${locked ? 'controls-disabled' : ''}`}>
                            <label className="label">Break</label>
                            <select
                              className="input compact"
                              value={breakMinutes}
                              onChange={(e) => setBreakMinutes(Number(e.target.value))}
                              disabled={locked}
                            >
                              <option value={5}>5 min</option>
                              <option value={10}>10 min</option>
                              <option value={15}>15 min</option>
                              <option value={20}>20 min</option>
                              <option value={30}>30 min</option>
                            </select>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleStartBreak(q, breakMinutes)}
                              disabled={locked || !hasStarted}
                              title={!hasStarted ? 'Start queue first' : locked ? 'Awaiting arrival' : 'Start break'}
                            >
                              Start Break
                            </button>
                          </div>
                        ) : (
                          <div className="break-controls">
                            <label className="label">Break ends in</label>
                            <span className="timer">{fmt(remaining)}</span>
                            <select
                              className="input compact"
                              defaultValue={5}
                              onChange={(e) => handleExtendBreak(q, Number(e.target.value))}
                              aria-label="Extend break by"
                            >
                              <option value={5}>+5</option>
                              <option value={10}>+10</option>
                              <option value={15}>+15</option>
                            </select>
                            <button
                              className="btn btn-warn"
                              onClick={() => handleEndBreak(q)}
                            >
                              End Break Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action menu shown when clicking Dismiss Current */}
                    {actionFor === q.docId && (
                      <div className="serve-action-menu">
                        <div className="menu-inner">
                          <p className="menu-title">Choose an action</p>
                          <div className="menu-actions">
                            <button
                              className="btn btn-outline"
                              onClick={() => handleStartBreak(q, breakMinutes)}
                            >
                              Take Break ({breakMinutes}m)
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleMoveNext(q)}
                            >
                              Move to Next Person
                            </button>
                            <button
                              className="btn btn-text"
                              onClick={() => setActionFor(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show no-show countdown hint (when locked) */}
                    {locked && hasStarted && !onBreak && (
                      <div className="no-show-hint" role="status" aria-live="polite">
                        <div className="hint-text">
                          <strong>Awaiting arrival of current person</strong> • {fmt(lockLeft)}
                          <span className="hint-note">
                            If the queue member arrives before the countdown ends, click “Proceed now” to continue.
                          </span>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleProceedNow(q)}
                          title="Clear countdown and continue now"
                        >
                          Proceed now
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {viewingUsers && (
          <section className="panel panel-users reveal fade-in-up slow" style={{ animationDelay: '260ms' }}>
            <div className="panel-head">
              <h3>Users in “{viewingUsers}”</h3>
            </div>
            <ul className="users-list">
              {usersInQueue.map((u, index) => (
                <li key={index}>
                  <span className="index">#{index + 1}</span>
                  <span className={`name ${u.dismissed ? 'dismissed' : ''}`}>
                    {u.name} {u.dismissed ? <span className="dismissed-tag">(dismissed)</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            <div className="panel-foot">
              <button
                className="btn btn-text"
                onClick={() => {
                  setViewingUsers(null);
                  setUsersInQueue([]);
                }}
              >
                Close
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}