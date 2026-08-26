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
  width: number
  points: { x: number; y: number }[]
}

interface PageInfo {
  pdfPage: PDFPageProxy
  viewport: PageViewport
  cssW: number
  cssH: number
}

type Action = { undo: () => void; redo: () => void }

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void }
  }
}

const DPR = window.devicePixelRatio || 1
const RESOLUTION = 3

const PENS = {
  pen: {
    color: '#1c6607',
    width: 2,
  },
  highlighter: {
    color: '#FFD700',
    width: 8,
  },
  eraser: {
    width: 5,
  },
}

export default function App() {
  const [pages, setPages] = useState<PageInfo[]>([])
  const [mode, setMode] = useState<Mode>('scroll')
  const annotationsRef = useRef<Record<number, Stroke[]>>({})
  const currentStrokeRef = useRef<Stroke | null>(null)
  const undoRedoRef = useRef<{ history: Action[]; redo: Action[] }>({
    history: [],
    redo: [],
  })

  const undo = useCallback(() => {
    const action = undoRedoRef.current.history.pop()
    if (!action) return
    action.undo()
    undoRedoRef.current.redo.push(action)
  }, [])

  const redo = useCallback(() => {
    const action = undoRedoRef.current.redo.pop()
    if (!action) return
    action.redo()
    undoRedoRef.current.history.push(action)
  }, [])

  const loadPdf = useCallback(async (base64: string) => {
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
        else if (msg.type === 'redo') redo()
      } catch (_) {}
    }

    document.addEventListener('message', handleMsg as EventListener)
    window.addEventListener('message', handleMsg)
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }))

    return () => {
      document.removeEventListener('message', handleMsg as EventListener)
      window.removeEventListener('message', handleMsg)
    }
  }, [loadPdf, setMode, undo, redo])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overflowY: mode === 'scroll' ? 'auto' : 'hidden',
      }}
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
            mode={mode}
            annotationsRef={annotationsRef}
            currentStrokeRef={currentStrokeRef}
            undoRedoRef={undoRedoRef}
          />
        ))}
      </div>
    </div>
  )
}

interface PdfPageProps {
  pageIndex: number
  pageInfo: PageInfo
  mode: Mode
  annotationsRef: React.RefObject<Record<number, Stroke[]>>
  currentStrokeRef: React.RefObject<Stroke | null>
  undoRedoRef: React.RefObject<{ history: Action[]; redo: Action[] }>
}

