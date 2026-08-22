import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { CounterButton } from './counterButton'

interface CounterProps {
  initialValue?: number
  min?: number
  max?: number
  title: string
  onChange?: (value: number) => void
}

export function Counter({
  initialValue = 0,
  min,
  max,
  title,
  onChange,
}: CounterProps) {
  const [count, setCount] = useState(initialValue)
  const foreground = useCSSVariable('--color-foreground') as string

  const update = (next: number) => {
    setCount(next)
    onChange?.(next)
  }

  return (
    <View className="w-full gap-2.5">
      <View className="w-full flex-row items-center justify-between">
        <Text className="text-foreground text-xl">{title}</Text>
        <Button onPress={() => update(initialValue)}>
          <Text>Reset</Text>
        </Button>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <CounterButton
          onPress={() => update(count - 1)}
          disabled={min !== undefined && count <= min}
        >
          <Ionicons name="remove" size={28} color={foreground} />
        </CounterButton>
        <Text className="text-foreground text-center text-[80px] leading-15 tabular-nums">
          {count}
        </Text>
        <CounterButton
          onPress={() => update(count + 1)}
          disabled={max !== undefined && count >= max}
        >
          <Ionicons name="add" size={28} color={foreground} />
        </CounterButton>
      </View>
    </View>
  )
}
