import { Relay } from 'nostr';

export const publishEvent = async (request, env, ctx) => {
  const body = await request.json();
  const relayUrls = body.relays.map(url => (new URL(url)).origin);
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

  return new Response('OK');
}