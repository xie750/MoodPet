import type { AppSettings } from "../../shared/types";
import {
  getCameraPrivacyStatus,
  SETTINGS_COPY,
  useSettings,
  type CameraPrivacyStatus,
  type SettingsAdapter,
  type SettingsPatch
} from "../../features/settings";
import "./SettingsPanel.css";

type SettingsPanelProps = {
  adapter?: SettingsAdapter;
  cameraStatus?: CameraPrivacyStatus;
};

const REMINDER_OPTIONS: Array<{
  value: AppSettings["reminderLevel"];
  label: string;
  description: string;
}> = [
  { value: "quiet", label: "安静", description: "只保留任务完成和重要状态反馈" },
  { value: "normal", label: "标准", description: "适度关心和休息建议" },
  { value: "active", label: "主动", description: "更积极地提醒休息和小游戏" }
];

const CAMERA_STATUS_LABEL: Record<CameraPrivacyStatus, string> = {
  off: "已关闭",
  running: "运行中",
  paused: "识别暂停",
  unavailable: "暂不可用"
};

function ToggleRow({
  checked,
  disabled = false,
  title,
  description,
  onChange
}: {
  checked: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`settings-toggle-row${disabled ? " settings-toggle-row-disabled" : ""}`}>
      <span className="settings-toggle-copy">
        <span className="settings-toggle-title">{title}</span>
        <span className="settings-toggle-description">{description}</span>
      </span>
      <input
        checked={checked}
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="settings-switch" aria-hidden="true" />
    </label>
  );
}

function PrivacyList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="settings-privacy-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsPanel({ adapter, cameraStatus }: SettingsPanelProps) {
  const { settings, isLoading, isSaving, error, updateSettings, reload } = useSettings(adapter);
  const resolvedCameraStatus = getCameraPrivacyStatus(settings, cameraStatus);

  function update(patch: SettingsPatch) {
    updateSettings(patch);
  }

  return (
    <section className="settings-panel" aria-labelledby="settings-title">
      <header className="settings-header">
        <div>
          <p className="settings-kicker">设置</p>
          <h1 id="settings-title">设置与隐私</h1>
        </div>
        <div className={`settings-status settings-status-${resolvedCameraStatus}`}>
          <span>摄像头</span>
          <strong>{CAMERA_STATUS_LABEL[resolvedCameraStatus]}</strong>
        </div>
      </header>

      {error && (
        <div className="settings-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={reload}>
            重试
          </button>
        </div>
      )}

      <div className={isLoading ? "settings-content settings-content-loading" : "settings-content"}>
        <section className="settings-section" aria-labelledby="privacy-title">
          <div className="settings-section-heading">
            <h2 id="privacy-title">摄像头与识别</h2>
            <p>摄像头只用于本地状态识别。默认不保存图片或视频，也不会上传人脸画面。</p>
          </div>

          <div className="settings-control-stack">
            <ToggleRow
              checked={settings.cameraEnabled}
              title="摄像头"
              description="关闭后仍可使用桌宠、任务、聊天和普通小游戏。"
              onChange={(checked) => update({ cameraEnabled: checked })}
            />
            <ToggleRow
              checked={settings.emotionEnabled}
              disabled={!settings.cameraEnabled}
              title="本地状态识别"
              description={
                settings.cameraEnabled
                  ? "只在本机运行，用来调整提醒频率和陪伴反馈。"
                  : "需要先开启摄像头偏好，之后会在你确认时请求授权。"
              }
              onChange={(checked) => update({ emotionEnabled: checked })}
            />
          </div>

          <dl className="settings-facts" aria-label="隐私状态">
            <div>
              <dt>识别方式</dt>
              <dd>本地</dd>
            </div>
            <div>
              <dt>图片和视频保存</dt>
              <dd>不保存</dd>
            </div>
            <div>
              <dt>人脸画面上传</dt>
              <dd>不会上传</dd>
            </div>
          </dl>
        </section>

        <section className="settings-section" aria-labelledby="reminder-title">
          <div className="settings-section-heading">
            <h2 id="reminder-title">提醒方式</h2>
            <p>选择小精灵主动出现的频率。专注模式开启后，主动关心和游戏邀请会显著减少。</p>
          </div>

          <fieldset className="settings-segmented">
            <legend>提醒等级</legend>
            <div className="settings-segmented-options">
              {REMINDER_OPTIONS.map((option) => (
                <label
                  className={settings.reminderLevel === option.value ? "settings-segment active" : "settings-segment"}
                  key={option.value}
                >
                  <input
                    checked={settings.reminderLevel === option.value}
                    name="reminderLevel"
                    type="radio"
                    value={option.value}
                    onChange={() => update({ reminderLevel: option.value })}
                  />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <ToggleRow
            checked={settings.focusMode}
            title="专注模式"
            description="开启后，小精灵不会主动弹出关心和游戏邀请。"
            onChange={(checked) => update({ focusMode: checked })}
          />
        </section>

        <section className="settings-section" aria-labelledby="desktop-title">
          <div className="settings-section-heading">
            <h2 id="desktop-title">桌面偏好</h2>
            <p>调整桌宠在桌面上的出现方式，让它保持轻量、可控。</p>
          </div>

          <div className="settings-control-stack">
            <ToggleRow
              checked={settings.petAlwaysOnTop}
              title="宠物置顶"
              description="让桌宠保持在其他窗口上方，方便随时互动。"
              onChange={(checked) => update({ petAlwaysOnTop: checked })}
            />
            <ToggleRow
              checked={settings.launchAtStartup}
              title="开机自启动"
              description="下次进入桌面时自动出现。"
              onChange={(checked) => update({ launchAtStartup: checked })}
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="storage-title">
          <div className="settings-section-heading">
            <h2 id="storage-title">数据与本地存储</h2>
            <p>产品只保存完成陪伴闭环所需的数据，不保存可识别身份的图像内容。</p>
          </div>

          <div className="settings-privacy-grid">
            <PrivacyList title="默认保存" items={SETTINGS_COPY.savedLocally} />
            <PrivacyList title="默认不保存" items={SETTINGS_COPY.neverSaved} />
          </div>
        </section>
      </div>

      <footer className="settings-footer" aria-live="polite">
        {isSaving ? "正在保存..." : "设置会保存在本机，并同步到应用各处。"}
      </footer>
    </section>
  );
}
