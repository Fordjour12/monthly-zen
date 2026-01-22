Cool — **MMKV is fast** and totally fine for chat persistence if you store things the right way (and don’t rewrite huge blobs every token).

Below is a **relay-only + MMKV persistence** setup that’s practical:

- Persist **conversations list**
- Persist **messages per conversation**
- Save **user message immediately**
- Save **assistant placeholder** immediately
- During stream: update UI frequently, but **persist throttled** (e.g. every 500ms)
- On done/error: persist final state

---

## 1) Install MMKV

```bash
npx expo install react-native-mmkv
```

(If you’re Expo managed, this requires a dev build/EAS — MMKV isn’t supported in Expo Go.)

---

## 2) `storage/chatStore.ts` (MMKV repo)

```ts
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "chat" });

export type Role = "user" | "assistant" | "system";
export type MsgStatus = "final" | "streaming" | "error";

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: number;
  status: MsgStatus;
  meta?: Record<string, any>;
};

export type Conversation = {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  lastMessagePreview?: string;
};

const KEY_CONVERSATIONS = "conversations:v1";
const convKey = (conversationId: string) => `messages:v1:${conversationId}`;

function safeParse<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function listConversations(): Conversation[] {
  return safeParse<Conversation[]>(storage.getString(KEY_CONVERSATIONS)) ?? [];
}

export function saveConversations(convs: Conversation[]) {
  storage.set(KEY_CONVERSATIONS, JSON.stringify(convs));
}

export function upsertConversation(conv: Conversation) {
  const all = listConversations();
  const idx = all.findIndex((c) => c.id === conv.id);
  if (idx >= 0) all[idx] = conv;
  else all.unshift(conv);

  // sort by updatedAt desc
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  saveConversations(all);
}

export function getMessages(conversationId: string): ChatMessage[] {
  return (
    safeParse<ChatMessage[]>(storage.getString(convKey(conversationId))) ?? []
  );
}

export function saveMessages(conversationId: string, messages: ChatMessage[]) {
  storage.set(convKey(conversationId), JSON.stringify(messages));
}

export function addMessage(message: ChatMessage) {
  const msgs = getMessages(message.conversationId);
  msgs.push(message);
  saveMessages(message.conversationId, msgs);
}

export function updateMessage(
  conversationId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
) {
  const msgs = getMessages(conversationId);
  const idx = msgs.findIndex((m) => m.id === messageId);
  if (idx === -1) return;
  msgs[idx] = { ...msgs[idx], ...patch };
  saveMessages(conversationId, msgs);
}

// Helpers
export function newId(prefix = "m") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ensureConversation(title?: string): Conversation {
  const conv: Conversation = {
    id: newId("c"),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  upsertConversation(conv);
  return conv;
}
```

---

## 3) Throttle helper (so you don’t write too often)

```ts
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  waitMs: number,
) {
  let last = 0;
  let timer: any = null;
  let pendingArgs: any[] | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = waitMs - (now - last);

    pendingArgs = args;

    if (remaining <= 0) {
      last = now;
      fn(...args);
      pendingArgs = null;
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        if (pendingArgs) fn(...pendingArgs);
        pendingArgs = null;
      }, remaining);
    }
  };
}
```

---

## 4) Relay-only + MMKV screen (core logic)

This is the important part: persistence that doesn’t kill performance.

