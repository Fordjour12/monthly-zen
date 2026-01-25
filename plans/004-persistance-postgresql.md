Nice — if you already have **PostgreSQL**, that’s a strong option for persistence (and honestly better than MMKV for long-term, multi-device, and analytics). You can still keep MMKV as an _offline cache_ later, but you can start with Postgres as the source of truth.

### Big picture

- **Relay server (Bun + Hono)**: streams SSE to the app
- **Relay server** also writes/reads from **Postgres**
- **React Native** only talks to your relay:
  - `POST /conversations` create
  - `GET /conversations` list
  - `GET /conversations/:id/messages` load
  - `POST /conversations/:id/messages` send (starts SSE stream + persists)

This is the cleanest because the server can persist even if the client disconnects mid-stream.

---

## Recommended DB schema (simple + scalable)

### `conversations`

- `id` UUID PK
- `user_id` UUID/text (or nullable if no auth yet)
- `title` text
- `created_at` timestamptz
- `updated_at` timestamptz
- `last_message_preview` text

### `messages`

- `id` UUID PK
- `conversation_id` UUID FK
- `role` text (`user|assistant|system`)
- `content` text
- `status` text (`streaming|final|error`)
- `meta` jsonb (usage/model/etc)
- `created_at` timestamptz

Indexes:

- `messages(conversation_id, created_at)`
- `conversations(user_id, updated_at desc)`

---

## Streaming + persistence pattern (best practice)

When user sends a message:

1. Insert **user message** (final)
2. Insert **assistant message placeholder** (`status='streaming'`, empty content)
3. Start provider stream
4. Stream deltas to RN via SSE
5. **Don’t update DB every token**
   - buffer tokens in memory
   - update DB every ~500ms **or** every ~500 chars

6. On finish:
   - final update to `content`, `status='final'`, `meta.usage`
   - update conversation `updated_at`, `last_message_preview`

This avoids hammering your DB.

---

## When Postgres is better than MMKV

✅ Multi-device sync
✅ Chat list + pagination + search later
✅ Backups, analytics, moderation tools
✅ Reliability (server finalizes messages even if app closes)

MMKV is still great as an optional offline cache later.

---

## How many endpoints you actually need

Minimum:

- `POST /conversations` → create new conversation
- `GET /conversations` → list
- `GET /conversations/:id/messages` → load messages
- `POST /conversations/:id/stream` → SSE stream + persist

That’s it.

---

## Important question (but I won’t block you)

Do you have **auth/users** yet?

- If **yes**: store `user_id` per conversation.
- If **no**: still build it, just store `user_id = NULL` for now or use a device id.

---

If you want, I can write you the **full Bun + Hono + Postgres code**:

- SQL migrations
- DB queries (with a Bun driver or `postgres` package)
- streaming endpoint that saves the final assistant message correctly
- RN calls for list/open/new chat

Tell me what you use to connect to Postgres on the server:

- `postgres` (porsager), `pg`, Prisma, Drizzle, or Kysely?

Great — **Drizzle + Postgres** is a clean setup for multi-conversation chat persistence.

Below is a complete, practical blueprint with **schema + Drizzle queries + Hono routes**, including the **SSE streaming endpoint that persists messages correctly without writing every token**.

I’ll assume:

- You already have your provider streaming logic (`streamChatCompletion(...)`) in the relay server.
- You’re using Bun + Hono.
- You don’t have auth yet (so `userId` can be nullable). If you _do_ have auth, just pass `userId`.

---

## 1) Drizzle schema (Postgres)

**`db/schema.ts`**

```ts
import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"), // nullable if no auth yet
    title: text("title"),
    lastMessagePreview: text("last_message_preview"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUpdatedIdx: index("conversations_user_updated_idx").on(t.userId, t.updatedAt),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "user" | "assistant" | "system"
    content: text("content").notNull().default(""),
    status: text("status").notNull().default("final"), // "streaming" | "final" | "error"
    meta: jsonb("meta").$type<Record<string, any>>(), // usage/model/finishReason etc.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    convCreatedIdx: index("messages_conversation_created_idx").on(t.conversationId, t.createdAt),
  }),
);
```

---

## 2) Drizzle DB init

