import { Counter } from '@/components/ui/counter'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Index() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="bg-background flex h-full flex-1 items-center gap-6 px-3"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex w-full gap-5">
        <Counter title="Reihen / Runden" initialValue={0} min={0} max={999} />
        <Counter title="Maschen" initialValue={0} min={0} max={999} />
      </View>
      <View className="w-full flex-1 rounded-xl bg-white"></View>
    </View>
  )
}
