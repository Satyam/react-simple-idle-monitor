import React, { Component, useEffect, useState } from 'react';

import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitorEvents from '../src/IdleMonitorEvents';

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

describe('IdleMonitorEvents from react-simple-idle-monitor', () => {
  describe('event firing', () => {
    test('onRun should be called when rendering', () => {
      const onRun = jest.fn();
      render(
        <div>
          <IdleMonitorEvents onRun={onRun}>Hello</IdleMonitorEvents>
        </div>
      );
      expect(onRun).toHaveBeenCalled();
      expect(onRun.mock.calls[0][0]).toMatchInlineSnapshot(`
      Object {
        "now": 123000000,
        "startTime": 123000000,
      }
    `);
    });
    test('nothing should be fired before timeout', () => {
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
      afterASecond();
      act(() => jest.runAllTimers());
      expect(onIdle).toHaveBeenCalled();
      expect(onIdle.mock.calls[0][0]).toMatchInlineSnapshot(`
      Object {
        "now": 123001000,
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
          Hello
        </IdleMonitorEvents>
      );
      expect(container.querySelector('div.active')).toBeInTheDocument();
      expect(container.querySelector('div.idle')).not.toBeInTheDocument();
      act(() => jest.runAllTimers());
      onIdle.mockClear();
      expect(container.querySelector('div.active')).not.toBeInTheDocument();
      expect(container.querySelector('div.idle')).toBeInTheDocument();
      afterASecond();
      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });
      expect(container.querySelector('div.active')).toBeInTheDocument();
      expect(container.querySelector('div.idle')).not.toBeInTheDocument();

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).toHaveBeenCalled();
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
            Hello
          </IdleMonitorEvents>
        </div>
      );

      fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

      expect(onIdle).not.toHaveBeenCalled();
      expect(onActive).not.toHaveBeenCalled();
    });
  });
  test('no change of state after UI event when idle', () => {
    const onRun = jest.fn();
    const onStop = jest.fn();
    const onIdle = jest.fn();
    const onActive = jest.fn();
    const { getByText } = render(
      <IdleMonitorEvents
        onIdle={onIdle}
        onActive={onActive}
        onRun={onRun}
        onStop={onStop}
      >
        Hello
      </IdleMonitorEvents>
    );
    act(() => jest.runAllTimers());
    // Don't event bother clearing the mocks since
    // they should not have been called anyway
    fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });

    expect(onIdle).not.toHaveBeenCalled();
    expect(onActive).not.toHaveBeenCalled();
    expect(onRun).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
  });
});
