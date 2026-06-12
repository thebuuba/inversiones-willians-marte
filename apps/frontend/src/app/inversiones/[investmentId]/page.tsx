import { InvestmentDetailPage } from '@/components/investors/investment-detail-page';

export default async function Page({ params }: { params: Promise<{ investmentId: string }> }) {
  const { investmentId } = await params;
  return <InvestmentDetailPage investmentId={investmentId} />;
}
