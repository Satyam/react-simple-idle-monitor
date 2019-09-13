import React, { useEffect, useState } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import IdleMonitor from '../src/index';

/* eslint-disable-next-line no-var */
declare var global; // for the server rendering further down.

import { LONG_TIME, advanceTimers, afterASecond } from './setup';

describe('IdleMonitor from react-simple-idle-monitor', () => {
  describe('Checking changing active and idle classnames', () => {
    describe('Initial rendering', () => {
      test('Only children and no other properties', () => {
        const { container } = render(<IdleMonitor>Hello</IdleMonitor>);

        // The child enclosed in a plain <div>
        expect(container.firstChild).toMatchInlineSnapshot(`
        <div>
          Hello
        </div>
      `);
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
      test('with children and no properties', () => {
        const { container } = render(<IdleMonitor>Hello</IdleMonitor>);
        advanceTimers(LONG_TIME);

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
        advanceTimers(LONG_TIME);

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

      test('check the mousemove listener', () => {
        const { container, getByText } = render(
          <IdleMonitor activeClassName="active" idleClassName="idle">
            Hello
          </IdleMonitor>
        );

        // it always start active, but not much else
        expect(container).toBeActive();
        advanceTimers(LONG_TIME);

        // Then it should switch to idle
        expect(container).toBeIdle();

        afterASecond();
        // On first enter, it should activate
        fireEvent.mouseMove(getByText('Hello'), { clientX: 100, clientY: 100 });
        expect(container).toBeActive();

        advanceTimers(LONG_TIME);

        // Then it should switch to idle
        expect(container).toBeIdle();
        // Moving a little bit should not cause changes
        fireEvent.mouseMove(getByText('Hello'), { clientX: 101, clientY: 101 });
        expect(container).toBeIdle();
        // Moving some more should
        fireEvent.mouseMove(getByText('Hello'), { clientX: 120, clientY: 120 });
        expect(container).toBeActive();
      });
    });

    test('should restart timers when timeout changed', () => {
      function Wrap1(): JSX.Element {
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
      advanceTimers(15000);

      expect(container).toBeActive();

      // enough extra time to trigger old timeout, but not the new one
      advanceTimers(10000);

      expect(container).toBeActive();

      advanceTimers(LONG_TIME);
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
