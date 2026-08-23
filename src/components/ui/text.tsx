import { cn } from '@/lib/utils'
import * as React from 'react'
import { Text as RNText } from 'react-native'

const TextClassContext = React.createContext<string | undefined>(undefined)

function Text({ className, ...props }: React.ComponentProps<typeof RNText>) {
  const textClass = React.useContext(TextClassContext)
  return (
    <RNText
      className={cn('text-foreground text-base', textClass, className)}
      {...props}
    />
  )
}

export { Text, TextClassContext }
