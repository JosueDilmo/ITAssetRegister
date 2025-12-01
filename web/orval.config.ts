import * as dotenv from 'dotenv'
import { defineConfig } from 'orval'
dotenv.config({
  path: '.env.local',
})

export default defineConfig({
  api: {
    input: process.env.BASE_INPUT_URL!,
    output: {
      target: './src/http/api.ts',
      client: 'fetch',
      httpClient: 'fetch',
      clean: true,
      baseUrl: process.env.BASE_URL!,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
})
