# UploadThing File Tracker Example App

This mini React + Convex app demonstrates how to install and use the UploadThing File Tracker component
in a real project. It includes a small Express server that hosts UploadThing's `/api/uploadthing` endpoint
and forwards callbacks to Convex.

## Setup

1. Install dependencies:

```bash
cd example-app
pnpm install
```

2. Start Convex dev (generates `convex/_generated`):

```bash
pnpm dev:convex
```

3. Configure environment variables:

Copy `.env.example` to `.env` and fill in the UploadThing values for the Express server, then create `.env.local` for Vite:

`.env`
```
UPLOADTHING_TOKEN=...
UPLOADTHING_CALLBACK_URL=https://<your-convex-deployment>.convex.site/webhooks/uploadthing
CLIENT_ORIGIN=http://localhost:5173
PORT=3000
```

`.env.local`
```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
VITE_UPLOADTHING_URL=http://localhost:3000/api/uploadthing
```

4. Add your UploadThing API key to your Convex deployment environment variables:

- Go to the Convex dashboard for your deployment.
- Add `UPLOADTHING_API_KEY` with the **Secret Key** from the UploadThing dashboard.

4. Start the UploadThing server:

```bash
pnpm dev:uploadthing
```

5. Start the React app:

```bash
pnpm dev
```

## Configure the component (optional)

If you want to store the API key in the component's own config (for example to use `getConfig`),
you can still run:

```bash
pnpm exec convex run uploadthing:setUploadthingConfig '{"uploadthingApiKey":"YOUR_UPLOADTHING_SECRET"}'
```

## Webhook URL

UploadThing callbacks are sent to Convex at:

```
https://<your-convex-deployment>.convex.site/webhooks/uploadthing
```

## What The UI Shows

- Uploads (via `useUploadThing` in the client and the Express route handler).
- Files owned by a user (via `uploadthing:listMyFiles`).
- Usage stats (via `uploadthing:getMyUsage`).
- Cleanup expired files (via `uploadthing:cleanupExpiredFiles`).

This demo doesn't include auth, so the user id is entered manually.
