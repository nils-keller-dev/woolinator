import type { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerCode from 'pdfjs-dist/build/pdf.worker.min.mjs?raw'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DrawMode, Stroke, ViewerCommand, ViewerEvent } from './types'
import { distToSegment } from './utils'

GlobalWorkerOptions.workerSrc = URL.createObjectURL(
  new Blob([workerCode], { type: 'text/javascript' }),
)

interface PageInfo {
  pdfPage: PDFPageProxy
  viewport: PageViewport
  cssW: number
  cssH: number
}

type Action = { undo: () => void; redo: () => void }

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
  const [mode, setMode] = useState<DrawMode>('scroll')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const undoRedoRef = useRef<{ history: Action[]; redo: Action[] }>({
    history: [],
    redo: [],
  })

  const onAction = useCallback((action: Action) => {
    undoRedoRef.current.history.push(action)
    undoRedoRef.current.redo = []
  }, [])

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

  const loadPdf = useCallback(async (url: string) => {
    const pdf = await getDocument({ url }).promise
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
  }, [])

  const postMessage = useCallback((message: ViewerEvent) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(message))
  }, [])

  const onAddStroke = useCallback((stroke: Stroke) => {
    postMessage({ type: 'addStroke', data: stroke })
  }, [])

  const onRemoveStroke = useCallback((id: number) => {
    postMessage({ type: 'removeStroke', data: id })
  }, [])

  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      const msg = JSON.parse(e.data) as ViewerCommand
      if (msg.type === 'loadPdf') loadPdf(msg.data)
      else if (msg.type === 'setMode') setMode(msg.data)
      else if (msg.type === 'undo') undo()
      else if (msg.type === 'redo') redo()
      else if (msg.type === 'setStrokes') setStrokes(msg.data)
    }

    document.addEventListener('message', handleMsg as EventListener)
    window.addEventListener('message', handleMsg)
    postMessage({ type: 'ready' })

    return () => {
      document.removeEventListener('message', handleMsg as EventListener)
      window.removeEventListener('message', handleMsg)
    }
  }, [loadPdf, setMode, undo, redo, setStrokes, postMessage])

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
            pageInfo={pageInfo}
            mode={mode}
            onAction={onAction}
            onAddStroke={onAddStroke}
            onRemoveStroke={onRemoveStroke}
            initialStrokes={strokes.filter(
              (s) => s.page === pageInfo.pdfPage.pageNumber,
            )}
          />
        ))}
      </div>
    </div>
  )
}

interface PdfPageProps {
  pageInfo: PageInfo
  mode: DrawMode
  onAction: (action: Action) => void
  onAddStroke: (stroke: Stroke) => void
  onRemoveStroke: (id: number) => void
  initialStrokes: Stroke[]
}

function PdfPageView({
  pageInfo,
  mode,
  onAction,
  onAddStroke,
  onRemoveStroke,
  initialStrokes,
}: PdfPageProps) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const hCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokesRef = useRef<Stroke[]>(initialStrokes)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const { pdfPage, viewport, cssW, cssH } = pageInfo

  const redrawPage = useCallback(() => {
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    const strokes = [...strokesRef.current]
    const live = currentStrokeRef.current
    if (live) strokes.push(live)

    const hCanvas = hCanvasRef.current
    if (hCanvas) {
      const hCtx = hCanvas.getContext('2d')!
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height)
      const highlights = strokes.filter(
        (s) => s.tool === 'highlighter' && s.points.length >= 2,
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

    const pens = strokes.filter((s) => s.tool === 'pen' && s.points.length >= 2)
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
    pdfPage.render({ canvas: pdfCanvas, viewport })

    drawCanvas.width = viewport.width
    drawCanvas.height = viewport.height
    const hCanvas = document.createElement('canvas')
    hCanvas.width = viewport.width
    hCanvas.height = viewport.height
    hCanvasRef.current = hCanvas

    redrawPage()
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
      const strokes = strokesRef.current
      const threshold = PENS.eraser.width * DPR * RESOLUTION
      const idx = strokes.findIndex((s) =>
        s.points.some((p, i) =>
          i === 0
            ? Math.hypot(p.x - x, p.y - y) < threshold
            : distToSegment(
                x,
                y,
                s.points[i - 1].x,
                s.points[i - 1].y,
                p.x,
                p.y,
              ) < threshold,
        ),
      )
      if (idx === -1) return
      const [erased] = strokes.splice(idx, 1)
      onAction({
        undo: () => {
          strokesRef.current.push(erased)
          redrawPage()
          onAddStroke(erased)
        },
        redo: () => {
          const arr = strokesRef.current
          arr.splice(arr.indexOf(erased), 1)
          redrawPage()
          onRemoveStroke(erased.id)
        },
      })
      redrawPage()
      onRemoveStroke(erased.id)
    }

    function onTouchStartDraw(e: TouchEvent) {
      e.preventDefault()
      const m = mode as 'highlighter' | 'pen'
      const t = e.touches[0]
      const r = drawCanvas.getBoundingClientRect()
      const x = (t.clientX - r.left) * (drawCanvas.width / r.width)
      const y = (t.clientY - r.top) * (drawCanvas.height / r.height)
      currentStrokeRef.current = {
        id: new Date().getTime(),
        tool: m,
        points: [{ x, y }],
        page: pdfPage.pageNumber,
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
      strokesRef.current.push(stroke)
      onAction({
        undo: () => {
          const arr = strokesRef.current
          arr.splice(arr.indexOf(stroke), 1)
          redrawPage()
          onRemoveStroke(stroke.id)
        },
        redo: () => {
          strokesRef.current.push(stroke)
          redrawPage()
          onAddStroke(stroke)
        },
      })

      onAddStroke(stroke)
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
