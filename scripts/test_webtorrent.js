const WebTorrent = require('webtorrent');
const client = new WebTorrent();
const magnet = 'magnet:?xt=urn:btih:b54a7c645b0857a268e370e1b23838562d98471c&dn=ubuntu-24.04-desktop-amd64.iso&tr=https%3A%2F%2Ftorrent.ubuntu.com%2Fannounce&tr=https%3A%2F%2Fipv6.torrent.ubuntu.com%2Fannounce';

console.log('Adding Ubuntu...');
client.add(magnet, (torrent) => {
    console.log('Metadata fetched!');
    console.log('Name:', torrent.name);
    console.log('Files count:', torrent.files.length);
    torrent.files.forEach(f => console.log('File:', f.name, f.length));
    process.exit(0);
});

setTimeout(() => {
    console.log('Timeout (60s)');
    process.exit(1);
}, 60000);
