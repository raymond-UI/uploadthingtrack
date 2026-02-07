import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { canAccess } from "./access";

async function getFolderRule(ctx: any, folder?: string) {
  if (!folder) return undefined;
  const rule = await ctx.db
    .query("folderRules")
    .withIndex("by_folder", (q: any) => q.eq("folder", folder))
    .unique();
  return rule?.access;
}

export const getFileByKey = query({
  args: {
    key: v.string(),
    viewerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!file) return null;

    const folderRule = await getFolderRule(ctx, file.folder);
    const allowed = canAccess({
      ownerId: file.userId,
      viewerId: args.viewerUserId,
      fileRule: file.access,
      folderRule,
    });

    if (!allowed) return null;

    return file;
  },
});

export const listFiles = query({
  args: {
    ownerUserId: v.string(),
    viewerUserId: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    tag: v.optional(v.string()),
    folder: v.optional(v.string()),
    includeExpired: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("files")
      .withIndex("by_user_uploadedAt", (q: any) => q.eq("userId", args.ownerUserId))
      .order("desc");

    const results = [] as any[];
    const now = Date.now();
    const limit = args.limit ?? 50;
    const folderCache = new Map<string, any>();

    for await (const file of query) {
      if (!args.includeExpired && file.expiresAt !== undefined && file.expiresAt <= now) {
        continue;
      }
      if (args.mimeType && file.mimeType !== args.mimeType) {
        continue;
      }
      if (args.tag && !file.tags?.includes(args.tag)) {
        continue;
      }
      if (args.folder && file.folder !== args.folder) {
        continue;
      }

      let folderRule;
      if (file.folder) {
        if (folderCache.has(file.folder)) {
          folderRule = folderCache.get(file.folder);
        } else {
          folderRule = await getFolderRule(ctx, file.folder);
          folderCache.set(file.folder, folderRule);
        }
      }
      const allowed = canAccess({
        ownerId: file.userId,
        viewerId: args.viewerUserId,
        fileRule: file.access,
        folderRule,
      });

      if (!allowed) continue;

      results.push(file);
      if (results.length >= limit) break;
    }

    return results;
  },
});

export const expiredBatch = internalQuery({
  args: {
    now: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("files")
      .withIndex("by_expiresAt", (q: any) => q.lte("expiresAt", args.now))
      .order("asc");

    const expired = [] as { key: string; _id: string }[];
    for await (const file of query) {
      expired.push({ key: file.key, _id: file._id });
      if (expired.length >= args.limit) break;
    }

    return expired;
  },
});
