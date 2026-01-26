import { createMMKV } from "react-native-mmkv";

export const storage = createMMKV({ id: "chat" });

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

export type MonitorSettings = {
  tone: string;
  depth: string;
  format: string;
};

const KEY_CONVERSATIONS = "conversations:v1";
const KEY_LAST_CONVERSATION = "conversations:last:v1";
const KEY_MONITOR_DEFAULT = "monitor-settings:default:v1";
const convKey = (conversationId: string) => `messages:v1:${conversationId}`;
const convMonitorKey = (conversationId: string) => `monitor-settings:conversation:v1:${conversationId}`;

function safeParse<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function newId(prefix = "m") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function listConversations(): Conversation[] {
  return safeParse<Conversation[]>(storage.getString(KEY_CONVERSATIONS)) ?? [];
}

export function getConversation(conversationId: string): Conversation | null {
  return listConversations().find((conversation) => conversation.id === conversationId) ?? null;
}

export function saveConversations(conversations: Conversation[]) {
  storage.set(KEY_CONVERSATIONS, JSON.stringify(conversations));
}

export function createConversation(title?: string): Conversation {
  const now = Date.now();
  const conversation: Conversation = {
    id: newId("c"),
    title,
    createdAt: now,
    updatedAt: now,
  };
  const all = listConversations();
  all.unshift(conversation);
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  saveConversations(all);
  setLastConversationId(conversation.id);
  return conversation;
}

export function updateConversation(conversationId: string, patch: Partial<Conversation>) {
  const all = listConversations();
  const idx = all.findIndex((conversation) => conversation.id === conversationId);
  if (idx === -1) return;
  const prev = all[idx];
  all[idx] = {
    ...prev,
    ...patch,
    id: conversationId,
    createdAt: prev.createdAt,
  };
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  saveConversations(all);
}

export function renameConversation(conversationId: string, title: string) {
  updateConversation(conversationId, { title, updatedAt: Date.now() });
}

export function deleteConversation(conversationId: string) {
  const all = listConversations().filter((conversation) => conversation.id !== conversationId);
  saveConversations(all);
  storage.remove(convKey(conversationId));
  if (getLastConversationId() === conversationId) {
    storage.remove(KEY_LAST_CONVERSATION);
  }
}

export function getMessages(conversationId: string): ChatMessage[] {
  return safeParse<ChatMessage[]>(storage.getString(convKey(conversationId))) ?? [];
}

export function saveMessages(conversationId: string, messages: ChatMessage[]) {
  storage.set(convKey(conversationId), JSON.stringify(messages));
}

export function addMessage(message: ChatMessage) {
  const messages = getMessages(message.conversationId);
  messages.push(message);
  saveMessages(message.conversationId, messages);
}

export function updateMessage(
  conversationId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
) {
  const messages = getMessages(conversationId);
  const idx = messages.findIndex((message) => message.id === messageId);
  if (idx === -1) return;
  messages[idx] = { ...messages[idx], ...patch };
  saveMessages(conversationId, messages);
}

export function setLastConversationId(conversationId: string) {
  storage.set(KEY_LAST_CONVERSATION, conversationId);
}

export function getLastConversationId(): string | null {
  return storage.getString(KEY_LAST_CONVERSATION) ?? null;
}

export function getDefaultMonitorSettings(): MonitorSettings | null {
  return safeParse<MonitorSettings>(storage.getString(KEY_MONITOR_DEFAULT));
}

export function setDefaultMonitorSettings(settings: MonitorSettings) {
  storage.set(KEY_MONITOR_DEFAULT, JSON.stringify(settings));
}

export function getConversationMonitorSettings(conversationId: string): MonitorSettings | null {
  return safeParse<MonitorSettings>(storage.getString(convMonitorKey(conversationId)));
}

export function setConversationMonitorSettings(conversationId: string, settings: MonitorSettings) {
  storage.set(convMonitorKey(conversationId), JSON.stringify(settings));
}
