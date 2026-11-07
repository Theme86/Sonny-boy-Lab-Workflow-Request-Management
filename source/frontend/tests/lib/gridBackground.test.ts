import { describe, expect, it } from 'vitest';
import { GRID_STYLE } from '@/lib/gridBackground';

describe('GRID_STYLE', () => {
  it('draws a coarse and a fine grid, each with horizontal and vertical lines', () => {
    expect(String(GRID_STYLE.backgroundImage).match(/linear-gradient/g)).toHaveLength(4);
    expect(GRID_STYLE.backgroundSize).toBe('96px 96px, 96px 96px, 24px 24px, 24px 24px');
  });
});
