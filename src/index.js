import { getProfile } from './getProfile';
import { publishEvent } from './publishEvent';

export default {
  async fetch(request, env, ctx) {
    const pathname = (new URL(request.url)).pathname;

    const apiToken = request.headers.get('API-TOKEN');
    if (apiToken !== env.API_TOKEN && env.API_TOKEN) {
      return new Response('INVALID_TOKEN', { status: 403 });
    }
    if (request.method !== "POST") {
      return new Response('Sooner and later you will see great changes made.', { status: 404 });
    }

    if (pathname === "/") {
      const status = await publishEvent(request, env, ctx);
      return new Response(status)
    } else if (pathname === "/profile") {
      const result = await getProfile(request, env, ctx);
      return new Response(JSON.stringify(result), {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      });
    } else {
      return new Response('Endpoint does not exist', { status: 404 });
    }
  },
};
