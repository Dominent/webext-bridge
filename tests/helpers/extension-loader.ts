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

export async function waitForIframeReady(page: any, iframeIndex: number = 0, timeout: number = 10000): Promise<void> {
  // Wait for the iframe's testIframe object to be ready
  await page.waitForFunction(
    (index: number) => {
      try {
        const iframe = (window as any).frames[index];
        return iframe && typeof iframe.testIframe === 'object' && typeof iframe.testIframe.sendPing === 'function';
      } catch {
        return false;
      }
    },
    iframeIndex,
    { timeout }
  );
}

export async function getChromeTabId(page: any): Promise<number> {
  // Use Chrome DevTools Protocol to get the actual Chrome tab ID
  const cdpSession = await page.context().newCDPSession(page);

  try {
    const { targetInfo } = await cdpSession.send('Target.getTargetInfo');

    // The tab ID in Chrome is typically embedded in the targetId or we need to query it differently
    // Let's try using the browser.tabs API through the extension background
    // For now, let's parse from the page's opener or use a different approach

    // Actually, the simplest way is to have the extension tell us the tab ID
    // Let's query all tabs and find the one matching this page's URL
    await cdpSession.detach();

    // Fallback: use page evaluation to get tab ID from content script
    const tabId = await page.evaluate(() => (window as any).currentTabId);
    return tabId;
  } catch (error) {
    await cdpSession.detach();
    throw error;
  }
}
