import { allowIframeMessaging } from 'webext-bridge/popup';

console.log('[Test Extension] Test page script loaded');

// Enable iframe messaging for the iframe namespace
console.log('[Test Extension] Calling allowIframeMessaging...');
allowIframeMessaging('com.webext-bridge.test');
console.log('[Test Extension] allowIframeMessaging called - popup is now bridging messages between iframe and background');

console.log('[Test Extension] Iframe messaging enabled for test namespace');
