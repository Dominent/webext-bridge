import { sendMessage, onMessage } from 'webext-bridge/content-script';

console.log('[Test Extension] Content script loaded');

// Simple test: send a ping to background on load and log result
(async () => {
  try {
    console.log('[Content-Script] Testing ping to background...');
    const result = await sendMessage('ping', {}, 'background');
    console.log('[Content-Script] Ping success:', JSON.stringify(result));
  } catch (err) {
    console.error('[Content-Script] Ping failed:', err);
  }
})();

// Listen for messages from background
onMessage('test-from-background', ({ data }) => {
  console.log('[Content-Script] Received from background:', data);
  return { received: true };
});

console.log('[Test Extension] Content script ready');
