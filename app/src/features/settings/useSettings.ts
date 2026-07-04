import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppSettings } from "../../shared/types";
import {
  createWindowSettingsAdapter,
  DEFAULT_APP_SETTINGS,
  normalizeSettingsPatch,
  type SettingsAdapter,
  type SettingsPatch
} from "./settingsModel";

type SettingsState = {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

export function useSettings(adapter?: SettingsAdapter) {
  const settingsAdapter = useMemo(() => adapter ?? createWindowSettingsAdapter(), [adapter]);
  const [state, setState] = useState<SettingsState>({
    settings: DEFAULT_APP_SETTINGS,
    isLoading: true,
    isSaving: false,
    error: null
  });

  const loadSettings = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const settings = await settingsAdapter.get();
      setState({ settings, isLoading: false, isSaving: false, error: null });
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        isSaving: false,
        error: error instanceof Error ? error.message : "设置读取失败"
      }));
    }
  }, [settingsAdapter]);

  const updateSettings = useCallback(
    async (patch: SettingsPatch) => {
      const safePatch = normalizeSettingsPatch(patch);
      setState((current) => ({
        ...current,
        settings: { ...current.settings, ...safePatch },
        isSaving: true,
        error: null
      }));

      try {
        const settings = await settingsAdapter.update(safePatch);
        await settingsAdapter.publishChanged(safePatch);
        setState({ settings, isLoading: false, isSaving: false, error: null });
      } catch (error) {
        setState((current) => ({
          ...current,
          isSaving: false,
          error: error instanceof Error ? error.message : "设置保存失败"
        }));
      }
    },
    [settingsAdapter]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return useMemo(
    () => ({
      ...state,
      reload: loadSettings,
      updateSettings
    }),
    [loadSettings, state, updateSettings]
  );
}
