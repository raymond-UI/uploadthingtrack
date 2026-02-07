import { httpActionGeneric, httpRouter } from "convex/server";
import { components } from "./_generated/api";

const http = httpRouter();
const httpAction = httpActionGeneric;

export const uploadthingWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-uploadthing-signature");
  const hook = request.headers.get("uploadthing-hook");
  if (!signature || !hook) {
    return new Response("Missing headers", { status: 400 });
  }

  const rawBody = await request.text();
  const result = await ctx.runAction(
    components.uploadthingFileTracker.callbacks.handleUploadthingCallback,
    { rawBody, signature, hook },
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
