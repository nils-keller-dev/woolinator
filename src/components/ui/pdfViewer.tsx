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
import type { DrawMode, Message } from '../../../apps/pdf-viewer/dist/types'
import HTML from '../../../apps/pdf-viewer/dist/viewerHtml'

export type PdfViewerHandle = {
  undo: () => void
  redo: () => void
}

type PdfViewerProps = {
  uri: string
  mode: DrawMode
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  function PdfViewer({ uri, mode }, ref) {
    const webViewRef = useRef<WebView>(null)
    const [isReady, setIsReady] = useState(false)

    function postMessage(message: Message) {
      webViewRef.current?.postMessage(JSON.stringify(message))
    }

    useImperativeHandle(ref, () => ({
      undo: () => postMessage({ type: 'undo' }),
      redo: () => postMessage({ type: 'redo' }),
    }))

    useEffect(() => {
      if (!isReady) return
      postMessage({ type: 'setMode', data: mode })
    }, [mode, isReady])

    useEffect(() => {
      if (!isReady) return
      loadPdf(uri)
    }, [uri, isReady])

    async function loadPdf(pdfUri: string) {
      const base64 = (await RNBlobUtil.fs.readFile(
        pdfUri.slice(7),
        'base64',
      )) as string
      postMessage({ type: 'loadPdf', data: base64 })
    }

    async function onMessage(event: WebViewMessageEvent) {
      if (JSON.parse(event.nativeEvent.data).type === 'ready') {
        setIsReady(true)
      }
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ html: HTML }}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled
      />
    )
  },
)

export { PdfViewer }
