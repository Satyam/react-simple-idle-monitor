import React, { useEffect, useState } from 'react';

import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorEvents from '../src/IdleMonitorEvents';
import { useIdleMonitor } from '../src/index';

import {
  EPOCH,
  LONG_TIME,
  SECOND,
  HALF_SECOND,
  advanceTimers,
  afterASecond,
  now,
} from './setup';

describe('IdleMonitorEvents from react-simple-idle-monitor', () => {
  describe('event firing', () => {
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
        }, HALF_SECOND);
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
    });
    expect(onStop).not.toHaveBeenCalled();

    onRun.mockClear();

    // Enough time to trigger the timer in Wrap1, not the idle timer.
    advanceTimers(SECOND);

    expect(onStop).toHaveBeenCalledWith({
      now: EPOCH + SECOND,
      startTime: EPOCH,
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
          }, HALF_SECOND);
          setTimeout(() => {
            act(() => run());
          }, SECOND + HALF_SECOND);
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
      });
      expect(onStop).not.toHaveBeenCalled();

      onRun.mockClear();

      advanceTimers(SECOND);

      expect(onStop).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
      });
      expect(onRun).not.toHaveBeenCalled();

      onStop.mockClear();

      advanceTimers(SECOND);

      expect(onRun).toHaveBeenCalledWith({
        now: EPOCH + SECOND + SECOND,
        startTime: EPOCH + SECOND + SECOND,
      });
      expect(onStop).not.toHaveBeenCalled();
    });
    test('onIdle and onActive', () => {
      const onActive = jest.fn();
      const onIdle = jest.fn();

      function Wrap3(): JSX.Element | null {
        const { activate } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => activate(false));
          }, HALF_SECOND);
          setTimeout(() => {
            act(() => activate());
          }, SECOND + HALF_SECOND);
        }, [activate]);
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
      });
      expect(onActive).not.toHaveBeenCalled();

      onIdle.mockClear();

      advanceTimers(SECOND);

      expect(onActive).toHaveBeenCalledWith({
        now: EPOCH + SECOND + SECOND,
        startTime: EPOCH + SECOND + SECOND,
      });
      expect(onIdle).not.toHaveBeenCalled();
    });

    test('no idle nor activate when stopped', () => {
      const onActive = jest.fn();
      const onIdle = jest.fn();

      function Wrap4(): JSX.Element | null {
        const { activate } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => activate(false));
          }, HALF_SECOND);
          setTimeout(() => {
            act(() => activate());
          }, SECOND + HALF_SECOND);
        }, [activate]);
        return null;
      }

      render(
        <IdleMonitorEvents onActive={onActive} onIdle={onIdle} enabled={false}>
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
});
