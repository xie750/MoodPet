import type { IpcResult, PanelRoute } from "../../shared/types";

export type PetWindowPosition = {
  x: number;
  y: number;
};

export type PetWindowSnapshot = {
  position: PetWindowPosition;
  width: number;
  height: number;
  alwaysOnTop: boolean;
  transparent: boolean;
  draggable: boolean;
};

export type MainPanelSnapshot = {
  visible: boolean;
  route: PanelRoute;
  width: number;
  height: number;
};

export type TraySnapshot = {
  available: boolean;
  menuItems: readonly TrayMenuItem[];
};

export type TrayMenuItem = {
  id: "open-main-panel" | "pause-reminders" | "quit";
  label: string;
  disabled?: boolean;
};

export type AppShellSnapshot = {
  petWindow: PetWindowSnapshot;
  mainPanel: MainPanelSnapshot;
  tray: TraySnapshot;
  quickMenuOpen: boolean;
  statusText: string;
  lastAction: string;
};

export type AppShellWindowBridge = {
  showMainPanel(): Promise<IpcResult<true>>;
  hideMainPanel(): Promise<IpcResult<true>>;
  toggleMainPanel(): Promise<IpcResult<true>>;
  openPanel(route: PanelRoute): Promise<IpcResult<true>>;
  setPetPosition(position: PetWindowPosition): Promise<IpcResult<PetWindowPosition>>;
  getPetPosition(): Promise<IpcResult<PetWindowPosition>>;
  setPetAlwaysOnTop(enabled: boolean): Promise<IpcResult<true>>;
};

export type AppShellController = {
  snapshot: AppShellSnapshot;
  openPanel(route: PanelRoute): Promise<void>;
  showMainPanel(): Promise<void>;
  hideMainPanel(): Promise<void>;
  toggleMainPanel(): Promise<void>;
  movePetWindow(position: PetWindowPosition): void;
  toggleQuickMenu(): void;
  closeQuickMenu(): void;
  setPetAlwaysOnTop(enabled: boolean): Promise<void>;
};

export type AppShellPreviewMode = "auto" | "mock";
