# Example App

A React + Convex + Express demo showing how to use `@mzedstudio/uploadthingtrack`.

## Setup

1. Install dependencies from the project root:

```bash
pnpm install
```

2. Copy the environment template and fill in your values:

```bash
cp example/.env.example example/.env
```

Edit `example/.env`:
```
UPLOADTHING_TOKEN=...
UPLOADTHING_CALLBACK_URL=https://<your-convex-deployment>.convex.site/webhooks/uploadthing
CLIENT_ORIGIN=http://localhost:5173
PORT=3000
```

Create `example/.env.local` for Convex and Vite:
```
CONVEX_DEPLOYMENT=dev:<your-deployment>
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
VITE_UPLOADTHING_URL=http://localhost:3000/api/uploadthing
```

3. Add your UploadThing API key to your Convex deployment via the [dashboard](https://dashboard.convex.dev) as `UPLOADTHING_API_KEY`.

4. Start everything (Convex, Vite, Express, and TypeScript watcher):

```bash
pnpm dev
```

## What it demonstrates

- File uploads via UploadThing with webhook tracking
- Per-user file listing and usage stats
- Access control (public/private/restricted) on files and folders
- File replacement (re-upload with the same key)
- Cleanup of expired file records

## Webhook URL

UploadThing callbacks are sent to:

```
https://<your-convex-deployment>.convex.site/webhooks/uploadthing
```
