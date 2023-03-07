import { relayInit } from 'nostr-tools';

export const publishEvent = async (request, env, ctx) => {
  const body = await request.json();
  const relayUrls = body.relays.map(url => (new URL(url)).origin);
  const event = body.event;
  if (!relayUrls || !event) {
    return new Response('INVALID_REQUEST', { status: 422 });
  }

  console.info(`Processing ${event.id}`);

  const promises = relayUrls.map(url => new Promise((resolve, reject) => {
    const relay = relayInit(url);
    const timeout = 5000;

    function timeoutAndClose() {
      console.error(`Timeout error: event ${event.id} relay ${url}`);
      relay.close();
      resolve();
    }
    let timeoutCheck = setTimeout(timeoutAndClose, timeout);

    relay.on('connect', () => {
      console.info(`Sending ${event.id} to ${url}`);
      const pub = relay.publish(event);
      pub.on('ok', () => {
        console.info(`Event ${event.id} published to ${url}`);
        relay.close();
        clearTimeout(timeoutCheck);
        resolve();
      });
      pub.on('failed', (reason) => {
        console.warn(`Failed to publish ${event.id} to ${url}: ${reason}`)
        relay.close();
        clearTimeout(timeoutCheck);
        resolve();
      })
    });

    relay.on('error', (msg) => {
      console.error(`Failed to connect to ${url}`, JSON.stringify(msg));
      clearTimeout(timeoutCheck);
      relay.close();
      resolve();
    });

    return relay.connect();
  }));

  ctx.waitUntil(Promise.all(promises));

  return new Response('OK');
}