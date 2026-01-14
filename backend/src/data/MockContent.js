const MOCK_CONTENT = [
    {
        _id: 'mock_1',
        title: 'NovaStream Demo: Big Buck Bunny',
        type: 'movie',
        description: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squash his happiness.',
        year: 2008,
        rating: 9.5,
        trendingScore: 100,
        posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
        backdropUrl: 'https://peach.blender.org/wp-content/uploads/title_anons.jpg',
        genres: ['Animation', 'Comedy'],
        sources: [
            {
                url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                quality: 'auto',
                type: 'hls',
                provider: 'mock'
            }
        ]
    },
    {
        _id: 'mock_2',
        title: 'Sintel',
        type: 'movie',
        description: 'A lonely young woman, Sintel, helps and befriends a dragon, whom she names Scales. But when he is kidnapped by an adult dragon, Sintel decides to embark on a dangerous quest to find her lost friend.',
        year: 2010,
        rating: 8.8,
        trendingScore: 90,
        posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sintel_poster.jpg/800px-Sintel_poster.jpg',
        backdropUrl: 'https://durian.blender.org/wp-content/uploads/2010/09/sintel_original_4k.png',
        genres: ['Fantasy', 'Animation'],
        sources: []
    }
];

const MOCK_USER_LIBRARY = {
    watchHistory: [],
    watchlist: []
};

module.exports = { MOCK_CONTENT, MOCK_USER_LIBRARY };
