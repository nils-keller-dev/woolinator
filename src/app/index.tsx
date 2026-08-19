import { Counter } from '@/components/ui/counter'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Index() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 items-center bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Counter initialValue={0} min={0} max={999} />
      <Counter initialValue={0} min={0} max={999} />
    </View>
  )
}
