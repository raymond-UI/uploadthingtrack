import { query, internalQuery } from "./_generated/server";
import type { DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { AccessRule } from "./types";
import { canAccess } from "./access";
import { fileDocValidator, folderRuleDocValidator } from "./types";

async function getFolderRule(db: DatabaseReader, folder?: string) {
  if (!folder) return undefined;
  const rule = await db
    .query("folderRules")
    .withIndex("by_folder", (q) => q.eq("folder", folder))
    .unique();
  return rule?.access;
}

export const getFileByKey = query({
  args: {
    key: v.string(),
    viewerUserId: v.optional(v.string()),
  },
  returns: v.union(fileDocValidator, v.null()),
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!file) return null;

    const folderRule = await getFolderRule(ctx.db, file.folder);
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
  returns: v.array(fileDocValidator),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("files")
      .withIndex("by_user_uploadedAt", (q) => q.eq("userId", args.ownerUserId))
      .order("desc");

    const results: Doc<"files">[] = [];
    const now = Date.now();
    const limit = args.limit ?? 50;
    const folderCache = new Map<string, AccessRule | undefined>();

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
          folderRule = await getFolderRule(ctx.db, file.folder);
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

export const listAllFiles = query({
  args: {
    viewerUserId: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    tag: v.optional(v.string()),
    folder: v.optional(v.string()),
    includeExpired: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(fileDocValidator),
  handler: async (ctx, args) => {
    const base = args.folder !== undefined
      ? ctx.db.query("files").withIndex("by_folder", (q) => q.eq("folder", args.folder))
      : ctx.db.query("files");

    const results: Doc<"files">[] = [];
    const now = Date.now();
    const limit = args.limit ?? 50;
    const folderCache = new Map<string, AccessRule | undefined>();

    for await (const file of base.order("desc")) {
      if (!args.includeExpired && file.expiresAt !== undefined && file.expiresAt <= now) {
        continue;
      }
      if (args.mimeType && file.mimeType !== args.mimeType) {
        continue;
      }
      if (args.tag && !file.tags?.includes(args.tag)) {
        continue;
      }

      let folderRule;
      if (file.folder) {
        if (folderCache.has(file.folder)) {
          folderRule = folderCache.get(file.folder);
        } else {
          folderRule = await getFolderRule(ctx.db, file.folder);
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

export const getFolderRuleByFolder = query({
  args: {
    folder: v.string(),
  },
  returns: v.union(folderRuleDocValidator, v.null()),
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("folderRules")
        .withIndex("by_folder", (q) => q.eq("folder", args.folder))
        .unique()) ?? null
    );
  },
});

export const listFolderRules = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(folderRuleDocValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const rules = [];
    for await (const rule of ctx.db.query("folderRules")) {
      rules.push(rule);
      if (rules.length >= limit) break;
    }
    return rules;
  },
});

export const expiredBatch = internalQuery({
  args: {
    now: v.number(),
    limit: v.number(),
  },
  returns: v.array(v.object({ key: v.string(), _id: v.id("files") })),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("files")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", args.now))
      .order("asc");

    const expired: { key: string; _id: Id<"files"> }[] = [];
    for await (const file of query) {
      expired.push({ key: file.key, _id: file._id });
      if (expired.length >= args.limit) break;
    }

    return expired;
  },
});
