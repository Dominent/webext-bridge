import { sendMessage, setNamespace, onMessage } from 'webext-bridge/iframe';

console.log('[Test Extension] Iframe script loaded');

// Set namespace
setNamespace('com.webext-bridge.test');

// Expose webext-bridge for tests to use directly
(window as any).webextBridge = {
  sendMessage,
  onMessage
};

// Expose test functions to window for Playwright to call
(window as any).testIframe = {
  async sendPing() {
    console.log('[Iframe] Sending ping to background');
    const response = await sendMessage('ping', {}, 'background');
    console.log('[Iframe] Received response:', response);
    return response;
  },

  async sendTestMessage(data: any) {
    console.log('[Iframe] Sending test-message to background:', data);
    const response = await sendMessage('test-message', data, 'background');
    console.log('[Iframe] Received response:', response);
    return response;
  },

  async getBackgroundInfo() {
    console.log('[Iframe] Getting background info');
    const response = await sendMessage('get-background-info', {}, 'background');
    console.log('[Iframe] Received info:', response);
    return response;
  },

  async getAllTabs() {
    console.log('[Iframe] Getting all tabs');
    const response = await sendMessage('get-all-tabs', {}, 'background');
    console.log('[Iframe] Received tabs:', response);
    return response;
  },

  async sendToContentScript(tabId: number, data: any) {
    console.log(`[Iframe] Sending to content-script@${tabId}:`, data);
    try {
      const response = await sendMessage('ping-from-iframe', data, `content-script@${tabId}`);
      console.log('[Iframe] Received response from content-script:', response);
      return response;
    } catch (error) {
      console.error('[Iframe] Error sending to content-script:', error);
      throw error;
    }
  }
};

// Listen for messages from background
onMessage('iframe-test', async ({ data }) => {
  console.log('[Iframe] Received iframe-test message:', data);
  return { received: true, echo: data };
});

// Listen for messages from content-script
onMessage('message-from-content-script', async ({ data }) => {
  console.log('[Iframe] Received message-from-content-script:', data);
  return { received: true };
});

// Signal that testIframe is ready
(window as any).testIframeReady = true;
console.log('[Iframe] Test functions exposed on window.testIframe');
