import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const UT_DELETE_ENDPOINT = "https://api.uploadthing.com/v6/deleteFiles";
const UT_DELETE_CHUNK_SIZE = 100;

async function deleteRemoteFiles(
  apiKey: string,
  fileKeys: string[],
): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < fileKeys.length; i += UT_DELETE_CHUNK_SIZE) {
    const chunk = fileKeys.slice(i, i + UT_DELETE_CHUNK_SIZE);
    try {
      const response = await fetch(UT_DELETE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": apiKey,
        },
        body: JSON.stringify({ fileKeys: chunk }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "unknown");
        return {
          success: false,
          error: `UploadThing API returned ${response.status}: ${text}`,
        };
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: `UploadThing API request failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
  return { success: true };
}

export const cleanupExpired = action({
  args: {
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    deletedCount: v.number(),
    keys: v.array(v.string()),
    hasMore: v.boolean(),
    remoteDeletedCount: v.optional(v.number()),
    remoteDeleteFailed: v.optional(v.boolean()),
    remoteDeleteError: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    deletedCount: number;
    keys: string[];
    hasMore: boolean;
    remoteDeletedCount?: number;
    remoteDeleteFailed?: boolean;
    remoteDeleteError?: string;
  }> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const limit = args.batchSize ?? globals.deleteBatchSize ?? 100;

    const expired = (await ctx.runQuery(internal.queries.expiredBatch, {
      now: Date.now(),
      limit,
    })) as { key: string; _id: string }[];

    const keys = expired.map((item) => item.key);

    if (args.dryRun || keys.length === 0) {
      return {
        deletedCount: 0,
        keys,
        hasMore: expired.length >= limit,
      };
    }

    let remoteDeletedCount: number | undefined;
    let remoteDeleteFailed: boolean | undefined;
    let remoteDeleteError: string | undefined;

    if (globals.deleteRemoteOnExpire) {
      if (!globals.uploadthingApiKey) {
        remoteDeleteFailed = true;
        remoteDeleteError =
          "deleteRemoteOnExpire is enabled but no uploadthingApiKey is configured";
      } else {
        const result = await deleteRemoteFiles(globals.uploadthingApiKey, keys);
        if (result.success) {
          remoteDeletedCount = keys.length;
        } else {
          // Remote deletion failed — preserve local records so the next run can retry
          return {
            deletedCount: 0,
            keys,
            hasMore: expired.length >= limit,
            remoteDeletedCount: 0,
            remoteDeleteFailed: true,
            remoteDeleteError: result.error,
          };
        }
      }
    }

    await ctx.runMutation(internal.files.deleteFilesByKey, { keys });

    return {
      deletedCount: keys.length,
      keys,
      hasMore: expired.length >= limit,
      ...(remoteDeletedCount !== undefined && { remoteDeletedCount }),
      ...(remoteDeleteFailed !== undefined && { remoteDeleteFailed }),
      ...(remoteDeleteError !== undefined && { remoteDeleteError }),
    };
  },
});
