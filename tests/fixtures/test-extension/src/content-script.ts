import { allowWindowMessaging, onMessage, sendMessage } from 'webext-bridge/content-script';
import browser from 'webextension-polyfill';

console.log('[Test Extension] Content script loaded');

// Enable window messaging for test namespace
allowWindowMessaging('com.webext-bridge.test');

// Get tab ID by asking background via webext-bridge
// This is more reliable than browser.runtime.sendMessage
(async () => {
  try {
    const response = await sendMessage('get-tab-id', {}, 'background');
    (window as any).currentTabId = response.tabId;
    (window as any).webextBridgeReady = true;
    console.log('[Content-Script] Tab ID stored:', response.tabId);
  } catch (err) {
    console.error('[Content-Script] Failed to get tab ID:', err);
    // Fallback: Just mark as ready without tab ID
    (window as any).webextBridgeReady = true;
  }
})();

// Log messages that pass through
onMessage('ping', async ({ sender, data }) => {
  console.log('[Content-Script] Forwarding ping from:', sender);
  // Just forward, don't handle
});

onMessage('test-message', async ({ sender, data }) => {
  console.log('[Content-Script] Forwarding test-message from:', sender);
  // Just forward, don't handle
});

// Handle messages from iframe
onMessage('ping-from-iframe', async ({ data, sender }) => {
  console.log('[Content-Script] Received ping-from-iframe:', data, 'from:', sender);
  return {
    status: 'pong',
    from: 'content-script',
    receivedData: data
  };
});

onMessage('broadcast-message', async ({ data }) => {
  console.log('[Content-Script] Received broadcast-message:', data);
  return { status: 'received' };
});

onMessage('check-sender', async ({ sender }) => {
  console.log('[Content-Script] Received check-sender, sender:', sender);
  return { ok: true };
});

console.log('[Test Extension] Content script ready - window messaging enabled');
