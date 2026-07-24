import { PortfolioDetailPage } from '@/components/portfolios/portfolio-detail-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortfolioDetailPage portfolioId={id} />;
}
