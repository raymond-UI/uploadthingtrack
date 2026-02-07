/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    callbacks: {
      handleUploadthingCallback: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; hook: string; rawBody: string; signature: string },
        | { fileId: string; hook: string; ok: true }
        | { error: string; ok: false },
        Name
      >;
    };
    cleanup: {
      cleanupExpired: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean },
        { deletedCount: number; hasMore: boolean; keys: Array<string> },
        Name
      >;
    };
    config: {
      getConfig: FunctionReference<
        "query",
        "internal",
        {},
        {
          defaultTtlMs?: number;
          deleteBatchSize?: number;
          deleteRemoteOnExpire?: boolean;
          hasApiKey: boolean;
          ttlByFileType?: Record<string, number>;
          ttlByMimeType?: Record<string, number>;
        },
        Name
      >;
      setConfig: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            defaultTtlMs?: number;
            deleteBatchSize?: number;
            deleteRemoteOnExpire?: boolean;
            ttlByFileType?: Record<string, number>;
            ttlByMimeType?: Record<string, number>;
            uploadthingApiKey?: string;
          };
          replace?: boolean;
        },
        { created: boolean },
        Name
      >;
    };
    files: {
      setFileAccess: FunctionReference<
        "mutation",
        "internal",
        {
          access?: {
            allowUserIds?: Array<string>;
            denyUserIds?: Array<string>;
            visibility: "public" | "private" | "restricted";
          } | null;
          key: string;
        },
        string | null,
        Name
      >;
      setFolderAccess: FunctionReference<
        "mutation",
        "internal",
        {
          access?: {
            allowUserIds?: Array<string>;
            denyUserIds?: Array<string>;
            visibility: "public" | "private" | "restricted";
          } | null;
          folder: string;
        },
        string | null,
        Name
      >;
      upsertFile: FunctionReference<
        "mutation",
        "internal",
        {
          file: {
            customId?: string;
            fileType?: string;
            key: string;
            mimeType: string;
            name: string;
            size: number;
            uploadedAt?: number;
            url: string;
          };
          options?: {
            access?: {
              allowUserIds?: Array<string>;
              denyUserIds?: Array<string>;
              visibility: "public" | "private" | "restricted";
            };
            expiresAt?: number;
            fileType?: string;
            folder?: string;
            metadata?: any;
            tags?: Array<string>;
            ttlMs?: number;
          };
          userId: string;
        },
        string,
        Name
      >;
    };
    queries: {
      getFileByKey: FunctionReference<
        "query",
        "internal",
        { key: string; viewerUserId?: string },
        {
          _creationTime: number;
          _id: string;
          access?: {
            allowUserIds?: Array<string>;
            denyUserIds?: Array<string>;
            visibility: "public" | "private" | "restricted";
          };
          customId?: string;
          expiresAt?: number;
          fileType?: string;
          folder?: string;
          key: string;
          metadata?: any;
          mimeType: string;
          name: string;
          replacedAt?: number;
          size: number;
          tags?: Array<string>;
          uploadedAt: number;
          url: string;
          userId: string;
        } | null,
        Name
      >;
      listFiles: FunctionReference<
        "query",
        "internal",
        {
          folder?: string;
          includeExpired?: boolean;
          limit?: number;
          mimeType?: string;
          ownerUserId: string;
          tag?: string;
          viewerUserId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          access?: {
            allowUserIds?: Array<string>;
            denyUserIds?: Array<string>;
            visibility: "public" | "private" | "restricted";
          };
          customId?: string;
          expiresAt?: number;
          fileType?: string;
          folder?: string;
          key: string;
          metadata?: any;
          mimeType: string;
          name: string;
          replacedAt?: number;
          size: number;
          tags?: Array<string>;
          uploadedAt: number;
          url: string;
          userId: string;
        }>,
        Name
      >;
    };
    stats: {
      getUsageStats: FunctionReference<
        "query",
        "internal",
        { userId: string },
        { totalBytes: number; totalFiles: number },
        Name
      >;
    };
  };
