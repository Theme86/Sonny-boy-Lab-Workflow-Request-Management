// Types for lib/fluidSimulation.js (plain JS, kept as close to the original engine as possible).

/**
 * Starts the WebGL fluid simulation on `canvas` and returns a function that stops it.
 * Throws when the browser has no usable WebGL.
 */
export function fluidSimulation(canvas: HTMLCanvasElement): () => void;
