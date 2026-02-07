import { httpActionGeneric, httpRouter } from "convex/server";
import { components } from "./_generated/api";

const http = httpRouter();
const httpAction = httpActionGeneric;
const uploadthingApiKey = process.env.UPLOADTHING_API_KEY;

if (!uploadthingApiKey) {
  throw new Error("Missing UPLOADTHING_API_KEY. Set it in the Convex dashboard.");
}

export const uploadthingWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-uploadthing-signature");
  const hook = request.headers.get("uploadthing-hook");
  if (!signature || !hook) {
    return new Response("Missing headers", { status: 400 });
  }

  const rawBody = await request.text();
  const result = await ctx.runAction(
    components.uploadthingFileTracker.callbacks.handleUploadthingCallback,
    { rawBody, signature, hook, apiKey: uploadthingApiKey },
  );

  if (!result.ok) {
    return new Response("Invalid webhook", { status: 400 });
  }

  return new Response("ok", { status: 200 });
});

http.route({
  path: "/webhooks/uploadthing",
  method: "POST",
  handler: uploadthingWebhook,
});

export default http;
