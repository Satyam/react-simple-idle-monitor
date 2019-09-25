/* istanbul ignore file */

import { act } from '@testing-library/react';

/* eslint "@typescript-eslint/no-namespace": 0 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeActive(): R;
      toBeIdle(): R;
    }
  }
}

export const EPOCH = 123000000;
export const TIMEOUT = 1000 * 60 * 20;
export const LONG_TIME = 100000000;
export const SECOND = 1000;

export let now = EPOCH;

jest.useFakeTimers();

/* eslint-disable @typescript-eslint/unbound-method */
beforeEach((): void => {
  Date.now = (): number => EPOCH;
  now = EPOCH;
});

export function advanceTimers(ms): void {
  now += ms;
  Date.now = (): number => now;
  act((): void => {
    jest.advanceTimersByTime(ms);
  });
}

export function afterASecond(): void {
  now += SECOND;
  Date.now = (): number => now;
}

/* eslint-enable @typescript-eslint/unbound-method */

expect.extend({
  toBeActive: received => {
    const pass =
      received.querySelectorAll('div.active').length === 1 &&
      received.querySelectorAll('div.idle').length === 0;
    if (pass) {
      return {
        message: (): string =>
          `expected ${received.innerHTML} not to have the 'active' className`,
        pass: true,
      };
    } else {
      return {
        message: (): string =>
          `expected ${received.innerHTML} to have the 'active' className`,
        pass: false,
      };
    }
  },
  toBeIdle: received => {
    const pass =
      received.querySelectorAll('div.active').length === 0 &&
      received.querySelectorAll('div.idle').length === 1;
    if (pass) {
      return {
        message: (): string =>
          `expected ${received.innerHTML} not to have the 'idle' className`,
        pass: true,
      };
    } else {
      return {
        message: (): string =>
          `expected ${received.innerHTML} to have the 'idle' className`,
        pass: false,
      };
    }
  },
});
