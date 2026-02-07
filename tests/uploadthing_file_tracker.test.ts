import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import { createHmac } from "node:crypto";

import schema from "../src/component/schema";

const modules = import.meta.glob("../src/component/**/*.ts");

function makeTest() {
  return convexTest(schema, modules);
}

const baseFile = {
  key: "file_1",
  url: "https://example.com/file.png",
  name: "file.png",
  size: 1024,
  mimeType: "image/png",
};

const apiKey = "test_uploadthing_key";

function sign(body: string, key: string, withPrefix = true) {
  const signature = createHmac("sha256", key).update(body).digest("hex");
  return withPrefix ? `hmac-sha256=${signature}` : signature;
}

function makeCallbackPayload(overrides?: Partial<any>) {
  return {
    file: {
      key: "cb_key_1",
      url: "https://example.com/callback.png",
      name: "callback.png",
      size: 2048,
      type: "image/png",
    },
    metadata: {
      userId: "callback_user",
      folder: "callbacks",
      tags: ["cb"],
    },
    ...overrides,
  };
}

describe("uploadthing file tracker", () => {
  test("upserts and replaces by key", async () => {
    const t = makeTest();

    const firstId = await t.mutation("files:upsertFile", {
      file: baseFile,
      userId: "user_a",
      options: { tags: ["avatar"], folder: "profiles" },
    });

    const secondId = await t.mutation("files:upsertFile", {
      file: {
        ...baseFile,
        url: "https://example.com/file_v2.png",
      },
      userId: "user_a",
      options: { tags: ["avatar", "v2"], folder: "profiles" },
    });

    expect(secondId).toEqual(firstId);

    const file = await t.query("queries:getFileByKey", {
      key: baseFile.key,
      viewerUserId: "user_a",
    });

    expect(file?.url).toBe("https://example.com/file_v2.png");
    expect(file?.replacedAt).toBeTypeOf("number");
  });

  test("enforces file-level access rules", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "private_file" },
      userId: "owner",
    });

    await t.mutation("files:setFileAccess", {
      key: "private_file",
      access: {
        visibility: "restricted",
        allowUserIds: ["viewer"],
      },
    });

    const allowed = await t.query("queries:getFileByKey", {
      key: "private_file",
      viewerUserId: "viewer",
    });
    const denied = await t.query("queries:getFileByKey", {
      key: "private_file",
      viewerUserId: "stranger",
    });

    expect(allowed).not.toBeNull();
    expect(denied).toBeNull();
  });

  test("deny list overrides allow list", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "deny_file" },
      userId: "owner",
    });

    await t.mutation("files:setFileAccess", {
      key: "deny_file",
      access: {
        visibility: "restricted",
        allowUserIds: ["viewer"],
        denyUserIds: ["viewer"],
      },
    });

    const denied = await t.query("queries:getFileByKey", {
      key: "deny_file",
      viewerUserId: "viewer",
    });

    expect(denied).toBeNull();
  });

  test("file rule overrides folder rule", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "folder_override" },
      userId: "owner",
      options: { folder: "public" },
    });

    await t.mutation("files:setFolderAccess", {
      folder: "public",
      access: { visibility: "public" },
    });

    await t.mutation("files:setFileAccess", {
      key: "folder_override",
      access: { visibility: "private" },
    });

    const viewer = await t.query("queries:getFileByKey", {
      key: "folder_override",
      viewerUserId: "viewer",
    });

    expect(viewer).toBeNull();
  });

  test("clearing file access removes public visibility", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "clear_access" },
      userId: "owner",
    });

    await t.mutation("files:setFileAccess", {
      key: "clear_access",
      access: { visibility: "public" },
    });

    const publicView = await t.query("queries:getFileByKey", {
      key: "clear_access",
      viewerUserId: "viewer",
    });
    expect(publicView).not.toBeNull();

    await t.mutation("files:setFileAccess", {
      key: "clear_access",
      access: null,
    });

    const afterClear = await t.query("queries:getFileByKey", {
      key: "clear_access",
      viewerUserId: "viewer",
    });
    expect(afterClear).toBeNull();
  });

  test("folder rules apply when file rule missing", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "folder_file" },
      userId: "owner",
      options: { folder: "public" },
    });

    await t.mutation("files:setFolderAccess", {
      folder: "public",
      access: { visibility: "public" },
    });

    const publicView = await t.query("queries:getFileByKey", {
      key: "folder_file",
    });

    expect(publicView).not.toBeNull();
  });

  test("TTL precedence (explicit expiresAt wins)", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        defaultTtlMs: 60_000,
        ttlByMimeType: { "image/png": 10_000 },
        ttlByFileType: { avatar: 5_000 },
      },
      replace: true,
    });

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "ttl_explicit" },
      userId: "owner",
      options: {
        expiresAt: 1_000_000,
        ttlMs: 1,
        fileType: "avatar",
      },
    });

    const file = await t.query("queries:getFileByKey", {
      key: "ttl_explicit",
      viewerUserId: "owner",
    });

    expect(file?.expiresAt).toBe(1_000_000);
  });

  test("TTL precedence (ttlMs overrides type defaults)", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        defaultTtlMs: 60_000,
        ttlByMimeType: { "image/png": 10_000 },
        ttlByFileType: { avatar: 5_000 },
      },
      replace: true,
    });

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "ttl_ms", uploadedAt: 1_000 },
      userId: "owner",
      options: {
        ttlMs: 7_000,
        fileType: "avatar",
      },
    });

    const file = await t.query("queries:getFileByKey", {
      key: "ttl_ms",
      viewerUserId: "owner",
    });

    expect(file?.expiresAt).toBe(8_000);
  });

  test("TTL precedence (fileType overrides mimeType and default)", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        defaultTtlMs: 60_000,
        ttlByMimeType: { "image/png": 10_000 },
        ttlByFileType: { avatar: 5_000 },
      },
      replace: true,
    });

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "ttl_filetype", uploadedAt: 5_000 },
      userId: "owner",
      options: { fileType: "avatar" },
    });

    const file = await t.query("queries:getFileByKey", {
      key: "ttl_filetype",
      viewerUserId: "owner",
    });

    expect(file?.expiresAt).toBe(10_000);
  });

  test("lists files with filters and reports usage stats", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "list_1" },
      userId: "owner",
      options: { tags: ["one"], folder: "assets" },
    });

    await t.mutation("files:upsertFile", {
      file: {
        ...baseFile,
        key: "list_2",
        mimeType: "image/jpeg",
        size: 2048,
      },
      userId: "owner",
      options: { tags: ["two"], folder: "assets" },
    });

    const filtered = await t.query("queries:listFiles", {
      ownerUserId: "owner",
      viewerUserId: "owner",
      tag: "two",
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0]?.key).toBe("list_2");

    const jpegOnly = await t.query("queries:listFiles", {
      ownerUserId: "owner",
      viewerUserId: "owner",
      mimeType: "image/jpeg",
    });

    expect(jpegOnly.length).toBe(1);
    expect(jpegOnly[0]?.key).toBe("list_2");

    const stats = await t.query("stats:getUsageStats", { userId: "owner" });
    expect(stats.totalFiles).toBe(2);
    expect(stats.totalBytes).toBe(3072);
  });

  test("listFiles excludes expired unless includeExpired=true", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "expired_list" },
      userId: "owner",
      options: { expiresAt: Date.now() - 1_000 },
    });

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "active_list" },
      userId: "owner",
      options: { expiresAt: Date.now() + 60_000 },
    });

    const defaultList = await t.query("queries:listFiles", {
      ownerUserId: "owner",
      viewerUserId: "owner",
    });

    expect(defaultList.some((file) => file.key === "expired_list")).toBe(false);

    const includeExpired = await t.query("queries:listFiles", {
      ownerUserId: "owner",
      viewerUserId: "owner",
      includeExpired: true,
    });

    expect(includeExpired.some((file) => file.key === "expired_list")).toBe(true);
  });

  test("cleanup supports dryRun and batchSize", async () => {
    const t = makeTest();

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "expired_1" },
      userId: "owner",
      options: { expiresAt: Date.now() - 10_000 },
    });

    await t.mutation("files:upsertFile", {
      file: { ...baseFile, key: "expired_2" },
      userId: "owner",
      options: { expiresAt: Date.now() - 9_000 },
    });

    const dryRun = await t.action("cleanup:cleanupExpired", {
      batchSize: 1,
      dryRun: true,
    });

    expect(dryRun.deletedCount).toBe(0);
    expect(dryRun.keys.length).toBe(1);

    const afterDryRun = await t.query("queries:listFiles", {
      ownerUserId: "owner",
      viewerUserId: "owner",
      includeExpired: true,
    });

    expect(afterDryRun.length).toBe(2);

    const result = await t.action("cleanup:cleanupExpired", { batchSize: 1 });
    expect(result.deletedCount).toBe(1);
  });

  test("callback validates signature and stores metadata", async () => {
    const t = makeTest();

    const payload = makeCallbackPayload();
    const rawBody = JSON.stringify(payload);

    const result = await t.action("callbacks:handleUploadthingCallback", {
      rawBody,
      signature: sign(rawBody, apiKey, true),
      hook: "uploadthing-upload-complete",
      apiKey,
    });

    expect(result.ok).toBe(true);

    const file = await t.query("queries:getFileByKey", {
      key: payload.file.key,
      viewerUserId: payload.metadata.userId,
    });

    expect(file?.userId).toBe(payload.metadata.userId);
    expect(file?.folder).toBe("callbacks");
    expect(file?.tags).toEqual(["cb"]);
  });

  test("callback accepts signature without prefix", async () => {
    const t = makeTest();

    const payload = makeCallbackPayload({
      file: { ...makeCallbackPayload().file, key: "cb_key_2" },
    });
    const rawBody = JSON.stringify(payload);

    const result = await t.action("callbacks:handleUploadthingCallback", {
      rawBody,
      signature: sign(rawBody, apiKey, false),
      hook: "uploadthing-upload-complete",
      apiKey,
    });

    expect(result.ok).toBe(true);
  });

  test("callback rejects invalid signature", async () => {
    const t = makeTest();

    const rawBody = JSON.stringify(makeCallbackPayload());

    const result = await t.action("callbacks:handleUploadthingCallback", {
      rawBody,
      signature: "hmac-sha256=bad",
      hook: "uploadthing-upload-complete",
      apiKey,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_signature");
  });

  test("callback throws when api key is missing", async () => {
    const t = makeTest();

    const rawBody = JSON.stringify(makeCallbackPayload());

    await expect(
      t.action("callbacks:handleUploadthingCallback", {
        rawBody,
        signature: sign(rawBody, apiKey),
        hook: "uploadthing-upload-complete",
      }),
    ).rejects.toThrow("UploadThing API key not configured.");
  });

  test("callback requires userId and required fields", async () => {
    const t = makeTest();

    const missingUser = makeCallbackPayload({ metadata: {} });
    const missingUserBody = JSON.stringify(missingUser);
    const missingUserResult = await t.action(
      "callbacks:handleUploadthingCallback",
      {
        rawBody: missingUserBody,
        signature: sign(missingUserBody, apiKey),
        hook: "uploadthing-upload-complete",
        apiKey,
      },
    );

    expect(missingUserResult.ok).toBe(false);
    expect(missingUserResult.error).toBe("missing_user_id");

    const missingFields = makeCallbackPayload({
      file: { key: "x" },
      metadata: { userId: "callback_user" },
    });
    const missingFieldsBody = JSON.stringify(missingFields);
    const missingFieldsResult = await t.action(
      "callbacks:handleUploadthingCallback",
      {
        rawBody: missingFieldsBody,
        signature: sign(missingFieldsBody, apiKey),
        hook: "uploadthing-upload-complete",
        apiKey,
      },
    );

    expect(missingFieldsResult.ok).toBe(false);
    expect(missingFieldsResult.error).toBe("missing_file_fields");
  });

  test("callback replaces file when key matches", async () => {
    const t = makeTest();

    const payload = makeCallbackPayload({
      file: { ...makeCallbackPayload().file, key: "cb_replace" },
    });
    const rawBody = JSON.stringify(payload);

    await t.action("callbacks:handleUploadthingCallback", {
      rawBody,
      signature: sign(rawBody, apiKey),
      hook: "uploadthing-upload-complete",
      apiKey,
    });

    const payload2 = makeCallbackPayload({
      file: {
        ...makeCallbackPayload().file,
        key: "cb_replace",
        url: "https://example.com/replaced.png",
      },
    });
    const rawBody2 = JSON.stringify(payload2);

    await t.action("callbacks:handleUploadthingCallback", {
      rawBody: rawBody2,
      signature: sign(rawBody2, apiKey),
      hook: "uploadthing-upload-complete",
      apiKey,
    });

    const file = await t.query("queries:getFileByKey", {
      key: "cb_replace",
      viewerUserId: "callback_user",
    });

    expect(file?.url).toBe("https://example.com/replaced.png");
    expect(file?.replacedAt).toBeTypeOf("number");
  });
});
