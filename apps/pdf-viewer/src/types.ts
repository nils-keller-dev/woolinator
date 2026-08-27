export type DrawMode = 'scroll' | 'pen' | 'highlighter' | 'eraser'

export type ViewerCommand =
  | { type: 'loadPdf'; data: string }
  | { type: 'setMode'; data: DrawMode }
  | { type: 'undo' }
  | { type: 'redo' }

export type ViewerEvent = { type: 'ready' }
