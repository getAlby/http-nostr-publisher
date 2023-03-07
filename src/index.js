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

    if (pathname === "/" || pathname === "/publish") {
      return await publishEvent(request, env, ctx);
    } else if (pathname === "/profile") {
      return await getProfile(request, env, ctx);
    } else {
      return new Response('Endpoint does not exist', { status: 404 });
    }
  },
};
