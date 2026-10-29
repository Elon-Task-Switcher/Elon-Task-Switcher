import { BREAK_TICK_SOUND_PRESETS, REMINDER_SOUND_PRESETS } from './soundPresets';
import type { TimerSettings } from './timer';

type SettingsPanelProps = {
  settings: TimerSettings;
  onSettingChange: (settingName: keyof TimerSettings, value: number | boolean | string) => void;
  onRestoreDefaults: () => void;
};

export function SettingsPanel({ settings, onSettingChange, onRestoreDefaults }: SettingsPanelProps) {
  return (
    <section className="settings-card" aria-labelledby="settings-title">
      <h2 id="settings-title">Settings</h2>
      <label>
        Work duration (minutes)
        <input
          type="number"
          min="0.05"
          step="0.05"
          max="180"
          value={settings.workMinutes}
          onChange={(event) => onSettingChange('workMinutes', Number(event.target.value))}
        />
      </label>
      <label>
        Break duration (minutes)
        <input
          type="number"
          min="0.05"
          step="0.05"
          max="180"
          value={settings.breakMinutes}
          onChange={(event) => onSettingChange('breakMinutes', Number(event.target.value))}
        />
      </label>
      <label>
        Intervals before break
        <input
          type="number"
          min="1"
          max="180"
          value={settings.intervalsBeforeBreak}
          onChange={(event) => onSettingChange('intervalsBeforeBreak', Number(event.target.value))}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.autoStartNextWork}
          onChange={(event) => onSettingChange('autoStartNextWork', event.target.checked)}
        />
        Auto-start next task loop
      </label>
      <fieldset className="sound-settings">
        <legend>Sound settings</legend>
        <label>
          Task switch sound
          <select
            value={settings.reminderSoundId}
            onChange={(event) => onSettingChange('reminderSoundId', event.target.value)}
          >
            {REMINDER_SOUND_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </label>
        <label>
          Task switch volume: {Math.round(settings.reminderVolume * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.reminderVolume}
            onChange={(event) => onSettingChange('reminderVolume', Number(event.target.value))}
          />
        </label>
        <label>
          Break tick sound
          <select
            value={settings.breakTickSoundId}
            onChange={(event) => onSettingChange('breakTickSoundId', event.target.value)}
          >
            {BREAK_TICK_SOUND_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </label>
        <label>
          Break tick volume: {Math.round(settings.breakTickVolume * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.breakTickVolume}
            onChange={(event) => onSettingChange('breakTickVolume', Number(event.target.value))}
          />
        </label>
      </fieldset>
      <button type="button" className="secondary" onClick={onRestoreDefaults}>Restore Defaults</button>
    </section>
  );
}
