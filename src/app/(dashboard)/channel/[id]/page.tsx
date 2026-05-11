import { PROVIDERS } from '@/lib/constants/providers';
import ChannelView from '@/components/channel/ChannelView';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return PROVIDERS.map(provider => ({
    id: provider.id,
  }));
}

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChannelView id={id} />;
}
