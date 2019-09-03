/**
 * React Simple Idle Monitor
 *
 * @author Daniel Barreiro
 *
 * Portions taken from:
 * https://github.com/SupremeTechnopriest/react-idle-timer/blob/master/src/index.js
 * By  Randy Lebeau
 *
 *
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
} from 'react';
import PropTypes from 'prop-types';

type IdleMonitorContext = {
  idle: boolean;
  enabled: boolean;
  timeout: number;
  startTime: number;
  now: number;
  remaining: number;
};

const initialContextValues = {
  idle: false,
  enabled: true,
  timeout: 0,
  startTime: 0,
  now: 0,
  remaining: 0,
};

enum Action {
  Run = 'Run',
  Stop = 'Stop',
  Idle = 'Idle',
  Active = 'Active',
  // StartTimeout = 'StartTimeout'
}

type IdleMonitorActions =
  | {
      type: Action.Run;
      timeout?: number;
    }
  | {
      type: Action.Stop;
    }
  | {
      type: Action.Idle;
    }
  | {
      type: Action.Active;
    };

type IdleMonitorProps = {
  timeout?: number;
  events?: string[];
  onIdle?: (context: IdleMonitorContext) => void;
  onActive?: (
    context: IdleMonitorContext & { preventActive: () => void; event: UIEvent }
  ) => void;
  onRun?: (context: IdleMonitorContext) => void;
  onStop?: (context: IdleMonitorContext) => void;
  element?: Node;
  children?: React.ReactNode;
  reduxActionPrefix?: string;
  dispatch?: (context: IdleMonitorContext & { type: string }) => void;
  enabled?: boolean;
  activeClassName?: string;
  idleClassName?: string;
};

export const IdleMonitorContext = createContext<IdleMonitorContext>(
  initialContextValues
);

const IdleMonitor = ({
  timeout = 1000 * 60 * 20,
  events = [
    'mousemove',
    'keydown',
    'wheel',
    'DOMMouseScroll',
    'mouseWheel',
    'mousedown',
    'touchstart',
    'touchmove',
    'MSPointerDown',
    'MSPointerMove',
  ],
  element = document,
  children,
  onIdle,
  onActive,
  onRun,
  onStop,
  reduxActionPrefix,
  dispatch: externalDispatch,
  enabled = true,
  activeClassName = '',
  idleClassName = '',
}: IdleMonitorProps) => {
  function reducer(
    state: IdleMonitorContext,
    action: IdleMonitorActions
  ): IdleMonitorContext {
    switch (action.type) {
      case Action.Run:
        return {
          ...state,
          idle: false,
          enabled: true,
          startTime: Date.now(),
          remaining: action.timeout || state.remaining,
          now: Date.now(),
          timeout: action.timeout || state.timeout,
        };
      case Action.Stop:
        return {
          ...state,
          idle: false,
          enabled: false,
          remaining: timeout - (Date.now() - state.startTime),
          now: Date.now(),
        };
      case Action.Idle:
        return {
          ...state,
          idle: true,
          remaining: 0,
          now: Date.now(),
        };
      case Action.Active:
        return {
          ...state,
          idle: false,
          now: Date.now(),
          startTime: Date.now(),
          remaining: timeout,
          timeout,
        };
      default:
        return state;
    }
  }

  const [ctx, dispatch] = useReducer(reducer, {
    ...initialContextValues,
    startTime: Date.now(),
    remaining: timeout,
    now: Date.now(),
    timeout,
  });

  const [className, setClassName] = useState(activeClassName);

  const timerId = useRef<number>();
  const pageXY = useRef<[number, number]>([0, 0]);
  const isInitializing = useRef<boolean>(true);

  const hasClassName = !!(activeClassName || idleClassName);

  function run(newTimeout?: number): void {
    // console.log('**run**', { newTimeout });
    dispatch({ type: Action.Run, timeout: newTimeout });
    startTimeout(newTimeout);
    notify('run', onRun);
  }

  function stop(): void {
    // console.log('**stop**', { timerId: timerId.current });
    clearTimeout(timerId.current);
    dispatch({
      type: Action.Stop,
    });
    notify('stop', onStop);
  }

  function idle(): void {
    // console.log('**Idle**', { hasClassName, idleClassName });
    dispatch({ type: Action.Idle });
    notify('idle', onIdle);
    if (hasClassName) setClassName(idleClassName);
  }

  function active(event: UIEvent): void {
    // console.log('**active**');
    let prevented = false;
    if (ctx.idle) {
      if (onActive) {
        onActive({
          ...ctx,
          idle: false,
          now: Date.now(),
          startTime: ctx.startTime,
          remaining: timeout - (Date.now() - ctx.startTime),
          preventActive: () => {
            prevented = true;
          },
          event,
        });
      }
      if (!prevented) {
        notify('active');
        if (hasClassName) setClassName(activeClassName);
      }
    }
  }

  function onEventHandler(ev): void {
    const [pageX, pageY] = pageXY.current;

    // If not enabled, ignore events
    if (!enabled) return;
    /*
          The following is taken verbatim from
          https://github.com/SupremeTechnopriest/react-idle-timer/blob/master/src/index.js
          It seems to make sense, but I was unable to figure out a unit test for it
        */
    // Mousemove event
    /* istanbul ignore if */
    if (ev.type === 'mousemove') {
      // if coord are same, it didn't move
      if (ev.pageX === pageX && ev.pageY === pageY) return;
      // if coord don't exist how could it move
      if (typeof ev.pageX === 'undefined' && typeof ev.pageY === 'undefined') {
        return;
      }
      // under 200 ms is hard to do, and you would have to stop,
      // as continuous activity will bypass this
      if (Date.now() - ctx.startTime < 200) return;
    }
    active(ev);
    pageXY.current = [ev.pageX, ev.pageY]; // update mouse coord
    startTimeout();
  }

  useEffect(() => {
    if (isInitializing.current) return;
    // console.log('useEffect set events', {
    //   enabled,
    //   element: element && element.nodeName,
    // });
    if (element && enabled) {
      events.forEach(ev => element.addEventListener(ev, onEventHandler));
    }
    return (): void => {
      // console.log('useEffect clear events');
      if (element) {
        events.forEach(ev => element.removeEventListener(ev, onEventHandler));
      }
    };
  }, [element, events, enabled]);

  useEffect(() => {
    if (isInitializing.current) return;
    // console.log('useEffect enabled', {
    //   enabled,
    //   timeout,
    //   ctx,
    // });
    if (enabled) {
      if (!ctx.enabled) run(timeout !== ctx.timeout ? timeout : 0);
    } else if (ctx.enabled) stop();
  }, [enabled]);

  useEffect(() => {
    if (isInitializing.current) return;
    // console.log('useEffect timeout', {
    //   timeout,
    // });
    startTimeout(timeout);
  }, [timeout]);

  useEffect(() => {
    // console.log('useEffect init', { enabled, timeout, ctx });
    if (enabled) {
      run();
    } else {
      stop();
    }
    isInitializing.current = false;
    return (): void => {
      if (ctx.enabled) stop();
    };
  }, []);

  function startTimeout(newTimeout?: number): void {
    // console.log('**startTimeout**', {
    //   newTimeout,
    //   timerId: timerId.current,
    //   remaining: ctx.remaining,
    //   timeout,
    //   total: newTimeout || ctx.remaining || timeout,
    // });
    clearTimeout(timerId.current);
    timerId.current = setTimeout(idle, newTimeout || ctx.remaining || timeout);
  }

  function notify(
    reduxSuffix?: string,
    event?: (IdleMonitorContext) => void
  ): void {
    if (typeof event === 'function') {
      event(ctx);
    }
    if (externalDispatch && reduxActionPrefix) {
      externalDispatch({
        ...ctx,
        type: `${reduxActionPrefix}_${reduxSuffix}`,
      });
    }
  }

  return children ? (
    <IdleMonitorContext.Provider value={ctx}>
      {hasClassName ? <div className={className}>{children}</div> : children}
    </IdleMonitorContext.Provider>
  ) : null;
};

export default IdleMonitor;

export function useIdleMonitor(): IdleMonitorContext {
  return useContext(IdleMonitorContext);
}

IdleMonitor.propTypes = {
  timeout: PropTypes.number,
  events: PropTypes.arrayOf(PropTypes.string),
  onIdle: PropTypes.func,
  onActive: PropTypes.func,
  onRun: PropTypes.func,
  onStop: PropTypes.func,
  element: PropTypes.element,
  children: PropTypes.element,
  reduxActionPrefix: PropTypes.string,
  dispatch: PropTypes.func,
  enabled: PropTypes.bool,
  activeClassName: PropTypes.string,
  idleClassName: PropTypes.string,
};