function PdfPageView({
  pageIndex,
  pageInfo,
  mode,
  annotationsRef,
  currentStrokeRef,
  undoRedoRef,
}: PdfPageProps) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const hCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const { pdfPage, viewport, cssW, cssH } = pageInfo

  const redrawPage = useCallback(() => {
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    const strokes = [...(annotationsRef.current[pageIndex] ?? [])]
    const live = currentStrokeRef.current
    if (live) strokes.push(live)

    const hCanvas = hCanvasRef.current
    if (hCanvas) {
      const hCtx = hCanvas.getContext('2d')!
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height)
      const highlights = strokes.filter(
        (s) => s.isHighlight && s.points.length >= 2,
      )
      if (highlights.length) {
        hCtx.lineCap = 'round'
        hCtx.lineJoin = 'round'
        hCtx.lineWidth = PENS.highlighter.width * DPR * RESOLUTION
        hCtx.strokeStyle = PENS.highlighter.color
        hCtx.beginPath()
        highlights.forEach((s) => {
          hCtx.moveTo(s.points[0].x, s.points[0].y)
          s.points.slice(1).forEach((pt) => hCtx.lineTo(pt.x, pt.y))
        })
        hCtx.stroke()
        ctx.save()
        ctx.globalAlpha = 0.45
        ctx.drawImage(hCanvas, 0, 0)
        ctx.restore()
      }
    }

    const pens = strokes.filter((s) => !s.isHighlight && s.points.length >= 2)
    if (pens.length) {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = PENS.pen.width * DPR * RESOLUTION
      ctx.strokeStyle = PENS.pen.color
      ctx.beginPath()
      pens.forEach((s) => {
        ctx.moveTo(s.points[0].x, s.points[0].y)
        s.points.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y))
      })
      ctx.stroke()
      ctx.restore()
    }
  }, [])

  useEffect(() => {
    const pdfCanvas = pdfCanvasRef.current!
    const drawCanvas = drawCanvasRef.current!

    pdfCanvas.width = viewport.width
    pdfCanvas.height = viewport.height
    pdfPage.render({ canvasContext: pdfCanvas.getContext('2d')!, viewport })

    drawCanvas.width = viewport.width
    drawCanvas.height = viewport.height
    annotationsRef.current[pageIndex] = []
    const hCanvas = document.createElement('canvas')
    hCanvas.width = viewport.width
    hCanvas.height = viewport.height
    hCanvasRef.current = hCanvas
  }, [])

  useEffect(() => {
    if (mode === 'scroll') return

    const drawCanvas = drawCanvasRef.current!

    function onTouchStartOrMoveEraser(e: TouchEvent) {
      e.preventDefault()
      const touch = e.touches[0]

      const r = drawCanvas.getBoundingClientRect()
      const x = (touch.clientX - r.left) * (drawCanvas.width / r.width)
      const y = (touch.clientY - r.top) * (drawCanvas.height / r.height)
      const strokes = annotationsRef.current[pageIndex]
      const idx = strokes.findIndex((s) =>
        s.points.some(
          (p) =>
            Math.hypot(p.x - x, p.y - y) < PENS.eraser.width * DPR * RESOLUTION,
        ),
      )
      if (idx === -1) return
      const [erased] = strokes.splice(idx, 1)
      undoRedoRef.current.history.push({
        undo: () => {
          annotationsRef.current[pageIndex].push(erased)
          redrawPage()
        },
        redo: () => {
          const arr = annotationsRef.current[pageIndex]
          arr.splice(arr.indexOf(erased), 1)
          redrawPage()
        },
      })
      undoRedoRef.current.redo = []
      redrawPage()
    }

    function onTouchStartDraw(e: TouchEvent) {
      e.preventDefault()
      const m = mode as 'highlighter' | 'pen'
      const t = e.touches[0]
      const r = drawCanvas.getBoundingClientRect()
      const x = (t.clientX - r.left) * (drawCanvas.width / r.width)
      const y = (t.clientY - r.top) * (drawCanvas.height / r.height)
      currentStrokeRef.current = {
        isHighlight: m === 'highlighter',
        width: PENS[m].width,
        points: [{ x, y }],
      }
    }

    function onTouchMoveDraw(e: TouchEvent) {
      e.preventDefault()
      const stroke = currentStrokeRef.current!
      const t = e.touches[0]
      const r = drawCanvas.getBoundingClientRect()
      stroke.points.push({
        x: (t.clientX - r.left) * (drawCanvas.width / r.width),
        y: (t.clientY - r.top) * (drawCanvas.height / r.height),
      })
      redrawPage()
    }

    const touchMoveFunctions = {
      pen: onTouchMoveDraw,
      highlighter: onTouchMoveDraw,
      eraser: onTouchStartOrMoveEraser,
    }

    const touchStartFunctions = {
      pen: onTouchStartDraw,
      highlighter: onTouchStartDraw,
      eraser: onTouchStartOrMoveEraser,
    }

    function onTouchEnd() {
      const stroke = currentStrokeRef.current
      if (!stroke) return
      annotationsRef.current[pageIndex].push(stroke)
      undoRedoRef.current.history.push({
        undo: () => {
          const arr = annotationsRef.current[pageIndex]
          arr.splice(arr.indexOf(stroke), 1)
          redrawPage()
        },
        redo: () => {
          annotationsRef.current[pageIndex].push(stroke)
          redrawPage()
        },
      })
      undoRedoRef.current.redo = []
      currentStrokeRef.current = null
    }

    drawCanvas.addEventListener('touchstart', touchStartFunctions[mode], {
      passive: false,
    })
    drawCanvas.addEventListener('touchmove', touchMoveFunctions[mode], {
      passive: false,
    })
    drawCanvas.addEventListener('touchend', onTouchEnd)

    return () => {
      drawCanvas.removeEventListener('touchstart', touchStartFunctions[mode])
      drawCanvas.removeEventListener('touchmove', touchMoveFunctions[mode])
      drawCanvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [mode])

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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: cssW,
          height: cssH,
          touchAction: 'none',
          pointerEvents: mode !== 'scroll' ? 'auto' : 'none',
        }}
      />
    </div>
  )
}
