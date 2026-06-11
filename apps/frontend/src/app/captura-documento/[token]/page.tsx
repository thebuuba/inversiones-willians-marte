import { DocumentCapturePage } from '@/components/documents/document-capture-page';

export default async function CaptureDocumentRoute(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  return <DocumentCapturePage token={token} />;
}
