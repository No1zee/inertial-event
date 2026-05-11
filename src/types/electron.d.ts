export {};

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, data?: unknown) => Promise<unknown>;
        send: (channel: string, ...args: any[]) => void;
        on?: (channel: string, func: (...args: any[]) => void) => (() => void) | undefined;
        off?: (channel: string, func: (...args: any[]) => void) => void;
        log?: (msg: string) => void;
      };
    };
    _lastHistoryUpdate?: number;
    _lastTrackUpdate?: number;
    NOVA_TEST_BYPASS_ONBOARDING?: boolean;
    ELECTRON_TEST_MODE?: boolean;
  }
  interface HTMLElement {
    preload?: string;
    allowpopups?: boolean;
  }
}
