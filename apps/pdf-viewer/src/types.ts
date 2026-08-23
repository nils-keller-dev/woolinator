export type DrawMode = 'scroll' | 'pen' | 'highlighter' | 'eraser'

export type Message =
  | { type: 'loadPdf'; data: string }
  | { type: 'setMode'; data: string }
  | { type: 'undo' }
  | { type: 'redo' }
