import { ClientDetailPage } from '@/components/clients/client-detail-page';

export default async function ClientPage(props: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await props.params;
  const params = await props.searchParams;
  const refreshKey = typeof params._ === 'string' ? params._ : undefined;
  return <ClientDetailPage key={refreshKey ?? 'default'} clientId={Number(clientId)} />;
}
