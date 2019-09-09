import React, { useEffect, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitor, { useIdleMonitor } from '../src/index';
import { declareClass } from '@babel/types';

jest.useFakeTimers();

const EPOCH = 123000000;
const TIMEOUT = 1000 * 60 * 20;
const LONG_TIME = 100000000;

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

function longTime() {
  now += LONG_TIME;
  Date.now = () => now;
  act(() => jest.advanceTimersByTime(LONG_TIME));
}
function afterASecond() {
  now += 1000;
  Date.now = () => now;
}

function StatusForm({ isRunning, isIdle, timeout, startTime }) {
  return (
    <form data-testid="status">
      <input readOnly name="isRunning" type="checkbox" checked={isRunning} />
      <input readOnly name="isIdle" type="checkbox" checked={isIdle} />
      <input readOnly name="timeout" type="number" value={timeout} />
      <input readOnly name="startTime" type="number" value={startTime} />
    </form>
  );
}

function StatusConsumer({}) {
  const state = useIdleMonitor();
  return <StatusForm {...state} />;
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
        <IdleMonitor timeout={1000}>
          <StatusConsumer />
        </IdleMonitor>
      );
      expect(getByTestId('status')).toHaveFormValues({
        isRunning: true,
        isIdle: false,
        timeout: 1000,
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
      act(() => jest.runAllTimers());

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

      longTime();

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
});
