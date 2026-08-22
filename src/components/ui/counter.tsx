import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { CounterButton } from './counterButton'

interface CounterProps {
  initialValue?: number
  min?: number
  max?: number
  title: string
}

export function Counter({
  initialValue = 0,
  min = 0,
  max = 999,
  title,
}: CounterProps) {
  const [inputValue, setInputValue] = useState(String(initialValue))
  const foreground = useCSSVariable('--color-foreground') as string
  const count = parseInt(inputValue, 10) || 0

  const update = (next: number) => setInputValue(String(next))

  const handleInputChange = (text: string) => {
    setInputValue(text.replace(/\D/g, ''))
  }

  const handleInputBlur = () => {
    setInputValue(String(count))
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
          <FontAwesome6 name="minus" size={28} color={foreground} />
        </CounterButton>
        <TextInput
          className="text-foreground absolute left-1/2 flex-1 -translate-x-1/2 text-center text-[80px] tabular-nums"
          value={inputValue}
          onChangeText={handleInputChange}
          onBlur={handleInputBlur}
          keyboardType="number-pad"
          maxLength={String(max).length}
          selectTextOnFocus
        />
        <CounterButton
          onPress={() => update(count + 1)}
          disabled={max !== undefined && count >= max}
        >
          <FontAwesome6 name="plus" size={28} color={foreground} />
        </CounterButton>
      </View>
    </View>
  )
}
