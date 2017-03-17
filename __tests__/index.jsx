import React from 'react';
import { shallow, mount } from 'enzyme';
import toJson from 'enzyme-to-json';
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
      expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('with children and no properties', () => {
      const wrapper = shallow(<IdleTimer><p>Hello</p></IdleTimer>);
      expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('with activeClassName and no children', () => {
      const wrapper = shallow(<IdleTimer activeClassName="active" />);
      expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('with children and activeClassName', () => {
      const wrapper = shallow(<IdleTimer activeClassName="active"><p>Hello</p></IdleTimer>);
      expect(toJson(wrapper)).toMatchSnapshot();
    });
  });
  describe('Rendering after timeout', () => {
    it('with no properties nor children', () => {
      const wrapper = shallow(<IdleTimer timeout={20} />);
      jest.runAllTimers();
      expect(toJson(wrapper)).toMatchSnapshot();
    });
    it.skip('with children and no properties', () => new Promise((resolve) => {
      const wrapper = mount(<IdleTimer timeout={20}><p>Hello</p></IdleTimer>);
      setTimeout(
        () => {
          expect(toJson(wrapper)).toMatchSnapshot();
          resolve();
        },
        30,
      );
    }));
    it('with idleClassName and no children', () => {
      const wrapper = shallow(
        <IdleTimer
          timeout={20}
          activeClassName="active"
          idleClassName="idle"
        />,
      );
      jest.runAllTimers();
      expect(toJson(wrapper)).toMatchSnapshot();
    });
    it.skip('with children and idleClassName', () => new Promise((resolve) => {
      const wrapper = mount(
        <IdleTimer
          timeout={20}
          activeClassName="active"
          idleClassName="idle"
        ><p>Hello</p></IdleTimer>,
      );
      setTimeout(
        () => {
          expect(toJson(wrapper)).toMatchSnapshot();
          resolve();
        },
        30,
      );
    }));
  });
});
