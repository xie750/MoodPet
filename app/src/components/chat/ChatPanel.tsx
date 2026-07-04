import { FormEvent, useMemo, useState } from "react";
import {
  createMockChatContext,
  generateChatReply,
  getRecommendedActionLabel,
  type ChatContext,
  type ChatMessage,
  type ChatRecommendedAction
} from "../../features/chat";
import "./ChatPanel.css";

type ChatPanelProps = {
  context?: Omit<ChatContext, "message">;
  onRecommendedAction?: (action: ChatRecommendedAction) => void;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "companion-welcome",
  role: "companion",
  text: "我在这儿。今天想先从哪件小事开始？",
  createdAt: 0
};

export function ChatPanel({ context, onRecommendedAction }: ChatPanelProps) {
  const defaultContext = useMemo(() => createMockChatContext(), []);
  const activeContext = context ?? defaultContext;
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState("");

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = draft.trim();
    if (!message) return;

    const now = Date.now();
    const reply = generateChatReply({
      ...activeContext,
      message
    });

    setMessages((current) => [
      ...current,
      {
        id: `user-${now}`,
        role: "user",
        text: message,
        createdAt: now
      },
      {
        id: `companion-${now}`,
        role: "companion",
        text: reply.reply,
        createdAt: now + 1,
        recommendedAction: reply.recommendedAction
      }
    ]);
    setDraft("");
  }

  function confirmAction(messageId: string, action: ChatRecommendedAction) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              actionConfirmed: true
            }
          : message
      )
    );

    onRecommendedAction?.(action);
  }

  return (
    <section className="chat-panel" aria-label="和小精灵聊天">
      <header className="chat-panel__header">
        <div>
          <p className="chat-panel__eyebrow">和小精灵聊天</p>
          <h1>轻轻说一句就好</h1>
        </div>
        <div className="chat-panel__context" aria-label="当前陪伴上下文">
          <span>{getModeLabel(activeContext.userState)}</span>
          <span>{activeContext.taskSummary.unfinished} 件待完成</span>
        </div>
      </header>

      <div className="chat-panel__body" aria-live="polite">
        {messages.map((message) => (
          <article className={`chat-message chat-message--${message.role}`} key={message.id}>
            <div className="chat-message__bubble">
              <p>{message.text}</p>
              {message.recommendedAction !== undefined && message.recommendedAction !== "none" && (
                <div className="chat-message__actions">
                  <button
                    type="button"
                    disabled={message.actionConfirmed}
                    onClick={() => confirmAction(message.id, message.recommendedAction ?? "none")}
                  >
                    {message.actionConfirmed ? "已记下" : getRecommendedActionLabel(message.recommendedAction)}
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <form className="chat-panel__composer" onSubmit={submitMessage}>
        <label htmlFor="chat-message-input">和它说点什么</label>
        <div className="chat-panel__input-row">
          <input
            id="chat-message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="比如：我有点累"
            maxLength={120}
          />
          <button type="submit" disabled={!draft.trim()}>
            发送
          </button>
        </div>
      </form>
    </section>
  );
}

function getModeLabel(userState: ChatContext["userState"]): string {
  if (userState === "happy") return "活力陪伴中";
  if (userState === "tired") return "关心一下";
  if (userState === "away") return "等你回来";
  return "安静陪伴中";
}
