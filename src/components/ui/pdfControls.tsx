import FontAwesome6, {
  FontAwesome6SolidIconName,
} from '@react-native-vector-icons/fontawesome6/static'
import { Pressable, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { DrawMode, PdfViewerHandle } from './pdfViewer'

interface PdfControlsProps {
  mode: DrawMode
  setMode: (mode: DrawMode) => void
  pdfRef: PdfViewerHandle | null
}

interface ControlButtonProps {
  iconName: FontAwesome6SolidIconName
  onPress: () => void
  isActive: boolean
}

function ControlButton({ iconName, onPress, isActive }: ControlButtonProps) {
  const [foreground, background] = useCSSVariable([
    '--color-foreground',
    '--color-background',
  ])

  return (
    <Pressable
      onPress={onPress}
      className={`size-13 items-center justify-center rounded-full p-2 ${isActive ? 'bg-foreground' : ''}`}
    >
      <FontAwesome6
        iconStyle="solid"
        name={iconName}
        size={20}
        color={isActive ? String(background) : String(foreground)}
      />
    </Pressable>
  )
}

function PdfControls({ setMode, pdfRef, mode }: PdfControlsProps) {
  const modeIconMap = [
    { mode: 'scroll', icon: 'arrows-up-down-left-right' },
    { mode: 'pen', icon: 'pen' },
    { mode: 'highlight', icon: 'highlighter' },
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
    </View>
  )
}

export { PdfControls }
