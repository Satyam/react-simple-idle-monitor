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
  useMemo,
} from 'react';
import PropTypes from 'prop-types';

type IdleMonitorContext = {
  /**
   * true when the timeout expired with no activity from the user
   */
  isIdle: boolean;

  /**
   * false either before mounting or after unmounting,
   * will turn true after first render if the `enabled` property
   * is true.  Will change when `run` or `stop` is called (see below)
   */
  isRunning: boolean;

  /**
   * Shows the timeout in milliseconds of the last activation.
   */
  timeout: number;

  /**
   * The time in milliseconds (from `Date.now()`)
   * when the idle timer was last restarted.
   */
  startTime: number;

  /**
   * If `isIdle==true`, it will switch to not-idle (active).
   * If already active, it will re-start the timeout counter
   * with the given timeout or the default set in the `timeout` property.
   * If called with `false` (i.e. `activate(false)`, not *falsy*),
   * it will turn idle.
   */
  activate: (timeout?: number | false) => void;

  /**
   * It will get the idle monitor running.
   * `isRunning` will be `true`.
   * If it was already running, it will restart the timeout count.
   * If a `timeout` argument is not provided, it will
   * restart with the value given in the `timeout` property.
   */
  run: (timeout?: number) => void;

  /**
   * It will stop the idle monitor.
   * `isRunning` will become `false`
   * If `isIdle` is `true`, it will revert to not-idle.
   */
  stop: () => void;
};

const notReady = (): void => {
  throw new Error('Idle Monitor not active yet');
};
const initialContextValues = {
  isIdle: false,
  isRunning: false,
  timeout: 0,
  startTime: 0,
  activate: notReady,
  run: notReady,
  stop: notReady,
};

enum Action {
  Run = 'Run',
  Stop = 'Stop',
  Idle = 'Idle',
  Active = 'Active',
}

type IdleMonitorActions =
  | {
      type: Action.Run;
    }
  | {
      type: Action.Stop;
    }
  | {
      type: Action.Idle;
    }
  | {
      type: Action.Active;
      timeout: number;
    };

export type IdleMonitorProps = {
  /**
   * Number of milliseconds of inactivity to assume idleness.
   * defaults to 20 minutes
   */
  timeout?: number;

  /**
   * Name of the events to be monitored for UI activity.
   * Defaults usually suffice.
   * If provided, they should listed as  by their React
   * (Synthetic Event)[https://reactjs.org/docs/events.html#reference]  names.
   */
  events?: string[];

  /**
   * As expected.  If not children are provided, the component will have no effect.
   */
  children: React.ReactNode;

  /**
   * It will set the monitor running.
   * Defaults to `true`
   */
  enabled?: boolean;

  /**
   * If a value is set, a `<div>` element will surround the `children`
   * with its `className` property set to the given value when the
   * UI is active (not-idle)
   */
  activeClassName?: string;

  /**
   * If a value is set, a `<div>` element will surround the `children`
   * with its `className` property set to the given value when the
   * UI is idle (not-active)
   */
  idleClassName?: string;
};

export const IdleMonitorContext = createContext<IdleMonitorContext>(
  initialContextValues
);

