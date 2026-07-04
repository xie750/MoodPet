import type { IpcResult } from "../../shared/types";
import type { AppShellWindowBridge, PetWindowPosition } from "./types";

const DEFAULT_PET_POSITION: PetWindowPosition = {
  x: 48,
  y: 84
};

function ok<T>(data: T): Promise<IpcResult<T>> {
  return Promise.resolve({ ok: true, data });
}

export function createMockAppShellWindowBridge(
  initialPosition: PetWindowPosition = DEFAULT_PET_POSITION
): AppShellWindowBridge {
  let petPosition = initialPosition;
  let mainPanelVisible = true;
  let alwaysOnTop = true;

  return {
    showMainPanel() {
      mainPanelVisible = true;
      return ok(true);
    },
    hideMainPanel() {
      mainPanelVisible = false;
      return ok(true);
    },
    toggleMainPanel() {
      mainPanelVisible = !mainPanelVisible;
      return ok(true);
    },
    openPanel() {
      mainPanelVisible = true;
      return ok(true);
    },
    setPetPosition(position) {
      petPosition = position;
      return ok(petPosition);
    },
    getPetPosition() {
      return ok(petPosition);
    },
    setPetAlwaysOnTop(enabled) {
      alwaysOnTop = enabled;
      void alwaysOnTop;
      return ok(true);
    }
  };
}
