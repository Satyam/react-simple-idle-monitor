import React, { useEffect, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitor, { useIdleMonitor } from '../src/index';

import {
  TIMEOUT,
  EPOCH,
  LONG_TIME,
  SECOND,
  HALF_SECOND,
  advanceTimers,
  afterASecond,
  afterAWhile,
  now,
} from './setup';

function StatusForm({
  isRunning,
  isIdle,
  timeout,
  startTime,
  className,
}): JSX.Element {
  return (
    <form data-testid="status">
      <input readOnly name="isRunning" type="checkbox" checked={isRunning} />
      <input readOnly name="isIdle" type="checkbox" checked={isIdle} />
      <input readOnly name="timeout" type="number" value={timeout} />
      <input readOnly name="startTime" type="number" value={startTime} />
      <input readOnly name="className" value={className} />
    </form>
  );
}

function StatusConsumer(): JSX.Element {
  const state = useIdleMonitor();
  return <StatusForm {...state} />;
}

function StatusLogger(): JSX.Element {
  const {
    isRunning,
    isIdle,
    timeout,
    startTime,
    className = '',
  } = useIdleMonitor();
  const [log, setLog] = useState<
    {
      isRunning: boolean;
      isIdle: boolean;
      timeout: number;
      startTime: number;
      className: string;
      now: number;
    }[]
  >([]);

  useEffect(() => {
    setLog(l => [
      ...l,
      { isRunning, isIdle, timeout, startTime, className, now },
    ]);
  }, [isRunning, isIdle, timeout, startTime, className]);
  return <div data-testid="log">{JSON.stringify(log, null, 2)}</div>;
}

describe('useIdleMonitor from react-simple-idle-monitor', () => {
  describe('Just initialized', () => {
    test('with no properties', () => {
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusConsumer />
        </IdleMonitor>
      );
      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        isIdle: false,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });
    });

    test('disabled', () => {
      const { getByTestId } = render(
        <IdleMonitor enabled={false}>
          <StatusConsumer />
        </IdleMonitor>
      );
      expect(getByTestId('status')).toHaveFormValues({
        isRunning: false,
        isIdle: false,
        timeout: 0,
        startTime: 0,
      });
    });

    test('with a different timeout value', () => {
      const { getByTestId } = render(
        <IdleMonitor timeout={SECOND}>
          <StatusConsumer />
        </IdleMonitor>
      );
      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        isIdle: false,
        timeout: SECOND,
        startTime: EPOCH,
      });
    });
  });

  describe('Changing times', () => {
    test('after lots of time', () => {
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusConsumer />
        </IdleMonitor>
      );
      advanceTimers(LONG_TIME);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // Now it is idle:
        isIdle: true,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });
    });

    test('UI event after idle', () => {
      const { getByTestId, getByText } = render(
        <IdleMonitor>
          <StatusConsumer />
          Hello
        </IdleMonitor>
      );

      advanceTimers(LONG_TIME);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // now it is idle
        isIdle: true,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });

      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // No longer idle
        isIdle: false,
        timeout: TIMEOUT,
        // time has passed (1 second because of afterASecond() function)
        startTime: now,
      });
    });

    test('UI event while still active', () => {
      const { getByTestId, getByText } = render(
        <IdleMonitor>
          <StatusConsumer />
          Hello
        </IdleMonitor>
      );

      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // wasn't idle and still isn't
        isIdle: false,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });
    });
  });
  describe('trying out some logging', () => {
    test('with no properties', () => {
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusLogger />
        </IdleMonitor>
      );
      expect(JSON.parse(getByTestId('log').innerHTML)).toEqual([
        {
          isRunning: false,
          isIdle: false,
          timeout: 0,
          startTime: 0,
          className: '',
          now: EPOCH,
        },
        {
          isRunning: true,
          isIdle: false,
          timeout: TIMEOUT,
          startTime: EPOCH,
          className: '',
          now: EPOCH,
        },
      ]);
    });
    test('let it go idle', () => {
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusLogger />
        </IdleMonitor>
      );
      advanceTimers(LONG_TIME);
      expect(JSON.parse(getByTestId('log').innerHTML)).toEqual([
        {
          isRunning: false,
          isIdle: false,
          timeout: 0,
          startTime: 0,
          className: '',
          now: EPOCH,
        },
        {
          isRunning: true,
          isIdle: false,
          timeout: TIMEOUT,
          startTime: EPOCH,
          className: '',
          now: EPOCH,
        },
        {
          isRunning: true,
          isIdle: true,
          timeout: TIMEOUT,
          startTime: EPOCH,
          className: '',
          now: EPOCH + LONG_TIME,
        },
      ]);
    });

    test('let it go idle and then active again', () => {
      const { getByTestId, getByText } = render(
        <IdleMonitor>
          <StatusLogger />
          <p>Hello</p>
        </IdleMonitor>
      );
      advanceTimers(LONG_TIME);
      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });
      expect(JSON.parse(getByTestId('log').innerHTML)).toEqual([
        {
          isRunning: false,
          isIdle: false,
          timeout: 0,
          startTime: 0,
          className: '',
          now: EPOCH,
        },
        {
          isRunning: true,
          isIdle: false,
          timeout: TIMEOUT,
          startTime: EPOCH,
          className: '',
          now: EPOCH,
        },
        {
          isRunning: true,
          isIdle: true,
          timeout: TIMEOUT,
          startTime: EPOCH,
          className: '',
          now: EPOCH + LONG_TIME,
        },
        {
          isRunning: true,
          isIdle: false,
          timeout: TIMEOUT,
          startTime: EPOCH + LONG_TIME + SECOND,
          className: '',
          now: EPOCH + LONG_TIME + SECOND,
        },
      ]);
    });
  });

  describe('Functions', () => {
    test('force idle', () => {
      function ActivateFalse(): React.ReactElement | null {
        const { idle } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            afterAWhile(HALF_SECOND);
            act(() => idle());
          }, HALF_SECOND); // less than a second
        }, [idle]);
        return null;
      }
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusConsumer />
          <ActivateFalse />
        </IdleMonitor>
      );

      advanceTimers(SECOND);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // Should become idle
        isIdle: true,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });
    });

    test('activate(undefined)', () => {
      function Activate(): JSX.Element | null {
        const { activate } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => activate());
          }, LONG_TIME + HALF_SECOND);
        }, [activate]);
        return null;
      }
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusConsumer />
          <Activate />
        </IdleMonitor>
      );
      advanceTimers(LONG_TIME);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // Should become idle
        isIdle: true,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });

      advanceTimers(SECOND);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // Should become active
        isIdle: false,
        timeout: TIMEOUT,
        // With real timers it would have been
        //   startTime: EPOCH + LONG_TIME + HALF_SECOND
        // but with fake timers, they jump when you advance them
        // skipping in betweens.
        startTime: EPOCH + LONG_TIME + SECOND,
      });
    });
    test('activate(SECOND)', () => {
      function Activate(): JSX.Element | null {
        const { activate } = useIdleMonitor();
        useEffect(() => {
          setTimeout(() => {
            act(() => activate(SECOND));
          }, LONG_TIME + HALF_SECOND);
        }, [activate]);
        return null;
      }
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusConsumer />
          <Activate />
        </IdleMonitor>
      );
      advanceTimers(LONG_TIME);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // Should become idle
        isIdle: true,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });

      advanceTimers(SECOND);

      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        // Should become active
        isIdle: false,
        // It should run for just a second:
        timeout: SECOND,
        // With real timers it would have been
        //   startTime: EPOCH + LONG_TIME + HALF_SECOND
        // but with fake timers, they jump when you advance them
        // skipping in betweens.
        startTime: EPOCH + LONG_TIME + SECOND,
      });
    });

    test('Stop and restart', () => {
      function StopStart(): JSX.Element | null {
        const { run, stop } = useIdleMonitor();
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
      const { getByTestId } = render(
        <IdleMonitor>
          <StatusConsumer />
          <StopStart />
        </IdleMonitor>
      );

      advanceTimers(SECOND);

      expect(getByTestId('status')).toHaveFormValues({
        // Should have stopped
        isRunning: false,
        // Always turns active when stopped
        isIdle: false,
        timeout: TIMEOUT,
        startTime: EPOCH,
      });

      advanceTimers(SECOND);

      expect(getByTestId('status')).toHaveFormValues({
        // Back to running
        isRunning: true,
        // Always start active
        isIdle: false,
        timeout: TIMEOUT,
        // With real timers it would have been
        //   startTime: EPOCH + SECOND + HALF_SECOND
        // but with fake timers, they jump when you advance them
        // skipping in betweens.
        startTime: EPOCH + SECOND + SECOND,
      });
    });
  });
});
