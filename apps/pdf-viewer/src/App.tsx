import type { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerCode from 'pdfjs-dist/build/pdf.worker.min.js?raw'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message, DrawMode as Mode } from './types'

GlobalWorkerOptions.workerSrc = URL.createObjectURL(
  new Blob([workerCode], { type: 'application/javascript' }),
)

interface Stroke {
  isHighlight: boolean
  color: string
  width: number
  points: { x: number; y: number }[]
  time: number
}

interface PageInfo {
  pdfPage: PDFPageProxy
  viewport: PageViewport
  cssW: number
  cssH: number
}

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void }
  }
}

const DPR = window.devicePixelRatio || 1
const RESOLUTION = 2

export default function App() {
  const [pages, setPages] = useState<PageInfo[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<Mode>('scroll')
  const annotationsRef = useRef<Record<number, Stroke[]>>({})
  const drawContextsRef = useRef<Record<number, CanvasRenderingContext2D>>({})
  const currentStrokeRef = useRef<Stroke | null>(null)

  const renderStroke = useCallback(
    (ctx: CanvasRenderingContext2D, s: Stroke) => {
      if (s.points.length < 2) return
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = s.width * DPR * RESOLUTION
      if (s.isHighlight) {
        ctx.globalAlpha = 0.45
        ctx.globalCompositeOperation = 'multiply'
        ctx.strokeStyle = '#FFD700'
      } else {
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = s.color
      }
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      s.points.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y))
      ctx.stroke()
      ctx.restore()
    },
    [],
  )

  const redrawPage = useCallback(
    (p: number) => {
      const ctx = drawContextsRef.current[p]
      if (!ctx) return
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ;(annotationsRef.current[p] ?? []).forEach((s) => renderStroke(ctx, s))
    },
    [renderStroke],
  )

  const undo = useCallback(() => {
    let lastPage: number | null = null
    let lastTime = -1
    Object.entries(annotationsRef.current).forEach(([p, arr]) => {
      if (arr.length && arr[arr.length - 1].time > lastTime) {
        lastTime = arr[arr.length - 1].time
        lastPage = Number(p)
      }
    })
    if (lastPage !== null) {
      annotationsRef.current[lastPage].pop()
      redrawPage(lastPage)
    }
  }, [redrawPage])

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m
    document.querySelectorAll<HTMLElement>('.draw-canvas').forEach((c) => {
      c.style.pointerEvents = m !== 'scroll' ? 'auto' : 'none'
    })
    if (scrollRef.current)
      scrollRef.current.style.overflowY = m === 'scroll' ? 'auto' : 'hidden'
  }, [])

  const loadPdf = useCallback(async (base64: string) => {
    annotationsRef.current = {}
    drawContextsRef.current = {}
    setPages([])
    if (scrollRef.current) scrollRef.current.scrollTop = 0

    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

    const pdf = await getDocument({ data: bytes }).promise
    const pageInfos: PageInfo[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const pdfPage = await pdf.getPage(i)
      const baseVp = pdfPage.getViewport({ scale: 1 })
      const cssW = window.innerWidth
      const scale = (cssW / baseVp.width) * DPR * RESOLUTION
      const viewport = pdfPage.getViewport({ scale })
      const cssH = (viewport.height / viewport.width) * cssW
      pageInfos.push({ pdfPage, viewport, cssW, cssH })
    }

    setPages(pageInfos)
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: 'loaded', pages: pdf.numPages }),
    )
  }, [])

  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      try {
        const msg = JSON.parse(e.data as string) as Message
        if (msg.type === 'loadPdf') loadPdf(msg.data)
        else if (msg.type === 'setMode') setMode(msg.data as Mode)
        else if (msg.type === 'undo') undo()
      } catch (_) {}
    }

    document.addEventListener('message', handleMsg as EventListener)
    window.addEventListener('message', handleMsg)
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }))

    return () => {
      document.removeEventListener('message', handleMsg as EventListener)
      window.removeEventListener('message', handleMsg)
    }
  }, [loadPdf, setMode, undo])

  return (
    <div
      ref={scrollRef}
      style={
        {
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties
      }
    >
      <div style={{ padding: '8px 0' }}>
        {pages.length === 0 && (
          <div
            style={{
              color: '#ccc',
              textAlign: 'center',
              padding: '60px 20px',
              fontSize: 16,
            }}
          >
            PDF wird geladen…
          </div>
        )}
        {pages.map((pageInfo, i) => (
          <PdfPageView
            key={i}
            pageIndex={i + 1}
            pageInfo={pageInfo}
            modeRef={modeRef}
            annotationsRef={annotationsRef}
            drawContextsRef={drawContextsRef}
            currentStrokeRef={currentStrokeRef}
            renderStroke={renderStroke}
          />
        ))}
      </div>
    </div>
  )
}

