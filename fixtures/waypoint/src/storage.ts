export function writePlaces(places: string[]) {
  localStorage.setItem('waypoint.places', JSON.stringify(places));
}
