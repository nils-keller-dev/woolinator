import HTML from '@woolinator/pdf-viewer'
import {
  type DrawMode,
  type Stroke,
  type ViewerCommand,
  type ViewerEvent,
} from '@woolinator/pdf-viewer/types'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type { WebViewMessageEvent } from 'react-native-webview'
import WebView from 'react-native-webview'

export type PdfViewerHandle = {
  undo: () => void
  redo: () => void
}

type PdfViewerProps = {
  uri: string
  mode: DrawMode
  strokes: Stroke[]
  updateStrokes: (strokes: Stroke[]) => void
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  function PdfViewer({ uri, mode, strokes, updateStrokes }, ref) {
    const webViewRef = useRef<WebView>(null)
    const [isReady, setIsReady] = useState(false)

    function postMessage(message: ViewerCommand) {
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
      postMessage({ type: 'loadPdf', data: uri })
    }, [uri, isReady])

    async function onMessage(event: WebViewMessageEvent) {
      const msg = JSON.parse(event.nativeEvent.data) as ViewerEvent
      if (msg.type === 'ready') {
        setIsReady(true)
        postMessage({ type: 'setStrokes', data: strokes })
      } else if (msg.type === 'addStroke') {
        updateStrokes([...strokes, msg.data])
      } else if (msg.type === 'removeStroke') {
        updateStrokes(strokes.filter((s) => s.id !== msg.data))
      }
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ html: HTML, baseUrl: 'file:///' }}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
      />
    )
  },
)

export { PdfViewer }
