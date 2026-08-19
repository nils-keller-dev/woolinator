import { Counter } from '@/components/ui/counter'
import { View } from 'react-native'

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Counter initialValue={0} min={0} max={999} />
    </View>
  )
}
