import React, { Component, useEffect, useState } from 'react';

import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorEvents from '../src/IdleMonitorEvents';

jest.useFakeTimers();

const EPOCH = 123000000;
const TIMEOUT = 1000 * 60 * 20;
const LONG_TIME = 100000000;
const SECOND = 1000;
const HALF_SECOND = SECOND / 2;

let now = EPOCH;

beforeEach(() => {
  Date.now = () => EPOCH;
  now = EPOCH;
});

function advanceTimers(ms) {
  now += ms;
  Date.now = () => now;
  act(() => jest.advanceTimersByTime(ms));
}

function afterASecond() {
  now += SECOND;
  Date.now = () => now;
}

expect.extend({
  toBeActive: received => {
    const pass =
      received.querySelectorAll('div.active').length === 1 &&
      received.querySelectorAll('div.idle').length === 0;
    if (pass) {
      return {
        message: () =>
          `expected ${received.innerHTML} not to have the 'active' className`,
        pass: true,
      };
    } else {
      return {
        message: () =>
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
        message: () =>
          `expected ${received.innerHTML} not to have the 'idle' className`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received.innerHTML} to have the 'idle' className`,
        pass: false,
      };
    }
  },
});

describe('IdleMonitorEvents from react-simple-idle-monitor', () => {
  describe('event firing', () => {
    test('onRun should be called when rendering', () => {
      const onRun = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onRun={onRun}>Hello</IdleMonitorEvents>
        </div>
      );
      expect(onRun).toHaveBeenCalled();
      expect(onRun.mock.calls[0][0].startTime).toBe(EPOCH);
    });

    test('neither onIdle nor onActive should be fired before timeout', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onIdle={onIdle} onActive={onActive}>
            Hello
          </IdleMonitorEvents>
        </div>
      );
      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
    });

    test('should fire onIdle after timeout', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onIdle={onIdle} onActive={onActive}>
            Hello
          </IdleMonitorEvents>
        </div>
      );

      advanceTimers(LONG_TIME);

      expect(onIdle).toHaveBeenCalled();
      expect(onIdle.mock.calls[0][0].now).toBe(EPOCH + LONG_TIME);
      expect(onIdle.mock.calls[0][0].startTime).toBe(EPOCH);
      expect(onActive).not.toHaveBeenCalled();
    });

    test('after idle, it should fire onActive after UI event', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const { container, getByText } = render(
        <IdleMonitorEvents
          onIdle={onIdle}
          onActive={onActive}
          activeClassName="active"
          idleClassName="idle"
        >
          Hello
        </IdleMonitorEvents>
      );
      expect(container).toBeActive();

      advanceTimers(LONG_TIME);

      onIdle.mockClear();
      expect(container).toBeIdle();

      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(container).toBeActive();

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).toHaveBeenCalled();

      expect(onActive.mock.calls[0][0].startTime).toBe(
        EPOCH + LONG_TIME + SECOND
      );
    });

    test('should not fire onActive after UI event if not idle first', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const { getByText } = render(
        <div>
          <IdleMonitorEvents onIdle={onIdle} onActive={onActive}>
            Hello
          </IdleMonitorEvents>
        </div>
      );

      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
    });
  });

  test('`onStop` event should be called when unmounted', () => {
    const onRun = jest.fn();
    const onStop = jest.fn();

    function Wrap1() {
      const [mounted, setMounted] = useState(true);
      useEffect(() => {
        setTimeout(() => {
          setMounted(false);
        }, HALF_SECOND);
      });
      return mounted ? (
        <IdleMonitorEvents onRun={onRun} onStop={onStop}>
          Hello
        </IdleMonitorEvents>
      ) : (
        <p>Hello</p>
      );
    }

    render(<Wrap1 />);

    expect(onRun).toHaveBeenCalled();
    expect(onRun.mock.calls[0][0].startTime).toBe(EPOCH);
    expect(onStop).not.toHaveBeenCalled();

    onRun.mockClear();

    // Enough time to trigger the timer in Wrap1, not the idle timer.
    advanceTimers(SECOND);

    expect(onStop).toHaveBeenCalled();
    expect(onStop.mock.calls[0][0]).toMatchInlineSnapshot();
    expect(onRun).not.toHaveBeenCalled();
  });
});
