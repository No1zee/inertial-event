(function() {
  if (typeof globalThis === 'undefined') {
      if (typeof self !== 'undefined') {
          self.globalThis = self;
      } else if (typeof window !== 'undefined') {
          window.globalThis = window;
      } else {
          try {
              (function() { return this; })().globalThis = (function() { return this; })();
          } catch (e) {
              window.globalThis = window;
          }
      }
  }
})();
