# HTTP to Nostr Cloudflare worker

This [Cloudflare worker](https://workers.cloudflare.com/) exposes a HTTP interface to publish events to specified Nostr relays. 
The HTTP request is non-blocking and will immediatelly return. The events will be published asynchronously.

The goal of this worker is to make it easier to integrate publishing events into any application. 
Using this worker applications do not need to integrate websockets and can publish events through a non-blocking HTTP request.


## API

### POST /publish

Send a JSON body with the the event and the relays that the event should be published to.

```json
{
  "relays": ["relay.damus.io", "relay.snort.social"],
  "event": { JSON of the EVENT }
}

```

The HTTP request will immediatelly return and the the events are published asynchonously. 

### POST /profile

Retrieve the profile for a pubkey.

```json
{
  "relays": ["relay.damus.io", "relay.snort.social"],
  "pubkey": "profile-pubkey"
}

```

If a profile is already cached it will return with `HTTP status 200`. 

If a profile is NOT already cached it will return with `HTTP status 202` and query the profile asynchronously.



## Configuration

#### Cloudflare KV

The profile data is cached in a [worker KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) (a global, low-latency, key-value data store). 

Configure the KV:

```
$ wrangler kv:namespace create PROFILES
$ wrangler kv:namespace create PROFILES --preview
```

and add the `kv_namespaces` array to the wrangler.toml

#### API Token

To protect your worker you can set a `API_TOKEN` environment variable.

Clients then need to send this token in a `API-TOKEN` HTTP header.


## Deployment

Refer to the [Cloudflare docs](https://developers.cloudflare.com/workers/get-started/guide/) Learn more about Cloudflare workers and how to publish workers

```
$ wrangler publish
```

## Development

```
$ wrangler dev
```


