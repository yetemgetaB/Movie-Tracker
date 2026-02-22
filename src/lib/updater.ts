import { check, install } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask, message } from '@tauri-apps/plugin-dialog';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  body?: string;
  date?: string;
}

export class AppUpdater {
  private static instance: AppUpdater;
  private updateInfo: UpdateInfo | null = null;

  private constructor() {}

  static getInstance(): AppUpdater {
    if (!AppUpdater.instance) {
      AppUpdater.instance = new AppUpdater();
    }
    return AppUpdater.instance;
  }

  async checkForUpdates(showNoUpdateMessage = false): Promise<UpdateInfo> {
    try {
      const update = await check();
      
      if (update?.available) {
        this.updateInfo = {
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          body: update.body,
          date: update.date
        };

        // Show update notification
        const shouldUpdate = await ask(
          `A new version (${update.version}) is available!\n\nCurrent version: ${update.currentVersion}\n\nWould you like to update now?`,
          {
            title: 'Update Available',
            kind: 'info'
          }
        );

        if (shouldUpdate) {
          await this.installUpdate();
        }
      } else {
        this.updateInfo = {
          available: false,
          currentVersion: update?.currentVersion || 'unknown',
          latestVersion: update?.currentVersion || 'unknown'
        };

        if (showNoUpdateMessage) {
          await message(
            'You are using the latest version!',
            {
              title: 'No Updates Available',
              kind: 'info'
            }
          );
        }
      }

      return this.updateInfo;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      const errorInfo: UpdateInfo = {
        available: false,
        currentVersion: 'unknown',
        latestVersion: 'unknown'
      };
      return errorInfo;
    }
  }

  private async installUpdate(): Promise<void> {
    try {
      if (!this.updateInfo?.available || !this.update) {
        throw new Error('No update available');
      }

      // Show changelog if available
      if (this.updateInfo.body) {
        const showChangelog = await ask(
          `Would you like to view the changelog before updating?`,
          {
            title: 'View Changelog',
            kind: 'info'
          }
        );

        if (showChangelog) {
          await this.showChangelog();
        }
      }

      // Download and install update
      await this.update.download();
      await this.update.install();
      
      // Ask for restart
      const shouldRestart = await ask(
        'Update downloaded successfully! The app needs to restart to complete the update.',
        {
          title: 'Update Ready',
          kind: 'info'
        }
      );

      if (shouldRestart) {
        await relaunch();
      }
    } catch (error) {
      console.error('Failed to install update:', error);
      await message(
        'Failed to install update. Please try again later.',
        {
          title: 'Update Failed',
          kind: 'error'
        }
      );
    }
  }

  async showChangelog(): Promise<void> {
    if (!this.updateInfo?.body) {
      await message(
        'No changelog available for this version.',
        {
          title: 'Changelog',
          kind: 'info'
        }
      );
      return;
    }

    // For now, show in a simple dialog
    // In a future version, we could create a dedicated changelog component
    await message(
      `Version ${this.updateInfo.latestVersion} Changelog:\n\n${this.updateInfo.body}`,
      {
        title: `Changelog - v${this.updateInfo.latestVersion}`,
        kind: 'info'
      }
    );
  }

  getUpdateInfo(): UpdateInfo | null {
    return this.updateInfo;
  }

  async checkOnStartup(): Promise<void> {
    // Check for updates silently on startup
    try {
      await this.checkForUpdates(false);
    } catch (error) {
      console.error('Failed to check for updates on startup:', error);
    }
  }
}

export default AppUpdater;
