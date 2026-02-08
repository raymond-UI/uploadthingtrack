import { internalQuery, mutation, query } from "./_generated/server";
import type { DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { configUpdateValidator } from "./types";

const GLOBALS_ID = "globals" as const;

export type Globals = {
  uploadthingApiKey?: string;
  defaultTtlMs?: number;
  ttlByMimeType?: Record<string, number>;
  ttlByFileType?: Record<string, number>;
  deleteRemoteOnExpire?: boolean;
  deleteBatchSize?: number;
};

async function readGlobals(db: DatabaseReader): Promise<Globals> {
  const record = await db
    .query("globals")
    .withIndex("by_singleton", (q) => q.eq("singleton", GLOBALS_ID))
    .unique();

  if (!record) return {};

  return {
    uploadthingApiKey: record.uploadthingApiKey,
    defaultTtlMs: record.defaultTtlMs,
    ttlByMimeType: record.ttlByMimeType,
    ttlByFileType: record.ttlByFileType,
    deleteRemoteOnExpire: record.deleteRemoteOnExpire,
    deleteBatchSize: record.deleteBatchSize,
  };
}

export async function loadGlobals(ctx: { db: DatabaseReader }): Promise<Globals> {
  return await readGlobals(ctx.db);
}

export const getGlobalsInternal = internalQuery({
  args: {},
  returns: v.object({
    uploadthingApiKey: v.optional(v.string()),
    defaultTtlMs: v.optional(v.number()),
    ttlByMimeType: v.optional(v.record(v.string(), v.number())),
    ttlByFileType: v.optional(v.record(v.string(), v.number())),
    deleteRemoteOnExpire: v.optional(v.boolean()),
    deleteBatchSize: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    return await readGlobals(ctx.db);
  },
});

export function computeExpiresAt(params: {
  now: number;
  mimeType?: string;
  fileType?: string;
  expiresAt?: number;
  ttlMs?: number;
  globals?: Globals;
}): number | undefined {
  if (params.expiresAt !== undefined) return params.expiresAt;
  if (params.ttlMs !== undefined) return params.now + params.ttlMs;

  const globals = params.globals;
  if (!globals) return undefined;

  if (params.fileType && globals.ttlByFileType?.[params.fileType] !== undefined) {
    return params.now + globals.ttlByFileType[params.fileType];
  }

  if (params.mimeType && globals.ttlByMimeType?.[params.mimeType] !== undefined) {
    return params.now + globals.ttlByMimeType[params.mimeType];
  }

  if (globals.defaultTtlMs !== undefined) {
    return params.now + globals.defaultTtlMs;
  }

  return undefined;
}

export const setConfig = mutation({
  args: {
    config: configUpdateValidator,
    replace: v.optional(v.boolean()),
  },
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("globals")
      .withIndex("by_singleton", (q) => q.eq("singleton", GLOBALS_ID))
      .unique();

    if (!existing) {
      const record = { singleton: GLOBALS_ID, ...args.config };
      await ctx.db.insert("globals", record);
      return { created: true };
    }

    const { _id, _creationTime, ...rest } = existing;
    const update = args.replace
      ? { singleton: GLOBALS_ID, ...args.config }
      : { ...rest, ...args.config };

    await ctx.db.patch(_id, update);
    return { created: false };
  },
});

export const getConfig = query({
  args: {},
  returns: v.object({
    defaultTtlMs: v.optional(v.number()),
    ttlByMimeType: v.optional(v.record(v.string(), v.number())),
    ttlByFileType: v.optional(v.record(v.string(), v.number())),
    deleteRemoteOnExpire: v.optional(v.boolean()),
    deleteBatchSize: v.optional(v.number()),
    hasApiKey: v.boolean(),
  }),
  handler: async (ctx) => {
    const globals = await loadGlobals(ctx);
    return {
      defaultTtlMs: globals.defaultTtlMs,
      ttlByMimeType: globals.ttlByMimeType,
      ttlByFileType: globals.ttlByFileType,
      deleteRemoteOnExpire: globals.deleteRemoteOnExpire,
      deleteBatchSize: globals.deleteBatchSize,
      hasApiKey: Boolean(globals.uploadthingApiKey),
    };
  },
});
