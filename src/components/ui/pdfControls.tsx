import { View } from 'react-native'
import { DrawMode } from '../../../apps/pdf-viewer/dist/types'
import { ControlButton } from './controlButton'
import { PdfViewerHandle } from './pdfViewer'

interface PdfControlsProps {
  mode: DrawMode
  setMode: (mode: DrawMode) => void
  pdfRef: PdfViewerHandle | null
}

function PdfControls({ setMode, pdfRef, mode }: PdfControlsProps) {
  const modeIconMap = [
    { mode: 'scroll', icon: 'arrows-up-down-left-right' },
    { mode: 'pen', icon: 'pen' },
    { mode: 'highlighter', icon: 'highlighter' },
    { mode: 'eraser', icon: 'eraser' },
  ] as const

  return (
    <View className="bg-secondary absolute bottom-4 left-1/2 -translate-x-1/2 flex-row gap-2 rounded-full p-1">
      {modeIconMap.map((el) => (
        <ControlButton
          key={el.mode}
          isActive={mode === el.mode}
          iconName={el.icon}
          onPress={() => setMode(el.mode)}
        />
      ))}
      <ControlButton
        isActive={false}
        iconName="arrow-rotate-left"
        onPress={() => pdfRef?.undo()}
      />
      <ControlButton
        isActive={false}
        iconName="arrow-rotate-right"
        onPress={() => pdfRef?.undo()}
      />
    </View>
  )
}

export { PdfControls }
