import { PROVIDERS } from '@/lib/constants/providers';
import ChannelView from '@/components/channel/ChannelView';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return PROVIDERS.map(provider => ({
    id: provider.id,
  }));
}

export default function ChannelPage({ params }: { params: { id: string } }) {
  return <ChannelView id={params.id} />;
}
