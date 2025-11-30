import { test, expect } from '@playwright/test';
import { createContextWithExtension, getExtensionId, waitForIframeReady } from '../helpers/extension-loader';

test.describe('Iframe Messaging in Extension Pages', () => {
  test('iframe can send message to background and receive reply', async () => {
    // Load extension
    const context = await createContextWithExtension('fixtures/test-extension/dist');
    const extensionId = await getExtensionId(context);

    // Navigate to test page (popup with iframe)
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/test-page.html`);

    // Wait for iframe to be ready
    await waitForIframeReady(page);

    // Test 1: iframe → background (ping)
    const pingResponse = await page.evaluate(async () => {
      const testIframe = (window as any).frames[0];
      return await testIframe.testIframe.sendPing();
    });

    expect(pingResponse).toEqual({ status: 'pong' });

    // Test 2: iframe → background with complex data
    const testData = {
      foo: 'bar',
      nested: { value: 42 },
      array: [1, 2, 3]
    };

    const complexResponse = await page.evaluate(async (data) => {
      const testIframe = (window as any).frames[0];
      return await testIframe.testIframe.sendTestMessage(data);
    }, testData);

    expect(complexResponse).toEqual({
      success: true,
      echo: testData
    });

    // Test 3: Verify background info is accessible
    const backgroundInfo = await page.evaluate(async () => {
      const testIframe = (window as any).frames[0];
      return await testIframe.testIframe.getBackgroundInfo();
    });

    expect(backgroundInfo).toHaveProperty('runtime', 'background');
    expect(backgroundInfo).toHaveProperty('timestamp');

    await context.close();
  });
});
