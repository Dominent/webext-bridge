import { chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createContextWithExtension(extensionPath: string) {
  // extensionPath should point to the dist folder (e.g., 'fixtures/test-extension/dist')
  const pathToExtension = path.resolve(__dirname, '..', extensionPath);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
    ],
  });

  return context;
}

export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Wait for the background page/service worker to load
  const backgroundPage = context.serviceWorkers()[0] || context.backgroundPages()[0];

  if (!backgroundPage) {
    // Wait for service worker
    const serviceWorker = await context.waitForEvent('serviceworker');
    const extensionId = serviceWorker.url().split('/')[2];
    return extensionId;
  }

  const extensionId = backgroundPage.url().split('/')[2];
  return extensionId;
}

export async function waitForContentScriptReady(page: any, timeout: number = 10000): Promise<void> {
  // Wait for the content script to be ready
  await page.waitForFunction(
    () => (window as any).webextBridgeReady === true,
    { timeout }
  );
}
