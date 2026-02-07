import { httpRouter } from "convex/server";
import { registerRoutes } from "@convex-dev/uploadthing";
import { components } from "./_generated/api";

const http = httpRouter();

registerRoutes(http, components.uploadthingFileTracker);

export default http;
