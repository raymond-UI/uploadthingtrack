import { defineApp } from "convex/server";
import uploadthingFileTracker from "@convex-dev/uploadthing/convex.config.js";

const app = defineApp();

app.use(uploadthingFileTracker, { name: "uploadthingFileTracker" });

export default app;
