import type { Level } from '../types';
import { levels } from '../types';
// Human-authored fixture explanations. Apply only when exact source snippets match.
const copy: Record<string, { guard: string; variants: string[] }> = {
  App: {
    guard: 'onClick={handleSave}',
    variants: [
      'Waypoint lets you save a place to a list. This screen starts with an empty list and shows a “Save a place” button. The button is connected to handleSave. Next, we’ll follow that connection. This is what the source says; we haven’t clicked a running app.',
      'App is a React component: a function describing the screen. useState starts places as an empty array. The button’s onClick property refers to handleSave, and places.map describes how each saved place becomes a list item. That event binding suggests where to look next; it is not a runtime test.',
      'App owns places in React state and renders its list. JSX binds the button to handleSave, which closes over places and setPlaces. The source indicates a stateful UI path; actual event dispatch and rendering have not been exercised.',
      'TypeScript AST evidence shows App declaring useState<string[]>([]) and an onClick identifier binding to nested handleSave. places.map produces keyed li elements. This is syntactic evidence without React execution, type-checker symbol resolution, or reachability guarantees.',
    ],
  },
  handleSave: {
    guard: "addPlace(places, 'Lisbon')",
    variants: [
      'This is the button’s instruction list. It asks addPlace to add Lisbon, then gives the returned list back to the screen. The place is fixed in this example; the user isn’t entering a destination. We still need to inspect addPlace to understand the saving part.',
      'handleSave is an event handler: a function attached to an interaction. It calls addPlace with the current places and the string Lisbon. It then calls setPlaces with the returned array so React can update the screen. The source does not include an input field.',
      'The handler passes its captured places array to the imported addPlace and sends the result to setPlaces. The source orders the addPlace call before the state update. If addPlace throws, that update would not be reached; no runtime exception test has been performed.',
      'TypeScript AST identifies the addPlace(places, Lisbon) call and subsequent setPlaces(next). The import resolves syntactically to ./places; no type-checker alias analysis is used. addPlace executes synchronously in the handler source; successful storage is not established by inspection.',
    ],
  },
  addPlace: {
    guard: 'const next = [...places, place]',
    variants: [
      'addPlace makes a new list containing the old places plus the new one. It passes that list to writePlaces and returns it to the button’s handler. Think of adding a line to a fresh copy of a checklist. Next we’ll see where writePlaces sends it.',
      'The spread syntax copies the existing array into a new array and appends place. addPlace calls writePlaces(next), then returns next. The function combines list-building with a storage call; it is not just a calculation.',
      'addPlace creates an appended array without mutating the input array, invokes writePlaces, and returns the new value. Storage is a synchronous side effect before return. The source contains no deduplication or validation, and runtime persistence remains unverified.',
      'TypeScript AST evidence: next is constructed via array spread and place, passed to an imported writePlaces, then returned. The input array is not directly mutated here. Storage failure could prevent return; no catch, transaction, deduplication, or validation appears in this function.',
    ],
  },
  writePlaces: {
    guard: "localStorage.setItem('waypoint.places', JSON.stringify(places))",
    variants: [
      'This function asks the browser to keep the list under the name waypoint.places. It turns the list into text first. That means the source uses browser storage, not a server database. This small sample has no code to load the saved list when the page opens again.',
      'writePlaces uses JSON.stringify to turn the array into text, then passes it to localStorage.setItem. localStorage is browser storage associated with the site. The sample shows writing only: App still starts with an empty array, and no read-back path is present in these sample sources.',
      'writePlaces serializes places and writes one localStorage key synchronously. The fixture contains no network request or database adapter. It also contains no getItem call to hydrate App on reload. Storage success and browser quota behavior have not been tested by running the target.',
      'TypeScript AST evidence shows a property call to localStorage.setItem with the literal key waypoint.places and JSON.stringify(places). There is no exception handling in this function. The fixture has no restoration path. This is source inspection, not verification of browser origin policy, quota, availability, or durability.',
    ],
  },
};
export function sampleVariants(name: string, excerpt: string): Record<Level, string> | null {
  const item = copy[name];
  if (!item || !excerpt.includes(item.guard)) return null;
  return Object.fromEntries(levels.map((l, i) => [l, item.variants[i]])) as Record<Level, string>;
}

const reviewedHashes: Record<string, string> = {
  'src/App.tsx': '63bce21551cbe55badca96bd723a463ffa71403bbdaf826a701d7e9261c22db6',
  'src/places.ts': '9003fecd2bae8903f7db64b8d0b08035c4c0ee0ab13cd3cb99f3648bb924c80e',
  'src/storage.ts': 'a2f7051fbcdbd37115993c6d21f9f72bd9aa707316a30b8e7ecfa3183a1ef183',
};
export function isReviewedSample(files: { path: string; hash: string }[]) {
  return (
    files.length === Object.keys(reviewedHashes).length &&
    files.every((f) => reviewedHashes[f.path] === f.hash)
  );
}
