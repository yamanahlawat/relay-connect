import type { paths } from '@/lib/api/schema';
import createClient from 'openapi-fetch';

const client = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_RELAY_SERVE_HOST,
});

export default client;
