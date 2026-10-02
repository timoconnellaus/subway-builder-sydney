// mulberry32: a tiny seeded random number generator. The state is a single uint32,
// so it fits in JSON game state.

const STEP = 0x6d2b79f5;

/** Advance a state; returns the new state and a number in [0, 1). */
export function nextRandom(state: number): [number, number] {
  const s = (state + STEP) >>> 0;
  let t = Math.imul(s ^ (s >>> 15), s | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [s, ((t ^ (t >>> 14)) >>> 0) / 4294967296];
}

/** A random function from a seed. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    const [n, r] = nextRandom(s);
    s = n;
    return r;
  };
}
