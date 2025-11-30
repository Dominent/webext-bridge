import browser from 'webextension-polyfill'
import { createEndpointRuntime } from './internal/endpoint-runtime'
import { createStreamWirings } from './internal/stream'
import { createPersistentPort } from './internal/persistent-port'
import { usePostMessaging } from './internal/post-message'

const port = createPersistentPort(`devtools@${browser.devtools.inspectedWindow.tabId}`)
const win = usePostMessaging('devtools')

const endpointRuntime = createEndpointRuntime(
  'devtools',
  (message) => {
    // Route to iframe if destination is iframe context
    if (message.destination.context === 'iframe') {
      win.postMessage(message)
    }
    else {
      port.postMessage(message)
    }
  },
)

port.onMessage(endpointRuntime.handleMessage)

port.onFailure((message) => {
  if (message.origin.context === 'iframe') {
    win.postMessage({
      type: 'error',
      transactionID: message.transactionId,
    })

    return
  }

  endpointRuntime.endTransaction(message.transactionId)
})

// Handle messages from iframes
win.onMessage((message) => {
  // Only handle actual InternalMessage, not EndpointWontRespondError
  if ('messageID' in message) {
    endpointRuntime.handleMessage(Object.assign({}, message, {
      origin: {
        // a message event inside devtools means an iframe dispatched it to be forwarded
        // so we're making sure that the origin is not tampered
        context: 'iframe' as const,
        tabId: null,
      },
    }))
  }
})

// Export iframe bridging function
export function allowIframeMessaging(namespace: string): void {
  win.setNamespace(namespace)
  win.enable()
}

export const { sendMessage, onMessage } = endpointRuntime
export const { openStream, onOpenStreamChannel } = createStreamWirings(endpointRuntime)
