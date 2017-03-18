import React from 'react';
import { shallow, mount } from 'enzyme';
import { jsdom } from 'jsdom';

import IdleTimer from '../src';

global.document = jsdom('');
global.window = document.defaultView;
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js',
};

jest.useFakeTimers();

describe('IdleTimer from react-simple-idle-monitor', () => {
  describe('Initial rendering', () => {
    it('with no properties nor children', () => {
      const wrapper = shallow(<IdleTimer />);
      expect(wrapper).toMatchSnapshot();
    });
    it('with children and no properties', () => {
      const wrapper = shallow(<IdleTimer><p>Hello</p></IdleTimer>);
      expect(wrapper).toMatchSnapshot();
    });
    it('with activeClassName and no children', () => {
      const wrapper = shallow(<IdleTimer activeClassName="active" />);
      expect(wrapper).toMatchSnapshot();
    });
    it('with children and activeClassName', () => {
      const wrapper = shallow(<IdleTimer activeClassName="active"><p>Hello</p></IdleTimer>);
      expect(wrapper).toMatchSnapshot();
    });
  });
  describe('Rendering after timeout', () => {
    /*
     * Must use wrapper.html() since enzyme-to-json fails in nulls:
     * https://github.com/adriantoine/enzyme-to-json/issues/47
     */
    it('with no properties nor children', () => {
      const wrapper = mount(<IdleTimer />);
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });
    it('with children and no properties', () => {
      const wrapper = mount(<IdleTimer><p>Hello</p></IdleTimer>);
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });
    it('with idleClassName and no children', () => {
      const wrapper = mount(
        <IdleTimer
          activeClassName="active"
          idleClassName="idle"
        />,
      );
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });
    it('with children and idleClassName', () => {
      const wrapper = mount(
        <IdleTimer
          activeClassName="active"
          idleClassName="idle"
        ><p>Hello</p></IdleTimer>,
      );
      jest.runAllTimers();
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
  describe('event firing', () => {
    it('should fire onIdle after timeout', () => {
      const onIdle = jest.fn();
      mount(
        <IdleTimer onIdle={onIdle} />,
      );
      expect(onIdle).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(onIdle).toHaveBeenCalledWith(expect.objectContaining({
        now: expect.any(Number),
        since: expect.any(Number),
      }));
      expect(Date.now() - onIdle.mock.calls[0][0].now).toBeLessThan(10);
      expect(Date.now() - onIdle.mock.calls[0][0].since).toBeLessThan(10);
    });
    it('should fire onActive after UI event', () => {
      const onIdle = jest.fn();
      const onActive = jest.fn();
      mount(
        <div>
          <IdleTimer onIdle={onIdle} onActive={onActive} />
        </div>,
      );
      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(onIdle).toHaveBeenCalledWith(expect.objectContaining({
        now: expect.any(Number),
        since: expect.any(Number),
      }));
      expect(Date.now() - onIdle.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - onIdle.mock.calls[0][0].since).toBeLessThan(100);
      expect(onActive).not.toHaveBeenCalled();
      onIdle.mockClear();

      // previous was setup, now the actual test

      // Since the monitor checks for events in document,
      // enzyme's simulate doesn't work,
      // the event has to be created and fired via JSDOM itself.
      const event = document.createEvent('HTMLEvents');
      event.initEvent('keydown', false, true);
      document.dispatchEvent(event);

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).toHaveBeenCalledWith(expect.objectContaining({
        now: expect.any(Number),
        since: expect.any(Number),
      }));
      expect(Date.now() - onActive.mock.calls[0][0].now).toBeLessThan(100);
      expect(Date.now() - onActive.mock.calls[0][0].since).toBeLessThan(100);
    });
  });
});
