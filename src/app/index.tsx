import { ControlButton } from '@/components/ui/controlButton'
import { Counter } from '@/components/ui/counter'
import { PdfControls } from '@/components/ui/pdfControls'
import type { PdfViewerHandle } from '@/components/ui/pdfViewer'
import { PdfViewer } from '@/components/ui/pdfViewer'
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static'
import * as DocumentPicker from 'expo-document-picker'
import { useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawMode } from '../../apps/pdf-viewer/dist/types'

export default function Index() {
  const insets = useSafeAreaInsets()
  const [pdfUri, setPdfUri] = useState<string | null>(null)
  const [mode, setMode] = useState<DrawMode>('scroll')
  const pdfRef = useRef<PdfViewerHandle>(null)

  async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (!result.canceled) {
      setPdfUri(result.assets[0].uri)
    }
  }

  return (
    <View
      className="bg-background flex h-full flex-1 items-center gap-6 px-3"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex w-full gap-5">
        <Counter title="Reihen / Runden" />
        <Counter title="Maschen" />
      </View>
      <View className="relative w-full flex-1 overflow-hidden rounded-xl bg-[#eee]">
        {pdfUri ? (
          <>
            <PdfViewer ref={pdfRef} uri={pdfUri} mode={mode} />
            <ControlButton
              iconName="file-import"
              onPress={pickPdf}
              className="absolute top-2 right-2"
            />
            <PdfControls
              mode={mode}
              setMode={setMode}
              pdfRef={pdfRef.current}
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
    </View>
  )
}
