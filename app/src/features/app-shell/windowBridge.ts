import type { AppApi, IpcResult, PanelRoute } from "../../shared/types";
import { createMockAppShellWindowBridge } from "./mockBridge";
import type { AppShellPreviewMode, AppShellWindowBridge, PetWindowPosition } from "./types";

function ok<T>(data: T): Promise<IpcResult<T>> {
  return Promise.resolve({ ok: true, data });
}

function getRendererAppApi(): AppApi | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.appApi;
}

export function createRendererAppShellWindowBridge(appApi: AppApi): AppShellWindowBridge {
  let petPosition: PetWindowPosition = {
    x: 48,
    y: 84
  };
  let mainPanelVisible = true;

  return {
    async showMainPanel() {
      mainPanelVisible = true;
      return appApi.windows.openPanel({ type: "open_panel", route: "tasks" });
    },
    hideMainPanel() {
      mainPanelVisible = false;
      return ok(true);
    },
    async toggleMainPanel() {
      mainPanelVisible = !mainPanelVisible;
      if (mainPanelVisible) {
        return appApi.windows.openPanel({ type: "open_panel", route: "tasks" });
      }

      return ok(true);
    },
    openPanel(route: PanelRoute) {
      mainPanelVisible = true;
      return appApi.windows.openPanel({ type: "open_panel", route });
    },
    setPetPosition(position: PetWindowPosition) {
      petPosition = position;
      return ok(petPosition);
    },
    getPetPosition() {
      return ok(petPosition);
    },
    setPetAlwaysOnTop(enabled: boolean) {
      return appApi.windows.setPetAlwaysOnTop(enabled);
    }
  };
}

export function createAppShellWindowBridge(mode: AppShellPreviewMode = "auto"): AppShellWindowBridge {
  if (mode === "mock") {
    return createMockAppShellWindowBridge();
  }

  const appApi = getRendererAppApi();
  if (!appApi) {
    return createMockAppShellWindowBridge();
  }

  return createRendererAppShellWindowBridge(appApi);
}
