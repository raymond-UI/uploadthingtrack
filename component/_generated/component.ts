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
        { hook: string; rawBody: string; signature: string },
        any,
        Name
      >;
    };
    cleanup: {
      cleanupExpired: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean },
        any,
        Name
      >;
    };
    config: {
      getConfig: FunctionReference<"query", "internal", {}, any, Name>;
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
        any,
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
        any,
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
        any,
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
        any,
        Name
      >;
    };
    index: {
      cleanupExpired: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean },
        any,
        Name
      >;
      getConfig: FunctionReference<"query", "internal", {}, any, Name>;
      getFileByKey: FunctionReference<
        "query",
        "internal",
        { key: string; viewerUserId?: string },
        any,
        Name
      >;
      getUsageStats: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
      >;
      handleUploadthingCallback: FunctionReference<
        "action",
        "internal",
        { hook: string; rawBody: string; signature: string },
        any,
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
        any,
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
        any,
        Name
      >;
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
        any,
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
        any,
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
        any,
        Name
      >;
    };
    queries: {
      getFileByKey: FunctionReference<
        "query",
        "internal",
        { key: string; viewerUserId?: string },
        any,
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
        any,
        Name
      >;
    };
    stats: {
      getUsageStats: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
      >;
    };
  };
