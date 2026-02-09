# @mzedstudio/uploadthingtrack

A [Convex component](https://docs.convex.dev/components) for tracking UploadThing files with access control, expiration, and webhook verification.

UploadThing handles file storage. This component adds the metadata layer: **who uploaded what**, **who can see it**, and **when it expires**.

## Features

- **File tracking** -- stores URL, key, name, size, MIME type, and upload time for every file
- **User association** -- ties each file to a `userId` for ownership and dashboards
- **Access control** -- per-file and per-folder visibility rules (public / private / restricted)
- **Expiration** -- configurable TTL by file, MIME type, file type, or a global default
- **Replacement** -- re-uploading with the same key updates the record in place
- **Tags and filters** -- tag files and query by user, folder, tag, or MIME type
- **Cross-user queries** -- list files across all users for galleries, feeds, and shared boards
- **On-demand deletion** -- delete specific file records by key
- **Remote cleanup** -- optionally delete files from UploadThing servers when they expire
- **Webhook verification** -- HMAC SHA-256 signature validation for UploadThing callbacks
- **Cleanup** -- batch deletion of expired file records
- **Custom metadata** -- store and retrieve arbitrary metadata on file records
- **Usage stats** -- total files and bytes per user

## Installation

```bash
npm install @mzedstudio/uploadthingtrack
```

## Setup

### 1. Register the component

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import uploadthingFileTracker from "@mzedstudio/uploadthingtrack/convex.config.js";

const app = defineApp();
app.use(uploadthingFileTracker, { name: "uploadthingFileTracker" });
export default app;
```

### 2. Create the client

```ts
// convex/uploadthing.ts
import { UploadThingFiles } from "@mzedstudio/uploadthingtrack";
import { components } from "./_generated/api";

const uploadthing = new UploadThingFiles(components.uploadthingFileTracker);
```

### 3. Mount the webhook route

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@mzedstudio/uploadthingtrack";
import { components } from "./_generated/api";

const http = httpRouter();
registerRoutes(http, components.uploadthingFileTracker);
export default http;
```

Set `UPLOADTHING_API_KEY` as an environment variable in the [Convex dashboard](https://dashboard.convex.dev). The webhook handler reads it automatically.

### 4. Configure the component (optional)

```ts
export const setup = mutation({
  handler: async (ctx) => {
    await uploadthing.setConfig(ctx, {
      config: {
        uploadthingApiKey: process.env.UPLOADTHING_API_KEY,
        defaultTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
        ttlByMimeType: { "image/png": 90 * 24 * 60 * 60 * 1000 },
        ttlByFileType: { avatar: 365 * 24 * 60 * 60 * 1000 },
        deleteRemoteOnExpire: true, // also delete from UploadThing servers
      },
    });
  },
});
```

## Usage

### Querying files

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const listMyFiles = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await uploadthing.listFiles(ctx, {
      ownerUserId: args.userId,
      viewerUserId: args.userId,
    });
  },
});

export const getFile = query({
  args: { key: v.string(), viewerUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await uploadthing.getFile(ctx, args);
  },
});
```

### Cross-user file listing

List files across all users -- useful for galleries, public feeds, and shared boards:

```ts
export const publicGallery = query({
  args: { viewerUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await uploadthing.listAllFiles(ctx, {
      viewerUserId: args.viewerUserId,
      folder: "gallery",
      limit: 20,
    });
  },
});
```

`listAllFiles` applies the same access control as `listFiles` -- viewers only see files they have permission to access. All filters (`folder`, `tag`, `mimeType`, `includeExpired`) are supported.

### Inserting files manually

```ts
import { mutation } from "./_generated/server";

export const trackFile = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    await uploadthing.upsertFile(ctx, {
      file: {
        key: args.key,
        url: args.url,
        name: args.name,
        size: args.size,
        mimeType: args.mimeType,
      },
      userId: args.userId,
      options: {
        folder: "uploads",
        tags: ["document"],
        metadata: { uploaderName: args.displayName },
      },
    });
  },
});
```

### Deleting files

Delete specific file records by key:

```ts
export const removeFiles = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const count = await uploadthing.deleteFiles(ctx, { keys: args.keys });
    // count = number of records actually deleted
  },
});
```

### Access control

```ts
// Make a file public
await uploadthing.setFileAccess(ctx, {
  key: "file_abc",
  access: { visibility: "public" },
});

// Restrict a folder to specific users
await uploadthing.setFolderAccess(ctx, {
  folder: "team-docs",
  access: {
    visibility: "restricted",
    allowUserIds: ["user_1", "user_2"],
  },
});

