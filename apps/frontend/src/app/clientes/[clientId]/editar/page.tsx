import { AddClientPage } from '@/components/clients/add-client-page';

export default async function EditarClientePage(props: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await props.params;
  return <AddClientPage clientId={Number(clientId)} />;
}
