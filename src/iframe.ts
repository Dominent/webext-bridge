import { createEndpointRuntime } from './internal/endpoint-runtime'
import { usePostMessaging } from './internal/post-message'
import { createStreamWirings } from './internal/stream'

// Auto-detect iframe context
const isIframeContext = (): boolean => {
  return (
    typeof window !== 'undefined'
    && window !== window.top
    && typeof (globalThis as any).chrome !== 'undefined'
    && typeof (globalThis as any).chrome.runtime !== 'undefined'
    && typeof (globalThis as any).chrome.runtime.id === 'string'
  )
}

if (!isIframeContext()) {
  throw new Error(
    '[webext-bridge] iframe entry point can only be used in extension pages loaded in iframes. '
    + 'For regular page iframes, this is not applicable. '
    + 'For extension pages not in iframes, use the appropriate entry point (popup/options/etc).',
  )
}

const win = usePostMessaging('iframe')

const endpointRuntime = createEndpointRuntime('iframe', message =>
  win.postMessage(message),
)

win.onMessage((msg) => {
  if ('type' in msg && 'transactionID' in msg)
    endpointRuntime.endTransaction(msg.transactionID)
  else endpointRuntime.handleMessage(msg)
})

export function setNamespace(nsps: string): void {
  win.setNamespace(nsps)
  win.enable()
}

export const { sendMessage, onMessage } = endpointRuntime
export const { openStream, onOpenStreamChannel }
  = createStreamWirings(endpointRuntime)