interface PdfPageProps {
  pageIndex: number
  pageInfo: PageInfo
  modeRef: React.MutableRefObject<Mode>
  annotationsRef: React.MutableRefObject<Record<number, Stroke[]>>
  drawContextsRef: React.MutableRefObject<
    Record<number, CanvasRenderingContext2D>
  >
  currentStrokeRef: React.MutableRefObject<Stroke | null>
  renderStroke: (ctx: CanvasRenderingContext2D, s: Stroke) => void
}

function PdfPageView({
  pageIndex,
  pageInfo,
  modeRef,
  annotationsRef,
  drawContextsRef,
  currentStrokeRef,
  renderStroke,
}: PdfPageProps) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const { pdfPage, viewport, cssW, cssH } = pageInfo

  useEffect(() => {
    const pdfCanvas = pdfCanvasRef.current!
    const drawCanvas = drawCanvasRef.current!

    pdfCanvas.width = viewport.width
    pdfCanvas.height = viewport.height
    pdfPage.render({ canvasContext: pdfCanvas.getContext('2d')!, viewport })

    drawCanvas.width = viewport.width
    drawCanvas.height = viewport.height
    drawContextsRef.current[pageIndex] = drawCanvas.getContext('2d')!
    annotationsRef.current[pageIndex] = []

    let lastX = 0
    let lastY = 0

    function onTouchStart(e: TouchEvent) {
      if (modeRef.current === 'scroll') return
      e.preventDefault()
      const t = e.touches[0]
      const r = drawCanvas.getBoundingClientRect()
      lastX = (t.clientX - r.left) * (drawCanvas.width / r.width)
      lastY = (t.clientY - r.top) * (drawCanvas.height / r.height)
      currentStrokeRef.current = {
        isHighlight: modeRef.current === 'highlighter',
        color: '#1a1a1a',
        width: modeRef.current === 'highlighter' ? 16 : 3,
        points: [{ x: lastX, y: lastY }],
        time: Date.now(),
      }
    }

    function onTouchMove(e: TouchEvent) {
      const stroke = currentStrokeRef.current
      if (!stroke || modeRef.current === 'scroll') return
      e.preventDefault()
      const t = e.touches[0]
      const r = drawCanvas.getBoundingClientRect()
      const x = (t.clientX - r.left) * (drawCanvas.width / r.width)
      const y = (t.clientY - r.top) * (drawCanvas.height / r.height)
      stroke.points.push({ x, y })
      const ctx = drawContextsRef.current[pageIndex]
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = stroke.width * DPR * RESOLUTION
      if (stroke.isHighlight) {
        ctx.globalAlpha = 0.45
        ctx.globalCompositeOperation = 'multiply'
        ctx.strokeStyle = '#FFD700'
      } else {
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = '#1a1a1a'
      }
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.restore()
      lastX = x
      lastY = y
    }

    function onTouchEnd() {
      const stroke = currentStrokeRef.current
      if (!stroke) return
      annotationsRef.current[pageIndex].push(stroke)
      currentStrokeRef.current = null
    }

    drawCanvas.addEventListener('touchstart', onTouchStart, { passive: false })
    drawCanvas.addEventListener('touchmove', onTouchMove, { passive: false })
    drawCanvas.addEventListener('touchend', onTouchEnd)

    return () => {
      drawCanvas.removeEventListener('touchstart', onTouchStart)
      drawCanvas.removeEventListener('touchmove', onTouchMove)
      drawCanvas.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        margin: '8px auto',
        width: cssW,
        height: cssH,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      }}
    >
      <canvas
        ref={pdfCanvasRef}
        style={{ display: 'block', width: cssW, height: cssH }}
      />
      <canvas
        ref={drawCanvasRef}
        className="draw-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: cssW,
          height: cssH,
          touchAction: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