// Remove a file-level rule (falls back to folder rule)
await uploadthing.setFileAccess(ctx, { key: "file_abc", access: null });
```

File-level rules always override folder-level rules. Deny lists take precedence over allow lists.

### Filtering

```ts
// By tag
await uploadthing.listFiles(ctx, {
  ownerUserId: userId,
  tag: "avatar",
});

// By MIME type
await uploadthing.listFiles(ctx, {
  ownerUserId: userId,
  mimeType: "image/png",
});

// By folder
await uploadthing.listFiles(ctx, {
  ownerUserId: userId,
  folder: "documents",
});
```

### Usage stats

```ts
const stats = await uploadthing.getUsageStats(ctx, { userId });
// { totalFiles: 42, totalBytes: 1048576 }
```

### Cleanup

```ts
import { action } from "./_generated/server";

export const cleanup = action({
  handler: async (ctx) => {
    // Preview what would be deleted
    const preview = await uploadthing.cleanupExpired(ctx, { dryRun: true });

    // Actually delete expired records
    const result = await uploadthing.cleanupExpired(ctx, { batchSize: 100 });
    // { deletedCount: 12, keys: [...], hasMore: false }
  },
});
```

When `deleteRemoteOnExpire` is enabled in config, `cleanupExpired` also calls the UploadThing API to delete files from their servers before removing local records. If remote deletion fails, local records are preserved so the next run can retry. Check `remoteDeleteFailed` and `remoteDeleteError` in the return value for details.

## TTL Precedence

When determining a file's expiration, the first match wins:

1. Explicit `expiresAt` timestamp
2. Per-file `ttlMs`
3. `ttlByFileType` from config
4. `ttlByMimeType` from config
5. `defaultTtlMs` from config
6. No expiration

## API Reference

### `UploadThingFiles` class

| Method | Context | Description |
|---|---|---|
| `upsertFile(ctx, args)` | mutation | Insert or replace a file record by key |
| `getFile(ctx, args)` | query | Get a file by key with access control |
| `listFiles(ctx, args)` | query | List files for a specific user with filters |
| `listAllFiles(ctx, args)` | query | List files across all users with access control |
| `deleteFiles(ctx, args)` | mutation | Delete specific file records by key |
| `setFileAccess(ctx, args)` | mutation | Set or clear file-level access rules |
| `setFolderAccess(ctx, args)` | mutation | Set or clear folder-level access rules |
| `getFolderRule(ctx, args)` | query | Get access rule for a folder |
| `listFolderRules(ctx, args)` | query | List all folder access rules |
| `setConfig(ctx, args)` | mutation | Update component configuration |
| `getConfig(ctx)` | query | Read current configuration |
| `getUsageStats(ctx, args)` | query | Get total files and bytes for a user |
| `cleanupExpired(ctx, args)` | action | Delete expired file records (and optionally remote files) |
| `handleCallback(ctx, args)` | action | Handle an UploadThing webhook |

### Configuration options

| Option | Type | Description |
|---|---|---|
| `uploadthingApiKey` | `string` | API key for webhook verification and remote deletion |
| `defaultTtlMs` | `number` | Default TTL in milliseconds for all files |
| `ttlByMimeType` | `Record<string, number>` | TTL overrides by MIME type |
| `ttlByFileType` | `Record<string, number>` | TTL overrides by custom file type |
| `deleteRemoteOnExpire` | `boolean` | Delete files from UploadThing servers on expiration |
| `deleteBatchSize` | `number` | Max files per cleanup batch (default: 100) |

### `registerRoutes(http, component, options?)`

Mounts the UploadThing webhook at `/webhooks/uploadthing` (configurable via `options.path`).

### Exported types

- `AccessRule` -- `{ visibility, allowUserIds?, denyUserIds? }`
- `FileInfo` -- `{ key, url, name, size, mimeType, ... }`
- `FileUpsertOptions` -- `{ tags?, folder?, access?, metadata?, expiresAt?, ttlMs?, fileType? }`
- `ConfigUpdate` -- `{ uploadthingApiKey?, defaultTtlMs?, ttlByMimeType?, ... }`

Validators (`accessRuleValidator`, `fileInfoValidator`, etc.) are also exported for use in your own function definitions.

## Testing

This component exports a test helper for use with [`convex-test`](https://docs.convex.dev/testing/convex-test):

```ts
import { convexTest } from "convex-test";
import { register } from "@mzedstudio/uploadthingtrack/test";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("my test", async () => {
  const t = convexTest(schema, modules);
  register(t, "uploadthingFileTracker");
  // ... test your functions that use the component
});
```

## License

Apache-2.0
