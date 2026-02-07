import { action, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

const accessRule = v.object({
  visibility: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("restricted"),
  ),
  allowUserIds: v.optional(v.array(v.string())),
  denyUserIds: v.optional(v.array(v.string())),
});

export const setFileAccess = mutation({
  args: {
    key: v.string(),
    access: v.union(accessRule, v.null()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.uploadthingFileTracker.files.setFileAccess,
      args,
    );
  },
});

export const setFolderAccess = mutation({
  args: {
    folder: v.string(),
    access: v.union(accessRule, v.null()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.uploadthingFileTracker.files.setFolderAccess,
      args,
    );
  },
});

export const upsertFile = mutation({
  args: {
    key: v.string(),
    url: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    userId: v.string(),
    folder: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.uploadthingFileTracker.files.upsertFile,
      {
        file: {
          key: args.key,
          url: args.url,
          name: args.name,
          size: args.size,
          mimeType: args.mimeType,
        },
        userId: args.userId,
        options: {
          folder: args.folder,
          tags: args.tags,
        },
      },
    );
  },
});

export const getFile = query({
  args: {
    key: v.string(),
    viewerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.uploadthingFileTracker.queries.getFileByKey,
      args,
    );
  },
});

export const checkAccess = action({
  args: {
    key: v.string(),
    viewerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.uploadthingFileTracker.queries.getFileByKey,
      args,
    );
  },
});
