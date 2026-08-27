export type Stroke = {
  id: number
  isHighlight: boolean
  width: number
  points: { x: number; y: number }[]
}

export type DrawMode = 'scroll' | 'pen' | 'highlighter' | 'eraser'

export type ViewerCommand =
  | { type: 'loadPdf'; data: string }
  | { type: 'setMode'; data: DrawMode }
  | { type: 'undo' }
  | { type: 'redo' }

export type ViewerEvent =
  | { type: 'ready' }
  | { type: 'addStroke'; data: Stroke }
  | { type: 'removeStroke'; data: Stroke['id'] }
