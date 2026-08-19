import { Stack } from 'expo-router'
import { useCSSVariable } from 'uniwind'
import '../../global.css'

export default function RootLayout() {
  const background = useCSSVariable('--color-background')
  const foreground = useCSSVariable('--color-foreground')

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: background as string },
        headerTintColor: foreground as string,
      }}
    />
  )
}
