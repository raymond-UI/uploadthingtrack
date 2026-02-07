import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUsageStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let totalFiles = 0;
    let totalBytes = 0;

    const query = ctx.db
      .query("files")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId));

    for await (const file of query) {
      totalFiles += 1;
      totalBytes += file.size;
    }

    return { totalFiles, totalBytes };
  },
});
