import { createEndpointRuntime } from './internal/endpoint-runtime'
import { usePostMessaging } from './internal/post-message'
import { createStreamWirings } from './internal/stream'
import { createPersistentPort } from './internal/persistent-port'
import type { InternalMessage } from './types'

const win = usePostMessaging('content-script')
const port = createPersistentPort()
const endpointRuntime = createEndpointRuntime('content-script', (message) => {
  // Always route replies through background since we can't determine if the destination is local or cross-tab
  if (message.messageType === 'reply') {
    port.postMessage(message)
  }
  else if (message.destination.context === 'window' || message.destination.context === 'iframe')
    win.postMessage(message)
  else port.postMessage(message)
})

win.onMessage((message: InternalMessage) => {
  endpointRuntime.handleMessage(Object.assign({}, message, {origin: {
    // a message event inside `content-script` means a script inside `window` or `iframe` dispatched it to be forwarded
    // so we're making sure that the origin is not tampered (i.e script is not masquerading it's true identity)
    // Preserve iframe context if it's from iframe, otherwise treat as window
    context: message.origin.context === 'iframe' ? 'iframe' : 'window',
    tabId: null
  }}))
})

port.onMessage(endpointRuntime.handleMessage)

port.onFailure((message) => {
  if (message.origin.context === 'window') {
    win.postMessage({
      type: 'error',
      transactionID: message.transactionId,
    })

    return
  }

  endpointRuntime.endTransaction(message.transactionId)
})

export function allowWindowMessaging(nsps: string): void {
  win.setNamespace(nsps)
  win.enable()
}

export const { sendMessage, onMessage } = endpointRuntime
export const { openStream, onOpenStreamChannel }
  = createStreamWirings(endpointRuntime)
