import React, { useState } from 'react';
import './App.css';

function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelTime, setTravelTime] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('/api/travel-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: [origin, destination] }),
      });
  
      const data = await response.json();
      console.log(data)
  
      if (response.ok) {
        const totalTime = data.shortestPath.reduce((total, item) => total + item.distance, 0);
        setTravelTime(totalTime);
      } else {
        setTravelTime('');
        alert('Error fetching travel time: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching travel time:', error);
      setTravelTime('');
      alert('Error fetching travel time');
    }
  };
  

  return (
    <div className="App">
      <h1>Travel Time Estimator</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="origin">Origin:</label>
        <input
          id="origin"
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          required
        />
        <br />
        <label htmlFor="destination">Destination:</label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <br />
        <button type="submit">Get Travel Time</button>
      </form>
      {travelTime && <p>Estimated travel time: {travelTime}</p>}
    </div>
  );
}

export default App;
