import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { accessRuleValidator } from "./types";

export default defineSchema({
  files: defineTable({
    key: v.string(),
    url: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    uploadedAt: v.number(),
    userId: v.string(),
    tags: v.optional(v.array(v.string())),
    folder: v.optional(v.string()),
    access: v.optional(accessRuleValidator),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
    replacedAt: v.optional(v.number()),
    customId: v.optional(v.string()),
    fileType: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_user", ["userId"])
    .index("by_user_uploadedAt", ["userId", "uploadedAt"])
    .index("by_folder", ["folder"])
    .index("by_expiresAt", ["expiresAt"]),

  folderRules: defineTable({
    folder: v.string(),
    access: accessRuleValidator,
    updatedAt: v.number(),
  }).index("by_folder", ["folder"]),

  globals: defineTable({
    singleton: v.literal("globals"),
    uploadthingApiKey: v.optional(v.string()),
    defaultTtlMs: v.optional(v.number()),
    ttlByMimeType: v.optional(v.record(v.string(), v.number())),
    ttlByFileType: v.optional(v.record(v.string(), v.number())),
    deleteRemoteOnExpire: v.optional(v.boolean()),
    deleteBatchSize: v.optional(v.number()),
  }).index("by_singleton", ["singleton"]),
});
