import { LoanDetailPage } from '@/components/loans/loan-detail-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LoanDetailPage loanId={id} />;
}
