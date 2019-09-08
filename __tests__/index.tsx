import React, { Component } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitor from '../src/index';
import IdleMonitorEvents from '../src/IdleMonitorEvents';
import IdleMonitorRedux from '../src/IdleMonitorRedux';

declare var global;

jest.useFakeTimers();

const EPOCH = 123000000;

beforeEach(() => {
  Date.now = jest.fn(() => EPOCH);
});

function advanceTimers(ms) {
  Date.now = jest.fn(() => EPOCH + ms);
  jest.advanceTimersByTime(ms);
}

function afterASecond() {
  Date.now = () => EPOCH + 1000;
}

describe('IdleMonitor from react-simple-idle-monitor', () => {
  describe('Initial rendering', () => {
    test('with no properties nor children', () => {
      // IdleMonitor should have children, otherwise it is useless.
      // But it doesn't fail if you forget
      // @ts-ignore
      const { container } = render(<IdleMonitor />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class=""
        />
      `);
    });

    test('with children and no properties', () => {
      const { container } = render(
        <IdleMonitor>
          <p>Hello</p>
        </IdleMonitor>
      );
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class=""
        >
          <p>
            Hello
          </p>
        </div>
      `);
    });

    test('with activeClassName and no children', () => {
      // IdleMonitor should have children, otherwise it is useless.
      // But it doesn't fail if you forget
      // @ts-ignore
      const { container } = render(<IdleMonitor activeClassName="active" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        />
      `);
    });

    test('with idleClassName and no children', () => {
      // IdleMonitor should have children, otherwise it is useless.
      // But it doesn't fail if you forget
      // @ts-ignore
      const { container } = render(<IdleMonitor idleClassName="idle" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class=""
        />
      `);
    });

    test('with children and activeClassName', () => {
      const { container } = render(
        <IdleMonitor activeClassName="active">
          <p>Hello</p>
        </IdleMonitor>
      );
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          <p>
            Hello
          </p>
        </div>
      `);
    });
  });
  describe('Rendering after timeout', () => {
    test('with no properties nor children', () => {
      // IdleMonitor should have children, otherwise it is useless.
      // But it doesn't fail if you forget
      // @ts-ignore
      const { container } = render(<IdleMonitor />);
      act(() => jest.runAllTimers());
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class=""
        />
      `);
    });

    test('with children and no properties', () => {
      const { container } = render(
        <IdleMonitor>
          <p>Hello</p>
        </IdleMonitor>
      );
      act(() => jest.runAllTimers());
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class=""
        >
          <p>
            Hello
          </p>
        </div>
      `);
    });

    test('with children and idleClassName', () => {
      const { container } = render(
        <IdleMonitor activeClassName="active" idleClassName="idle">
          <p>Hello</p>
        </IdleMonitor>
      );
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          <p>
            Hello
          </p>
        </div>
      `);
      act(() => jest.runAllTimers());
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="idle"
        >
          <p>
            Hello
          </p>
        </div>
      `);
    });
  });

  describe('event firing', () => {
    test('nothing should be fired before timeout', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onIdle={onIdle} onActive={onActive}>
            <p>Hello</p>
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
            <p>Hello</p>
          </IdleMonitorEvents>
        </div>
      );

      act(() => jest.runAllTimers());
      expect(onIdle).toHaveBeenCalledWith(
        expect.objectContaining({
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(onIdle.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123000000,
          "startTime": 123000000,
        }
      `);
      expect(onActive).not.toHaveBeenCalled();
    });

    test('should fire onActive after UI event', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const { container, getByText } = render(
        <IdleMonitorEvents
          onIdle={onIdle}
          onActive={onActive}
          activeClassName="active"
          idleClassName="idle"
        >
          <p>Hello</p>
        </IdleMonitorEvents>
      );
      expect(container.querySelectorAll('div.active')).toHaveLength(1);
      expect(container.querySelectorAll('div.idle')).toHaveLength(0);
      act(() => jest.runAllTimers());
      onIdle.mockClear();
      expect(container.querySelectorAll('div.active')).toHaveLength(0);
      expect(container.querySelectorAll('div.idle')).toHaveLength(1);
      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });
      expect(container.querySelectorAll('div.active')).toHaveLength(1);
      expect(container.querySelectorAll('div.idle')).toHaveLength(0);

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).toHaveBeenCalledWith(
        expect.objectContaining({
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(onActive.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123001000,
          "startTime": 123001000,
        }
      `);
    });

    test('should not fire onActive after UI event if not idle first', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const { getByText } = render(
        <div>
          <IdleMonitorEvents onIdle={onIdle} onActive={onActive}>
            <p>Hello</p>
          </IdleMonitorEvents>
        </div>
      );

      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
    });

    test('should restart timers when timeout changed', () => {
      const Wrap1 = class extends Component {
        constructor(props) {
          super(props);
          this.done = false;
          setTimeout(() => {
            this.done = true;
            this.forceUpdate();
          }, 10000);
        }
        done: boolean;
        render() {
          return (
            <IdleMonitor
              timeout={this.done ? 30000 : 20000}
              activeClassName="active"
              idleClassName="idle"
            >
              <p>Hello</p>
            </IdleMonitor>
          );
        }
      };
      const { container } = render(<Wrap1 />);
      expect(container.querySelectorAll('div.active')).toHaveLength(1);
      expect(container.querySelectorAll('div.idle')).toHaveLength(0);
      // Enough time to trigger the timer in Wrap, not the idle timer.
      act(() => advanceTimers(15000));
      expect(container.querySelectorAll('div.active')).toHaveLength(1);
      expect(container.querySelectorAll('div.idle')).toHaveLength(0);
      // enough extra time to trigger old timeout, but not the new one
      act(() => advanceTimers(10000));

      expect(container.querySelectorAll('div.active')).toHaveLength(1);
      expect(container.querySelectorAll('div.idle')).toHaveLength(0);
      act(() => jest.runAllTimers());
      expect(container.querySelectorAll('div.active')).toHaveLength(0);
      expect(container.querySelectorAll('div.idle')).toHaveLength(1);
    });
  });

  describe('Redux actions dispatched', () => {
    test('`_run` action should be dispatched on init', () => {
      const dispatch = jest.fn();
      render(
        <div>
          <IdleMonitorRedux
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
          >
            <p>Hello</p>
          </IdleMonitorRedux>
        </div>
      );
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
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
            <p>Hello</p>
          </IdleMonitorRedux>
        </div>
      );
      dispatch.mockClear();
      act(() => jest.runAllTimers());
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "now": 123000000,
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
            <p>Hello</p>
          </IdleMonitorRedux>
        </div>
      );
      act(() => jest.runAllTimers());
      dispatch.mockClear();
      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
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
            <p>Hello</p>
          </IdleMonitorRedux>
        </div>
      );
      dispatch.mockClear();

      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(dispatch).not.toHaveBeenCalled();
    });

    test('`_stop` action should be called when unmounted', () => {
      const dispatch = jest.fn();

      const Wrap2 = class extends Component {
        constructor(props) {
          super(props);
          this.done = false;
          setTimeout(() => {
            this.done = true;
            this.forceUpdate();
          }, 10000);
        }
        done: boolean;

        render() {
          return this.done ? (
            <p>Hello</p>
          ) : (
            <IdleMonitorRedux
              dispatch={dispatch}
              reduxActionPrefix="redux_action"
            >
              <p>Hello</p>
            </IdleMonitorRedux>
          );
        }
      };
      render(<Wrap2 />);
      dispatch.mockClear();

      // Enough time to trigger the timer in Wrap, not the idle timer.
      act(() => advanceTimers(20000));

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();
    });

    test('`_stop` action should be called when disabled', () => {
      const dispatch = jest.fn();
      const Wrap3 = class extends Component {
        constructor(props) {
          super(props);
          this.enabled = true;
          setTimeout(() => {
            this.enabled = false;
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
              <p>Hello</p>
            </IdleMonitorRedux>
          );
        }
      };
      const { getByText } = render(<Wrap3 />);
      dispatch.mockClear();
      act(() => advanceTimers(20000));
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
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

    test('`_stop` action should be called when started disabled', () => {
      const dispatch = jest.fn();
      const Wrap4 = class extends Component {
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
              <p>Hello</p>
            </IdleMonitorRedux>
          );
        }
      };
      render(<Wrap4 />);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();

      dispatch.mockClear();
      act(() => advanceTimers(20000));

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();

      // It should resume normal operation
      dispatch.mockClear();
      act(() => jest.runAllTimers());
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0]).toMatchInlineSnapshot();
    });
  });

  describe('server-side rendering (no document)', () => {
    test.todo('no change of state after timeout', () => {
      const onRun = jest.fn();
      const onStop = jest.fn();
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const dispatch = jest.fn();
      const { container } = render(
        // @ts-ignore
        <IdleMonitor
          element={null}
          activeClassName="active"
          idleClassName="idle"
          onIdle={onIdle}
          onActive={onActive}
          onRun={onRun}
          onStop={onStop}
          dispatch={dispatch}
          reduxActionPrefix="redux_action"
        >
          <p>Hello</p>
        </IdleMonitor>
      );
      act(() => jest.runAllTimers());
      expect(container.firstChild).toMatchInlineSnapshot();
      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
      expect(onRun).not.toHaveBeenCalled();
      expect(onStop).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });

    test.todo('no change of state after UI event when idle', () => {
      const onRun = jest.fn();
      const onStop = jest.fn();
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const dispatch = jest.fn();
      const { getByText } = render(
        // @ts-ignore
        <IdleMonitor
          element={null}
          onIdle={onIdle}
          onActive={onActive}
          onRun={onRun}
          onStop={onStop}
          dispatch={dispatch}
          reduxActionPrefix="redux_action"
        >
          <p>Hello</p>
        </IdleMonitor>
      );
      act(() => jest.runAllTimers());
      // Don't event bother clearing the mocks since
      // they should not have been called anyway
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
      expect(onRun).not.toHaveBeenCalled();
      expect(onStop).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('using reactDOM/server', () => {
    let doc;
    beforeAll(() => {
      doc = global.document;
      delete global.document;
    });
    afterAll(() => {
      global.document = doc;
    });

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
            <p>Hello</p>
          </IdleMonitorRedux>
        )
      ).toMatchInlineSnapshot(`"<div class=\\"active\\"><p>Hello</p></div>"`);
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
            <p>Hello</p>
          </IdleMonitorRedux>
        )
      ).toMatchInlineSnapshot(`"<div class=\\"active\\"><p>Hello</p></div>"`);
    });
  });
});
