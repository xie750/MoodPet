import { useMemo } from "react";
import { createMockSettingsAdapter, DEFAULT_APP_SETTINGS } from "../../features/settings";
import { SettingsPanel } from "./SettingsPanel";

export function SettingsPanelMock() {
  const adapter = useMemo(
    () =>
      createMockSettingsAdapter({
        ...DEFAULT_APP_SETTINGS,
        reminderLevel: "normal",
        petAlwaysOnTop: true
      }),
    []
  );

  return <SettingsPanel adapter={adapter} cameraStatus="paused" />;
}
