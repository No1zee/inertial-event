import { QueryProvider } from '@/components/providers/QueryProvider';
import { ShortcutProvider } from '@/components/providers/ShortcutProvider';
import ContentModal from '@/components/content/ContentModal';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <ShortcutProvider>
                {children}
                <ContentModal />
            </ShortcutProvider>
        </QueryProvider>
    );
}
