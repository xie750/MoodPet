import { useCallback, useMemo, useState } from "react";
import type { IpcResult, PanelRoute } from "../../shared/types";
import { createAppShellWindowBridge } from "./windowBridge";
import type {
  AppShellController,
  AppShellPreviewMode,
  AppShellSnapshot,
  AppShellWindowBridge,
  PetWindowPosition
} from "./types";

const DEFAULT_SNAPSHOT: AppShellSnapshot = {
  petWindow: {
    position: {
      x: 48,
      y: 84
    },
    width: 220,
    height: 260,
    alwaysOnTop: true,
    transparent: true,
    draggable: true
  },
  mainPanel: {
    visible: true,
    route: "tasks",
    width: 420,
    height: 620
  },
  tray: {
    available: true,
    menuItems: [
      {
        id: "open-main-panel",
        label: "打开主面板"
      },
      {
        id: "pause-reminders",
        label: "暂停提醒 1 小时"
      },
      {
        id: "quit",
        label: "退出应用"
      }
    ]
  },
  quickMenuOpen: false,
  statusText: "桌宠窗口已就绪，主面板使用 mock 数据展示。",
  lastAction: "初始化应用壳"
};

type UseAppShellControllerOptions = {
  mode?: AppShellPreviewMode;
  bridge?: AppShellWindowBridge;
  initialSnapshot?: AppShellSnapshot;
};

function getResultMessage(result: IpcResult<unknown>, fallback: string): string {
  if (result.ok) {
    return fallback;
  }

  return result.error.message;
}

export function useAppShellController(options: UseAppShellControllerOptions = {}): AppShellController {
  const bridge = useMemo(
    () => options.bridge ?? createAppShellWindowBridge(options.mode),
    [options.bridge, options.mode]
  );
  const [snapshot, setSnapshot] = useState<AppShellSnapshot>(options.initialSnapshot ?? DEFAULT_SNAPSHOT);

  const openPanel = useCallback(
    async (route: PanelRoute) => {
      setSnapshot((current) => ({
        ...current,
        quickMenuOpen: false,
        mainPanel: {
          ...current.mainPanel,
          visible: true,
          route
        },
        lastAction: `打开主面板：${route}`,
        statusText: "正在通过窗口白名单接口打开主面板。"
      }));

      const result = await bridge.openPanel(route);
      setSnapshot((current) => ({
        ...current,
        statusText: getResultMessage(result, "主面板已打开。")
      }));
    },
    [bridge]
  );

  const showMainPanel = useCallback(async () => {
    setSnapshot((current) => ({
      ...current,
      mainPanel: {
        ...current.mainPanel,
        visible: true
      },
      lastAction: "显示主面板",
      statusText: "正在显示主面板。"
    }));

    const result = await bridge.showMainPanel();
    setSnapshot((current) => ({
      ...current,
      statusText: getResultMessage(result, "主面板已显示。")
    }));
  }, [bridge]);

  const hideMainPanel = useCallback(async () => {
    setSnapshot((current) => ({
      ...current,
      mainPanel: {
        ...current.mainPanel,
        visible: false
      },
      lastAction: "隐藏主面板",
      statusText: "主面板已隐藏，桌宠窗口仍保持存在。"
    }));

    const result = await bridge.hideMainPanel();
    setSnapshot((current) => ({
      ...current,
      statusText: getResultMessage(result, "主面板已隐藏，桌宠仍在桌面。")
    }));
  }, [bridge]);

  const toggleMainPanel = useCallback(async () => {
    const nextVisible = !snapshot.mainPanel.visible;
    setSnapshot((current) => ({
      ...current,
      mainPanel: {
        ...current.mainPanel,
        visible: nextVisible
      },
      quickMenuOpen: false,
      lastAction: nextVisible ? "展开主面板" : "收起主面板",
      statusText: nextVisible ? "主面板已展开。" : "主面板已收起。"
    }));

    const result = await bridge.toggleMainPanel();
    setSnapshot((current) => ({
      ...current,
      statusText: getResultMessage(result, nextVisible ? "主面板已展开。" : "主面板已收起。")
    }));
  }, [bridge, snapshot.mainPanel.visible]);

  const movePetWindow = useCallback(
    (position: PetWindowPosition) => {
      setSnapshot((current) => ({
        ...current,
        petWindow: {
          ...current.petWindow,
          position
        },
        lastAction: "移动桌宠窗口",
        statusText: `桌宠位置：${Math.round(position.x)}, ${Math.round(position.y)}`
      }));

      void bridge.setPetPosition(position);
    },
    [bridge]
  );

  const toggleQuickMenu = useCallback(() => {
    setSnapshot((current) => ({
      ...current,
      quickMenuOpen: !current.quickMenuOpen,
      lastAction: current.quickMenuOpen ? "关闭快捷菜单" : "打开快捷菜单",
      statusText: current.quickMenuOpen ? "快捷菜单已关闭。" : "快捷菜单已打开，可进入任务、游戏、聊天或设置。"
    }));
  }, []);

  const closeQuickMenu = useCallback(() => {
    setSnapshot((current) => ({
      ...current,
      quickMenuOpen: false,
      lastAction: "关闭快捷菜单",
      statusText: "快捷菜单已关闭。"
    }));
  }, []);

  const setPetAlwaysOnTop = useCallback(
    async (enabled: boolean) => {
      setSnapshot((current) => ({
        ...current,
        petWindow: {
          ...current.petWindow,
          alwaysOnTop: enabled
        },
        lastAction: enabled ? "启用桌宠置顶" : "关闭桌宠置顶",
        statusText: enabled ? "桌宠窗口保持置顶。" : "桌宠窗口已取消置顶。"
      }));

      const result = await bridge.setPetAlwaysOnTop(enabled);
      setSnapshot((current) => ({
        ...current,
        statusText: getResultMessage(result, enabled ? "桌宠窗口保持置顶。" : "桌宠窗口已取消置顶。")
      }));
    },
    [bridge]
  );

  return {
    snapshot,
    openPanel,
    showMainPanel,
    hideMainPanel,
    toggleMainPanel,
    movePetWindow,
    toggleQuickMenu,
    closeQuickMenu,
    setPetAlwaysOnTop
  };
}
