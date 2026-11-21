// Types for lib/fluidSimulation.js (plain JS, kept as close to the original engine as possible).

export type FluidOptions = {
  /** Base colour behind the ink, 0–255 per channel. Read every frame. */
  backColor?: () => { r: number; g: number; b: number };
  /** Ink hues as [start, range] on the 0–1 hue wheel. Read for every new colour. */
  hueBand?: () => [number, number];
};

/**
 * Starts the WebGL fluid simulation on `canvas` and returns a function that stops it.
 * Throws when the browser has no usable WebGL.
 */
export function fluidSimulation(canvas: HTMLCanvasElement, options?: FluidOptions): () => void;
