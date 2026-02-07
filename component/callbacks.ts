import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function normalizeSignature(signature: string): string {
  const trimmed = signature.trim();
  if (trimmed.startsWith("hmac-sha256=")) {
    return trimmed.slice("hmac-sha256=".length);
  }
  return trimmed;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const chunk = hex.slice(i * 2, i * 2 + 2);
    const value = Number.parseInt(chunk, 16);
    if (Number.isNaN(value)) return null;
    bytes[i] = value;
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hmacSha256Hex(key: string, message: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto unavailable in this runtime.");
  }
  const encoder = new TextEncoder();
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );
  const bytes = new Uint8Array(signature);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(rawBody: string, signature: string, apiKey: string) {
  const expected = await hmacSha256Hex(apiKey, rawBody);
  const actual = normalizeSignature(signature);

  const expectedBytes = hexToBytes(expected);
  const actualBytes = hexToBytes(actual);
  if (!expectedBytes || !actualBytes) return false;

  return timingSafeEqualBytes(expectedBytes, actualBytes);
}

function extractUserId(metadata: any): string | undefined {
  if (!metadata) return undefined;
  return (
    metadata.userId ??
    metadata.ownerId ??
    metadata.uploadedBy ??
    metadata.user
  );
}

function extractTags(metadata: any): string[] | undefined {
  if (!metadata) return undefined;
  if (Array.isArray(metadata.tags)) return metadata.tags;
  if (typeof metadata.tags === "string") {
    return metadata.tags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter(Boolean);
  }
  return undefined;
}

function toNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

type CallbackResult =
  | { ok: true; fileId: string; hook: string }
  | { ok: false; error: string };

export const handleUploadthingCallback = action({
  args: {
    rawBody: v.string(),
    signature: v.string(),
    hook: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CallbackResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const apiKey = args.apiKey ?? globals.uploadthingApiKey;
    if (!apiKey) {
      throw new Error("UploadThing API key not configured.");
    }

    const isValid = await verifySignature(args.rawBody, args.signature, apiKey);
    if (!isValid) {
      return { ok: false, error: "invalid_signature" };
    }

    let payload: any;
    try {
      payload = JSON.parse(args.rawBody);
    } catch (error) {
      return { ok: false, error: "invalid_json" };
    }

    const file = payload.file ?? payload;
    const metadata = payload.metadata ?? file.metadata ?? {};

    const key = file.key ?? file.fileKey ?? file.id;
    const url = file.url ?? file.fileUrl;
    const name = file.name ?? file.filename ?? file.fileName;
    const size = toNumber(file.size ?? file.fileSize);
    const mimeType = file.type ?? file.mimeType ?? file.contentType;
    const customId = file.customId ?? file.customID;
    const fileType = file.fileType ?? metadata.fileType;

    if (!key || !url || !name || size === undefined || !mimeType) {
      return { ok: false, error: "missing_file_fields" };
    }

    const userId = extractUserId(metadata) ?? payload.userId;
    if (!userId) {
      return { ok: false, error: "missing_user_id" };
    }

    const options = {
      tags: extractTags(metadata),
      folder: metadata.folder,
      access: metadata.access,
      metadata,
      expiresAt: toNumber(metadata.expiresAt),
      ttlMs: toNumber(metadata.ttlMs),
      fileType,
    };

    const fileId: string = await ctx.runMutation(internal.files.internalUpsertFile, {
      file: {
        key,
        url,
        name,
        size,
        mimeType,
        customId,
        fileType,
      },
      userId,
      options,
    });

    return { ok: true, fileId, hook: args.hook };
  },
});
