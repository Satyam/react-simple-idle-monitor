import React, { useEffect, useState } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitor from '../src/index';

declare var global; // for the server rendering further down.

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

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeActive(): R;
      toBeIdle(): R;
    }
  }
}
expect.extend({
  toBeActive: received => {
    const pass =
      received.querySelectorAll('div.active').length === 1 &&
      received.querySelectorAll('div.idle').length === 0;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to have the 'active' className`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have the 'active' className`,
        pass: false,
      };
    }
  },
  toBeIdle: received => {
    const pass =
      received.querySelectorAll('div.active').length === 0 &&
      received.querySelectorAll('div.idle').length === 1;
    if (pass) {
      return {
        message: () => `expected ${received} not to have the 'idle' className`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have the 'idle' className`,
        pass: false,
      };
    }
  },
});
describe('IdleMonitor from react-simple-idle-monitor', () => {
  describe('Checking changing active and idle classnames', () => {
    describe('Initial rendering', () => {
      test('with no properties nor children', () => {
        // IdleMonitor should have children, otherwise it is useless.
        // But it doesn't fail if you forget (TypeScript would warn you)
        // @ts-ignore
        const { container } = render(<IdleMonitor />);

        // Just an empty <div>
        expect(container.firstChild).toMatchInlineSnapshot(`<div />`);
      });

      test('with children and no properties', () => {
        const { container } = render(<IdleMonitor>Hello</IdleMonitor>);

        // The child enclosed in a plain <div>
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div>
          Hello
        </div>
      `);
      });

      test('with activeClassName and no children', () => {
        // IdleMonitor should have children, otherwise it is useless.
        // But it doesn't fail if you forget (TypeScript would warn you)
        // @ts-ignore
        const { container } = render(<IdleMonitor activeClassName="active" />);
        expect(container).toBeActive();
        // ... and nothing else.
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        />
      `);
      });

      test('with idleClassName and no children', () => {
        // IdleMonitor should have children, otherwise it is useless.
        // But it doesn't fail if you forget (TypeScript would warn you)
        // @ts-ignore
        const { container } = render(<IdleMonitor idleClassName="idle" />);

        // Just an empty plain <div>
        expect(container.firstChild).toMatchInlineSnapshot(`<div />`);
      });

      test('with children and activeClassName', () => {
        const { container } = render(
          <IdleMonitor activeClassName="active">Hello</IdleMonitor>
        );
        expect(container).toBeActive();
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          Hello
        </div>
      `);
      });

      test('with children and idleClassName', () => {
        const { container } = render(
          <IdleMonitor idleClassName="idle">Hello</IdleMonitor>
        );

        // No classname on the <div> since it should start active
        // and no activeClassName given
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div>
          Hello
        </div>
      `);
      });

      test('start disabled', () => {
        const { container } = render(
          <IdleMonitor
            enabled={false}
            activeClassName="active"
            idleClassName="idle"
          >
            Hello
          </IdleMonitor>
        );

        // If disabled it should start as active.
        expect(container).toBeActive();
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          Hello
        </div>
      `);
      });
    });

    describe('Rendering after timeout', () => {
      test('with no properties nor children', () => {
        // IdleMonitor should have children, otherwise it is useless.
        // But it doesn't fail if you forget (TypeScript would warn you)
        // @ts-ignore
        const { container } = render(<IdleMonitor />);
        act(() => jest.runAllTimers());

        // With no children, nothing much would happen
        expect(container.firstChild).toMatchInlineSnapshot(`<div />`);
      });

      test('with children and no properties', () => {
        const { container } = render(<IdleMonitor>Hello</IdleMonitor>);
        act(() => jest.runAllTimers());

        // Nothing special would happen anyway
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div>
          Hello
        </div>
      `);
      });

      test('with children, activeClassName and idleClassName', () => {
        const { container, getByText } = render(
          <IdleMonitor activeClassName="active" idleClassName="idle">
            Hello
          </IdleMonitor>
        );

        // it always start active, but not much else
        expect(container).toBeActive();
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="active"
        >
          Hello
        </div>
      `);
        act(() => jest.runAllTimers());

        // Then it should switch to idle
        expect(container).toBeIdle();
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="idle"
        >
          Hello
        </div>
      `);
        afterASecond();
        fireEvent.keyDown(getByText('Hello'), { key: 'Enter', code: 13 });
        expect(container).toBeActive();
      });
    });

    test('should restart timers when timeout changed', () => {
      function Wrap1() {
        const [timeout, setTime] = useState(20000);
        useEffect(() => {
          setTimeout(() => {
            setTime(30000);
          }, 10000);
        });
        return (
          <IdleMonitor
            timeout={timeout}
            activeClassName="active"
            idleClassName="idle"
          >
            Hello
          </IdleMonitor>
        );
      }
      const { container } = render(<Wrap1 />);

      expect(container).toBeActive();

      // Enough time to trigger the timer in Wrap, not the idle timer.
      act(() => advanceTimers(15000));

      expect(container).toBeActive();

      // enough extra time to trigger old timeout, but not the new one
      act(() => advanceTimers(10000));

      expect(container).toBeActive();

      act(() => jest.runAllTimers());
      expect(container).toBeIdle();
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
          <IdleMonitor activeClassName="active" idleClassName="idle">
            Hello
          </IdleMonitor>
        )
        // it should render with the active className
      ).toMatchInlineSnapshot(`"<div class=\\"active\\">Hello</div>"`);
    });

    test('Using renderToStaticMarkup with no DOM', () => {
      expect(global.document).toBeUndefined();
      expect(
        renderToStaticMarkup(
          <IdleMonitor activeClassName="active" idleClassName="idle">
            Hello
          </IdleMonitor>
        )
        // it should render with the active className
      ).toMatchInlineSnapshot(`"<div class=\\"active\\">Hello</div>"`);
    });
  });
});
