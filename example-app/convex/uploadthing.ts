import { action, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const setUploadthingConfig = mutation({
  args: {
    uploadthingApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.uploadthingFileTracker.config.setConfig,
      {
        config: {
          uploadthingApiKey: args.uploadthingApiKey,
        },
        replace: false,
      },
    );
  },
});

export const listMyFiles = query({
  args: {
    userId: v.string(),
    tag: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.uploadthingFileTracker.queries.listFiles, {
      ownerUserId: args.userId,
      viewerUserId: args.userId,
      tag: args.tag,
      mimeType: args.mimeType,
    });
  },
});

export const getMyUsage = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.uploadthingFileTracker.stats.getUsageStats, {
      userId: args.userId,
    });
  },
});

export const cleanupExpiredFiles = action({
  args: {
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(
      components.uploadthingFileTracker.cleanup.cleanupExpired,
      {
        batchSize: args.batchSize,
        dryRun: args.dryRun,
      },
    );
  },
});
