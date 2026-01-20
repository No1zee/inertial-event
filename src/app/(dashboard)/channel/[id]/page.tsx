
import { PROVIDERS } from '@/lib/constants/providers';
import ChannelView from '@/components/channel/ChannelView';

export function generateStaticParams() {
    return PROVIDERS.map((provider) => ({
        id: provider.id,
    }));
}

export default function ChannelPage({ params }: { params: { id: string } }) {
    return <ChannelView id={params.id} />;
}
