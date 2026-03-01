/// <reference types="jest" />

declare global {
  namespace NodeJS {
    interface Global {
      fetch: jest.MockedFunction<typeof fetch>;
      console: {
        log: jest.MockedFunction<typeof console.log>;
        warn: jest.MockedFunction<typeof console.warn>;
        error: jest.MockedFunction<typeof console.error>;
        info: jest.MockedFunction<typeof console.info>;
        debug: jest.MockedFunction<typeof console.debug>;
      };
    }
  }
}

export {};