**`db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { max: 10 });
export const db = drizzle(client);
```

---

## 3) Routes you need

### A) Create conversation

**`POST /conversations`** → returns `{conversationId}`

### B) List conversations

**`GET /conversations`** → returns recent conversations

### C) Get messages

**`GET /conversations/:id/messages`** → returns messages sorted by time

### D) Stream chat + persist

**`POST /conversations/:id/stream`** → SSE stream

- inserts user message
- inserts assistant placeholder (`status=streaming`)
- streams deltas
- periodically updates assistant content
- finalizes assistant message + updates conversation metadata

---

## 4) Hono routes (with streaming + persistence)

**`routes/chat.ts`**

```ts
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schema";

// Your existing provider stream function:
import { streamChatCompletion } from "../providers/openrouter"; // adapt import

type RelayOut =
  | { type: "delta"; text: string }
  | { type: "usage"; usage: any }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string };

const app = new Hono();

/** Utilities */
const now = () => new Date();
const preview = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 120);

function sse(writer: { write: (s: string) => Promise<void> }, data: RelayOut) {
  // Explicit event helps some clients
  return writer.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
}

// Throttle DB updates (don’t write every token)
function makeThrottledUpdater(fn: () => Promise<void>, ms: number) {
  let timer: any = null;
  let pending = false;

  return async () => {
    pending = true;
    if (timer) return;

    timer = setTimeout(async () => {
      timer = null;
      if (!pending) return;
      pending = false;
      try {
        await fn();
      } catch {
        // ignore DB update failures during streaming; final write will happen
      }
    }, ms);
  };
}

/** POST /conversations */
app.post("/conversations", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : null;
  const userId = typeof body?.userId === "string" ? body.userId : null;

  const [row] = await db
    .insert(conversations)
    .values({
      userId,
      title,
      createdAt: now(),
      updatedAt: now(),
    })
    .returning({ id: conversations.id });

  return c.json({ conversationId: row.id });
});

/** GET /conversations */
app.get("/conversations", async (c) => {
  const userId = c.req.query("userId"); // optional

  const where = userId ? eq(conversations.userId, userId) : undefined;

  const rows = await db
    .select()
    .from(conversations)
    .where(where)
    .orderBy(desc(conversations.updatedAt))
    .limit(50);

  return c.json({ conversations: rows });
});

/** GET /conversations/:id/messages */
app.get("/conversations/:id/messages", async (c) => {
  const conversationId = c.req.param("id");

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId as any))
    .orderBy(messages.createdAt)
    .limit(500);

  return c.json({ messages: rows });
});

/**
 * POST /conversations/:id/stream
 * Body: { question: string, model?: string, systemPrompt?: string, userId?: string }
 */
app.post("/conversations/:id/stream", async (c) => {
  const conversationId = c.req.param("id");

  let body: { question?: string; model?: string; systemPrompt?: string; userId?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const question = body.question?.trim();
  if (!question) return c.json({ error: "question is required" }, 400);

  // Optional: validate conversation exists (and belongs to user if you enforce auth)
  const conv = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.id, conversationId as any))
    .limit(1);

  if (!conv.length) return c.json({ error: "conversation not found" }, 404);

  const model = body.model?.trim() || "google/gemini-2.5-flash";
  const systemPrompt = body.systemPrompt?.trim();

  // 1) Persist user msg
  const [userMsg] = await db
    .insert(messages)
    .values({
      conversationId: conversationId as any,
      role: "user",
      content: question,
      status: "final",
      createdAt: now(),
      updatedAt: now(),
    })
    .returning({ id: messages.id });

  // 2) Persist assistant placeholder
  const [assistantMsg] = await db
    .insert(messages)
    .values({
      conversationId: conversationId as any,
      role: "assistant",
      content: "",
      status: "streaming",
      meta: { model },
      createdAt: now(),
      updatedAt: now(),
    })
    .returning({ id: messages.id });

  // Update conversation metadata right away (preview = user question)
  await db
    .update(conversations)
    .set({
      updatedAt: now(),
      lastMessagePreview: preview(question),
    })
    .where(eq(conversations.id, conversationId as any));

  // 3) Start provider stream
  let providerStream: Awaited<ReturnType<typeof streamChatCompletion>>;
  try {
    // You probably want to include some history. Keep it simple:
    // Fetch last N messages and map into provider format.
    const history = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId as any))
      .orderBy(desc(messages.createdAt))
      .limit(30);

    const chronological = history.reverse();

    const providerMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...chronological]
      : chronological;

    providerStream = await streamChatCompletion({
      model,
      messages: providerMessages as any,
      includeUsage: true,
    });
  } catch (e: any) {
    const msg = e?.message ?? "Failed to start stream";
    await db
      .update(messages)
      .set({ status: "error", content: `Error: ${msg}`, updatedAt: now() })
      .where(eq(messages.id, assistantMsg.id));
    return c.json({ error: msg }, 500);
  }

  // SSE headers
  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");
  c.header("Content-Encoding", "identity");

  return stream(c, async (writer) => {
    let buffer = "";
    let done = false;
    let latestUsage: any = null;

    // Heartbeat comment (keeps dev/proxies alive)
    const keepalive = setInterval(() => {
      writer.write(": ping\n\n").catch(() => {});
    }, 15000);

    // Throttled DB updater
    const flushToDbThrottled = makeThrottledUpdater(async () => {
      await db
        .update(messages)
        .set({
          content: buffer,
          updatedAt: now(),
          meta: latestUsage ? { model, usage: latestUsage } : { model },
        })
        .where(eq(messages.id, assistantMsg.id));
    }, 500);

    try {
      for await (const chunk of providerStream) {
        if (chunk.error?.message) {
          await sse(writer, { type: "error", message: chunk.error.message });
          buffer = `Error: ${chunk.error.message}`;
          await db
            .update(messages)
            .set({ status: "error", content: buffer, updatedAt: now() })
            .where(eq(messages.id, assistantMsg.id));
          done = true;
          break;
        }

        const choice = chunk.choices?.[0];
        const delta = choice?.delta?.content;
        if (delta) {
          buffer += delta;
          await sse(writer, { type: "delta", text: delta });
          await flushToDbThrottled();
        }

        if (chunk.usage) {
          latestUsage = chunk.usage;
          // optional: emit usage
          await sse(writer, { type: "usage", usage: chunk.usage });
        }

        const finishReason = choice?.finish_reason;
        if (finishReason && finishReason !== "error") {
          await sse(writer, { type: "done", finishReason });
          done = true;
          break;
        }
      }

      // Finalize if not done
      if (!done) {
        await sse(writer, { type: "done" });
      }

      // Final DB write
      await db
        .update(messages)
        .set({
          status: "final",
          content: buffer,
          meta: latestUsage ? { model, usage: latestUsage } : { model },
          updatedAt: now(),
        })
        .where(eq(messages.id, assistantMsg.id));

      // Update conversation preview to assistant text (or keep user text — your choice)
      await db
        .update(conversations)
        .set({
          updatedAt: now(),
          lastMessagePreview: preview(buffer || question),
        })
        .where(eq(conversations.id, conversationId as any));
    } catch (e: any) {
      const msg = e?.message ?? "Stream failed";
      await sse(writer, { type: "error", message: msg });
      await db
        .update(messages)
        .set({ status: "error", content: buffer || `Error: ${msg}`, updatedAt: now() })
        .where(eq(messages.id, assistantMsg.id));
    } finally {
      clearInterval(keepalive);
    }
  });
});

export default app;
```

---

## 5) RN usage pattern (what your app calls)

- Create new chat:
  - `POST /conversations` → get `conversationId`

- Load chats:
  - `GET /conversations`

- Load messages:
  - `GET /conversations/:id/messages`

- Send + stream:
  - `POST /conversations/:id/stream` (SSE)

Your existing “relay-only” screen works — just change the endpoint to `/conversations/:id/stream`.

---

## 6) Why server-side persistence is better than client-side here

Because even if:

- the phone locks,
- the app crashes,
- SSE disconnects,

…the server can still finalize the assistant message in Postgres.

---

If you paste your current Drizzle config (migrations setup + `drizzle.config.ts`), I can also give you the exact migration SQL or Drizzle migration commands for this schema.
