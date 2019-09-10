import React, { Component, useEffect, useState } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorRedux from '../src/IdleMonitorRedux';

declare var global;

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
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH,
        startTime: EPOCH,
        type: ACTION_RUN,
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

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH + LONG_TIME,
        startTime: EPOCH,
        type: ACTION_IDLE,
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

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH + LONG_TIME,
        startTime: EPOCH + LONG_TIME,
        type: ACTION_ACTIVE,
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

    test('`_stop` action should be dispatched when unmounted', () => {
      const dispatch = jest.fn();

      function Wrap2() {
        const [mounted, setMounted] = useState(true);
        useEffect(() => {
          setTimeout(() => {
            setMounted(false);
          }, HALF_SECOND);
        });
        return mounted ? (
          <IdleMonitorRedux dispatch={dispatch} reduxActionPrefix={PREFIX}>
            Hello
          </IdleMonitorRedux>
        ) : (
          <p>Hello</p>
        );
      }

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH,
        startTime: EPOCH,
        type: ACTION_RUN,
      });

      // clear the _run action
      dispatch.mockClear();

      // Enough time to trigger the timer in Wrap2, not the idle timer.
      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH,
        startTime: EPOCH,
        type: ACTION_RUN,
      });
    });

    test('`_stop` action should be dispatched when disabled', () => {
      const dispatch = jest.fn();

      function Wrap3() {
        const [enabled, setEnabled] = useState(true);
        useEffect(() => {
          setTimeout(() => {
            setEnabled(false);
          }, HALF_SECOND);
        });
        return (
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix={PREFIX}
            enabled={enabled}
          >
            Hello
          </IdleMonitorRedux>
        );
      }

      const { getByText } = render(<Wrap3 />);

      // clear the run
      dispatch.mockClear();

      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH + SECOND,
        startTime: EPOCH,
        type: ACTION_STOP,
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
      function Wrap4() {
        const [enabled, setEnabled] = useState(false);
        useEffect(() => {
          setTimeout(() => {
            setEnabled(true);
          }, HALF_SECOND);
        });
        return (
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix={PREFIX}
            enabled={enabled}
          >
            Hello
          </IdleMonitorRedux>
        );
      }
      render(<Wrap4 />);
      // The _run action should not be called
      dispatch.mockClear();
      advanceTimers(SECOND);

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH + SECOND,
        startTime: EPOCH + SECOND,
        type: ACTION_RUN,
      });

      // It should resume normal operation
      dispatch.mockClear();

      advanceTimers(LONG_TIME);

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toEqual({
        now: EPOCH + SECOND + LONG_TIME,
        startTime: EPOCH + SECOND,
        type: ACTION_IDLE,
      });
    });
  });
});
