import { InvestorDetailPage } from '@/components/investors/investor-detail-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvestorDetailPage investorId={id} />;
}
