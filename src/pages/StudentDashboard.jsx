import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [queueID, setQueueID] = useState('');
  const [joinedQueues, setJoinedQueues] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'queues'), async (snapshot) => {
      const filtered = await Promise.all(
        snapshot.docs
          .filter((doc) => doc.data().users?.includes(user.uid))
          .map(async (docSnap) => {
            const data = docSnap.data();
            const userNames = await Promise.all(
              data.users.map(async (uid) => {
                const userDoc = await getDoc(doc(db, 'users', uid));
                return userDoc.exists() ? userDoc.data().name || 'Unknown' : 'Unknown';
              })
            );

            return {
              ...data,
              docId: docSnap.id,
              userNames,
            };
          })
      );

      setJoinedQueues(filtered);
    });

    return () => unsubscribe();
  }, [user]);

  const handleJoinQueue = async () => {
    if (!queueID) return;
  
    const qSnapshot = await getDocs(collection(db, 'queues'));
    const match = qSnapshot.docs.find(doc => doc.data().id === queueID);
  
    if (!match) {
      alert('Queue not found.');
      return;
    }
  
    const queueData = match.data();
    const docId = match.id;
  
    if (!queueData.users.includes(user.uid)) {
      await updateDoc(doc(db, 'queues', docId), {
        users: arrayUnion(user.uid),
      });
      alert('You have successfully joined the queue!');
    } else {
      alert('You already joined this queue.');
    }
  
    setQueueID('');
  };  

  const handleLeaveQueue = async (docId) => {
    await updateDoc(doc(db, 'queues', docId), {
      users: arrayRemove(user.uid),
    });
  };
<img src="/queuetrackr-logo.png" alt="QueueTrackr Logo" style={{ height: '200px' }} />

  return (
    
    <div className="student-dashboard">
      <header>
        <h2>Welcome, {user?.name}</h2>
        <p>Role: {user?.role}</p>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      <section className="join-queue">
        <h3>Join a Queue</h3>
        <input
          type="text"
          placeholder="Enter Queue Document ID"
          value={queueID}
          onChange={(e) => setQueueID(e.target.value)}
        />
        <button onClick={handleJoinQueue}>Join Queue</button>
      </section>

      <section className="my-queues">
        <h3>My Queues</h3>
        {joinedQueues.length === 0 ? (
          <p>You have not joined any queues yet.</p>
        ) : (
          joinedQueues.map((queue) => {
            const yourIndex = queue.users.indexOf(user.uid);
            const currentlyServingIndex = queue.currentIndex;
            const currentlyServing =
              currentlyServingIndex < queue.userNames.length
                ? `#${currentlyServingIndex + 1}. ${queue.userNames[currentlyServingIndex]}`
                : 'None';

            return (
              <div className="queue-card" key={queue.docId}>
                <h4>{queue.name}</h4>
                <p>Queue ID: {queue.id}</p>
                <p><strong>Your Position:</strong> #{yourIndex + 1}</p>
                <p><strong>Currently Serving:</strong> {currentlyServing}</p>

                <div className="user-list">
                  <h5>All Users in Queue:</h5>
                  <ul>
                    {queue.userNames.map((name, index) => (
                      <li
                        key={index}
                        className={queue.users[index] === user.uid ? 'you' : ''}
                      >
                        #{index + 1}. {name}
                        {queue.users[index] === user.uid ? ' (You)' : ''}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="leave-btn"
                  onClick={() => handleLeaveQueue(queue.docId)}
                >
                  Leave Queue
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
