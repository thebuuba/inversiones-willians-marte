import { ClientDetailPage } from '@/components/clients/client-detail-page';

export default async function ClientPage(props: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await props.params;
  return <ClientDetailPage clientId={clientId} />;
}
