import { httpActionGeneric } from "convex/server";
import type {
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  HttpRouter,
} from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

// Re-export types and validators that consumers need
export type { ComponentApi } from "../component/_generated/component.js";
export type {
  AccessRule,
  FileInfo,
  FileUpsertOptions,
  ConfigUpdate,
} from "../component/types.js";
export {
  accessRuleValidator,
  fileInfoValidator,
  fileUpsertOptionsValidator,
  configUpdateValidator,
} from "../component/types.js";

// Minimal context types — only the methods needed for each operation.
// Using Pick allows callers to pass ctx from queries, mutations, or actions.
type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type MutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "runQuery" | "runMutation"
>;
type ActionCtx = Pick<
  GenericActionCtx<GenericDataModel>,
  "runQuery" | "runMutation" | "runAction"
>;

/**
 * Client wrapper for the UploadThing File Tracker component.
 *
 * ```ts
 * import { UploadThingFiles } from "@convex-dev/uploadthing";
 * import { components } from "./_generated/api";
 *
 * const uploadthing = new UploadThingFiles(components.uploadthingFileTracker);
 * ```
 */
export class UploadThingFiles {
  public component: ComponentApi;

  constructor(component: ComponentApi) {
    this.component = component;
  }

  /**
   * Insert or replace a file record by key.
   */
  async upsertFile(
    ctx: MutationCtx,
    args: {
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
        access?: {
          visibility: "public" | "private" | "restricted";
          allowUserIds?: string[];
          denyUserIds?: string[];
        };
        metadata?: any;
        expiresAt?: number;
        ttlMs?: number;
        fileType?: string;
      };
    },
  ) {
    return await ctx.runMutation(this.component.files.upsertFile, args);
  }

  /**
   * Get a file by its UploadThing key, enforcing access rules.
   */
  async getFile(
    ctx: QueryCtx,
    args: {
      key: string;
      viewerUserId?: string;
    },
  ) {
    return await ctx.runQuery(this.component.queries.getFileByKey, args);
  }

  /**
   * List files for a user with optional filters.
   */
  async listFiles(
    ctx: QueryCtx,
    args: {
      ownerUserId: string;
      viewerUserId?: string;
      mimeType?: string;
      tag?: string;
      folder?: string;
      includeExpired?: boolean;
      limit?: number;
    },
  ) {
    return await ctx.runQuery(this.component.queries.listFiles, args);
  }

  /**
   * List files across all users with optional filters and access control.
   */
  async listAllFiles(
    ctx: QueryCtx,
    args: {
      viewerUserId?: string;
      mimeType?: string;
      tag?: string;
      folder?: string;
      includeExpired?: boolean;
      limit?: number;
    } = {},
  ) {
    return await ctx.runQuery(this.component.queries.listAllFiles, args);
  }

  /**
   * Get the access rule for a specific folder, or `null` if none is set.
   */
  async getFolderRule(
    ctx: QueryCtx,
    args: { folder: string },
  ) {
    return await ctx.runQuery(
      this.component.queries.getFolderRuleByFolder,
      args,
    );
  }

  /**
   * List all folder access rules.
   */
  async listFolderRules(
    ctx: QueryCtx,
    args: { limit?: number } = {},
  ) {
    return await ctx.runQuery(this.component.queries.listFolderRules, args);
  }

  /**
   * Set or clear the access rule for a specific file.
   * Pass `null` to remove the file-level rule.
   */
  async setFileAccess(
    ctx: MutationCtx,
    args: {
      key: string;
      access?: {
        visibility: "public" | "private" | "restricted";
        allowUserIds?: string[];
        denyUserIds?: string[];
      } | null;
    },
  ) {
    return await ctx.runMutation(this.component.files.setFileAccess, args);
  }

  /**
   * Set or clear the access rule for an entire folder.
   * Pass `null` to remove the folder rule.
   */
  async setFolderAccess(
    ctx: MutationCtx,
    args: {
      folder: string;
      access?: {
        visibility: "public" | "private" | "restricted";
        allowUserIds?: string[];
        denyUserIds?: string[];
      } | null;
    },
  ) {
    return await ctx.runMutation(this.component.files.setFolderAccess, args);
  }

  /**
   * Update the component configuration (API key, TTL defaults, etc.).
   */
  async setConfig(
    ctx: MutationCtx,
    args: {
      config: {
        uploadthingApiKey?: string;
        defaultTtlMs?: number;
        ttlByMimeType?: Record<string, number>;
        ttlByFileType?: Record<string, number>;
        deleteRemoteOnExpire?: boolean;
        deleteBatchSize?: number;
      };
      replace?: boolean;
    },
  ) {
    return await ctx.runMutation(this.component.config.setConfig, args);
  }

  /**
   * Read the current component configuration (API key excluded).
   */
  async getConfig(ctx: QueryCtx) {
    return await ctx.runQuery(this.component.config.getConfig, {});
  }

  /**
   * Get usage statistics (total files and bytes) for a user.
   */
  async getUsageStats(ctx: QueryCtx, args: { userId: string }) {
    return await ctx.runQuery(this.component.stats.getUsageStats, args);
  }

  /**
   * Delete specific file records by their UploadThing keys.
   * Returns the number of records actually deleted.
   */
  async deleteFiles(
    ctx: MutationCtx,
    args: { keys: string[] },
  ) {
    return await ctx.runMutation(this.component.files.deleteFiles, args);
  }

  /**
   * Delete expired file records in batches. Use `dryRun` to preview.
   *
   * When `deleteRemoteOnExpire` is enabled in config, also calls the
   * UploadThing API to delete files from their servers before removing
   * local records. If remote deletion fails, local records are preserved
   * so the next run can retry. Check `remoteDeleteFailed` and
   * `remoteDeleteError` in the return value for details.
   */
  async cleanupExpired(
    ctx: ActionCtx,
    args: {
      batchSize?: number;
      dryRun?: boolean;
    } = {},
  ) {
    return await ctx.runAction(this.component.cleanup.cleanupExpired, args);
  }

  /**
   * Handle an UploadThing webhook callback.
   * Verifies the HMAC signature and upserts the file record.
   */
  async handleCallback(
    ctx: ActionCtx,
    args: {
      rawBody: string;
      signature: string;
      hook: string;
      apiKey?: string;
    },
  ) {
    return await ctx.runAction(
      this.component.callbacks.handleUploadthingCallback,
      args,
    );
  }
}

/**
 * Register the UploadThing webhook HTTP route.
 *
 * ```ts
 * import { httpRouter } from "convex/server";
 * import { registerRoutes } from "@convex-dev/uploadthing";
 * import { components } from "./_generated/api";
 *
 * const http = httpRouter();
 * registerRoutes(http, components.uploadthingFileTracker);
 * export default http;
 * ```
 */
export function registerRoutes(
  http: HttpRouter,
  component: ComponentApi,
  options: {
    path?: string;
    apiKey?: string;
  } = {},
) {
  const path = options.path ?? "/webhooks/uploadthing";

  http.route({
    path,
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
      const signature = request.headers.get("x-uploadthing-signature");
      const hook = request.headers.get("uploadthing-hook");
      if (!signature || !hook) {
        return new Response("Missing required UploadThing headers", {
          status: 400,
        });
      }

      const rawBody = await request.text();
      const apiKey = options.apiKey ?? process.env.UPLOADTHING_API_KEY;

      const result = await ctx.runAction(
        component.callbacks.handleUploadthingCallback,
        { rawBody, signature, hook, apiKey },
      );

      if (!result.ok) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("ok", { status: 200 });
    }),
  });
}
