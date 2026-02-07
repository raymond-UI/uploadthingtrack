import "dotenv/config";
import express from "express";
import cors from "cors";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

const uploadthingToken = process.env.UPLOADTHING_TOKEN;
const uploadthingCallbackUrl = process.env.UPLOADTHING_CALLBACK_URL;

if (!uploadthingToken) {
  throw new Error("Missing UPLOADTHING_TOKEN in example-app/.env");
}

const config = { token: uploadthingToken };

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    config: {
      ...config,
      callbackUrl: uploadthingCallbackUrl,
    },
  }),
);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`UploadThing server running on http://localhost:${port}`);
});
