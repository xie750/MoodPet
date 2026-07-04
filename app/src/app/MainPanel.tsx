import { useState } from "react";
import { ChatPanel } from "../components/chat";
import { SmileEnergyGame } from "../components/game";
import { SettingsPanel } from "../components/settings";
import { TaskPanel } from "../components/task";
import type { ChatRecommendedAction } from "../features/chat";
import type { PanelRoute } from "../shared/types";

type MainPanelProps = {
  initialRoute: string;
};

const ROUTE_LABELS: Record<PanelRoute, string> = {
  tasks: "今日任务",
  chat: "和我聊天",
  game: "陪我玩",
  settings: "设置"
};

const ROUTES: readonly PanelRoute[] = ["tasks", "chat", "game", "settings"];

function parseRoute(route: string): PanelRoute {
  if (route.includes("chat")) return "chat";
  if (route.includes("game")) return "game";
  if (route.includes("settings")) return "settings";
  return "tasks";
}

export function MainPanel({ initialRoute }: MainPanelProps) {
  const [route, setRoute] = useState<PanelRoute>(() => parseRoute(initialRoute));

  async function handleChatRecommendedAction(action: ChatRecommendedAction) {
    await window.appApi.events.create({
      type: "chat_recommended_action",
      payload: {
        action,
        userConfirmed: true
      },
      createdAt: Date.now()
    });

    if (action === "open_tasks") {
      setRoute("tasks");
    }

    if (action === "open_smile_game") {
      setRoute("game");
    }
  }

  return (
    <main className="panel">
      <nav className="panel-nav" aria-label="主面板导航">
        {ROUTES.map((item) => (
          <button
            className={route === item ? "active" : ""}
            type="button"
            onClick={() => setRoute(item)}
            aria-current={route === item ? "page" : undefined}
            key={item}
          >
            {ROUTE_LABELS[item]}
          </button>
        ))}
      </nav>

      {route === "tasks" && <TaskPanel />}

      {route === "chat" && (
        <section className="panel-section panel-section-chat">
          <ChatPanel onRecommendedAction={handleChatRecommendedAction} />
        </section>
      )}

      {route === "game" && (
        <section className="panel-section">
          <SmileEnergyGame />
        </section>
      )}

      {route === "settings" && (
        <section className="panel-section">
          <SettingsPanel />
        </section>
      )}
    </main>
  );
}
