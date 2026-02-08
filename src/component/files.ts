import { mutation, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { computeExpiresAt, loadGlobals } from "./config";
import type { AccessRule } from "./types";
import { accessRuleValidator, fileInfoValidator, fileUpsertOptionsValidator } from "./types";
import { sanitizeAccessRule } from "./access";

async function upsertFileRecord(ctx: MutationCtx, params: {
  file: {
    key: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
    uploadedAt?: number;
    fileType?: string;
    customId?: string;
  };
  userId: string;
  options?: {
    tags?: string[];
    folder?: string;
    access?: AccessRule;
    metadata?: Record<string, unknown>;
    expiresAt?: number;
    ttlMs?: number;
    fileType?: string;
  };
}) {
  const now = Date.now();
  const globals = await loadGlobals(ctx);
  const uploadedAt = params.file.uploadedAt ?? now;
  const fileType = params.options?.fileType ?? params.file.fileType;
  const expiresAt = computeExpiresAt({
    now: uploadedAt,
    mimeType: params.file.mimeType,
    fileType,
    expiresAt: params.options?.expiresAt,
    ttlMs: params.options?.ttlMs,
    globals,
  });

  const existing = await ctx.db
    .query("files")
    .withIndex("by_key", (q) => q.eq("key", params.file.key))
    .unique();

  const patch: Record<string, unknown> = {
    url: params.file.url,
    name: params.file.name,
    size: params.file.size,
    mimeType: params.file.mimeType,
    uploadedAt,
    userId: params.userId,
  };

  if (params.file.customId !== undefined) patch.customId = params.file.customId;
  if (fileType !== undefined) patch.fileType = fileType;

  if (params.options?.tags !== undefined) patch.tags = params.options.tags;
  if (params.options?.folder !== undefined) patch.folder = params.options.folder;
  if (params.options?.metadata !== undefined) patch.metadata = params.options.metadata;
  if (params.options?.access !== undefined) {
    patch.access = sanitizeAccessRule(params.options.access);
  }
  if (expiresAt !== undefined) patch.expiresAt = expiresAt;

  if (existing) {
    patch.replacedAt = now;
    await ctx.db.patch(existing._id, patch as any);
    return existing._id;
  }

  return await ctx.db.insert("files", {
    key: params.file.key,
    ...patch,
  } as any);
}

export const upsertFile = mutation({
  args: {
    file: fileInfoValidator,
    userId: v.string(),
    options: v.optional(fileUpsertOptionsValidator),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    return await upsertFileRecord(ctx, {
      file: args.file,
      userId: args.userId,
      options: args.options,
    });
  },
});

export const internalUpsertFile = internalMutation({
  args: {
    file: fileInfoValidator,
    userId: v.string(),
    options: v.optional(fileUpsertOptionsValidator),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    return await upsertFileRecord(ctx, {
      file: args.file,
      userId: args.userId,
      options: args.options,
    });
  },
});

export const setFileAccess = mutation({
  args: {
    key: v.string(),
    access: v.optional(v.union(accessRuleValidator, v.null())),
  },
  returns: v.union(v.id("files"), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      access: args.access === null ? undefined : sanitizeAccessRule(args.access),
    });

    return existing._id;
  },
});

export const setFolderAccess = mutation({
  args: {
    folder: v.string(),
    access: v.optional(v.union(accessRuleValidator, v.null())),
  },
  returns: v.union(v.id("folderRules"), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("folderRules")
      .withIndex("by_folder", (q) => q.eq("folder", args.folder))
      .unique();

    if (args.access === null) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    const access = sanitizeAccessRule(args.access);
    if (!access) {
      return null;
    }

    const updatedAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        access,
        updatedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("folderRules", {
      folder: args.folder,
      access,
      updatedAt,
    });
  },
});

export const deleteFiles = mutation({
  args: {
    keys: v.array(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let count = 0;
    for (const key of args.keys) {
      const existing = await ctx.db
        .query("files")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) {
        await ctx.db.delete(existing._id);
        count++;
      }
    }
    return count;
  },
});

export const deleteFilesByKey = internalMutation({
  args: {
    keys: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const key of args.keys) {
      const existing = await ctx.db
        .query("files")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
    return null;
  },
});
