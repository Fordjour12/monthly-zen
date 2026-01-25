import "dotenv/config";
import { createContext } from "@monthly-zen/api/context";
import { appRouter } from "@monthly-zen/api/routers/index";
import { streamChatCompletion, type OpenRouterMessage } from "@monthly-zen/api/lib/openrouter";
import { auth } from "@monthly-zen/auth";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/health", (c) => {
  return c.json({ ok: true });
});

app.post("/api/v2/openrouter", async (c) => {
  let body: {
    question?: string;
    model?: string;
    systemPrompt?: string;
  } | null = null;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const question = body?.question?.trim();
  if (!question) return c.json({ error: "question is required" }, 400);

  const model = "google/gemini-2.5-flash";
  const systemPrompt = body?.systemPrompt?.trim();

  const messages: OpenRouterMessage[] = systemPrompt
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ]
    : [{ role: "user", content: question }];

  let streamResponse: Awaited<ReturnType<typeof streamChatCompletion>>;

  try {
    streamResponse = await streamChatCompletion({
      model,
      messages,
      includeUsage: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start stream";
    return c.json({ error: message }, 500);
  }

  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");
  c.header("Content-Encoding", "identity");

  return stream(c, async (streamWriter) => {
    let doneSent = false;

    // comment heartbeat (best practice)
    const keepalive = setInterval(() => {
      streamWriter.write(": ping\n\n").catch(() => {});
    }, 15000);

    try {
      for await (const chunk of streamResponse) {
        if (chunk.error?.message) {
          await streamWriter.write(
            `data: ${JSON.stringify({ type: "error", message: chunk.error.message })}\n\n`,
          );
          doneSent = true;
          break;
        }

        const choice = chunk.choices?.[0];
        const delta = choice?.delta?.content;
        if (delta) {
          await streamWriter.write(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`);
        }

        if (chunk.usage) {
          await streamWriter.write(
            `data: ${JSON.stringify({ type: "usage", usage: chunk.usage })}\n\n`,
          );
        }

        const finishReason = choice?.finish_reason;
        if (finishReason && finishReason !== "error") {
          await streamWriter.write(`data: ${JSON.stringify({ type: "done", finishReason })}\n\n`);
          doneSent = true;
          break;
        }
      }

      if (!doneSent) {
        await streamWriter.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stream failed";
      await streamWriter.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    } finally {
      clearInterval(keepalive);
      // if your streamWriter has close/end, call it:
      // streamWriter.close?.();
    }
  });
});

app.post("/api/openrouter", async (c) => {
  let body: {
    question?: string;
    model?: string;
    systemPrompt?: string;
  } | null = null;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const question = body?.question?.trim();
  if (!question) {
    return c.json({ error: "question is required" }, 400);
  }

  // body?.model?.trim() || process.env.OPENROUTER_MODEL || "openai/gpt-4o"
  const model = "google/gemini-2.5-flash";
  const systemPrompt = body?.systemPrompt?.trim();
  const messages: OpenRouterMessage[] = systemPrompt
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ]
    : [{ role: "user", content: question }];
  let streamResponse: Awaited<ReturnType<typeof streamChatCompletion>> | null = null;

  try {
    streamResponse = await streamChatCompletion({
      model,
      messages,
      includeUsage: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start stream";
    return c.json({ error: message }, 500);
  }

  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return stream(c, async (streamWriter) => {
    let doneSent = false;
    const keepalive = setInterval(() => {
      streamWriter.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`).catch(() => {});
    }, 15000);

    try {
      for await (const chunk of streamResponse!) {
        if (chunk.error?.message) {
          await streamWriter.write(
            `data: ${JSON.stringify({ type: "error", message: chunk.error.message })}\n\n`,
          );
          return;
        }

        const choice = chunk.choices?.[0];
        const delta = choice?.delta?.content;
        if (delta) {
          await streamWriter.write(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`);
        }

        if (chunk.usage) {
          await streamWriter.write(
            `data: ${JSON.stringify({ type: "usage", usage: chunk.usage })}\n\n`,
          );
        }

        const finishReason = choice?.finish_reason;
        if (finishReason && finishReason !== "error") {
          await streamWriter.write(`data: ${JSON.stringify({ type: "done", finishReason })}\n\n`);
          doneSent = true;
          return;
        }
      }

      if (!doneSent) {
        await streamWriter.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stream failed";
      await streamWriter.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    } finally {
      clearInterval(keepalive);
    }
  });
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
