import redisClient from "../../config/redis.js";

export const getOrSetCache =
  async (
    key,
    callback,
    ttl = 60
  ) => {
    // CHECK CACHE
    const cached =
      await redisClient.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    // FETCH FRESH DATA
    const freshData =
      await callback();

    // SAVE CACHE
    await redisClient.setEx(
      key,
      ttl,
      JSON.stringify(freshData)
    );

    return freshData;
  };