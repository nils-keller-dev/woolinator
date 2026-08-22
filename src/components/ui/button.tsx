import { TextClassContext } from '@/components/ui/text'
import { Pressable } from 'react-native'

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable>

function Button({ ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value="text-foreground text-sm ">
      <Pressable role="button" {...props} />
    </TextClassContext.Provider>
  )
}

export { Button }
export type { ButtonProps }
