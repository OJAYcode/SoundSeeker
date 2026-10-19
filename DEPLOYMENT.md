# Deploying SoundSeeker

## API

Deploy `apps/api` to a Node 24 host such as Render, Railway, or Fly.io. Run `pnpm --filter @soundseeker/api build` to build and `node apps/api/dist/server.js` to serve it.

Set these environment variables on the API host:

- `ACRCLOUD_HOST`
- `ACRCLOUD_ACCESS_KEY`
- `ACRCLOUD_ACCESS_SECRET`
- `PER_IP_DAILY_LIMIT` (for example, `20`)
- `GLOBAL_DAILY_LIMIT` (for example, `200`)
- `ALLOWED_ORIGIN` (the exact deployed web URL)
- `PORT` (provided by most hosts)

The API only keeps uploads in memory. It needs no ffmpeg because ACRCloud documents support for browser-recorded audio containers; it accepts short audio requests and recommends samples under 15 seconds. If a future browser format is not accepted, add server-side conversion and deploy a host image with ffmpeg.

## Web app

Deploy `apps/web/dist` to Vercel, Netlify, or Cloudflare Pages after `pnpm --filter @soundseeker/web build`.

Set `VITE_API_URL` in the web host's build environment to the public API origin, for example `https://soundseeker-api.up.railway.app`. Do not include a trailing slash or `/api` in this value. Rebuild the web app after changing it. Leave it unset locally to use Vite's `/api` proxy.

Microphone access and PWA installation require HTTPS outside `localhost`.
