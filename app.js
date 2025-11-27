mapboxgl.accessToken = 'pk.eyJ1IjoianZhbmxhcmUiLCJhIjoiY21oY2Zrd29nMTN2dDJtcHh5YzlxYWVtNSJ9.bP5BGQT-tdmmsC1SStqvNw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.3321, 47.6062], // Seattle
  zoom: 12
});

// GeoJSON feature collection for points
let points = turf.featureCollection([]);

// Helper: add/update points on map
function updatePointsLayer() {
  if (map.getSource('points')) {
    map.getSource('points').setData(points);
  } else {
    map.addSource('points', { type: 'geojson', data: points });
    map.addLayer({
      id: 'points',
      type: 'circle',
      source: 'points',
      paint: { 'circle-radius': 8, 'circle-color': '#ff5722' }
    });
  }
}

// Click on map to add points
map.on('click', (e) => {
  const newPoint = turf.point([e.lngLat.lng, e.lngLat.lat], { name: `Point ${points.features.length + 1}` });
  points.features.push(newPoint);
  updatePointsLayer();
});

// --- Measure Distance ---
document.getElementById('measureDistance').addEventListener('click', () => {
  if (points.features.length < 2) {
    alert('Add at least 2 points to measure distance.');
    return;
  }

  const line = turf.lineString(points.features.map(f => f.geometry.coordinates));
  const distance = turf.length(line, { units: 'kilometers' }).toFixed(2);

  if (map.getSource('line')) {
    map.getSource('line').setData(line);
  } else {
    map.addSource('line', { type: 'geojson', data: line });
    map.addLayer({
      id: 'line',
      type: 'line',
      source: 'line',
      paint: { 'line-color': '#0074D9', 'line-width': 4 }
    });
  }

  alert(`Total Distance: ${distance} km`);
});

// --- Nearest Neighbor ---
document.getElementById('nearestNeighbor').addEventListener('click', () => {
  if (points.features.length < 2) {
    alert('Add at least 2 points for nearest neighbor analysis.');
    return;
  }

  // Use last clicked point as target
  const target = points.features[points.features.length - 1];
  const others = turf.featureCollection(points.features.slice(0, -1));
  const nearest = turf.nearestPoint(target, others);

  // Highlight target and nearest
  const targetFeature = turf.featureCollection([target, nearest]);
  if (map.getSource('target')) {
    map.getSource('target').setData(targetFeature);
  } else {
    map.addSource('target', { type: 'geojson', data: targetFeature });
    map.addLayer({
      id: 'target',
      type: 'circle',
      source: 'target',
      paint: {
        'circle-radius': 10,
        'circle-color': [
          'case',
          ['==', ['get', 'name'], target.properties.name], '#00FF00', // target green
          '#FF0000' // nearest red
        ]
      }
    });
  }

  alert(`Nearest neighbor to ${target.properties.name} is ${nearest.properties.name}`);
});

// --- Buffer ---
document.getElementById('buffer').addEventListener('click', () => {
  if (points.features.length === 0) {
    alert('Add points to create buffers.');
    return;
  }

  const buffered = turf.buffer(points, 1, { units: 'kilometers' });

  if (map.getSource('buffer')) {
    map.getSource('buffer').setData(buffered);
  } else {
    map.addSource('buffer', { type: 'geojson', data: buffered });
    map.addLayer({
      id: 'buffer',
      type: 'fill',
      source: 'buffer',
      paint: {
        'fill-color': '#888888',
        'fill-opacity': 0.4
      }
    });
  }

  alert('Buffer of 1 km applied around all points.');
});

// --- Clear Points ---
document.getElementById('clear').addEventListener('click', () => {
  points = turf.featureCollection([]);
  if (map.getSource('points')) map.getSource('points').setData(points);
  if (map.getSource('line')) map.getSource('line').setData(turf.featureCollection([]));
  if (map.getSource('target')) map.getSource('target').setData(turf.featureCollection([]));
  if (map.getSource('buffer')) map.getSource('buffer').setData(turf.featureCollection([]));
});
