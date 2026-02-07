/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as uploadthing from "../uploadthing.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  uploadthing: typeof uploadthing;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  uploadthingFileTracker: {
    callbacks: {
      handleUploadthingCallback: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; hook: string; rawBody: string; signature: string },
        any
      >;
    };
    cleanup: {
      cleanupExpired: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean },
        any
      >;
    };
    config: {
      getConfig: FunctionReference<"query", "internal", {}, any>;
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
        any
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
        any
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
        any
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
        any
      >;
    };
    index: {
      cleanupExpired: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean },
        any
      >;
      getConfig: FunctionReference<"query", "internal", {}, any>;
      getFileByKey: FunctionReference<
        "query",
        "internal",
        { key: string; viewerUserId?: string },
        any
      >;
      getUsageStats: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      handleUploadthingCallback: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; hook: string; rawBody: string; signature: string },
        any
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
        any
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
        any
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
        any
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
        any
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
        any
      >;
    };
    queries: {
      getFileByKey: FunctionReference<
        "query",
        "internal",
        { key: string; viewerUserId?: string },
        any
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
        any
      >;
    };
    stats: {
      getUsageStats: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
    };
  };
};
