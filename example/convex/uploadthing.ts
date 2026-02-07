import { action, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { UploadThingFiles } from "@convex-dev/uploadthing";
import { v } from "convex/values";

const uploadthing = new UploadThingFiles(components.uploadthingFileTracker);

export const setUploadthingConfig = mutation({
  args: {
    uploadthingApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await uploadthing.setConfig(ctx, {
      config: {
        uploadthingApiKey: args.uploadthingApiKey,
      },
      replace: false,
    });
  },
});

export const listMyFiles = query({
  args: {
    userId: v.string(),
    tag: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await uploadthing.listFiles(ctx, {
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
    return await uploadthing.getUsageStats(ctx, {
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
    return await uploadthing.cleanupExpired(ctx, {
      batchSize: args.batchSize,
      dryRun: args.dryRun,
    });
  },
});
