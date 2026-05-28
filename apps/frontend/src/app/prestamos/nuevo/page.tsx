import { NewLoanPage } from '@/components/loans/new-loan-page';

export default async function NuevoPrestamoPage(props: { searchParams: Promise<{ cliente?: string }> }) {
  const searchParams = await props.searchParams;
  return <NewLoanPage initialClientId={searchParams.cliente} />;
}
