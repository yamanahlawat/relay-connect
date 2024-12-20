import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-axios',
  input: 'http://localhost:8000/openapi.json',
  output: {
    lint: 'eslint',
    format: 'prettier',
    path: 'src/client',
  },
});
