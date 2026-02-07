import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  fileUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 4 },
    video: { maxFileSize: "32MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 2 },
  })
    .middleware(({ req }) => {
      const userId = req.headers["x-user-id"];
      if (!userId || Array.isArray(userId)) {
        throw new Error("Missing x-user-id header");
      }

      const folderHeader = req.headers["x-folder"];
      const tagsHeader = req.headers["x-tags"];

      const folder = Array.isArray(folderHeader)
        ? folderHeader[0]
        : folderHeader;

      const tags = Array.isArray(tagsHeader) ? tagsHeader[0] : tagsHeader;

      const parsedTags = tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;

      return {
        userId,
        folder,
        tags: parsedTags,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        userId: metadata.userId,
        key: file.key,
        url: file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
