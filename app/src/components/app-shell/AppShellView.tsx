import { useEffect, useRef, useState } from "react";
import type { PanelRoute } from "../../shared/types";
import type { AppShellController, PetWindowPosition } from "../../features/app-shell/types";
import "./AppShellView.css";

type AppShellViewProps = {
  controller: AppShellController;
};

type IconName = "tasks" | "chat" | "game" | "settings" | "panel" | "pin" | "tray" | "close";

const ROUTE_LABELS: Record<PanelRoute, string> = {
  tasks: "今日任务",
  chat: "和我聊天",
  game: "陪我玩",
  settings: "设置"
};

const ROUTE_DESCRIPTIONS: Record<PanelRoute, string> = {
  tasks: "查看今天的小任务和完成进度。",
  chat: "用短句获得温和陪伴反馈。",
  game: "进入微笑能量小游戏入口。",
  settings: "管理隐私、提醒和显示偏好。"
};

const ROUTES: readonly PanelRoute[] = ["tasks", "chat", "game", "settings"];

function ShellIcon({ name }: { name: IconName }) {
  const pathByName: Record<IconName, string> = {
    tasks: "M6 7h12M6 12h12M6 17h8M4 7h.01M4 12h.01M4 17h.01",
    chat: "M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4A3.5 3.5 0 0 1 15.5 14H10l-5 4v-4.5",
    game: "M7 9h2v2h2v2H9v2H7v-2H5v-2h2V9Zm8.5 1h.01M17.5 14h.01M6 6h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z",
    settings:
      "M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0-5v2M12 18.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    panel: "M4 5h16v14H4V5Zm5 0v14",
    pin: "M14 3l7 7-3 1-4 4v4l-2 2-3-7-6-3 2-2h4l4-4 1-2Z",
    tray: "M4 4h16v11H4V4Zm2 15h12M9 15v4M15 15v4",
    close: "M6 6l12 12M18 6 6 18"
  };

  return (
    <svg aria-hidden="true" className="app-shell-icon" focusable="false" viewBox="0 0 24 24">
      <path d={pathByName[name]} />
    </svg>
  );
}

