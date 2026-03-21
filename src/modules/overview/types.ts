// ─── Overview Module Types ────────────────────────────────────────────────────

// ─── Chat ────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ActiveAgent {
  name: string;
  icon: string;
}

// ─── useChat hook return type ─────────────────────────────────────────────────

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  activeAgent: ActiveAgent | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

// ─── Props Interfaces ─────────────────────────────────────────────────────────

export interface DashboardClientProps {
  // No props — DashboardClient uses useChat hook internally
}

export interface DashboardViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  showScrollBtn: boolean;
  /** ref for scroll container */
  scrollRef: React.RefObject<HTMLElement | null>;
  /** ref for textarea */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** ref for bottom anchor */
  bottomRef: React.RefObject<HTMLDivElement | null>;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSuggestion: (text: string) => void;
  clearMessages: () => void;
  scrollToBottom: () => void;
}

export interface AssistantMessageProps {
  content: string;
  isLoading: boolean;
}

export interface UserMessageProps {
  content: string;
}
