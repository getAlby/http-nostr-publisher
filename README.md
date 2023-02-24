# HTTP to Nostr Cloudflare worker

This [Cloudflare worker](https://workers.cloudflare.com/) exposes a HTTP interface to publish events to specified Nostr relays. 
The HTTP request is non-blocking and will immediatelly return. The events will be published asynchronously.

The goal of this worker is to make it easier to integrate publishing events into any application. 
Using this worker applications do not need to integrate websockets and can publish events through a non-blocking HTTP request.


## API

### POST /

Send a JSON body with the the event and the relays that the event should be published to.

```json
{
  "relays": ["relay.damus.io", "relay.snort.social"],
  "event": { JSON of the EVENT }
}

```

The HTTP request will immediatelly return and the the events are published asynchonously. 

## Configuration

To protect your worker you can set a `API_TOKEN` environment variable.

Clients then need to send this token in a `API-TOKEN` HTTP header.


## Deployment

Refer to the [Cloudflare docs](https://developers.cloudflare.com/workers/get-started/guide/) Learn more about Cloudflare workers and how to publish workers

```
$ wrangler publish
```

