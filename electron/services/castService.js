const mdns = require('mdns-js');
const { Client, DefaultMediaReceiver } = require('castv2-client');
const dlnacasts = require('dlnacasts');
const ip = require('ip');

class CastService {
    constructor() {
        this.devices = new Map(); // id -> { id, name, type, host, device (raw) }
        this.dlna = dlnacasts();
        this.browser = null;
        this.scanning = false;
    }

    startScan(callback) {
        if (this.scanning) return;
        this.scanning = true;
        this.devices.clear();

        // 1. Scan for DLNA
        try {
            this.dlna.update(); // Start search
            this.dlna.on('update', (player) => {
                const id = `dlna-${player.host}`;
                if (!this.devices.has(id)) {
                    this.devices.set(id, {
                        id,
                        name: player.name,
                        type: 'dlna',
                        host: player.host,
                        raw: player
                    });
                    callback(Array.from(this.devices.values()));
                }
            });
        } catch (e) {
            console.error('[CastService] DLNA Init Error:', e);
        }

        // 2. Scan for Chromecast (mDNS)
        try {
            this.browser = mdns.createBrowser(mdns.tcp('googlecast'));
            this.browser.on('ready', () => this.browser.discover());
            
            this.browser.on('update', (data) => {
                if (!data || !data.addresses || data.addresses.length === 0) return;
                
                // Extract useful name
                let name = 'Chromecast';
                if (data.txt) {
                    const fn = data.txt.find(t => t.startsWith('fn='));
                    if (fn) name = fn.split('=')[1];
                }

                const host = data.addresses[0];
                const id = `cast-${host}`;

                if (!this.devices.has(id)) {
                    this.devices.set(id, {
                        id,
                        name: name,
                        type: 'chromecast',
                        host: host,
                        raw: data
                    });
                    callback(Array.from(this.devices.values()));
                }
                
            });
        } catch (e) {
             console.error('[CastService] Chromecast Init Error:', e);
        }
    }

    stopScan() {
        if (this.browser) {
            try { this.browser.stop(); } catch(e) {}
            this.browser = null;
        }
        this.scanning = false;
    }

    async cast(deviceId, mediaUrl, metadata = {}) {
        const device = this.devices.get(deviceId);
        if (!device) throw new Error('Device not found');

        console.log(`[CastService] Casting to ${device.name} (${device.type}): ${mediaUrl}`);

        if (device.type === 'dlna') {
            return this._castDlna(device.raw, mediaUrl, metadata);
        } else if (device.type === 'chromecast') {
            return this._castChrome(device.host, mediaUrl, metadata);
        }
    }

    _castDlna(player, url, metadata) {
        return new Promise((resolve, reject) => {
            player.play(url, {
                title: metadata.title || 'NovaStream Video',
                type: 'video/mp4' 
            }, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    _castChrome(host, url, metadata) {
        return new Promise((resolve, reject) => {
            const client = new Client();
            client.connect(host, () => {
                client.launch(DefaultMediaReceiver, (err, player) => {
                    if (err) {
                        client.close();
                        return reject(err);
                    }

                    const media = {
                        contentId: url,
                        contentType: 'video/mp4',
                        streamType: 'BUFFERED',
                        metadata: {
                            type: 0,
                            metadataType: 0,
                            title: metadata.title || 'NovaStream', 
                            images: [
                                { url: metadata.poster || 'https://via.placeholder.com/480' }
                            ]
                        }
                    };

                    player.load(media, { autoplay: true }, (err, status) => {
                        if (err) {
                            client.close();
                            reject(err);
                        } else {
                            // Keep connection open for heartbeat?
                            // For now we close because we don't track status
                            // client.close(); 
                            resolve(status);
                        }
                    });
                });
            });
            
            client.on('error', (err) => {
                console.error('[CastClient] Error:', err);
                client.close(); // Ensure cleanup
            });
        });
    }
}

module.exports = new CastService();
