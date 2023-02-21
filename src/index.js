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
    const relayUrls = body.relays;
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
