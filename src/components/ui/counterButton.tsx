import { cn } from '@/lib/utils'
import { Pressable } from 'react-native'

type CounterButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable>

function CounterButton({ ...props }: CounterButtonProps) {
  return (
    <Pressable
      className={cn(
        props.disabled && 'opacity-50',
        'bg-input/30 border-input active:bg-input/50 size-17 items-center justify-center rounded-full border',
      )}
      role="button"
      {...props}
    />
  )
}

export { CounterButton }
export type { CounterButtonProps }
