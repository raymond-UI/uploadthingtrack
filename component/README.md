# UploadThing File Tracker Component

A metadata, access-control, and expiration layer for UploadThing uploads. This component stores UploadThing file references in its own Convex tables and exposes queries, mutations, and actions to manage file ownership, permissions, and cleanup.

## What This Component Does

- Tracks file metadata (`key`, `url`, `name`, `size`, `mimeType`, `uploadedAt`).
- Associates files with a `userId` passed in from your app (components cannot use `ctx.auth`).
- Supports per-file and per-folder access rules.
- Lists files by user, mime type, tag, or folder.
- Supports expiration policies (default TTL or per file type/mime type).
- Provides a cleanup action for expired records.
- Validates UploadThing webhook callbacks with HMAC signatures.
- Supports file replacement (upsert by `key`).

## Installation

1. Add the component to your app's `convex/convex.config.ts` and give it a name, for example:

```ts
import { defineApp } from "convex/server";
import uploadthingFileTracker from "<path-to-component>/component/convex.config";

const app = defineApp();
app.use(uploadthingFileTracker, { name: "uploadthingFileTracker" });

export default app;
```

2. Configure the UploadThing API key (components cannot read environment variables):

```ts
// in an admin-only mutation/action in your app
await ctx.runMutation(components.uploadthingFileTracker.setConfig, {
  config: {
    uploadthingApiKey: process.env.UPLOADTHING_SECRET!,
    defaultTtlMs: 1000 * 60 * 60 * 24 * 30,
    ttlByMimeType: {
      "image/png": 1000 * 60 * 60 * 24 * 7,
    },
  },
});
```

## UploadThing Webhook Handling

UploadThing signs webhook callbacks with an `x-uploadthing-signature` header and a `uploadthing-hook` header. The signature is an HMAC SHA-256 of the request body using your UploadThing API key. The component validates this signature internally. ([UploadThing callbacks](https://docs.uploadthing.com/concepts/route-handlers#handling-callback-requests))

If you'd rather keep the API key only in the Convex deployment environment, you can pass it through
from your app's HTTP action when calling `handleUploadthingCallback`:

```ts
const apiKey = process.env.UPLOADTHING_API_KEY!;
const result = await ctx.runAction(
  components.uploadthingFileTracker.callbacks.handleUploadthingCallback,
  { rawBody, signature, hook, apiKey },
);
```

Create an HTTP action in your app to forward the request to the component:

```ts
import { httpAction } from "convex/server";
import { components } from "./_generated/api";

export const uploadthingWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-uploadthing-signature");
  const hook = request.headers.get("uploadthing-hook");
  if (!signature || !hook) {
    return new Response("Missing headers", { status: 400 });
  }

  const rawBody = await request.text();
  const result = await ctx.runAction(
    components.uploadthingFileTracker.handleUploadthingCallback,
    { rawBody, signature, hook },
  );

  if (!result.ok) {
    return new Response("Invalid webhook", { status: 400 });
  }

  return new Response("ok", { status: 200 });
});
```

Your UploadThing route should include `userId` in the callback metadata so the component can associate the file with its owner.

## Access Control

Each file can have an access rule, and each folder can have an access rule. File rules override folder rules. Rules support:

- `visibility: "public" | "private" | "restricted"`
- `allowUserIds` and `denyUserIds`

Use `setFileAccess` and `setFolderAccess` to configure rules.

## Queries

- `getFileByKey` to fetch a file by key, enforcing access rules.
- `listFiles` to fetch a user's files filtered by mime type, tag, or folder.
- `getUsageStats` for total files and bytes per user.

## Expiration and Cleanup

- Files can set `expiresAt` or `ttlMs` at insert time.
- Global defaults can be set with `setConfig`.
- Use `cleanupExpired` as a scheduled action in your app (cron in the app config).

`cleanupExpired` returns the list of keys it deleted. If you want to delete files from UploadThing itself, call the UploadThing SDK from your app and pass those keys, then run `cleanupExpired` to remove local records.

## Notes

- Components cannot access `ctx.auth`; user identity must be passed in explicitly by your app. ([Convex components](https://docs.convex.dev/components/authoring))
- Components cannot define their own HTTP routes; your app must forward webhooks to the component action. ([Convex components](https://docs.convex.dev/components/authoring))
