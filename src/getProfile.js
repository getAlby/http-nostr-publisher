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

  const fetchAndCache = async (pubkey) => {
    const result = await Promise.any(fetchProfiles(pubkey,relayUrls));
    return await setCache(pubkey, JSON.stringify(result));
  }
  
  const { value, metadata } = await getCache(pubkey);
  
  if (!metadata || metadata.createdAt + 3 * HOUR * 1000 > Date.now()) {
    ctx.waitUntil(fetchAndCache(pubkey, relayUrls));
  }

  return new Response(value, { 
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    }
  });
}