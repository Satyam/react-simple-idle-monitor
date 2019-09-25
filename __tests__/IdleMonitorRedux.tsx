import React, { useEffect, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorRedux from '../src/IdleMonitorRedux';
import { useIdleMonitor } from '../src/index';

import { EPOCH, LONG_TIME, SECOND, advanceTimers, now, TIMEOUT } from './setup';

const PREFIX = 'redux_action';
const ACTION_RUN = `${PREFIX}_run`;
const ACTION_IDLE = `${PREFIX}_idle`;
const ACTION_ACTIVE = `${PREFIX}_active`;
const ACTION_STOP = `${PREFIX}_stop`;

describe('IdleMonitorRedux from react-simple-idle-monitor', () => {
  describe('Redux actions dispatched', () => {
    test('`_run` action should be dispatched on init', () => {
      const dispatch = jest.fn();
      render(
        <div>
          <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
            Hello
          </IdleMonitorRedux>
        </div>
      );
      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH,
        startTime: EPOCH,
        type: ACTION_RUN,
        timeout: TIMEOUT,
      });
    });

    test('`_idle` action should be dispatched after timeout', () => {
      const dispatch = jest.fn();
      render(
        <div>
          <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
            Hello
          </IdleMonitorRedux>
        </div>
      );

      // Clearing the _run actions
      dispatch.mockClear();

      advanceTimers(LONG_TIME);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + LONG_TIME,
        startTime: EPOCH,
        type: ACTION_IDLE,
        timeout: TIMEOUT,
      });
    });

    test('`_active` action should be dispatched after UI event', () => {
      const dispatch = jest.fn();
      const { getByText } = render(
        <div>
          <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
            Hello
          </IdleMonitorRedux>
        </div>
      );

      advanceTimers(LONG_TIME);

      // Clearing the _run and _idle actions
      dispatch.mockClear();

      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + LONG_TIME,
        startTime: EPOCH + LONG_TIME,
        type: ACTION_ACTIVE,
        timeout: TIMEOUT,
      });
    });

    test('it should not dispatch anything after UI event if not idle first', () => {
      const dispatch = jest.fn();
      const { getByText } = render(
        <div>
          <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
            Hello
          </IdleMonitorRedux>
        </div>
      );

      // Clearing the _run action
      dispatch.mockClear();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(dispatch).not.toHaveBeenCalled();
    });

    test('-debug- `_stop` action should be dispatched when unmounted', () => {
      const dispatch = jest.fn();

      function Wrap2(): JSX.Element {
        const [mounted, setMounted] = useState(true);
        useEffect(() => {
          setTimeout(() => {
            setMounted(false);
          }, SECOND);
        }, []);
        return mounted ? (
          <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
            Hello
          </IdleMonitorRedux>
        ) : (
          <p>Hello</p>
        );
      }

      render(<Wrap2 />);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH,
        startTime: EPOCH,
        type: ACTION_RUN,
        timeout: TIMEOUT,
      });

      // clear the _run action
      dispatch.mockClear();

      // Enough time to trigger the timer in Wrap2, not the idle timer.
      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        type: ACTION_STOP,
        timeout: TIMEOUT,
      });
    });

    test('`_stop` action should be dispatched when disabled', () => {
      const dispatch = jest.fn();

      function Wrap3(): JSX.Element {
        const [disabled, setDisabled] = useState(false);
        useEffect(() => {
          setTimeout(() => {
            setDisabled(true);
          }, SECOND);
        }, []);
        return (
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix={PREFIX}
            disabled={disabled}
          >
            Hello
          </IdleMonitorRedux>
        );
      }

      const { getByText } = render(<Wrap3 />);

      // clear the run
      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        type: ACTION_STOP,
        timeout: TIMEOUT,
      });

      // Nothing else should be dispatched while disabled
      dispatch.mockClear();
      advanceTimers(LONG_TIME);
      expect(dispatch).not.toHaveBeenCalled();

      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });
      expect(dispatch).not.toHaveBeenCalled();
    });

    test('`_stop` action should be dispatched when started disabled', () => {
      const dispatch = jest.fn();
      function Wrap4(): JSX.Element {
        const [disabled, setDisabled] = useState(true);
        useEffect(() => {
          setTimeout(() => {
            setDisabled(false);
          }, SECOND);
        }, []);
        return (
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix={PREFIX}
            disabled={disabled}
          >
            Hello
          </IdleMonitorRedux>
        );
      }
      render(<Wrap4 />);

      // The _run action should not be called
      expect(dispatch).not.toHaveBeenCalled();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH + SECOND,
        type: ACTION_RUN,
        timeout: TIMEOUT,
      });

      // It should resume normal operation
      dispatch.mockClear();

      advanceTimers(LONG_TIME);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + SECOND + LONG_TIME,
        startTime: EPOCH + SECOND,
        type: ACTION_IDLE,
        timeout: TIMEOUT,
      });
    });
  });

  describe('actions dispatched in response to hooks', () => {
    test('stop and restart', () => {
      const dispatch = jest.fn();

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
        <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
          <Wrap2 />
        </IdleMonitorRedux>
      );
      expect(dispatch).toHaveBeenCalledWith({
        startTime: EPOCH,
        now,
        type: ACTION_RUN,
        timeout: TIMEOUT,
      });

      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        type: ACTION_STOP,
        timeout: TIMEOUT,
      });

      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + 2 * SECOND,
        startTime: EPOCH + 2 * SECOND,
        type: ACTION_RUN,
        timeout: TIMEOUT,
      });
    });

    test('onIdle and onActive', () => {
      const dispatch = jest.fn();

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
        <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
          <Wrap3 />
        </IdleMonitorRedux>
      );

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        type: ACTION_IDLE,
        timeout: TIMEOUT,
      });

      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        now: EPOCH + 2 * SECOND,
        startTime: EPOCH + 2 * SECOND,
        type: ACTION_ACTIVE,
        timeout: TIMEOUT,
      });
    });

    test('no idle nor activate when stopped', () => {
      const dispatch = jest.fn();

      function Wrap4(): JSX.Element | null {
        const { idle, activate } = useIdleMonitor();
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
        <IdleMonitorRedux
          dispatch={dispatch}
          reduxActionPrefix={PREFIX}
          disabled
        >
          <Wrap4 />
        </IdleMonitorRedux>
      );

      advanceTimers(SECOND);

      expect(dispatch).not.toHaveBeenCalled();

      advanceTimers(SECOND);

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('changes in timeout should be properly reported', () => {
    test('onRun should be called with the proper timeout', () => {
      const dispatch = jest.fn();
      render(
        <div>
          <IdleMonitorRedux
            dispatch={dispatch}
            timeout={TIMEOUT / 2}
            reduxActionPrefix={PREFIX}
          >
            Hello
          </IdleMonitorRedux>
        </div>
      );
      expect(dispatch).toHaveBeenCalledWith({
        type: ACTION_RUN,
        startTime: EPOCH,
        now,
        timeout: TIMEOUT / 2,
      });
    });

    test('stop, restart and activate with new timeout', () => {
      const dispatch = jest.fn();

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
        <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
          <Wrap5 />
        </IdleMonitorRedux>
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: ACTION_RUN,
        startTime: EPOCH,
        now,
        timeout: TIMEOUT,
      });

      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        type: ACTION_STOP,
        now: EPOCH + SECOND,
        startTime: EPOCH,
        timeout: TIMEOUT,
      });

      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        type: ACTION_RUN,
        now: EPOCH + 2 * SECOND,
        startTime: EPOCH + 2 * SECOND,
        timeout: TIMEOUT / 2,
      });

      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalledWith({
        type: ACTION_ACTIVE,
        now: EPOCH + 3 * SECOND,
        startTime: EPOCH + 3 * SECOND,
        timeout: TIMEOUT / 4,
      });
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

    test('no dispatch nor prefix', () => {
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorRedux>Hello</IdleMonitorRedux>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"dispatch attribute must be assigned a function"`
      );
    });
    test('dispatch but no prefix', () => {
      expect(() => {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        render(<IdleMonitorRedux dispatch={jest.fn()}>Hello</IdleMonitorRedux>);
      }).toThrowErrorMatchingInlineSnapshot(
        `"reduxActionPrefix attribute must be assigned a string"`
      );
    });
  });
});
