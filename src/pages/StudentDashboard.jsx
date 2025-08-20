import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';

import {
  collection,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './StudentDashboard.css';
import Footer from '../components/Footer';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  const [allQueues, setAllQueues] = useState([]);
  const [joinedQueues, setJoinedQueues] = useState([]);

  const [selectedDocId, setSelectedDocId] = useState('');
  const [queueID, setQueueID] = useState('');
  const [joining, setJoining] = useState(false);
  const [leavingId, setLeavingId] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const [now, setNow] = useState(Date.now());
  const [confirmLeave, setConfirmLeave] = useState(null); // { docId, name } when open

  const [completedBanner, setCompletedBanner] = useState(null); // { name }
  const completedOnceRef = useRef(new Set()); // docIds we've handled



  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) el.blur();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, 'queues'), async (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ ...d.data(), docId: d.id }));

      setAllQueues(docs);

      const mine = docs.filter((q) => (q.users || []).includes(user.uid));
      const mineWithNames = await Promise.all(
        mine.map(async (q) => {
          const userNames = await Promise.all(
            (q.users || []).map(async (uid) => {
              const uDoc = await getDoc(doc(db, 'users', uid));
              return uDoc.exists() ? uDoc.data().name || 'Unknown' : 'Unknown';
            })
          );
          return { ...q, userNames };
        })
      );

      setJoinedQueues(mineWithNames);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const availableQueues = allQueues.filter((q) => !(q.users || []).includes(user?.uid));

  const handleJoinSelected = async () => {
    if (!selectedDocId || !user) return;
    setJoining(true);
    try {
      await updateDoc(doc(db, 'queues', selectedDocId), {
        users: arrayUnion(user.uid),
      });
      setSelectedDocId('');
      alert('Joined queue.');
    } catch (e) {
      alert('Failed to join. Try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinById = async () => {
    if (!queueID.trim() || !user) return;
    const match = allQueues.find((q) => q.id === queueID.trim());
    if (!match) {
      alert('Queue not found.');
      return;
    }
    setJoining(true);
    try {
      await updateDoc(doc(db, 'queues', match.docId), {
        users: arrayUnion(user.uid),
      });
      setQueueID('');
      alert('Joined queue.');
    } catch (e) {
      alert('Failed to join. Try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveQueue = async (docId) => {
    if (!user) return;
    setLeavingId(docId);
    try {
      await updateDoc(doc(db, 'queues', docId), {
        users: arrayRemove(user.uid),
      });
    } catch (e) {
      alert('Failed to leave. Try again.');
    } finally {
      setLeavingId('');
    }
  };

  // Confirm-leave helpers
 const openConfirmLeave = (queue) => setConfirmLeave({ docId: queue.docId, name: queue.name });
 const handleConfirmLeave = async () => {
  if (!confirmLeave) return;
  await handleLeaveQueue(confirmLeave.docId);
  setConfirmLeave(null);
 };
 const handleCancelLeave = () => setConfirmLeave(null);


  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch {
      setLoggingOut(false);
      alert('Logout failed. Please try again.');
    }
  };

  const timeRemaining = (queue) => {
    if (!queue.breakEndsAt) return 0;
    const ends = typeof queue.breakEndsAt.toMillis === 'function'
      ? queue.breakEndsAt.toMillis()
      : Number(queue.breakEndsAt);
    return Math.max(0, ends - now);
  };

  const fmt = (ms) => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(m)}:${pad(s)}`;
  };


// Local formatter
const fmtMs = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

useEffect(() => {
  if (!user || joinedQueues.length === 0) return;

  let cancelled = false;
  (async () => {
    for (const q of joinedQueues) {
      const yourIndex = (q.users || []).indexOf(user.uid);
      const currIdx = q.currentIndex ?? 0;

      if (
        yourIndex >= 0 &&
        currIdx > yourIndex && // admin moved past you
        !completedOnceRef.current.has(q.docId)
      ) {
        completedOnceRef.current.add(q.docId);

        // Show banner
        if (!cancelled) setCompletedBanner({ name: q.name });

        // Auto-remove from queue (safe if already removed)
        try {
          await updateDoc(doc(db, 'queues', q.docId), {
            users: arrayRemove(user.uid),
          });
        } catch {
          // ignore; user might already be removed
        }
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [joinedQueues, user]);

// Auto-dismiss banner after 6s
useEffect(() => {
  if (!completedBanner) return;
  const t = setTimeout(() => setCompletedBanner(null), 6000);
  return () => clearTimeout(t);
}, [completedBanner]);


  return (
    <div className="student-dashboard">
      <header className="sd-header reveal fade-in-down slow">
        <div className="brand" role="button">
          <img src="/queuetrackr-logo.png" alt="QueueTrackr" className="brand-logo" />
          <span className="brand-name">QueueTrackr Student</span>
        </div>
        <div className="spacer" />
        <div className="sd-meta">
          <span className="sd-user">Hi, {user?.name || 'Student'}</span>
          <span className="sd-role">{user?.role || 'Student'}</span>
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

      {completedBanner && (
        <div className="toast toast-success" role="status" aria-live="polite">
          <span>All done with {completedBanner.name}! You’ve been removed from the queue.</span>
          <button className="btn btn-text" onClick={() => setCompletedBanner(null)}>Dismiss</button>
        </div>
      )}

      <main className="sd-main">
        <section className="panel panel-join reveal fade-in-up slow" style={{ animationDelay: '120ms' }}>
          <div className="panel-head">
            <h3>Join a Queue</h3>
          </div>
          <div className="panel-body">
            <div className="join-grid">
              <div className="join-block">
              <label className="label">Pick from available queues</label>
                <div className="row">
                  <select
                    className="input"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                  >
                    <option value="">Select a queue…</option>
                    {availableQueues.map((q) => {
                      const hasStarted = Boolean(q.hasStarted);
                      const total = q.users?.length || 0;
                      const currIdx = q.currentIndex ?? 0;
                      const activeCount = Math.max(0, total - (hasStarted ? currIdx : 0));
                      const status = !hasStarted ? 'Not Started' : q.isOnBreak ? 'On Break' : 'Active';
                      return (
                        <option key={q.docId} value={q.docId}>
                          {q.name} — {q.id} • {activeCount} in queue • {status}
                        </option>
                      );
                    })}
                  </select>
                  <button className="btn btn-primary" onClick={handleJoinSelected} disabled={!selectedDocId || joining}>
                    {joining ? 'Joining…' : 'Join'}
                  </button>
                </div>
              </div>

              <div className="join-block">
                <label className="label">Or paste a Queue ID</label>
                <div className="row">
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Q4821"
                    value={queueID}
                    onChange={(e) => setQueueID(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={handleJoinById} disabled={!queueID || joining}>
                    {joining ? 'Joining…' : 'Join by ID'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel panel-myqueues reveal fade-in-up slow" style={{ animationDelay: '220ms' }}>
          <div className="panel-head">
            <h3>My Queues</h3>
          </div>

          {joinedQueues.length === 0 ? (
            <p className="empty">You have not joined any queues yet.</p>
          ) : (
            <ul className="queue-grid">
           {joinedQueues.map((queue) => {
  const yourIndex = (queue.users || []).indexOf(user.uid);
  const servingIdx = queue.currentIndex ?? 0;

  const hasStarted = Boolean(queue.hasStarted);
  const onBreak = Boolean(queue.isOnBreak);
  const remaining = onBreak ? timeRemaining(queue) : 0;

  const servingLabel = !hasStarted
    ? 'Not started yet'
    : servingIdx < (queue.userNames?.length || 0)
    ? `#${servingIdx + 1}. ${queue.userNames[servingIdx]}`
    : 'None';

  const positionsAhead = yourIndex >= 0 ? Math.max(0, yourIndex - servingIdx) : null;

  // Clamp avg to [5s, 60m] to avoid outliers
  const speedMsRaw = queue.avgServeMs ?? 180000;
  const speedMs = Math.min(60 * 60 * 1000, Math.max(5000, speedMsRaw));

  const etaMs = positionsAhead != null ? positionsAhead * speedMs : null;
  const etaWithBreakMs = !hasStarted ? null : onBreak ? (etaMs != null ? etaMs + remaining : null) : etaMs;

  // ...existing JSX...

    return (
      <li key={queue.docId} className="queue-card">
        <div className="queue-card-head">
          <h4 className="queue-name">{queue.name}</h4>
          <div className="badges">
            {!hasStarted ? (
              <span className="badge badge-pending">Not Started</span>
            ) : onBreak ? (
              <span className="badge badge-warn">On Break • {fmt(remaining)}</span>
            ) : (
              <span className="badge">Active</span>
            )}
          </div>
        </div>
  
        <div className="queue-meta">
          <div className="meta">
            <span className="label">Queue ID</span>
            <span className="value">{queue.id}</span>
          </div>
          <div className="meta">
            <span className="label">Your Position</span>
            <span className="value">#{yourIndex + 1}</span>
          </div>
          <div className="meta">
            <span className="label">Currently Serving</span>
            <span className="value">{servingLabel}</span>
          </div>
          <div className="meta">
            <span className="label">Queue Speed</span>
            <span className="value">
              {queue.samples > 0 && queue.avgServeMs
                ? `${fmtMs(speedMs)} / person`
                : 'Learning…'}
            </span>
          </div>
          <div className="meta">
  <span className="label">Your ETA</span>
  <span className="value">
    {!hasStarted
      ? '—'
      : positionsAhead === 0
      ? 'Now'
      : etaWithBreakMs != null
      ? fmtMs(etaWithBreakMs)
      : '—'}
  </span>
</div>
        </div>
                    <div className="divider" />

                    <div className="user-list">
                      <h5>All Users in Queue</h5>
                      <ul>
                        {(queue.userNames || []).map((name, index) => (
                          <li key={index} className={queue.users[index] === user.uid ? 'you' : ''}>
                            #{index + 1}. {name}
                            {queue.users[index] === user.uid ? ' (You)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="actions">
                      <button
                        className="btn btn-danger"
                        onClick={() => openConfirmLeave(queue)}
                        disabled={leavingId === queue.docId}
                      >
                        {leavingId === queue.docId ? 'Leaving…' : 'Leave Queue'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <Footer />

     {confirmLeave && (
       <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="leave-title">
         <div className="modal">
           <h4 id="leave-title" className="modal-title">Leave this queue?</h4>
           <div className="modal-body">
             <p>
               You’re about to leave <strong>{confirmLeave.name}</strong>.
             </p>
             <p className="warn">
               Warning: If you join again, you will lose your current position and rejoin at the end.
             </p>
           </div>
           <div className="modal-actions">
             <button className="btn btn-text" onClick={handleCancelLeave}>Cancel</button>
             <button
              className="btn btn-danger"
               onClick={handleConfirmLeave}
               disabled={leavingId === confirmLeave.docId}
             >
               {leavingId === confirmLeave.docId ? 'Leaving…' : 'Yes, leave queue'}
             </button>
          </div>
         </div>
       </div>
     )}
    </div>
  );
}