import { cn } from '@/lib/utils'
import FontAwesome6, {
  FontAwesome6SolidIconName,
} from '@react-native-vector-icons/fontawesome6/static'
import { Pressable } from 'react-native'
import { useCSSVariable } from 'uniwind'

type ControlButtonProps = React.ComponentProps<typeof Pressable> & {
  iconName: FontAwesome6SolidIconName
  onPress: () => void
  isActive?: boolean
}

function ControlButton({
  className,
  iconName,
  onPress,
  isActive = false,
  ...props
}: ControlButtonProps) {
  const [foreground, background] = useCSSVariable([
    '--color-foreground',
    '--color-background',
  ])

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'size-11 items-center justify-center rounded-full p-2',
        isActive ? 'bg-foreground' : 'bg-secondary',
        className,
      )}
      {...props}
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

export { ControlButton }
