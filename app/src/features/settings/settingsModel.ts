import type { AppSettings } from "../../shared/types";

export type SettingsPatch = Partial<
  Pick<
    AppSettings,
    | "cameraEnabled"
    | "emotionEnabled"
    | "reminderLevel"
    | "focusMode"
    | "petAlwaysOnTop"
    | "launchAtStartup"
  >
>;

export type CameraPrivacyStatus = "off" | "running" | "paused" | "unavailable";

export type SettingsAdapter = {
  get(): Promise<AppSettings>;
  update(patch: SettingsPatch): Promise<AppSettings>;
  publishChanged(patch: SettingsPatch): Promise<void>;
};

export const SETTINGS_COPY = {
  savedLocally: ["任务数据", "宠物亲密度", "游戏记录", "设置项", "状态摘要"],
  neverSaved: ["摄像头视频", "人脸图片", "单帧截图", "可识别身份的图像数据"]
} as const;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  cameraEnabled: false,
  emotionEnabled: false,
  reminderLevel: "normal",
  focusMode: false,
  petAlwaysOnTop: true,
  launchAtStartup: false,
  selectedPetId: "default",
  themeMode: "system"
};

export function normalizeSettingsPatch(patch: SettingsPatch): SettingsPatch {
  const normalized: SettingsPatch = {};

  if (typeof patch.cameraEnabled === "boolean") {
    normalized.cameraEnabled = patch.cameraEnabled;
    if (!patch.cameraEnabled) {
      normalized.emotionEnabled = false;
    }
  }

  if (typeof patch.emotionEnabled === "boolean") {
    normalized.emotionEnabled = patch.emotionEnabled;
    if (patch.emotionEnabled) {
      normalized.cameraEnabled = true;
    }
  }

  if (
    patch.reminderLevel === "quiet" ||
    patch.reminderLevel === "normal" ||
    patch.reminderLevel === "active"
  ) {
    normalized.reminderLevel = patch.reminderLevel;
  }

  if (typeof patch.focusMode === "boolean") {
    normalized.focusMode = patch.focusMode;
  }

  if (typeof patch.petAlwaysOnTop === "boolean") {
    normalized.petAlwaysOnTop = patch.petAlwaysOnTop;
  }

  if (typeof patch.launchAtStartup === "boolean") {
    normalized.launchAtStartup = patch.launchAtStartup;
  }

  return normalized;
}

export function getCameraPrivacyStatus(
  settings: Pick<AppSettings, "cameraEnabled" | "emotionEnabled">,
  runtimeStatus?: CameraPrivacyStatus
): CameraPrivacyStatus {
  if (!settings.cameraEnabled) {
    return "off";
  }

  if (!settings.emotionEnabled) {
    return "paused";
  }

  return runtimeStatus ?? "running";
}

export function createMockSettingsAdapter(initialSettings: AppSettings = DEFAULT_APP_SETTINGS): SettingsAdapter {
  let current = initialSettings;

  return {
    async get() {
      return current;
    },
    async update(patch) {
      current = { ...current, ...normalizeSettingsPatch(patch) };
      return current;
    },
    async publishChanged() {
      return undefined;
    }
  };
}

export function createWindowSettingsAdapter(): SettingsAdapter {
  return {
    async get() {
      const result = await window.appApi.settings.get();
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    async update(patch) {
      const safePatch = normalizeSettingsPatch(patch);
      const result = await window.appApi.settings.update(safePatch);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    async publishChanged(patch) {
      const event = {
        type: "settings_changed" as const,
        payload: normalizeSettingsPatch(patch),
        createdAt: Date.now()
      };
      const result = await window.appApi.events.create(event);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
    }
  };
}