export function AppShellView({ controller }: AppShellViewProps) {
  const { snapshot } = controller;
  const dragState = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPosition: PetWindowPosition;
    moved: boolean;
  } | null>(null);
  const [panelTheme, setPanelTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        controller.closeQuickMenu();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [controller]);

  function handlePetPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: snapshot.petWindow.position,
      moved: false
    };
  }

  function handlePetPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - currentDrag.startClientX;
    const deltaY = event.clientY - currentDrag.startClientY;
    const movedFarEnough = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;
    currentDrag.moved = currentDrag.moved || movedFarEnough;

    controller.movePetWindow({
      x: Math.max(12, currentDrag.startPosition.x + deltaX),
      y: Math.max(12, currentDrag.startPosition.y + deltaY)
    });
  }

  function handlePetPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;

    if (!currentDrag.moved) {
      controller.toggleQuickMenu();
    }
  }

  function handlePetKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      controller.toggleQuickMenu();
    }
  }

  return (
    <section className={`app-shell-preview app-shell-preview-${panelTheme}`} aria-label="应用壳与窗口模块 mock 预览">
      <header className="app-shell-header">
        <div>
          <p className="app-shell-kicker">应用壳与窗口模块</p>
          <h1>桌面陪伴精灵窗口控制台</h1>
          <p>透明桌宠窗口、主面板、快捷菜单和托盘行为的渲染侧 mock 展示。</p>
        </div>
        <div className="app-shell-header-actions" aria-label="预览控制">
          <button type="button" className="app-shell-secondary-button" onClick={controller.toggleMainPanel}>
            <ShellIcon name="panel" />
            {snapshot.mainPanel.visible ? "收起面板" : "显示面板"}
          </button>
          <button
            type="button"
            className="app-shell-icon-button"
            aria-label={panelTheme === "light" ? "切换为深色预览" : "切换为浅色预览"}
            onClick={() => setPanelTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            <ShellIcon name="settings" />
          </button>
        </div>
      </header>

      <div className="app-shell-body">
        <div className="app-shell-desktop" onPointerDown={controller.closeQuickMenu}>
          <div className="app-shell-screen-label">Desktop Mock</div>
          <button
            type="button"
            className="app-shell-pet"
            aria-label="桌宠窗口，点击打开快捷菜单，拖动改变位置"
            aria-expanded={snapshot.quickMenuOpen}
            onKeyDown={handlePetKeyDown}
            onPointerDown={(event) => {
              event.stopPropagation();
              handlePetPointerDown(event);
            }}
            onPointerMove={handlePetPointerMove}
            onPointerUp={handlePetPointerUp}
            style={{
              left: `${snapshot.petWindow.position.x}px`,
              top: `${snapshot.petWindow.position.y}px`,
              width: `${snapshot.petWindow.width}px`,
              height: `${snapshot.petWindow.height}px`
            }}
          >
            <span className="app-shell-pet-shadow" />
            <span className="app-shell-pet-body">
              <span className="app-shell-pet-face" />
            </span>
            <span className="app-shell-pet-caption">我在这儿</span>
          </button>

          {snapshot.quickMenuOpen && (
            <div
              className="app-shell-quick-menu"
              role="menu"
              aria-label="桌宠快捷菜单"
              style={{
                left: `${snapshot.petWindow.position.x + 158}px`,
                top: `${snapshot.petWindow.position.y + 48}px`
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {ROUTES.map((route) => (
                <button
                  key={route}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    void controller.openPanel(route);
                  }}
                >
                  <ShellIcon name={route} />
                  {ROUTE_LABELS[route]}
                </button>
              ))}
              <div className="app-shell-menu-divider" />
              <button type="button" role="menuitem" onClick={controller.closeQuickMenu}>
                <ShellIcon name="close" />
                稍后再说
              </button>
            </div>
          )}

          {snapshot.mainPanel.visible && (
            <article className="app-shell-panel" aria-label="主面板窗口 mock">
              <header className="app-shell-panel-titlebar">
                <div>
                  <span>桌面陪伴精灵</span>
                  <small>{snapshot.mainPanel.width} x {snapshot.mainPanel.height}</small>
                </div>
                <button type="button" aria-label="隐藏主面板" onClick={() => void controller.hideMainPanel()}>
                  <ShellIcon name="close" />
                </button>
              </header>
              <div className="app-shell-panel-layout">
                <nav aria-label="主面板导航">
                  {ROUTES.map((route) => (
                    <button
                      key={route}
                      type="button"
                      className={snapshot.mainPanel.route === route ? "active" : ""}
                      onClick={() => {
                        void controller.openPanel(route);
                      }}
                    >
                      <ShellIcon name={route} />
                      {ROUTE_LABELS[route]}
                    </button>
                  ))}
                </nav>
                <main>
                  <p className="app-shell-section-label">当前面板</p>
                  <h2>{ROUTE_LABELS[snapshot.mainPanel.route]}</h2>
                  <p>{ROUTE_DESCRIPTIONS[snapshot.mainPanel.route]}</p>
                  <div className="app-shell-status-grid">
                    <div>
                      <span>窗口状态</span>
                      <strong>{snapshot.mainPanel.visible ? "已显示" : "已隐藏"}</strong>
                    </div>
                    <div>
                      <span>桌宠置顶</span>
                      <strong>{snapshot.petWindow.alwaysOnTop ? "开启" : "关闭"}</strong>
                    </div>
                  </div>
                </main>
              </div>
            </article>
          )}
        </div>

        <aside className="app-shell-inspector" aria-label="窗口状态">
          <section>
            <div className="app-shell-section-heading">
              <ShellIcon name="pin" />
              <h2>桌宠窗口</h2>
            </div>
            <dl>
              <div>
                <dt>透明窗口</dt>
                <dd>{snapshot.petWindow.transparent ? "是" : "否"}</dd>
              </div>
              <div>
                <dt>可拖动</dt>
                <dd>{snapshot.petWindow.draggable ? "是" : "否"}</dd>
              </div>
              <div>
                <dt>当前位置</dt>
                <dd>{Math.round(snapshot.petWindow.position.x)}, {Math.round(snapshot.petWindow.position.y)}</dd>
              </div>
            </dl>
            <label className="app-shell-toggle">
              <input
                type="checkbox"
                checked={snapshot.petWindow.alwaysOnTop}
                onChange={(event) => {
                  void controller.setPetAlwaysOnTop(event.currentTarget.checked);
                }}
              />
              <span>窗口置顶</span>
            </label>
          </section>

          <section>
            <div className="app-shell-section-heading">
              <ShellIcon name="tray" />
              <h2>系统托盘</h2>
            </div>
            <div className="app-shell-tray-list">
              {snapshot.tray.menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.id === "open-main-panel") {
                      void controller.showMainPanel();
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section aria-live="polite">
            <p className="app-shell-section-label">最近动作</p>
            <strong className="app-shell-last-action">{snapshot.lastAction}</strong>
            <p className="app-shell-status-text">{snapshot.statusText}</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