const IdleMonitor = ({
  timeout = 1000 * 60 * 20,
  events = [
    'onMouseMove',
    'onKeyDown',
    'onWheel',
    'onMouseDown',
    'onTouchMove',
    'onTouchStart',
  ],
  children,
  enabled = true,
  activeClassName,
  idleClassName,
}: IdleMonitorProps): JSX.Element => {
  const currentTimeout = useRef<number>(timeout);

  function reducer(
    state: IdleMonitorContext,
    action: IdleMonitorActions
  ): IdleMonitorContext {
    switch (action.type) {
      case Action.Run:
        return {
          ...state,
          isIdle: false,
          isRunning: true,
          startTime: Date.now(),
          timeout: currentTimeout.current,
        };
      case Action.Stop:
        return {
          ...state,
          isIdle: false,
          isRunning: false,
        };
      case Action.Idle:
        return {
          ...state,
          isIdle: true,
        };
      case Action.Active:
        return {
          ...state,
          isIdle: false,
          startTime: Date.now(),
          timeout: action.timeout,
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, {
    ...initialContextValues,
    run,
    stop,
    activate,
  });

  const [className, setClassName] = useState(activeClassName);

  const timerId = useRef<number>();
  const pageXY = useRef<[number, number]>([0, 0]);
  const isMounted = useRef<boolean>(false);

  const hasClassName = !!(activeClassName || idleClassName);

  function run(newTimeout?: number): void {
    // console.log('**run**', { newTimeout });
    currentTimeout.current = newTimeout || timeout;
    dispatch({ type: Action.Run });
    startTimeout();
  }

  function stop(): void {
    // console.log('**stop**', { timerId: timerId.current });
    clearTimeout(timerId.current);
    dispatch({
      type: Action.Stop,
    });
  }

  function setIdle(): void {
    // console.log('**Idle**', { hasClassName, idleClassName });
    dispatch({ type: Action.Idle });
    if (hasClassName) setClassName(idleClassName);
  }

  function setActive(newTimeout?: number): void {
    // console.log('**setActive**', { newTimeout, hasClassName });
    dispatch({
      type: Action.Active,
      timeout: newTimeout || currentTimeout.current,
    });
    if (hasClassName) setClassName(activeClassName);
    startTimeout(newTimeout);
  }

  function activate(newTimeout?: number | false): void {
    // console.log('**activate**', { newTimeout });
    if (newTimeout === false) {
      setIdle();
    } else {
      setActive(newTimeout);
    }
  }

  function onEventHandler(ev): void {
    const [pageX, pageY] = pageXY.current;

    // If not enabled, ignore events
    if (!state.isRunning || !state.isIdle) return;
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
      if (Date.now() - state.startTime < 200) return;
    }
    setActive();
    pageXY.current = [ev.pageX, ev.pageY]; // update mouse coord
  }

  useEffect(() => {
    if (!isMounted.current) return;
    // console.log('useEffect enabled', {
    //   enabled,
    //   state,
    // });
    if (enabled) {
      if (!state.isRunning) run();
    } else if (state.isRunning) stop();
  }, [enabled]);

  useEffect(() => {
    if (!isMounted.current) return;
    // console.log('useEffect timeout', {
    //   timeout,
    // });
    currentTimeout.current = timeout;
    startTimeout();
  }, [timeout]);

  useEffect(() => {
    // console.log('useEffect init', { enabled, timeout, state });
    if (enabled) {
      run();
    } else {
      stop();
    }
    isMounted.current = true;
    return (): void => {
      // console.log('useEffect unmount', state);
      if (state.isRunning) stop();
    };
  }, []);

  function startTimeout(newTimeout?: number): void {
    // console.log('**startTimeout**', {
    //   newTimeout,
    //   timerId: timerId.current,
    //   timeout,
    //   currentTimeout: currentTimeout.current,
    // });
    clearTimeout(timerId.current);
    timerId.current = setTimeout(setIdle, newTimeout || currentTimeout.current);
  }

  const listenTo = useMemo(
    () =>
      events.reduce(
        (list, eventName) => ({
          ...list,
          [eventName]: onEventHandler,
        }),
        {}
      ),
    [events]
  );

  return (
    <IdleMonitorContext.Provider value={state}>
      <div className={className} {...listenTo}>
        {children}
      </div>
    </IdleMonitorContext.Provider>
  );
};

export default IdleMonitor;

export function useIdleMonitor(): IdleMonitorContext {
  return useContext(IdleMonitorContext);
}

IdleMonitor.propTypes = {
  timeout: PropTypes.number,
  events: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool,
  activeClassName: PropTypes.string,
  idleClassName: PropTypes.string,
};
