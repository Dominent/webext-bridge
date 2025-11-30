# webext-bridge Test Suite

Comprehensive integration tests for webext-bridge iframe messaging functionality using Playwright.

## Overview

This test suite validates all aspects of the iframe messaging implementation:
- Basic iframe ↔ background communication
- Message routing through content-script bridge
- Namespace isolation
- Error handling and exponential backoff
- Multiple iframe scenarios
- Reconnection resilience

## Prerequisites

1. **Node.js** 18+ installed
2. **Dependencies** installed:
   ```bash
   npm install
   ```

3. **Playwright browsers** installed:
   ```bash
   npx playwright install chromium
   ```

## Building the Test Extension

Before running tests, build the test extension:

```bash
cd tests/fixtures/test-extension
npm run build
# or
npx tsx build.ts
```

This compiles the TypeScript sources for:
- `background.js` - Service worker with message handlers
- `content-script.js` - Content script with allowWindowMessaging
- `iframe.js` - Iframe script using webext-bridge/iframe

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test suite
```bash
npx playwright test tests/specs/01-iframe-basic.spec.ts
```

### Run with UI mode (interactive)
```bash
npm run test:ui
```

### Debug mode
```bash
npm run test:debug
```

### Run specific test
```bash
npx playwright test -g "iframe can send message to background"
```

## Test Suites

### Suite 1: Basic Iframe Messaging (`01-iframe-basic.spec.ts`)
Tests fundamental iframe communication:
- ✅ iframe → background message sending
- ✅ Auto-detection of iframe context
- ✅ Complex data transmission
- ✅ Namespace requirement enforcement

### Suite 2: Message Routing (`02-iframe-routing.spec.ts`)
Validates proper routing through content-script bridge:
- ✅ Messages route through content-script
- ✅ Context preservation (iframe not converted to window)
- ✅ Sequential message handling
- ✅ Concurrent message handling

### Suite 3: Namespace Isolation (`03-iframe-namespace.spec.ts`)
Ensures namespace-based message isolation:
- ✅ Correct namespace enables communication
- ✅ setNamespace() requirement
- ✅ allowWindowMessaging() requirement
- ✅ MessageChannel negotiation

### Suite 4: Error Handling (`04-iframe-errors.spec.ts`)
Verifies graceful error handling:
- ✅ Auto-detection prevents misuse
- ✅ Data serialization works
- ✅ No unhandled errors
- ✅ No rapid-fire connection errors (exponential backoff)
- ✅ Background worker restart resilience

### Suite 5: Bidirectional Streams (`05-iframe-streams.spec.ts`)
Stream functionality tests:
- ⚠️ Most tests skipped (requires stream implementation)
- ✅ Stream API availability check

### Suite 6: Reconnection & Persistence (`06-iframe-reconnection.spec.ts`)
Tests connection resilience:
- ✅ Message completion without issues
- ✅ No console error spam
- ✅ Backoff prevents rapid reconnections
- ✅ Concurrent message reliability
- ✅ 95%+ delivery rate

### Suite 7: Multiple Iframes (`07-iframe-multi.spec.ts`)
Multiple iframe scenarios:
- ✅ Multiple iframes load successfully
- ✅ Independent communication
- ✅ No cross-iframe interference
- ✅ Resource cleanup on removal
- ✅ Dynamic iframe injection
- ✅ 50+ concurrent messages from 5 iframes

## Test Extension Structure

```
tests/fixtures/test-extension/
├── manifest.json          # MV3 manifest
├── background.js          # Compiled service worker
├── content-script.js      # Compiled content script
├── iframe.js              # Compiled iframe script
├── iframe.html            # Iframe page
├── test-page.html         # Test page with iframe
├── build.ts               # Build script
└── src/
    ├── background.ts      # Background source
    ├── content-script.ts  # Content script source
    └── iframe.ts          # Iframe source
```

## Key Test Patterns

### Loading Extension
```typescript
import { createContextWithExtension, getExtensionId } from '../helpers/extension-loader';

const context = await createContextWithExtension('fixtures/test-extension');
const extensionId = await getExtensionId(context);
```

### Navigating to Test Page
```typescript
const page = await context.newPage();
await page.goto(`chrome-extension://${extensionId}/test-page.html`);
await page.waitForTimeout(1000); // Wait for iframe initialization
```

### Sending Messages from Iframe
```typescript
const response = await page.evaluate(async () => {
  const testIframe = (window as any).frames[0];
  return await testIframe.testIframe.sendPing();
});

expect(response).toEqual({ status: 'pong' });
```

## Debugging Tests

### View test in browser
```bash
npm run test:ui
```

This opens Playwright's UI mode where you can:
- See browser window during tests
- Step through test execution
- Inspect DOM and console

### Enable verbose logging
```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

### Slow down execution
```typescript
await page.waitForTimeout(5000); // Pause for 5 seconds
```

## Troubleshooting

### Tests fail with "Extension not loaded"
- Ensure test extension is built: `cd tests/fixtures/test-extension && npx tsx build.ts`
- Check that all `.js` files exist in `tests/fixtures/test-extension/`

### Tests timeout
- Increase timeout in specific tests
- Check browser console for errors
- Verify webext-bridge is built: `npm run build`

### "Could not establish connection" errors
- This may indicate background worker issues
- Check that exponential backoff is working (should not see 100+ errors)
- Verify service worker is registered

### Module resolution errors
- Ensure webext-bridge is built before building test extension
- Check that node_modules includes webext-bridge
- Verify import paths in test extension sources

## CI Integration

These tests can run in CI with headless Chromium:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Build webext-bridge
  run: npm run build

- name: Build test extension
  run: cd tests/fixtures/test-extension && npx tsx build.ts

- name: Run tests
  run: npm test
```

Note: Some CI environments may require additional configuration for extension testing.

## Contributing

When adding new tests:

1. Follow existing test patterns
2. Use descriptive test names
3. Clean up resources (close context)
4. Add comments for complex test logic
5. Update this README if adding new suites

## Test Coverage Goals

- ✅ Basic messaging (iframe ↔ background)
- ✅ Message routing (through content-script)
- ✅ Namespace isolation
- ✅ Error handling
- ⚠️ Streams (partially implemented)
- ✅ Reconnection & backoff
- ✅ Multiple iframes

## Known Limitations

- Stream tests are mostly skipped (need full stream implementation in test extension)
- Background worker restart tests are simplified (actual service worker manipulation is complex)
- Tests require `headless: false` (extensions don't work in headless Chrome)

## Resources

- [Playwright Chrome Extensions](https://playwright.dev/docs/chrome-extensions)
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/how-to/test)
- [webext-bridge Documentation](https://github.com/zikaari/webext-bridge)
