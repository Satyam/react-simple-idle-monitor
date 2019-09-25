import React, { useEffect, useState } from 'react';

import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorEvents from '../src/IdleMonitorEvents';
import { useIdleMonitor } from '../src/index';

import {
  EPOCH,
  TIMEOUT,
  LONG_TIME,
  SECOND,
  advanceTimers,
  afterASecond,
  now,
} from './setup';

describe('IdleMonitorEvents from react-simple-idle-monitor', () => {
  describe('Basic event firing', () => {
    test('onRun should be called when rendering', () => {
      const onRun = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onRun={onRun}>Hello</IdleMonitorEvents>
        </div>
      );
      expect(onRun).toHaveBeenCalledWith({
        startTime: EPOCH,
        now,
        timeout: TIMEOUT,
      });
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

      expect(onIdle).toHaveBeenCalledWith({
        now: EPOCH + LONG_TIME,
        startTime: EPOCH,
        timeout: TIMEOUT,
      });
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
      expect(onActive).toHaveBeenCalledWith({
        startTime: EPOCH + LONG_TIME + SECOND,
        now,
        timeout: TIMEOUT,
      });
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

    function Wrap1(): JSX.Element {
      const [mounted, setMounted] = useState(true);
      useEffect(() => {
        setTimeout(() => {
          setMounted(false);
        }, SECOND);
      }, []);
      return mounted ? (
        <IdleMonitorEvents onRun={onRun} onStop={onStop}>
          Hello
        </IdleMonitorEvents>
      ) : (
        <p>Hello</p>
      );
    }

    render(<Wrap1 />);

    expect(onRun).toHaveBeenCalledWith({
      startTime: EPOCH,
      now,
      timeout: TIMEOUT,
    });
    expect(onStop).not.toHaveBeenCalled();

    onRun.mockClear();

    // Enough time to trigger the timer in Wrap1, not the idle timer.
    advanceTimers(SECOND);

    expect(onStop).toHaveBeenCalledWith({
      now: EPOCH + SECOND,
      startTime: EPOCH,
      timeout: TIMEOUT,
    });
    expect(onRun).not.toHaveBeenCalled();
  });

  describe('events fired in response to hooks', () => {
    test('stop and restart', () => {
      const onRun = jest.fn();
      const onStop = jest.fn();

      function Wrap2(): JSX.Element | null {
        const { stop, run } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => stop());
          }, SECOND);
          setTimeout(() => {
            act(() => run());
          }, 2 * SECOND);
        }, [run, stop]);
        return null;
      }

      render(
        <IdleMonitorEvents onRun={onRun} onStop={onStop}>
          <Wrap2 />
        </IdleMonitorEvents>
      );
      expect(onRun).toHaveBeenCalledWith({
        startTime: EPOCH,
        now,
        timeout: TIMEOUT,
      });
      expect(onStop).not.toHaveBeenCalled();

      onRun.mockClear();

      advanceTimers(SECOND);

      expect(onStop).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        timeout: TIMEOUT,
      });
      expect(onRun).not.toHaveBeenCalled();

      onStop.mockClear();

      advanceTimers(SECOND);

      expect(onRun).toHaveBeenCalledWith({
        now: EPOCH + 2 * SECOND,
        startTime: EPOCH + 2 * SECOND,
        timeout: TIMEOUT,
      });
      expect(onStop).not.toHaveBeenCalled();
    });

    test('onIdle and onActive', () => {
      const onActive = jest.fn();
      const onIdle = jest.fn();

      function Wrap3(): JSX.Element | null {
        const { idle, activate } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => idle());
          }, SECOND);
          setTimeout(() => {
            act(() => activate());
          }, 2 * SECOND);
        }, [idle, activate]);
        return null;
      }

      render(
        <IdleMonitorEvents onActive={onActive} onIdle={onIdle}>
          <Wrap3 />
        </IdleMonitorEvents>
      );

      advanceTimers(SECOND);

      expect(onIdle).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        timeout: TIMEOUT,
      });
      expect(onActive).not.toHaveBeenCalled();

      onIdle.mockClear();

      advanceTimers(SECOND);

      expect(onActive).toHaveBeenCalledWith({
        now: EPOCH + 2 * SECOND,
        startTime: EPOCH + 2 * SECOND,
        timeout: TIMEOUT,
      });
      expect(onIdle).not.toHaveBeenCalled();
    });

    test('no idle nor activate when stopped', () => {
      const onActive = jest.fn();
      const onIdle = jest.fn();

      function Wrap4(): JSX.Element | null {
        const { activate, idle } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => idle());
          }, SECOND);
          setTimeout(() => {
            act(() => activate());
          }, 2 * SECOND);
        }, [activate, idle]);
        return null;
      }

      render(
        <IdleMonitorEvents onActive={onActive} onIdle={onIdle} disabled>
          <Wrap4 />
        </IdleMonitorEvents>
      );

      advanceTimers(SECOND);

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();

      advanceTimers(SECOND);

      expect(onActive).not.toHaveBeenCalled();
      expect(onIdle).not.toHaveBeenCalled();
    });
  });

  describe('changes in timeout should be properly reported', () => {
    test('onRun should be called with the proper timeout', () => {
      const onRun = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onRun={onRun} timeout={TIMEOUT / 2}>
            Hello
          </IdleMonitorEvents>
        </div>
      );
      expect(onRun).toHaveBeenCalledWith({
        startTime: EPOCH,
        now,
        timeout: TIMEOUT / 2,
      });
    });

    test('stop, restart and activate with new timeout', () => {
      const onRun = jest.fn();
      const onStop = jest.fn();
      const onActive = jest.fn();

      function Wrap5(): JSX.Element | null {
        const { stop, run, activate } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => stop());
          }, SECOND);
          setTimeout(() => {
            act(() => run(TIMEOUT / 2));
          }, 2 * SECOND);
          setTimeout(() => {
            act(() => activate(TIMEOUT / 4));
          }, 3 * SECOND);
        }, [run, stop, activate]);
        return null;
      }

      render(
        <IdleMonitorEvents onRun={onRun} onStop={onStop} onActive={onActive}>
          <Wrap5 />
        </IdleMonitorEvents>
      );
      expect(onRun).toHaveBeenCalledWith({
        startTime: EPOCH,
        now,
        timeout: TIMEOUT,
      });
      expect(onStop).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();

      onRun.mockClear();

      advanceTimers(SECOND);

      expect(onStop).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        timeout: TIMEOUT,
      });
      expect(onRun).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();

      onStop.mockClear();

      advanceTimers(SECOND);

      expect(onRun).toHaveBeenCalledWith({
        now: EPOCH + 2 * SECOND,
        startTime: EPOCH + 2 * SECOND,
        timeout: TIMEOUT / 2,
      });
      expect(onStop).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();

      onRun.mockClear();

      advanceTimers(SECOND);

      expect(onActive).toHaveBeenCalledWith({
        now: EPOCH + 3 * SECOND,
        startTime: EPOCH + 3 * SECOND,
        timeout: TIMEOUT / 4,
      });
      expect(onRun).not.toHaveBeenCalled();
      expect(onStop).not.toHaveBeenCalled();
    });
  });
  describe('Force some errors', () => {
    // To suppress the error message from the log:
    let consoleError;
    /* eslint-disable @typescript-eslint/unbound-method */
    beforeAll(() => {
      consoleError = console.error;
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = consoleError;
    });
    /* eslint-enable @typescript-eslint/unbound-method */

    test('no event handler', () => {
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorEvents>Hello</IdleMonitorEvents>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"At least one of the onXxxx attributes must be set, otherwise simply use IdleMonitor"`
      );
    });
    test('a string as an event handler', () => {
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorEvents onRun="handler">Hello</IdleMonitorEvents>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"onRun attribute must be assigned a function"`
      );
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorEvents onStop="handler">Hello</IdleMonitorEvents>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"onStop attribute must be assigned a function"`
      );
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorEvents onIdle="handler">Hello</IdleMonitorEvents>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"onIdle attribute must be assigned a function"`
      );
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorEvents onActive="handler">Hello</IdleMonitorEvents>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"onActive attribute must be assigned a function"`
      );
    });
  });
});
