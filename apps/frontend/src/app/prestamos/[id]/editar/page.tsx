import { EditLoanPage } from '@/components/loans/edit-loan-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditLoanPage loanId={id} />;
}
