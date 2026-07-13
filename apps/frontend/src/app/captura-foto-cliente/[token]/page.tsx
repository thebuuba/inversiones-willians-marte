import { ClientPhotoCapturePage } from '@/components/clients/client-photo-capture-page';

export default async function ClientPhotoCaptureRoute(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  return <ClientPhotoCapturePage token={token} />;
}
