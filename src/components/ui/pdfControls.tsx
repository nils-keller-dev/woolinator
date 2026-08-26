import { cn } from '@/lib/utils'
import type { DrawMode } from '@woolinator/pdf-viewer/types'
import { View } from 'react-native'
import { ControlButton } from './controlButton'

type PdfControlsProps = React.ComponentProps<typeof View> & {
  mode: DrawMode
  setMode: (mode: DrawMode) => void
  onUndo: () => void
  onRedo: () => void
}

function PdfControls({
  className,
  setMode,
  mode,
  onUndo,
  onRedo,
  ...props
}: PdfControlsProps) {
  const modeIconMap = [
    { mode: 'scroll', icon: 'arrows-up-down-left-right' },
    { mode: 'pen', icon: 'pen' },
    { mode: 'highlighter', icon: 'highlighter' },
    { mode: 'eraser', icon: 'eraser' },
  ] as const

  return (
    <View
      className={cn('bg-secondary flex-row gap-2 rounded-full p-1', className)}
      {...props}
    >
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
        onPress={onUndo}
      />
      <ControlButton
        isActive={false}
        iconName="arrow-rotate-right"
        onPress={onRedo}
      />
    </View>
  )
}

export { PdfControls }
