import { sendMessage, onMessage } from 'webext-bridge/background';
import browser from 'webextension-polyfill';

console.log('[Test Extension] Background worker started');

// Handle ping messages
onMessage('ping', async ({ sender }) => {
  console.log('[Background] Received ping from:', sender);
  return { status: 'pong' };
});

// Handle test messages
onMessage('test-message', async ({ data, sender }) => {
  console.log('[Background] Received test-message from:', sender, 'data:', data);
  return { success: true, echo: data };
});

// Handle get-background-info messages
onMessage('get-background-info', async () => {
  return {
    runtime: 'background',
    timestamp: Date.now()
  };
});

// Handle get-active-tab messages
onMessage('get-active-tab', async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  console.log('[Background] Active tab:', tabs[0]?.id);
  return { tabId: tabs[0]?.id };
});

// Handle get-tab-id messages
onMessage('get-tab-id', async ({ sender }) => {
  console.log('[Background] get-tab-id from:', sender);
  return { tabId: sender.tabId };
});

// Handle get-all-tabs for testing
onMessage('get-all-tabs', async () => {
  const tabs = await browser.tabs.query({});
  console.log('[Background] All tabs:', tabs.map(t => ({ id: t.id, url: t.url })));
  return { tabs: tabs.map(t => ({ id: t.id, url: t.url, title: t.title })) };
});

console.log('[Test Extension] Background message handlers registered');
