import { Relay } from 'nostr';


export default {
  async fetch(request, env, ctx) {
    const apiToken = request.headers.get('API-TOKEN');
    if (apiToken !== env.API_TOKEN && env.API_TOKEN) {
      return new Response('INVALID_TOKEN', { status: 403 });
    }
    if (request.method !== "POST") {
      return new Response('Sooner and later you will see great changes made.', { status: 404 });
    }

    const body = await request.json();
    const relayUrls = body.relays.map(url => (new URL(url)).origin);

    if (body.profileInfo) {
      const pubkey = body.pubkey;

      const setCache = (key, data) => env.PROFILES.put(key, data)
      const getCache = key => env.PROFILES.get(key)

      if (!relayUrls || !pubkey) {
        return new Response('INVALID_REQUEST', { status: 422 });
      }

      // should be prefetched data, PROFILE.get
      let data = {}
      const cache = await getCache(pubkey)
      if (cache) {
        data = JSON.parse(cache)
      }

      const existingUrls = Object.keys(data);

      // TODO: set an expiry of 2 days for the kv pairs
      // TODO: 3 hour update using timestamp from metadata

      // TODO: update repeatedUrls only if an hour passes
      const repeatedUrlsToUpdate = relayUrls.filter(url => existingUrls.includes(url))

      // filter all relayUrls for which we already have data
      const urlsToFetch = relayUrls.filter(url => !existingUrls.includes(url))

      const fetchProfiles = (urls) => urls.map(url => new Promise((resolve, reject) => {
        console.info(`Fetching ${pubkey}'s info from ${url}`);
  
        const relay = Relay(url);
        const timeout = 3500;
  
        function timeoutAndClose() {
          console.error(`Timeout error: pubkey ${pubkey} relay ${url}`);
          relay.close();
          resolve();
        }
        let timeoutCheck = setTimeout(timeoutAndClose, timeout);
  
        relay.on('open', () => {
          console.info(`Fetching ${pubkey}'s info...`);
          clearTimeout(timeoutCheck);
          // TODO: Fetch info from nostr profile
          const fetchedInfo = `info from ${url}`
          resolve({url, fetchedInfo});
        });
  
        relay.on('error', (msg) => {
          console.error(`Failed to fetch from ${url}`, JSON.stringify(msg));
          clearTimeout(timeoutCheck);
          relay.close();
          resolve();
        });
  
        relay.on('ok', () => {
          console.info(`Fetched ${pubkey}'s info from ${url}`);
          clearTimeout(timeoutCheck);
          relay.close();
          resolve()
        });
      }));

      const result = await Promise.all(fetchProfiles(urlsToFetch));
      result.forEach(el => {
        data[el.url] = el.fetchedInfo
      });

      const kvUpdatePromise = async (data) => {
        const res = await Promise.all(fetchProfiles(repeatedUrlsToUpdate));
        res.forEach(el => {
          data[el.url] = el.fetchedInfo
        });
        await setCache(pubkey, JSON.stringify(data))
      }
      // updates env.PROFILES with new info after sending the response
      ctx.waitUntil(kvUpdatePromise(data));

      const response = {};
      relayUrls.forEach(url => {
        response[url] = data[url]
      });
      return new Response(JSON.stringify(response), {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      });
    }

    const event = body.event;
    if (!relayUrls || !event) {
      return new Response('INVALID_REQUEST', { status: 422 });
    }

    console.info(`Processing ${event.id}`);

    const promises = relayUrls.map(url => new Promise((resolve, reject) => {
      console.info(`Publishing ${event.id} to ${url}`);

      const relay = Relay(url);
      const timeout = 3500;

      function timeoutAndClose() {
        console.error(`Timeout error: event ${event.id} relay ${url}`);
        relay.close();
        resolve();
      }
      let timeoutCheck = setTimeout(timeoutAndClose, timeout);

      relay.on('open', () => {
        console.info(`Sending ${event.id}`);
        relay.send(['EVENT', event]);
      });

      relay.on('error', (msg) => {
        console.error(`Failed to connect to ${url}`, JSON.stringify(msg));
        clearTimeout(timeoutCheck);
        relay.close();
        resolve();
      });

      relay.on('ok', () => {
        console.info(`Event ${event.id} published to ${url}`);
        clearTimeout(timeoutCheck);
        relay.close();
        resolve()
      });
    }));

    ctx.waitUntil(Promise.all(promises));

    return new Response("OK");
  },
};
