const express = require('express');
const axios = require('axios');
const path = require('path');
const serveStatic = require('serve-static');
const { permutations } = require('itertools');
const fs = require('fs');


require('dotenv').config(); 
const GOOGLE_MAPS_ACCESS_KEY = process.env.GOOGLE_MAPS_ACCESS_KEY;

const app = express();
const port = process.env.PORT || 3001;

// Serve React app build files in production
if (process.env.NODE_ENV === 'production') {
  app.use(serveStatic(path.join(__dirname, 'my-app/build')));
}

app.use(express.json());

/**
 * POST route for fetching the shortest travel path between multiple locations
 * using the Google Maps DistanceMatrix API.
 */
app.post('/api/travel-time', async (req, res) => {
  const locations = req.body.locations;

  console.log(req.body);

  if (!locations || locations.length < 2) {
    return res.status(400).json({ error: 'At least two locations are required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: locations.join('|'),
        destinations: locations.join('|'),
        mode: 'transit',
        key: GOOGLE_MAPS_ACCESS_KEY,
      },
    });
    // Save the response data to a JSON file
    fs.writeFile('response_data.json', JSON.stringify(response.data, null, 2), (err) => {
      if (err) throw err;
      console.log('Response saved to response_data.json');
    });

    if (response.data.status === 'OK' && response.data.rows.length > 0) {
      const durationMatrix = response.data.rows.map((row, i) =>
        row.elements.map((element, j) => (i === j ? Infinity : element.duration.value))
      );
      const shortestPath = findShortestPath(locations, durationMatrix);
      return res.json({ shortestPath });
    } else {
      return res.status(500).json({ error: 'Failed to fetch travel time from Google Maps API' });
    }
  } catch (error) {
    console.error('Error fetching travel time:', error);
    return res.status(500).json({ error: 'Error fetching travel time from Google Maps API' });
  }
});


/**
 * Function to find the shortest travel path between multiple locations using
 * a brute-force approach, given an array of locations and a distance matrix.
 *
 * @param {string[]} locations - An array of location names or addresses.
 * @param {number[][]} distanceMatrix - A 2D array representing the distance matrix
 *                                      between all pairs of locations.
 * @returns {Object[]} - An array of objects representing the shortest path, with
 *                       each object containing the location name and the distance
 *                       from the previous location.
 */
function findShortestPath(locations, distanceMatrix) {
  const locationIndices = locations.map((_, index) => index);
  const allPermutations = Array.from(permutations(locationIndices.slice(1)));

  let shortestDistance = Infinity;
  let shortestPath = null;

  for (const permutation of allPermutations) {
    let currentDistance = 0;
    let previousLocationIndex = 0;

    for (const locationIndex of permutation) {
      currentDistance += distanceMatrix[previousLocationIndex][locationIndex];
      previousLocationIndex = locationIndex;
    }

    currentDistance += distanceMatrix[previousLocationIndex][0];

    if (currentDistance < shortestDistance) {
      shortestDistance = currentDistance;
      shortestPath = [0, ...permutation, 0];
    }
  }

  const formattedShortestPath = shortestPath.map((index) => ({
    location: locations[index],
    distance: index === 0 ? 0 : distanceMatrix[shortestPath[index - 1]][index],
  }));

  return formattedShortestPath;
}

// Catch-all route for serving the React app in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'my-app/build', 'index.html'));
    });
  }
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  