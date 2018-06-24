/* eslint-disable react/no-multi-comp */
/* eslint comma-dangle: ["error", {
  "functions": "never",
  "arrays": "only-multiline",
  "objects": "only-multiline",
}] */
import React, { Component } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import IdleMonitor from '../src';

configure({ adapter: new Adapter() });

// Since the monitor checks for events in document,
// enzyme's simulate doesn't work,
// the event has to be created and fired via JSDOM itself.
function fireUIEvent() {
  const event = document.createEvent('HTMLEvents');
  event.initEvent('keydown', false, true);
  document.dispatchEvent(event);
}

jest.useFakeTimers();

describe('IdleMonitor from react-simple-idle-monitor', () => {
  describe('Initial rendering', () => {
    it('with no properties nor children', () => {
      const wrapper = shallow(<IdleMonitor />);
      expect(wrapper).toMatchSnapshot();
    });

    it('with children and no properties', () => {
      const wrapper = shallow(
        <IdleMonitor>
          <p>
            Hello
          </p>
        </IdleMonitor>
      );
      expect(wrapper).toMatchSnapshot();
    });

    it('with activeClassName and no children', () => {
      const wrapper = shallow(<IdleMonitor activeClassName="active" />);
      expect(wrapper).toMatchSnapshot();
    });

    it('with idleClassName and no children', () => {
      const wrapper = shallow(<IdleMonitor idleClassName="idle" />);
      expect(wrapper).toMatchSnapshot();
    });

    it('with children and activeClassName', () => {
      const wrapper = shallow(
        <IdleMonitor activeClassName="active">
          <p>
            Hello
          </p>
        </IdleMonitor>
      );
      expect(wrapper).toMatchSnapshot();
    });
  });
  describe('Rendering after timeout', () => {
    /*
     * Must use wrapper.html() since enzyme-to-json fails in nulls:
     * https://github.com/adriantoine/enzyme-to-json/issues/47
     */
    it('with no properties nor children', () => {
      const wrapper = mount(<IdleMonitor />);
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('with children and no properties', () => {
      const wrapper = mount(
        <IdleMonitor>
          <p>
            Hello
          </p>
        </IdleMonitor>
      );
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('with idleClassName and no children', () => {
      const wrapper = mount(
        <IdleMonitor activeClassName="active" idleClassName="idle" />
      );
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('with children and idleClassName', () => {
      const wrapper = mount(
        <IdleMonitor activeClassName="active" idleClassName="idle">
          <p>
            Hello
          </p>
        </IdleMonitor>
      );
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });
  });

  describe('event firing', () => {
    it('nothing should be fired before timeout', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      mount(
        <div>
          <IdleMonitor onIdle={onIdle} onActive={onActive} />
        </div>
      );
      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
    });

    it('should fire onIdle after timeout', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      mount(
        <div>
          <IdleMonitor onIdle={onIdle} onActive={onActive} />
        </div>
      );

      jest.runAllTimers();
      expect(onIdle).toHaveBeenCalledWith(
        expect.objectContaining({
          now: expect.any(Number),
          startTime: expect.any(Number)
        })
      );
      expect(Date.now() - onIdle.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - onIdle.mock.calls[0][0].startTime).toBeLessThan(100);
      expect(onActive).not.toHaveBeenCalled();
    });

    it('should fire onActive after UI event', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const wrapper = mount(
        <IdleMonitor
          onIdle={onIdle}
          onActive={onActive}
          activeClassName="active"
          idleClassName="idle"
        />
      );
      expect(wrapper.find('div.active')).toHaveLength(1);
      expect(wrapper.find('div.idle')).toHaveLength(0);
      jest.runAllTimers();
      onIdle.mockClear();
      wrapper.update();
      expect(wrapper.find('div.active')).toHaveLength(0);
      expect(wrapper.find('div.idle')).toHaveLength(1);
      fireUIEvent();
      wrapper.update();
      expect(wrapper.find('div.active')).toHaveLength(1);
      expect(wrapper.find('div.idle')).toHaveLength(0);

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).toHaveBeenCalledWith(
        expect.objectContaining({
          now: expect.any(Number),
          startTime: expect.any(Number),
          preventActive: expect.any(Function),
          event: expect.any(Object),
        })
      );
      expect(Date.now() - onActive.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - onActive.mock.calls[0][0].startTime).toBeLessThan(
        100
      );
    });

    it('it should not change classname if activation prevented', () => {
      const onActive = (ev) => {
        ev.preventActive();
      };
      const wrapper = mount(
        <IdleMonitor
          onActive={onActive}
          activeClassName="active"
          idleClassName="idle"
        />
      );
      expect(wrapper.find('div.active')).toHaveLength(1);
      expect(wrapper.find('div.idle')).toHaveLength(0);
      jest.runAllTimers();
      wrapper.update();
      expect(wrapper.find('div.active')).toHaveLength(0);
      expect(wrapper.find('div.idle')).toHaveLength(1);
      fireUIEvent();
      wrapper.update();
      expect(wrapper.find('div.active')).toHaveLength(0);
      expect(wrapper.find('div.idle')).toHaveLength(1);
    });

    it('should not fire onActive after UI event if not idle first', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      mount(
        <div>
          <IdleMonitor onIdle={onIdle} onActive={onActive} />
        </div>
      );

      fireUIEvent();

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
    });

    it('should restart timers when timeout changed', () => {
      const Wrap = class extends Component {
        constructor(props) {
          super(props);
          this.done = false;
          setTimeout(() => {
            this.done = true;
            this.forceUpdate();
          }, 10000);
        }

        render() {
          return (
            <IdleMonitor
              timeout={this.done ? 30000 : 20000}
              activeClassName="active"
              idleClassName="idle"
            />
          );
        }
      };
      const wrapper = mount(<Wrap />);
      expect(wrapper.find('div.active')).toHaveLength(1);
      expect(wrapper.find('div.idle')).toHaveLength(0);
      // Enough time to trigger the timer in Wrap, not the idle timer.
      jest.runTimersToTime(15000);
      expect(wrapper.find('div.active')).toHaveLength(1);
      expect(wrapper.find('div.idle')).toHaveLength(0);
      // enough extra time to trigger old timeout, but not the new one
      jest.runTimersToTime(10000);
      wrapper.update();
      expect(wrapper.find('div.active')).toHaveLength(1);
      expect(wrapper.find('div.idle')).toHaveLength(0);
      jest.runAllTimers();
      wrapper.update();
      expect(wrapper.find('div.active')).toHaveLength(0);
      expect(wrapper.find('div.idle')).toHaveLength(1);
    });
  });

  describe('Redux actions dispatched', () => {
    it('`_run` action should be dispatched on init', () => {
      const dispatch = jest.fn();
      mount(
        <div>
          <IdleMonitor dispatch={dispatch} reduxActionPrefix="redux_action" />
        </div>
      );
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_run');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );
    });

    it('`_idle` action should be dispatched after timeout', () => {
      const dispatch = jest.fn();
      mount(
        <div>
          <IdleMonitor dispatch={dispatch} reduxActionPrefix="redux_action" />
        </div>
      );
      dispatch.mockClear();
      jest.runAllTimers();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_idle');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );
    });

    it('`_active` action should be dispatched after UI event', () => {
      const dispatch = jest.fn();
      mount(
        <div>
          <IdleMonitor dispatch={dispatch} reduxActionPrefix="redux_action" />
        </div>
      );
      jest.runAllTimers();
      dispatch.mockClear();

      fireUIEvent();

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_active');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );
    });

    it('`_active` action should not be dispatched after UI event if prevented', () => {
      const dispatch = jest.fn();
      const onActive = (ev) => {
        ev.preventActive();
      };
      mount(
        <div>
          <IdleMonitor
            dispatch={dispatch}
            reduxActionPrefix="redux_action"
            onActive={onActive}
          />
        </div>
      );
      jest.runAllTimers();
      dispatch.mockClear();

      fireUIEvent();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('it should not dispatch anything after UI event if not idle first', () => {
      const dispatch = jest.fn();
      mount(
        <div>
          <IdleMonitor dispatch={dispatch} reduxActionPrefix="redux_action" />
        </div>
      );
      dispatch.mockClear();

      fireUIEvent();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('`_stop` action should be called when unmounted', () => {
      const dispatch = jest.fn();

      const Wrap = class extends Component {
        constructor(props) {
          super(props);
          this.done = false;
          setTimeout(() => {
            this.done = true;
            this.forceUpdate();
          }, 10000);
        }

        render() {
          return this.done ? (
            <p>
              Hello
            </p>
          ) : (
            <IdleMonitor dispatch={dispatch} reduxActionPrefix="redux_action" />
          );
        }
      };
      mount(<Wrap />);
      dispatch.mockClear();

      // Enough time to trigger the timer in Wrap, not the idle timer.
      jest.runTimersToTime(20000);

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_stop');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );
    });

    it('`_stop` action should be called when disabled', () => {
      const dispatch = jest.fn();
      const Wrap = class extends Component {
        constructor(props) {
          super(props);
          this.enabled = true;
          setTimeout(() => {
            this.enabled = false;
            this.forceUpdate();
          }, 10000);
        }

        render() {
          return (
            <IdleMonitor
              dispatch={dispatch}
              reduxActionPrefix="redux_action"
              enabled={this.enabled}
            />
          );
        }
      };
      mount(<Wrap />);
      dispatch.mockClear();
      jest.runTimersToTime(20000);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_stop');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );

      // Nothing else should be dispatched while disabled
      dispatch.mockClear();
      jest.runAllTimers();
      expect(dispatch).not.toHaveBeenCalled();
      fireUIEvent();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('`_stop` action should be called when started disabled', () => {
      const dispatch = jest.fn();
      const Wrap = class extends Component {
        constructor(props) {
          super(props);
          this.enabled = false;
          setTimeout(() => {
            this.enabled = true;
            this.forceUpdate();
          }, 10000);
        }

        render() {
          return (
            <IdleMonitor
              dispatch={dispatch}
              reduxActionPrefix="redux_action"
              enabled={this.enabled}
            />
          );
        }
      };
      mount(<Wrap />);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_stop');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(dispatch.mock.calls[0][0].startTime).toBeUndefined();

      dispatch.mockClear();
      jest.runTimersToTime(20000);

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_run');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );

      // It should resume normal operation
      dispatch.mockClear();
      jest.runAllTimers();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          now: expect.any(Number),
          startTime: expect.any(Number),
        })
      );
      expect(dispatch.mock.calls[0][0].type).toBe('redux_action_idle');
      expect(Date.now() - dispatch.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - dispatch.mock.calls[0][0].startTime).toBeLessThan(
        100
      );
    });
  });

  describe('server-side rendering (no document)', () => {
    it('no change of state after timeout', () => {
      const onRun = jest.fn();
      const onStop = jest.fn();
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const dispatch = jest.fn();
      const wrapper = mount(
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
          <p>
            Hello
          </p>
        </IdleMonitor>
      );
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
      expect(onRun).not.toHaveBeenCalled();
      expect(onStop).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('no change of state after UI event when idle', () => {
      const onRun = jest.fn();
      const onStop = jest.fn();
      const onIdle = jest.fn();
      const onActive = jest.fn();
      const dispatch = jest.fn();
      mount(
        <IdleMonitor
          element={null}
          onIdle={onIdle}
          onActive={onActive}
          onRun={onRun}
          onStop={onStop}
          dispatch={dispatch}
          reduxActionPrefix="redux_action"
        />
      );
      jest.runAllTimers();
      // Don't event bother clearing the mocks since
      // they should not have been called anyway
      fireUIEvent();

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

    it('Using renderToString with no DOM', () => {
      expect(global.document).toBeUndefined();
      expect(
        renderToString(
          <IdleMonitor
            activeClassName="active"
            idleClassName="idle"
            reduxActionPrefix="redux_action"
          >
            <p>
              Hello
            </p>
          </IdleMonitor>
        )
      ).toMatchSnapshot();
    });

    it('Using renderToStaticMarkup with no DOM', () => {
      expect(global.document).toBeUndefined();
      expect(
        renderToStaticMarkup(
          <IdleMonitor
            activeClassName="active"
            idleClassName="idle"
            reduxActionPrefix="redux_action"
          >
            <p>
              Hello
            </p>
          </IdleMonitor>
        )
      ).toMatchSnapshot();
    });
  });
});
