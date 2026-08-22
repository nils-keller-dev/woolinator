import Pdf from 'react-native-pdf'

type PdfViewerProps = {
  uri: string
}

function PdfViewer({ uri }: PdfViewerProps) {
  return (
    <Pdf
      source={{ uri, cache: true }}
      style={{ flex: 1, width: '100%' }}
      minScale={0.5}
      maxScale={5.0}
      onError={(error) => console.error('[PdfViewer]', error)}
    />
  )
}

export { PdfViewer }
