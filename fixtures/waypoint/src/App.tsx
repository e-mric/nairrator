import { useState } from 'react';
import { addPlace } from './places';

export function App() {
  const [places, setPlaces] = useState<string[]>([]);
  function handleSave() {
    const next = addPlace(places, 'Lisbon');
    setPlaces(next);
  }
  return <main><h1>Waypoint</h1><button onClick={handleSave}>Save a place</button><ul>{places.map(place => <li key={place}>{place}</li>)}</ul></main>;
}
