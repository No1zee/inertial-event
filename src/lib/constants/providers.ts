
export const PROVIDERS = [
    { id: '8', name: 'Netflix', color: '#E50914', slug: 'netflix', logo: '/providers/netflix.svg', font: 'Bebas Neue' },
    { id: '337', name: 'Disney+', color: '#113CCF', slug: 'disney', logo: '/providers/disney.svg', font: 'Outfit' },
    { id: '9', name: 'Prime Video', color: '#00A8E1', slug: 'prime', logo: '/providers/prime.svg', font: 'PT Sans' },
    { id: '15', name: 'Hulu', color: '#1CE783', slug: 'hulu', logo: '/providers/hulu.svg', font: 'Montserrat' },
    { id: '350', name: 'Apple TV+', color: '#F5F5F7', slug: 'apple', logo: '/providers/apple.svg', font: 'Inter' },
    { id: '1899', name: 'Max', color: '#002BE7', slug: 'max', logo: '/providers/max.svg', font: 'Koulen' },
    { id: '386', name: 'Peacock', color: '#E5E5E5', slug: 'peacock', logo: '/providers/peacock.svg', font: 'Raleway' },
    { id: '80', name: 'Adult Swim', color: '#FFFFFF', slug: 'adult-swim', logo: '/providers/adult-swim.png', font: 'Inter' },
    { id: 'aunties', name: 'For the Aunties', color: '#D4AF37', slug: 'aunties', logo: '/providers/aunties.svg', font: 'Georgia' },
];

export const getProviderBySlug = (slug: string) => PROVIDERS.find(p => p.slug === slug);
export const getProviderById = (id: string) => PROVIDERS.find(p => p.id === id);
