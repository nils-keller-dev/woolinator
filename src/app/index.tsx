import { Counter } from '@/components/ui/counter'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Index() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 gap-8 items-center bg-background px-3"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      <Counter title="Überschrift 1" initialValue={0} min={0} max={999} />
      <Counter title="Überschrift 2" initialValue={0} min={0} max={999} />
    </View>
  )
}
