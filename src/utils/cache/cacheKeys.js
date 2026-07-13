export const analyticsCacheKey =
  (
    type,
    filters = {}
  ) => {
    return `analytics:${type}:${JSON.stringify(
      filters
    )}`;
  };