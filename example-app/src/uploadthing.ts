import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../server/uploadthing";

const uploadthingUrl = import.meta.env.VITE_UPLOADTHING_URL;
if (!uploadthingUrl) {
  throw new Error("Missing VITE_UPLOADTHING_URL in example-app/.env.local");
}

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: uploadthingUrl,
});
