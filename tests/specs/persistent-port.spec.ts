import { test, expect } from '@playwright/test';
import { createContextWithExtension, getExtensionId } from '../helpers/extension-loader';

test.describe('Persistent Port', () => {
  test('content script can communicate with background via persistent port', async () => {
    const context = await createContextWithExtension('fixtures/test-extension/dist');

    try {
      await getExtensionId(context);
      const page = await context.newPage();

      // Collect console messages
      const logs: string[] = [];
      page.on('console', msg => {
        logs.push(msg.text());
        console.log('PAGE:', msg.text());
      });

      await page.goto('https://example.com');

      // Wait for the ping to complete (check for success message)
      await page.waitForFunction(
        () => {
          // Check if success message appeared in any script's console
          return true; // We'll verify via collected logs
        },
        { timeout: 10000 }
      );

      // Give time for async ping to complete
      await page.waitForTimeout(2000);

      // Check that we got the expected log messages
      const hasLoaded = logs.some(log => log.includes('Content script loaded'));
      const hasPingSuccess = logs.some(log => log.includes('Ping success'));

      expect(hasLoaded).toBe(true);
      expect(hasPingSuccess).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('persistent port maintains connection across multiple pages', async () => {
    const context = await createContextWithExtension('fixtures/test-extension/dist');

    try {
      await getExtensionId(context);
      const page = await context.newPage();

      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));

      // First page
      await page.goto('https://example.com');
      await page.waitForTimeout(2000);

      const firstPageSuccess = logs.some(log => log.includes('Ping success'));
      expect(firstPageSuccess).toBe(true);

      // Clear logs and navigate to second page
      logs.length = 0;
      await page.goto('https://example.org');
      await page.waitForTimeout(2000);

      const secondPageSuccess = logs.some(log => log.includes('Ping success'));
      expect(secondPageSuccess).toBe(true);
    } finally {
      await context.close();
    }
  });
});
