import { writePlaces } from './storage';

export function addPlace(places: string[], place: string) {
  const next = [...places, place];
  writePlaces(next);
  return next;
}
