import { relayInit } from 'nostr-tools';
import { bech32 } from "bech32";

export const fetchProfiles = (pubkey, urls) => urls.map(url => new Promise(async (resolve, reject) => {
  console.info(`Fetching ${pubkey}'s info from ${url}`);

  const relay = relayInit(url);
  const timeout = 5000;

  function timeoutAndClose() {
    console.error(`Timeout error: pubkey ${pubkey} relay ${url}`);
    relay.close();
    resolve();
  }
  let timeoutCheck = setTimeout(timeoutAndClose, timeout);

  relay.on('connect', () => {
    console.info(`connected to ${url}`);
    const subscription = relay.sub([{ limit: 1, kinds: [0], authors: [pubkey] }]);
    subscription.on('event', (ev) => {
      console.info(`Fetched ${pubkey}'s info from ${url}`);
      clearTimeout(timeoutCheck);
      relay.close();
      resolve(ev);
    });
  });

  relay.on('error', (msg) => {
    console.error(`Failed to fetch from ${url}`, JSON.stringify(msg));
    clearTimeout(timeoutCheck);
    relay.close();
    resolve();
  });

  relay.connect();
}));

const bech32Decode = (str, encoding = "utf-8") => {
  const { words: dataPart } = bech32.decode(str, 2000);
  const requestByteArray = bech32.fromWords(dataPart);
  return Buffer.from(requestByteArray).toString(encoding);
}

export const normalizeToHex = (str) => {
  const NIP19Prefixes = ["npub", "nsec", "note"];
  const prefix = str.substring(0, 4);
  if (NIP19Prefixes.includes(prefix)) {
    try {
      const hexStr = bech32Decode(str, "hex");
      return hexStr;
    } catch (e) {
      console.info("ignoring bech32 parsing error", e);
    }
  }
  return str;
}