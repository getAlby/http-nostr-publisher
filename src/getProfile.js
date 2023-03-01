import { fetchProfiles } from './utils';

const HOUR = 60 * 60

export const getProfile = async (request, env, ctx) => {
  const body = await request.json();
  const relayUrls = body.relays.map(url => (new URL(url)).origin);
  const pubkey = body.pubkey;

  if (!relayUrls || !pubkey) {
    return new Response('INVALID_REQUEST', { status: 422 });
  }

  const setCache = (key, data) => env.PROFILES.put(key, data, {
    metadata: { createdAt: Date.now() },
    // key expires after 2 days
    expirationTtl: 2 * 24 * HOUR
  })
  const getCache = key => env.PROFILES.getWithMetadata(key)

  let data;
  const { value, metadata } = await getCache(pubkey)
  if (value) {
    data = JSON.parse(value)
    // return if the data is NOT older than 3 hours
    if (metadata.createdAt + 3 * HOUR * 1000 > Date.now()) {
      return data;
    }
  }   

  const result = await Promise.any(fetchProfiles(pubkey,relayUrls));

  const kvUpdatePromise = async (res) => {
    await setCache(pubkey, JSON.stringify(res))
  }
  // updates env.PROFILES with new info after sending the response
  ctx.waitUntil(kvUpdatePromise(result));

  return result;
}