import { defineApp } from "convex/server";
import uploadthingFileTracker from "../../component/convex.config";

const app = defineApp();

app.use(uploadthingFileTracker, { name: "uploadthingFileTracker" });

export default app;
