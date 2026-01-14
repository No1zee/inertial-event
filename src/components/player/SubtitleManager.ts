export class SubtitleManager {
    constructor(private videoElement: HTMLVideoElement) { }

    addTrack(label: string, srclang: string, url: string, isDefault: boolean = false) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = label;
        track.srclang = srclang;
        track.src = url;
        track.default = isDefault;

        this.videoElement.appendChild(track);
    }

    clearTracks() {
        const tracks = this.videoElement.querySelectorAll('track');
        tracks.forEach(track => track.remove());
    }

    setTrack(lang: string) {
        const textTracks = this.videoElement.textTracks;
        for (let i = 0; i < textTracks.length; i++) {
            if (textTracks[i].language === lang) {
                textTracks[i].mode = 'showing';
            } else {
                textTracks[i].mode = 'disabled';
            }
        }
    }
}

export default SubtitleManager;
