export interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPreferences {
    theme: 'dark' | 'light' | 'system';
    player: {
        autoplay: boolean;
        defaultQuality: 'auto' | '1080p' | '720p';
        subtitleLanguage: string;
    };
    notifications: {
        email: boolean;
        push: boolean;
        newReleases: boolean;
    };
}
