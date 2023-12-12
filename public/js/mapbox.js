const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log('Hello from the client side :D');
// console.log(locations);

// // DOM ELEMENTS
// const mapBox = document.getElementById('map');

// // DELEGATION
// if (mapBox) {
//   console.log('The map is working!');
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }

// const displayMap = (locations) => {
mapboxgl.accessToken =
  'pk.eyJ1Ijoib21hcmFiZHVsd2FoYWIiLCJhIjoiY2xuMTZyenhhMTFjOTJsbnV2N2F5ZTV2cyJ9.x7B7LAuO7fMnz-1xKdqgug';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/omarabdulwahab/cln184xq2034s01r7d6xw72kp',
  scrollZoom: false,
  // center: [-118.394445, 34.083555],
  // zoom: 7,
  // interactive: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    Element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add Popup
  new mapboxgl.Popup({
    offset: 50,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
// };
