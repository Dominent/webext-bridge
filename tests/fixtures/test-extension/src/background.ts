import { onMessage } from 'webext-bridge/background';

console.log('[Test Extension] Background worker started');

// Handle ping messages - basic connectivity test
onMessage('ping', async ({ sender }) => {
  console.log('[Background] Received ping from:', sender);
  return { status: 'pong', timestamp: Date.now() };
});

// Handle test messages - echo back data
onMessage('test-message', async ({ data, sender }) => {
  console.log('[Background] Received test-message from:', sender, 'data:', data);
  return { success: true, echo: data };
});

// Handle get-background-info - get background status
onMessage('get-background-info', async () => {
  return {
    runtime: 'background',
    timestamp: Date.now()
  };
});

console.log('[Test Extension] Background message handlers registered');
