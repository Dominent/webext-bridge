import { test, expect } from '@playwright/test';
import { createContextWithExtension, getExtensionId } from '../helpers/extension-loader';

test.describe('Iframe Cross-Tab Messaging', () => {
  test('iframe in extension page sends message to content-script in different tab', async () => {
    const context = await createContextWithExtension('fixtures/test-extension/dist');
    const extensionId = await getExtensionId(context);

    // 1. Open web page
    const webPage = await context.newPage();
    await webPage.goto('https://example.com');
    await webPage.waitForTimeout(1500);

    // 2. Open popup with iframe
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/test-page.html`);
    await popupPage.waitForTimeout(2000); // Give iframe time to load

    // 3. Test basic iframe to background communication first
    const basicTest = await popupPage.evaluate(async () => {
      const testIframe = (window as any).frames[0];
      if (!testIframe?.testIframe) {
        return { error: 'testIframe not found' };
      }

      try {
        const pingResponse = await testIframe.testIframe.sendPing();
        return { basicTest: 'passed', pingResponse };
      } catch (error: any) {
        return { error: 'basic test failed: ' + error.message };
      }
    });

    if (basicTest.error) {
      throw new Error(basicTest.error);
    }

    // 4. Test cross-tab messaging - get tabs and send message
    const result = await popupPage.evaluate(async () => {
      const testIframe = (window as any).frames[0];

      try {
        // Get all tabs from background using wrapper function
        const allTabs = await testIframe.testIframe.getAllTabs();

        // Find example.com
        const exampleTab = allTabs.tabs.find((t: any) => t.url && t.url.includes('example.com'));

        if (!exampleTab) {
          return { error: 'Tab not found', allTabs };
        }

        // Send message to content-script using wrapper function
        const response = await testIframe.testIframe.sendToContentScript(
          exampleTab.id,
          { source: 'popup-iframe' }
        );

        return { success: true, tabId: exampleTab.id, response };
      } catch (error: any) {
        return { error: error.message };
      }
    });

    expect(result).toHaveProperty('success', true);
    expect(result.response).toEqual({
      status: 'pong',
      from: 'content-script',
      receivedData: { source: 'popup-iframe' }
    });

    await context.close();
  });
});
