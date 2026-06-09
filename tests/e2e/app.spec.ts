import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')) as { version: string };

const SETTINGS_KEY = 'elon-task-switcher.settings.v1';

const silentFastSettings = {
  workMinutes: 0.05,
  breakMinutes: 0.05,
  intervalsBeforeBreak: 12,
  autoStartNextWork: true,
  reminderSoundId: 'silent',
  breakTickSoundId: 'silent',
  reminderVolume: 0.85,
  breakTickVolume: 0.45,
};

async function seedSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: SETTINGS_KEY, value: settings },
  );
}

async function expectStatus(page: Page, status: string, options?: { timeout?: number }) {
  await expect(page.locator('.mode-label')).toHaveText(status, options);
}

test.describe('Elon Task Switcher end-to-end', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the default timer and exposes all main controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Task switching timer' })).toBeVisible();
    await expectStatus(page, 'Work');
    await expect(page.getByLabel('Time remaining')).toHaveText('05:00');
    await expect(page.getByText('Switch task when the timer ends.')).toBeVisible();
    await expect(page.getByText('Completed intervals: 0 / 12')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Test Reminder' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Test Break Tick' })).toBeEnabled();

    await expect(page.getByLabel('Work duration (minutes)')).toHaveValue('5');
    await expect(page.getByLabel('Break duration (minutes)')).toHaveValue('5');
    await expect(page.getByLabel('Intervals before break')).toHaveValue('12');
    await expect(page.getByLabel('Auto-start next task loop')).toBeChecked();
    await expect(page.getByLabel('Task switch sound')).toHaveValue('bell');
    await expect(page.getByLabel('Break tick sound')).toHaveValue('classic-tick');
    await expect(page.getByLabel(/Task switch volume/)).toHaveValue('0.85');
    await expect(page.getByLabel(/Break tick volume/)).toHaveValue('0.45');
    await expect(page.getByRole('heading', { name: 'GitHub project links' })).toBeVisible();
    await expect(page.getByLabel('App version')).toHaveText(`Version ${packageJson.version}`);
    await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher');
    await expect(page.getByRole('link', { name: 'Report an issue' })).toHaveAttribute('href', 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher/issues');
    await expect(page.getByRole('link', { name: 'MIT license' })).toHaveAttribute('href', 'https://github.com/Elon-Task-Switcher/Elon-Task-Switcher/blob/main/LICENSE');
  });

  test('starts, pauses, resumes, resets, and persists the running session after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click();
    await expectStatus(page, 'Work running');
    await expect(page.getByRole('button', { name: 'Pause' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeEnabled();

    await page.getByRole('button', { name: 'Pause' }).click();
    await expectStatus(page, 'Paused');
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

    await page.getByRole('button', { name: 'Resume' }).click();
    await expectStatus(page, 'Work running');

    await page.reload();
    await expectStatus(page, 'Work running');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expectStatus(page, 'Work');
    await expect(page.getByLabel('Time remaining')).toHaveText('05:00');
  });

  test('updates settings, persists them across reload, and restores defaults', async ({ page }) => {
    await page.getByLabel('Work duration (minutes)').fill('7');
    await page.getByLabel('Break duration (minutes)').fill('3');
    await page.getByLabel('Intervals before break').fill('2');
    await page.getByLabel('Auto-start next task loop').uncheck();
    await page.getByLabel('Task switch sound').selectOption('alarm');
    await page.getByLabel('Break tick sound').selectOption('digital');
    await page.getByLabel(/Task switch volume/).fill('0.4');
    await page.getByLabel(/Break tick volume/).fill('0.2');

    await expect(page.getByLabel('Time remaining')).toHaveText('07:00');
    await page.reload();

    await expect(page.getByLabel('Work duration (minutes)')).toHaveValue('7');
    await expect(page.getByLabel('Break duration (minutes)')).toHaveValue('3');
    await expect(page.getByLabel('Intervals before break')).toHaveValue('2');
    await expect(page.getByLabel('Auto-start next task loop')).not.toBeChecked();
    await expect(page.getByLabel('Task switch sound')).toHaveValue('alarm');
    await expect(page.getByLabel('Break tick sound')).toHaveValue('digital');
    await expect(page.getByLabel(/Task switch volume/)).toHaveValue('0.4');
    await expect(page.getByLabel(/Break tick volume/)).toHaveValue('0.2');

    await page.getByRole('button', { name: 'Restore Defaults' }).click();
    await expect(page.getByLabel('Time remaining')).toHaveText('05:00');
    await expect(page.getByLabel('Auto-start next task loop')).toBeChecked();
    await expect(page.getByLabel('Task switch sound')).toHaveValue('bell');
    await expect(page.getByLabel('Break tick sound')).toHaveValue('classic-tick');
  });
});

test.describe('timer completion flows', () => {
  test('auto-starts the next work loop and shows a switch alert when a work interval ends', async ({ page }) => {
    await seedSettings(page, silentFastSettings);
    await page.goto('/');

    await page.getByRole('button', { name: 'Start' }).click();
    await expectStatus(page, 'Work running');
    await expect(page.getByText('Timer fini - change de tache maintenant')).toBeVisible({ timeout: 5_000 });
    await expectStatus(page, 'Work running');
    await expect(page.getByText('Completed intervals: 1 / 12')).toBeVisible();
  });

  test('enters break after configured interval count, completes it, then resumes work', async ({ page }) => {
    await seedSettings(page, {
      ...silentFastSettings,
      intervalsBeforeBreak: 1,
      autoStartNextWork: false,
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Start' }).click();
    await expectStatus(page, 'Break');
    await expect(page.locator('main')).toHaveAttribute('data-status', 'break-running');
    await expect(page.getByText('Tick-tock plays during the break. Return to work when it ends.')).toBeVisible();

    await expectStatus(page, 'Break complete', { timeout: 5_000 });
    await expect(page.locator('main')).toHaveAttribute('data-status', 'break-complete');
    await expect(page.getByRole('button', { name: 'Resume work' })).toBeVisible();

    await page.getByRole('button', { name: 'Resume work' }).click();
    await expectStatus(page, 'Work');
    await expect(page.getByText('Completed intervals: 0 / 1')).toBeVisible();
  });

  test('lets the user continue manually when auto-start is disabled before a break is due', async ({ page }) => {
    await seedSettings(page, {
      ...silentFastSettings,
      intervalsBeforeBreak: 2,
      autoStartNextWork: false,
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Start' }).click();
    await expectStatus(page, 'Switch task', { timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Next loop' })).toBeVisible();
    await expect(page.getByText('Completed intervals: 1 / 2')).toBeVisible();

    await page.getByRole('button', { name: 'Next loop' }).click();
    await expectStatus(page, 'Work');
    await expect(page.getByLabel('Time remaining')).toHaveText('00:03');
  });
});
