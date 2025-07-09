import { useNavigate } from 'react-router-dom';
import './Welcome.css';


export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-wrapper">
      <div className="overlay">
        <img src="/queuetrackr-logo.png" alt="QueueTrackr Logo" style={{ height: '200px' }} />
        <h1>Welcome to QueueTrackr</h1>
        <p className="tagline">Smart, Real-time Queue Management</p>
        <p className="description">
          QueueTrackr helps universities eliminate physical waiting lines. Students can join queues using unique codes, and admins can manage everything in real-time — fast, digital, and stress-free.
        </p>
        
        {/* How to Use Section */}
        <div className="how-to-use">
          <h2>How to Use</h2>
          <div className="how-to-use-content">
            <div className="user-guide">
              <h3>For Queue Members (Students)</h3>
              <ul>
                <li>1. Receive a unique queue code from your admin.</li>
                <li>2. Join the queue using the code on your mobile or web app.</li>
                <li>3. Monitor your position and wait for your turn!</li>
              </ul>
            </div>
            <div className="admin-guide">
              <h3>For Queue Admins</h3>
              <ul>
                <li>1. Create and manage multiple queues for different services.</li>
                <li>2. Assign unique queue codes for students to join.</li>
                <li>3. Monitor the status of each queue in real-time and manage users effectively.</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Login & Sign Up Buttons */}
        <div className="button-group">
          <button onClick={() => navigate('/signup')}>Sign Up</button>
          <button onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
      
    </div>
    
  );
}
