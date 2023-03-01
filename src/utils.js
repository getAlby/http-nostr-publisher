import { Relay } from 'nostr';

export const fetchProfiles = (pubkey, urls) => urls.map(url => new Promise((resolve, reject) => {
  console.info(`Fetching ${pubkey}'s info from ${url}`);

  const relay = Relay(url);
  const timeout = 3500;

  function timeoutAndClose() {
    console.error(`Timeout error: pubkey ${pubkey} relay ${url}`);
    relay.close();
    resolve();
  }
  let timeoutCheck = setTimeout(timeoutAndClose, timeout);

  relay.on('open', async () => {
    console.info(`Fetching ${pubkey}'s info...`);
    // TODO: Add support for npub
    relay.subscribe(crypto.randomUUID(), {limit: 1, kinds:[0], authors: [pubkey]});
  });

  relay.on('error', (msg) => {
    console.error(`Failed to fetch from ${url}`, JSON.stringify(msg));
    clearTimeout(timeoutCheck);
    relay.close();
    resolve();
  });

  relay.on('event', (sub_id, ev) => {
    console.info(`Fetched ${pubkey}'s info from ${url}`);
    clearTimeout(timeoutCheck);
    relay.close();
    resolve(ev);
  });
}));