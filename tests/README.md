# webext-bridge Test Suite

Integration tests for webext-bridge persistent port functionality using Playwright.

## Overview

This test suite validates the persistent port implementation:
- Basic content-script ↔ background communication
- Message delivery reliability
- Multiple consecutive message handling
- Cross-navigation resilience

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
npx tsx build.ts
```

This compiles the TypeScript sources for:
- `background.js` - Service worker with message handlers
- `content-script.js` - Content script exposing test interface

## Running Tests

### Run all tests
```bash
npm test
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
npx playwright test -g "content script can ping background"
```

## Test Suite

### Persistent Port Tests (`persistent-port.spec.ts`)

Tests persistent port functionality:
- Content script can ping background via persistent port
- Content script can send test messages with data
- Content script can get background info
- Persistent port handles multiple consecutive messages
- Persistent port works across page navigations

## Test Extension Structure

```
tests/fixtures/test-extension/
├── manifest.json          # MV3 manifest
├── test-page.html         # Simple test page
├── build.ts               # Build script
└── src/
    ├── background.ts      # Background source
    ├── content-script.ts  # Content script source
    └── test-page.ts       # Test page source
```

## Key Test Patterns

### Loading Extension
```typescript
import { createContextWithExtension, getExtensionId, waitForContentScriptReady } from '../helpers/extension-loader';

const context = await createContextWithExtension('fixtures/test-extension/dist');
const extensionId = await getExtensionId(context);
```

### Testing Messages
```typescript
const page = await context.newPage();
await page.goto('https://example.com');
await waitForContentScriptReady(page);

const response = await page.evaluate(async () => {
  return await (window as any).testPersistentPort.ping();
});

expect(response.status).toBe('pong');
```

## Troubleshooting

### Tests fail with "Extension not loaded"
- Ensure test extension is built: `cd tests/fixtures/test-extension && npx tsx build.ts`
- Check that all `.js` files exist in `tests/fixtures/test-extension/dist/`

### Tests timeout
- Increase timeout in specific tests
- Check browser console for errors
- Verify webext-bridge is built: `npm run build`

### Module resolution errors
- Ensure webext-bridge is built before building test extension
- Check that node_modules includes webext-bridge

## CI Integration

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

Note: Tests require `headless: false` (extensions don't work in headless Chrome).
