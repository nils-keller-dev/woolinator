import { ControlButton } from '@/components/ui/controlButton'
import { Counter } from '@/components/ui/counter'
import { PdfControls } from '@/components/ui/pdfControls'
import type { PdfViewerHandle } from '@/components/ui/pdfViewer'
import { PdfViewer } from '@/components/ui/pdfViewer'
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static'
import { DrawMode } from '@woolinator/pdf-viewer/types'
import * as DocumentPicker from 'expo-document-picker'
import { useEffect, useRef, useState } from 'react'
import {
  Appearance,
  ColorSchemeName,
  Pressable,
  StatusBar,
  StatusBarStyle,
  Text,
  View,
} from 'react-native'
import { createMMKV, useMMKVString } from 'react-native-mmkv'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useCSSVariable } from 'uniwind'

const storage = createMMKV()

if (!storage.getAllKeys().length) {
  storage.set('mode', 'scroll')
}

export default function Index() {
  const [pdfUri, setPdfUri] = useMMKVString('pdfUri')
  const [mode, setMode] = useMMKVString('mode')
  const [barStyle, setBarStyle] = useState<StatusBarStyle>(
    colorSchemeToBarStyle(Appearance.getColorScheme()),
  )
  const pdfRef = useRef<PdfViewerHandle>(null)
  const [background] = useCSSVariable(['--color-background'])

  function colorSchemeToBarStyle(
    colorScheme: ColorSchemeName | null | undefined,
  ) {
    return colorScheme === 'dark' ? 'light-content' : 'dark-content'
  }

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setBarStyle(colorSchemeToBarStyle(colorScheme))
    })
    return () => subscription.remove()
  }, [])

  async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (!result.canceled) {
      setPdfUri(result.assets[0].uri)
      setMode('scroll')
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          padding: 12,
          backgroundColor: String(background),
          gap: 24,
        }}
      >
        <StatusBar barStyle={barStyle} />
        <View className="flex w-full gap-5">
          <Counter title="Reihen / Runden" />
          <Counter title="Maschen" />
        </View>
        <View className="relative w-full flex-1 overflow-hidden rounded-xl bg-[#eee]">
          {pdfUri ? (
            <>
              <PdfViewer ref={pdfRef} uri={pdfUri} mode={mode as DrawMode} />
              <ControlButton
                iconName="file-import"
                onPress={pickPdf}
                className="absolute top-2 right-2"
              />
              <PdfControls
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
                mode={mode as DrawMode}
                setMode={setMode}
                onUndo={() => pdfRef.current?.undo()}
                onRedo={() => pdfRef.current?.redo()}
              />
            </>
          ) : (
            <Pressable
              className="flex size-full items-center justify-center gap-1"
              onPress={pickPdf}
            >
              <FontAwesome6
                iconStyle="solid"
                name="file-import"
                size={24}
                color="#444"
              />
              <Text className="text-[#444]">PDF öffnen</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
