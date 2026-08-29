export type Stroke = {
  id: number
  tool: 'pen' | 'highlighter'
  points: { x: number; y: number }[]
  page: number
}

export type DrawMode = 'scroll' | 'pen' | 'highlighter' | 'eraser'

export type ViewerCommand =
  | { type: 'loadPdf'; data: string }
  | { type: 'setMode'; data: DrawMode }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'setStrokes'; data: Stroke[] }

export type ViewerEvent =
  | { type: 'ready' }
  | { type: 'addStroke'; data: Stroke }
  | { type: 'removeStroke'; data: Stroke['id'] }
