import React, { Component, useEffect, useState } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorRedux from '../src/IdleMonitorRedux';

declare var global;

jest.useFakeTimers();

const EPOCH = 123000000;

let now = EPOCH;

beforeEach(() => {
  Date.now = () => EPOCH;
  now = EPOCH;
});

function advanceTimers(ms) {
  now += ms;
  Date.now = () => now;
  jest.advanceTimersByTime(ms);
}

function afterASecond() {
  now += 1000;
  Date.now = () => now;
}

describe('IdleMonitorRedux from react-simple-idle-monitor', () => {
  describe('Redux actions dispatched', () => {
    test('`_run` action should be dispatched on init', () => {
      const dispatch = jest.fn();
      render(
        <div>
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
          >
            Hello
          </IdleMonitorRedux>
        </div>
      );
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123000000,
          "startTime": 123000000,
          "type": "redux_action_run",
        }
      `);
    });

    test('`_idle` action should be dispatched after timeout', () => {
      const dispatch = jest.fn();
      render(
        <div>
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
          >
            Hello
          </IdleMonitorRedux>
        </div>
      );
      dispatch.mockClear();
      afterASecond();
      act(() => jest.runAllTimers());
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123001000,
          "startTime": 123000000,
          "type": "redux_action_idle",
        }
      `);
    });

    test('`_active` action should be dispatched after UI event', () => {
      const dispatch = jest.fn();
      const { getByText } = render(
        <div>
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
          >
            Hello
          </IdleMonitorRedux>
        </div>
      );
      act(() => jest.runAllTimers());
      dispatch.mockClear();
      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123001000,
          "startTime": 123001000,
          "type": "redux_action_active",
        }
      `);
    });

    test('it should not dispatch anything after UI event if not idle first', () => {
      const dispatch = jest.fn();
      const { getByText } = render(
        <div>
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
          >
            Hello
          </IdleMonitorRedux>
        </div>
      );
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
          }, 10000);
        });
        return mounted ? (
          <IdleMonitorRedux
            activeClassName="active"
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
          >
            Hello
          </IdleMonitorRedux>
        ) : (
          <p>Hello</p>
        );
      }

      const { container } = render(<Wrap2 />);

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          Hello
        </div>
      `);
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123000000,
          "startTime": 123000000,
          "type": "redux_action_run",
        }
      `);

      dispatch.mockClear();

      // Enough time to trigger the timer in Wrap2, not the idle timer.
      act(() => advanceTimers(20000));

      expect(container.firstChild).toMatchInlineSnapshot(`
        <p>
          Hello
        </p>
      `);
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();
    });

    test('`_stop` action should be dispatched when disabled', () => {
      const dispatch = jest.fn();

      function Wrap3() {
        const [enabled, setEnabled] = useState(true);
        useEffect(() => {
          setTimeout(() => {
            setEnabled(false);
          }, 10000);
        });
        return (
          <IdleMonitorRedux
            activeClassName="active"
            idleClassName="idle"
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
            enabled={enabled}
          >
            Hello
          </IdleMonitorRedux>
        );
      }
      const { container, getByText } = render(<Wrap3 />);
      dispatch.mockClear();

      act(() => advanceTimers(20000));

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          Hello
        </div>
      `);

      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123020000,
          "startTime": 123000000,
          "type": "redux_action_stop",
        }
      `);

      // Nothing else should be dispatched while disabled
      dispatch.mockClear();
      act(() => jest.runAllTimers());
      expect(dispatch).not.toHaveBeenCalled();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });
      expect(dispatch).not.toHaveBeenCalled();
    });

    test('`_stop` action should be dispatched when started disabled', () => {
      const dispatch = jest.fn();
      const Wrap4x = class extends Component {
        constructor(props) {
          super(props);
          this.enabled = false;
          setTimeout(() => {
            this.enabled = true;
            this.forceUpdate();
          }, 10000);
        }
        enabled: boolean;

        render() {
          return (
            <IdleMonitorRedux
              dispatch={dispatch}
              reduxActionPrefix="redux_action"
              enabled={this.enabled}
            >
              Hello
            </IdleMonitorRedux>
          );
        }
      };
      function Wrap4() {
        const [enabled, setEnabled] = useState(false);
        useEffect(() => {
          setTimeout(() => {
            setEnabled(true);
          }, 10000);
        });
        return (
          <IdleMonitorRedux
            activeClassName="active"
            idleClassName="idle"
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
            enabled={enabled}
          >
            Hello
          </IdleMonitorRedux>
        );
      }
      const { container } = render(<Wrap4 />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          Hello
        </div>
      `);
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();

      dispatch.mockClear();
      act(() => advanceTimers(20000));

      expect(container.firstChild).toMatchInlineSnapshot();
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();

      // It should resume normal operation
      dispatch.mockClear();
      afterASecond();
      act(() => jest.runAllTimers());
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();
    });
  });
  describe('using reactDOM/server', () => {
    test('Using renderToString with no DOM', () => {
      expect(global.document).toBeUndefined();
      expect(
        renderToString(
          <IdleMonitorRedux
            activeClassName="active"
            idleClassName="idle"
            reduxActionPrefix="redux_action"
            dispatch={() => void 0}
          >
            Hello
          </IdleMonitorRedux>
        )
      ).toMatchInlineSnapshot(`"<div class=\\"active\\">Hello</div>"`);
    });

    test('Using renderToStaticMarkup with no DOM', () => {
      expect(global.document).toBeUndefined();
      expect(
        renderToStaticMarkup(
          <IdleMonitorRedux
            activeClassName="active"
            idleClassName="idle"
            reduxActionPrefix="redux_action"
            dispatch={() => void 0}
          >
            Hello
          </IdleMonitorRedux>
        )
      ).toMatchInlineSnapshot(`"<div class=\\"active\\">Hello</div>"`);
    });
  });
});
