const WebTorrent = require('webtorrent');

class TorrentService {
    constructor() {
        this.client = new WebTorrent();
        this.activeTorrents = new Map();
    }

    async startStream(magnetLink) {
        return new Promise((resolve, reject) => {
            if (this.activeTorrents.has(magnetLink)) {
                return resolve(this.activeTorrents.get(magnetLink));
            }

            this.client.add(magnetLink, (torrent) => {
                const server = torrent.createServer();
                server.listen(0, () => {
                    const port = server.address().port;
                    const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv'));
                    const url = `http://localhost:${port}/0`;

                    const result = {
                        url,
                        infoHash: torrent.infoHash,
                        name: torrent.name,
                        files: torrent.files.map(f => f.name)
                    };

                    this.activeTorrents.set(magnetLink, result);
                    resolve(result);
                });

                torrent.on('error', (err) => {
                    console.error('Torrent error:', err);
                    reject(err);
                });
            });
        });
    }

    stopStream(magnetLink) {
        const torrent = this.client.get(magnetLink);
        if (torrent) {
            torrent.destroy();
            this.activeTorrents.delete(magnetLink);
        }
    }
}

module.exports = new TorrentService();
