import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { View } from 'react-native'
import { useCSSVariable } from 'uniwind'

interface CounterProps {
  initialValue?: number
  min?: number
  max?: number
  title?: string
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
    <View className="w-full gap-2">
      {title && (
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => update(initialValue)}
          >
            <Text>Reset</Text>
          </Button>
        </View>
      )}
      <View className="flex-row items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full scale-200"
          onPress={() => update(count - 1)}
          disabled={min !== undefined && count <= min}
        >
          <Ionicons name="remove" size={18} color={foreground} />
        </Button>

        <Text className="w-56 text-center text-9xl font-semibold tabular-nums text-foreground">
          {count}
        </Text>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full scale-200"
          onPress={() => update(count + 1)}
          disabled={max !== undefined && count >= max}
        >
          <Ionicons name="add" size={18} color={foreground} />
        </Button>
      </View>
    </View>
  )
}