```ts
import EventSource from "react-native-sse";
import {
  addMessage,
  ensureConversation,
  getMessages,
  newId,
  updateMessage,
  upsertConversation,
} from "@/storage/chatStore";
import { throttle } from "@/storage/throttle";

type RelayChunk =
  | { type: "delta"; text: string }
  | { type: "usage"; usage: any }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string }
  | { type: "ping" };

const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL ?? "";
const SYSTEM_PROMPT = "You are Monthly Zen...";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function parseBatchedJSONLines(raw: string): any[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Some polyfills batch multiple JSON objects into one message event.
  const parts = normalized
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const out: any[] = [];
  for (const part of parts) {
    try {
      out.push(
        JSON.parse(part.startsWith("data:") ? part.slice(5).trim() : part),
      );
    } catch {
      // ignore
    }
  }
  return out;
}

// In your component:
const convRef = useRef<string | null>(null);
const esRef = useRef<EventSource | null>(null);
const assistantIdRef = useRef<string | null>(null);

// Throttled persistence of assistant content
const persistAssistantContentThrottled = useMemo(
  () =>
    throttle((conversationId: string, messageId: string, content: string) => {
      updateMessage(conversationId, messageId, { content });
      upsertConversation({
        id: conversationId,
        createdAt: 0,
        updatedAt: Date.now(),
      } as any);
    }, 500),
  [],
);

const startConversationIfNeeded = () => {
  if (convRef.current) return convRef.current;
  const conv = ensureConversation("Planner Chat");
  convRef.current = conv.id;
  return conv.id;
};

const sendRelayMessage = (text: string) => {
  if (!text.trim() || !RELAY_URL) return;

  const conversationId = startConversationIfNeeded();

  // 1) persist user msg
  const userMsgId = newId("u");
  addMessage({
    id: userMsgId,
    conversationId,
    role: "user",
    content: text.trim(),
    createdAt: Date.now(),
    status: "final",
  });

  // 2) persist assistant placeholder
  const assistantId = newId("a");
  assistantIdRef.current = assistantId;
  addMessage({
    id: assistantId,
    conversationId,
    role: "assistant",
    content: "",
    createdAt: Date.now(),
    status: "streaming",
  });

  // 3) update conversation preview
  upsertConversation({
    id: conversationId,
    title: "Planner Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessagePreview: text.trim().slice(0, 80),
  });

  // 4) open SSE stream (relay only)
  const payload = JSON.stringify({
    question: text.trim(),
    model: DEFAULT_MODEL,
    systemPrompt: SYSTEM_PROMPT,
  });

  const es = new EventSource(RELAY_URL, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: payload,
    pollingInterval: 0,
  });

  esRef.current = es;

  es.addEventListener("message", (event) => {
    const items = parseBatchedJSONLines(event.data ?? "");
    for (const item of items) {
      const chunk = item as RelayChunk;

      if (chunk.type === "delta" && assistantIdRef.current) {
        // Update UI state however you do it...
        // setMessages((prev)=>...)

        // Persist throttled (important)
        const currentMsgs = getMessages(conversationId);
        const currentAssistant = currentMsgs.find(
          (m) => m.id === assistantIdRef.current,
        );
        const nextText = (currentAssistant?.content ?? "") + chunk.text;

        persistAssistantContentThrottled(
          conversationId,
          assistantIdRef.current,
          nextText,
        );
      }

      if (chunk.type === "usage" && assistantIdRef.current) {
        updateMessage(conversationId, assistantIdRef.current, {
          meta: { usage: chunk.usage },
        });
      }

      if (chunk.type === "error" && assistantIdRef.current) {
        updateMessage(conversationId, assistantIdRef.current, {
          status: "error",
          content: `Error: ${chunk.message}`,
        });
        es.close();
      }

      if (chunk.type === "done" && assistantIdRef.current) {
        updateMessage(conversationId, assistantIdRef.current, {
          status: "final",
        });
        es.close();
      }
    }
  });

  es.addEventListener("error", () => {
    if (assistantIdRef.current) {
      updateMessage(conversationId, assistantIdRef.current, {
        status: "error",
        content: "Error: Streaming failed",
      });
    }
    es.close();
  });
};
```

### Loading persisted messages on screen mount

```ts
useEffect(() => {
  const conversationId = convRef.current;
  if (!conversationId) return;
  const saved = getMessages(conversationId);
  // setMessages(saved mapped to your UI type)
}, []);
```

---

## The big MMKV rule for streaming

✅ Update UI each token
✅ Persist assistant content **throttled** (every 300–800ms)
✅ Persist final message on done

If you persist every token, even MMKV will start to feel laggy.

---

## Want me to stitch this into your exact UI component?

If you tell me:

1. Do you want **multiple conversations** or just **one chat thread**?
2. Should persistence include the **system message** too?

I’ll give you a complete single file that plugs directly into your current screen (with create/load conversation + list + delete helpers).
