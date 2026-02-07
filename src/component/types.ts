import { v, type Infer } from "convex/values";

export const accessRuleValidator = v.object({
  visibility: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("restricted"),
  ),
  allowUserIds: v.optional(v.array(v.string())),
  denyUserIds: v.optional(v.array(v.string())),
});

export type AccessRule = Infer<typeof accessRuleValidator>;

export const fileInfoValidator = v.object({
  key: v.string(),
  url: v.string(),
  name: v.string(),
  size: v.number(),
  mimeType: v.string(),
  uploadedAt: v.optional(v.number()),
  fileType: v.optional(v.string()),
  customId: v.optional(v.string()),
});

export type FileInfo = Infer<typeof fileInfoValidator>;

export const fileUpsertOptionsValidator = v.object({
  tags: v.optional(v.array(v.string())),
  folder: v.optional(v.string()),
  access: v.optional(accessRuleValidator),
  metadata: v.optional(v.any()),
  expiresAt: v.optional(v.number()),
  ttlMs: v.optional(v.number()),
  fileType: v.optional(v.string()),
});

export type FileUpsertOptions = Infer<typeof fileUpsertOptionsValidator>;

export const configUpdateValidator = v.object({
  uploadthingApiKey: v.optional(v.string()),
  defaultTtlMs: v.optional(v.number()),
  ttlByMimeType: v.optional(v.record(v.string(), v.number())),
  ttlByFileType: v.optional(v.record(v.string(), v.number())),
  deleteRemoteOnExpire: v.optional(v.boolean()),
  deleteBatchSize: v.optional(v.number()),
});

export type ConfigUpdate = Infer<typeof configUpdateValidator>;
