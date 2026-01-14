import Hls from 'hls.js';

export class HLSHandler {
    private hls: Hls | null = null;

    constructor(private videoElement: HTMLVideoElement) { }

    init(url: string, autoplay: boolean = false) {
        if (this.hls) {
            this.hls.destroy();
        }

        if (Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.videoElement);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoplay) {
                    this.videoElement.play().catch(() => { });
                }
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            this.hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            this.hls?.recoverMediaError();
                            break;
                        default:
                            this.destroy();
                            break;
                    }
                }
            });
        } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoElement.src = url;
        }
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
}

export default HLSHandler;
