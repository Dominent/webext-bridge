let promise: Promise<MessagePort>

/**
 * Returns a MessagePort for one-on-one communication
 *
 * Depending on which context's code runs first, either an incoming port from the other side
 * is accepted OR a port will be offered, which the other side will then accept.
 */
export const getMessagePort = (
  thisContext: 'window' | 'content-script' | 'iframe' | 'popup' | 'options' | 'devtools',
  namespace: string,
  onMessage: (e: MessageEvent<any>) => void,
): Promise<MessagePort> => (
  promise ??= new Promise((resolve) => {
    const acceptMessagingPort = (event: MessageEvent) => {
      const { data: { cmd, scope, context }, ports } = event
      if (cmd === 'webext-port-offer' && scope === namespace && context !== thisContext) {
        window.removeEventListener('message', acceptMessagingPort)
        ports[0].onmessage = onMessage
        ports[0].postMessage('port-accepted')
        return resolve(ports[0])
      }
    }

    const offerMessagingPort = () => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event: MessageEvent) => {
        if (event.data === 'port-accepted') {
          window.removeEventListener('message', acceptMessagingPort)
          return resolve(channel.port1)
        }

        onMessage?.(event)
      }

      // For iframe context, post to parent window. For other contexts, post to current window
      const targetWindow = thisContext === 'iframe' ? window.parent : window
      targetWindow.postMessage({
        cmd: 'webext-port-offer',
        scope: namespace,
        context: thisContext,
      }, '*', [channel.port2])
    }

    window.addEventListener('message', acceptMessagingPort)

    // Determine if this context should offer or only accept
    // - Extension pages (popup/options/devtools) only accept from iframes, never offer
    // - Iframe always offers to parent
    // - Window waits then offers (for content-script compatibility)
    // - Content-script offers immediately (for window compatibility)
    const shouldOffer = thisContext !== 'popup' && thisContext !== 'options' && thisContext !== 'devtools'

    if (!shouldOffer) {
      // Extension pages only accept, never offer - iframe will always offer to them
      // No action needed - just wait for iframe to offer
    } else if (thisContext === 'window') {
      // Window context waits before offering (original behavior)
      setTimeout(offerMessagingPort, 0)
    } else {
      // iframe and content-script offer immediately
      offerMessagingPort()
    }
  })
)
