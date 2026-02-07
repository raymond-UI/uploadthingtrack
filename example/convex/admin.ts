import { action, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { UploadThingFiles, accessRuleValidator } from "@convex-dev/uploadthing";
import { v } from "convex/values";

const uploadthing = new UploadThingFiles(components.uploadthingFileTracker);

export const setFileAccess = mutation({
  args: {
    key: v.string(),
    access: v.union(accessRuleValidator, v.null()),
  },
  handler: async (ctx, args) => {
    return await uploadthing.setFileAccess(ctx, args);
  },
});

export const setFolderAccess = mutation({
  args: {
    folder: v.string(),
    access: v.union(accessRuleValidator, v.null()),
  },
  handler: async (ctx, args) => {
    return await uploadthing.setFolderAccess(ctx, args);
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
    return await uploadthing.upsertFile(ctx, {
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
    });
  },
});

export const getFile = query({
  args: {
    key: v.string(),
    viewerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await uploadthing.getFile(ctx, args);
  },
});

export const checkAccess = action({
  args: {
    key: v.string(),
    viewerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await uploadthing.getFile(ctx, args);
  },
});
