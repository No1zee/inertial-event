export {};

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, data?: unknown) => Promise<unknown>;
        on?: (channel: string, func: (data: unknown) => void) => (() => void) | undefined;
        off?: (channel: string, func: () => void) => void;
        log?: (msg: string) => void;
      };
    };
    _lastHistoryUpdate?: number;
    _lastTrackUpdate?: number;
  }
  interface HTMLElement {
    preload?: string;
    allowpopups?: boolean;
  }
}
