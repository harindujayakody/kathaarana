type BuildStats = Record<string, { rating: number; ratings: number }>;

let cache: Promise<BuildStats> | undefined;

// Ratings at build time, for the aggregateRating in each novel's structured data.
// If the API can't be reached the build carries on without them.
export const buildStats = () =>
  (cache ??= fetch('https://kathaarana.com/api/stats', { signal: AbortSignal.timeout(4000) })
    .then((res) => (res.ok ? res.json() : { novels: {} }))
    .then((data) => (data.novels ?? {}) as BuildStats)
    .catch((): BuildStats => ({})));
