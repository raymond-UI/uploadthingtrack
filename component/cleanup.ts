import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const cleanupExpired = action({
  args: {
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const limit = args.batchSize ?? globals.deleteBatchSize ?? 100;

    const expired = (await ctx.runQuery(internal.queries.expiredBatch, {
      now: Date.now(),
      limit,
    })) as { key: string; _id: string }[];

    const keys = expired.map((item) => item.key);

    if (!args.dryRun && keys.length > 0) {
      await ctx.runMutation(internal.files.deleteFilesByKey, { keys });
    }

    return {
      deletedCount: args.dryRun ? 0 : keys.length,
      keys,
      hasMore: expired.length >= limit,
    };
  },
});
