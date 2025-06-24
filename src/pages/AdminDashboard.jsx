// AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewingUsers, setViewingUsers] = useState(null);
  const [usersInQueue, setUsersInQueue] = useState([]);

  const fetchQueues = async () => {
    const q = query(collection(db, 'queues'), where('createdBy', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
    setQueues(data);
  };

  useEffect(() => {
    if (user) fetchQueues();
  }, [user]);

  const handleCreateQueue = async () => {
    if (!queueName) return;
    setCreating(true);

    const newQueue = {
      name: queueName,
      id: 'Q' + Math.floor(Math.random() * 9000 + 1000),
      createdBy: user.uid,
      createdAt: new Date(),
      users: [],
      currentIndex: 0
    };

    await addDoc(collection(db, 'queues'), newQueue);
    setQueueName('');
    setCreating(false);
    fetchQueues();
  };

  const handleEndQueue = async (docId) => {
    const confirmed = window.confirm('Are you sure you want to end this queue?');
    if (confirmed) {
      await deleteDoc(doc(db, 'queues', docId));
      fetchQueues();
    }
  };

  const handleDismissCurrent = async (queue) => {
    const nextIndex = queue.currentIndex + 1;
    if (nextIndex >= queue.users.length) {
      alert('No more users in the queue.');
      return;
    }

    const queueRef = doc(db, 'queues', queue.docId);
    await updateDoc(queueRef, { currentIndex: nextIndex });
    fetchQueues();
  };

  const handleViewUsers = async (queue) => {
    const userData = await Promise.all(
      queue.users.map(async (uid) => {
        const docSnap = await getDoc(doc(db, 'users', uid));
        return docSnap.exists() ? docSnap.data().name || 'Unknown' : 'Unknown';
      })
    );

    setUsersInQueue(userData);
    setViewingUsers(queue.name);
  };

  return (
    <div className="admin-dashboard">
      <div className="content">
        <header>
          <h2>Welcome, {user?.name}</h2>
          <p>Role: {user?.role}</p>
          <button onClick={logout} className="logout-btn">Logout</button>
        </header>

        <section className="queue-create">
          <h3>Create New Queue</h3>
          <input
            type="text"
            placeholder="Queue Name"
            value={queueName}
            onChange={(e) => setQueueName(e.target.value)}
          />
          <button onClick={handleCreateQueue} disabled={creating}>
            {creating ? 'Creating...' : 'Create Queue'}
          </button>
        </section>

        <section className="queue-list">
          <h3>Active Queues</h3>
          {queues.length === 0 ? (
            <p>No active queues</p>
          ) : (
            <ul>
              {queues.map(queue => (
                <li key={queue.id}>
                  <h4>{queue.name}</h4>
                  <p>
  ID: {queue.id}{' '}
  <button
    className="copy-btn"
    onClick={() => {
      navigator.clipboard.writeText(queue.id);
      alert('Queue ID copied to clipboard!');
    }}
  >
    📋 Copy
  </button>
</p>

                  <p>People in queue: {queue.users.length}</p>

                  <p>
                    Currently Serving:{' '}
                    <strong>
                      {queue.users.length > 0 && queue.currentIndex < queue.users.length
                        ? `#${queue.currentIndex + 1}`
                        : 'None'}
                    </strong>
                  </p>

                  {queue.users.length > 0 && queue.currentIndex < queue.users.length && (
                    <button
                      className="dismiss-btn"
                      onClick={() => handleDismissCurrent(queue)}
                    >
                      Dismiss Current
                    </button>
                  )}

                  <div className="actions">
                    <button onClick={() => handleViewUsers(queue)}>View Users</button>
                    <button onClick={() => handleEndQueue(queue.docId)}>End Queue</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {viewingUsers && (
          <section className="queue-users">
            <h3>Users in "{viewingUsers}"</h3>
            <ul>
              {usersInQueue.map((name, index) => (
                <li key={index}>{index + 1}. {name}</li>
              ))}
            </ul>
            <button onClick={() => {
              setViewingUsers(null);
              setUsersInQueue([]);
            }}>
              Close
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
