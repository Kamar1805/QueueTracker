import './Loader.css';
import spinner from '../assets/spinner.png'; // adjust the path if needed

export default function Loader() {
  return (
    <div className="loader-overlay">
      <img src={spinner} alt="Loading..." className="spinner" />

    </div>
  );
}
