import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Loader2 } from 'lucide-react';

interface ElectronWebView extends HTMLWebViewElement {
  executeJavaScript(script: string): Promise<unknown>;
}

interface WebviewIpcEvent extends Event {
  channel: string;
  args: unknown[];
}

interface WebViewBridgeProps {
  src: string;
  tmdbId: string;
  season?: string | number;
  episode?: string | number;
  initialProgress: number;
  visualBoost: boolean;
  pipBoost: boolean;
  onEnded: () => void;
  onProgress: (currentTime: number, duration: number) => void;
  onSourceFound?: (source: { url: string; type: string }) => void;
}

export function WebViewBridge({
  src,
  tmdbId,
  season,
  episode,
  initialProgress,
  visualBoost,
  pipBoost,
  onEnded,
  onProgress,
  onSourceFound
}: WebViewBridgeProps) {
  const [preloadPath, setPreloadPath] = useState<string | null>(null);
  const [isWebviewReady, setIsWebviewReady] = useState(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const webviewRef = useRef<ElectronWebView | null>(null);
  const isWebviewAttachedRef = useRef(false);
  const initialProgressRef = useRef(initialProgress);
  const pipBoostRef = useRef(pipBoost);
  const transitionTriggeredRef = useRef(false);

  useEffect(() => {
    initialProgressRef.current = initialProgress;
  }, [initialProgress]);

  useEffect(() => {
    pipBoostRef.current = pipBoost;
    if (isWebviewReady && webviewRef.current && isWebviewAttachedRef.current) {
      safeExecute(`if (window.__applyPipBoost) window.__applyPipBoost();`);
    }
  }, [pipBoost, isWebviewReady]);

  // Reset transition guard when identity changes
  useEffect(() => {
    transitionTriggeredRef.current = false;
    setIsPlaybackActive(false);
  }, [tmdbId, season, episode]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('get-player-preload-path').then((path: unknown) => {
        if (typeof path === 'string') setPreloadPath(path);
      });
    }
  }, []);

  const safeExecute = useCallback((script: string) => {
    if (!webviewRef.current || !isWebviewReady || !isWebviewAttachedRef.current) {
      return;
    }
    try {
      const wv = webviewRef.current as any;
      if (typeof wv.executeJavaScript === 'function') {
        wv.executeJavaScript(script).catch((err: any) => {
          if (!String(err).includes('attached to the DOM')) {
            console.warn('[NovaStream] Script execution error:', err);
          }
        });
      }
    } catch (e) {
      console.warn('[NovaStream] WebView execution blocked: Runtime exception.');
    }
  }, [isWebviewReady]);

  const [initMessage, setInitMessage] = useState('INITIALIZING PLAYBACK ENGINE');
  const [initFailed, setInitFailed] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isWebviewReady && !isPlaybackActive) {
      setInitFailed(false);
      setInitMessage('INITIALIZING PLAYBACK ENGINE');
      
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);

      // Auto-dismiss overlay after 12s even if IPC never fires —
      // prevents permanent black screen with audio leaking underneath
      const autoDismissTimeout = setTimeout(() => {
        if (!isPlaybackActive) {
          console.warn('[NovaStream] Auto-dismissing loading overlay (IPC timeout)');
          setIsPlaybackActive(true);
        }
      }, 12000);
      
      initTimeoutRef.current = setTimeout(() => {
        if (!isPlaybackActive) {
          setInitFailed(true);
          setInitMessage('CONNECTION STRUGGLING');
        }
      }, 15000);

      return () => {
        clearTimeout(autoDismissTimeout);
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      };
    } else if (isPlaybackActive) {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      setInitFailed(false);
    }
    
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, [isWebviewReady, isPlaybackActive]);

  const handleIpcMessage = useCallback((event: Event) => {
    const electronEvent = event as WebviewIpcEvent;
    const channel = electronEvent.channel;
    const data = electronEvent.args?.[0] as Record<string, unknown> | undefined;

    if (channel === 'video-ended' || channel === 'AG_ENDED') {
      if (!transitionTriggeredRef.current) {
        transitionTriggeredRef.current = true;
        onEnded();
      }
    } else if (channel === 'AG_UPDATE' && data) {
      const { currentTime, duration } = data as { currentTime: number; duration: number };
      onProgress(currentTime, duration);
    } else if (channel === 'AG_PLAYBACK_STARTED' || channel === 'AG_CANPLAY') {
      console.log('[VidlinkPlayer] Handshake Complete - Playback Active');
      setIsPlaybackActive(true);
    } else if (channel === 'AG_SOURCE_FOUND' && data && onSourceFound) {
      const { url, type } = data as { url: string; type: string };
      onSourceFound({ url, type });
    } else if (channel === 'AG_DIAGNOSTIC' && data) {
      setInitMessage(String(data.message || 'INITIALIZING').toUpperCase());
    } else if (channel === 'AG_ERROR' && data) {
      console.error('[VidlinkPlayer] Internal Error:', data.error);
      setInitFailed(true);
      setInitMessage('PLAYBACK ERROR');
    }
  }, [onEnded, onProgress, onSourceFound]);

  const syncPlaybackState = useCallback(() => {
    if (!webviewRef.current || !isWebviewAttachedRef.current) return;
    const wv = webviewRef.current as any;
    
    // Sync visual boost
    if (typeof wv.send === 'function') {
      wv.send('AG_SET_VISUAL_BOOST', visualBoost);
    }
  }, [visualBoost]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const handleReady = () => {
      if (isWebviewAttachedRef.current) {
        console.log('[VidlinkPlayer] DOM Ready - Controller Active');
        setIsWebviewReady(true);
        setInitMessage('CONTROLLER ACTIVE');
        syncPlaybackState();
      }
    };

    const handleStartLoading = () => {
      setIsWebviewReady(false);
      setIsPlaybackActive(false);
      setInitFailed(false);
      setInitMessage('PREPARING LINK BRIDGE');
    };
    const handleStopLoading = () => console.log('[VidlinkPlayer] Resource Loading Complete');
    const handleFailLoad = (e: any) => {
      // Ignore aborted loads (errorCode -3) which happen normally during source switching
      if (e.errorCode === -3) {
        console.warn('[VidlinkPlayer] Load aborted (-3), likely due to new navigation');
        return;
      }
      console.error('[VidlinkPlayer] Webview Load Failed:', e);
      setInitFailed(true);
      setInitMessage('LOAD FAILURE');
    };
    const handleConsole = (e: any) => {
      if (e.message.includes('[NovaStream]') || e.message.includes('[AG]')) {
        console.log(`[Webview] ${e.message}`);
      }
    };
    const ipcHandler = handleIpcMessage as unknown as EventListener;

    wv.addEventListener('dom-ready', handleReady);
    wv.addEventListener('did-start-loading', handleStartLoading);
    wv.addEventListener('did-stop-loading', handleStopLoading);
    wv.addEventListener('did-fail-load', handleFailLoad);
    wv.addEventListener('console-message', handleConsole);
    wv.addEventListener('ipc-message', ipcHandler);
    
    return () => {
      wv.removeEventListener('dom-ready', handleReady);
      wv.removeEventListener('did-start-loading', handleStartLoading);
      wv.removeEventListener('did-stop-loading', handleStopLoading);
      wv.removeEventListener('did-fail-load', handleFailLoad);
      wv.removeEventListener('console-message', handleConsole);
      wv.removeEventListener('ipc-message', ipcHandler);
    };
  }, [handleIpcMessage, syncPlaybackState]);

  const onWebviewRef = useCallback(
    (wv: HTMLWebViewElement | null) => {
      if (!wv) {
        setIsWebviewReady(false);
        isWebviewAttachedRef.current = false;
        webviewRef.current = null;
        return;
      }
      
      if (webviewRef.current === wv) return;
      webviewRef.current = wv as unknown as ElectronWebView;
      isWebviewAttachedRef.current = true;
    },
    []
  );

  useEffect(() => {
    if (isWebviewReady) {
      syncPlaybackState();
    }
  }, [visualBoost, isWebviewReady, syncPlaybackState]);

  useEffect(() => {
    const handleGlobalCommand = (e: CustomEvent) => {
      const { action } = e.detail;
      const wv = webviewRef.current as any;
      if (!wv || typeof wv.send !== 'function') return;

      if (action === 'pause') {
        wv.send('AG_PAUSE');
      } else if (action === 'play') {
        wv.send('AG_PLAY');
      }
    };
    
    window.addEventListener('AG_PLAYER_COMMAND' as any, handleGlobalCommand);
    return () => window.removeEventListener('AG_PLAYER_COMMAND' as any, handleGlobalCommand);
  }, []);

  return (
    <div className="relative flex-1 w-full h-full">
      {(!isPlaybackActive && isWebviewReady) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 transition-all duration-500">
          <div className="relative mb-8">
            <Loader2 className={`w-12 h-12 ${initFailed ? 'text-red-500' : 'text-primary'} animate-spin opacity-40`} />
            <div className={`absolute inset-0 blur-xl ${initFailed ? 'bg-red-500/20' : 'bg-primary/20'} animate-pulse rounded-full`} />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <PretextHeadline 
              text={initMessage} 
              className={`text-[10px] font-black tracking-[0.6em] uppercase transition-colors duration-500 ${initFailed ? 'text-red-500/60' : 'text-white/40'}`} 
            />
            
            {initFailed && (
              <div 
                className="flex flex-col items-center gap-4 mt-8 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <p className="text-zinc-500 text-[10px] font-medium tracking-wider uppercase mb-2">The link is taking too long to respond.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      // Reload only the webview, not the entire Electron app
                      const wv = webviewRef.current as any;
                      if (wv && typeof wv.reload === 'function') {
                        setIsPlaybackActive(false);
                        setIsWebviewReady(false);
                        setInitFailed(false);
                        setInitMessage('RETRYING CONNECTION');
                        wv.reload();
                      } else {
                        // Iframe fallback: re-set the src to force reload
                        const iframe = document.querySelector('[data-testid="video-player"]') as HTMLIFrameElement;
                        if (iframe) {
                          iframe.src = iframe.src;
                        }
                      }
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black tracking-widest uppercase transition-all"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('AG_TOGGLE_SOURCE'))}
                    className="px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/20 rounded-full text-[10px] font-black tracking-widest uppercase text-primary transition-all"
                  >
                    Switch Source
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {typeof window !== 'undefined' && window.electron ? (
        !preloadPath ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-20 transition-all duration-1000">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-8 opacity-40" />
              <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
            </div>
            <PretextHeadline text="PREPARING LINK BRIDGE" className="text-[10px] font-black tracking-[0.6em] text-white/40 uppercase" />
          </div>
        ) : (
          <webview
            key={`${tmdbId}-${season}-${episode}`}
            ref={onWebviewRef}
            src={src}
            preload={preloadPath || undefined}
            className="flex-1 w-full h-full"
            allowFullScreen
            allowpopups
            allowRunningInsecureContent
            webpreferences="contextIsolation=no, nodeIntegration=no, webSecurity=no, nodeIntegrationInSubFrames=true, autoplayPolicy=no-user-gesture-required"
            partition="persist:novastream"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            data-testid="video-player"
          />
        )
      ) : (
        <iframe
          src={src}
          title="Video Player"
          className="flex-1 w-full h-full border-none"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          data-testid="video-player"
        />
      )}
    </div>
  );
}
