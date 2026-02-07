import { httpRouter } from "convex/server";
import { registerRoutes } from "@mzedstudio/uploadthingtrack";
import { components } from "./_generated/api";

const http = httpRouter();

registerRoutes(http, components.uploadthingFileTracker);

export default http;
