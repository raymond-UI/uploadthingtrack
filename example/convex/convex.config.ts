import { defineApp } from "convex/server";
import uploadthingFileTracker from "@mzedstudio/uploadthingtrack/convex.config.js";

const app = defineApp();

app.use(uploadthingFileTracker, { name: "uploadthingFileTracker" });

export default app;
