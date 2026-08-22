import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import RNBlobUtil from 'react-native-blob-util'
import type { WebViewMessageEvent } from 'react-native-webview'
import WebView from 'react-native-webview'
// run `npm run build:pdf` to regenerate after editing apps/pdf-viewer/
import HTML from '../../../apps/pdf-viewer/dist/viewerHtml'

export type DrawMode = 'scroll' | 'pen' | 'highlight'

export type PdfViewerHandle = {
  undo: () => void
}

type PdfViewerProps = { uri: string; mode: DrawMode }

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  function PdfViewer({ uri, mode }, ref) {
    const webViewRef = useRef<WebView>(null)
    const [isReady, setIsReady] = useState(false)

    useImperativeHandle(ref, () => ({
      undo: () =>
        webViewRef.current?.postMessage(JSON.stringify({ type: 'undo' })),
    }))

    useEffect(() => {
      if (!isReady) return
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setMode', mode }))
    }, [mode, isReady])

    async function onMessage(event: WebViewMessageEvent) {
      try {
        const msg = JSON.parse(event.nativeEvent.data)
        if (msg.type === 'ready') {
          setIsReady(true)
          const path = uri.startsWith('file://') ? uri.slice(7) : uri
          const base64 = await RNBlobUtil.fs.readFile(path, 'base64')
          webViewRef.current?.postMessage(
            JSON.stringify({ type: 'loadPdf', base64 }),
          )
        }
      } catch (e) {
        console.error('[PdfViewer]', e)
      }
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ html: HTML }}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        style={{ flex: 1 }}
      />
    )
  },
)

export { PdfViewer }
