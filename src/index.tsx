/**
 * React Simple Idle Monitor
 *
 * @author Daniel Barreiro
 *
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  AllHTMLAttributes,
} from 'react';
import PropTypes from 'prop-types';

declare let process: {
  env: {
    NODE_ENV: string;
  };
};

type IdleMonitorContext = {
  /**
   * true when the timeout expired with no activity from the user
   */
  isIdle: boolean;

  /**
   * false either before mounting or after un-mounting,
   * will turn true after first render if not `disabled`.
   * Will change when `run` or `stop` is called (see below)
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
   * The current className set from either `activeClassName` or
   * `idleClassName` depending on the state
   */
  className: string;

  /**
   * If `isIdle==true`, it will switch to not-idle (active).
   * If already active, it will re-start the timeout counter
   * with the given timeout or the default set in the `timeout` property.
   */
  activate: (timeout?: number) => void;

  /**
   * It will switch to an idling state (`isIdle=== true`),
   * just as if the timeout had passed.
   */
  idle: () => void;

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

type InternalState = {
  _clientX: number;
  _clientY: number;
  _setTimer: number;
  _defaultTimeout: number;
  _currentTimeout: number;
  _activeClassName: string;
  _idleClassName: string;
};

// The following is a placeholder to keep TypeScript happy
// while the context is still to be created
/* istanbul ignore next */
const notReady = (): void => {
  throw new Error('Idle Monitor not active yet');
};

const initialContextValues = {
  isIdle: false,
  isRunning: false,
  timeout: 0,
  startTime: 0,
  className: '',
  activate: notReady,
  idle: notReady,
  run: notReady,
  stop: notReady,
  _clientX: 0,
  _clientY: 0,
  _setTimer: 0,
  _defaultTimeout: 0,
  _currentTimeout: 0,
  _activeClassName: '',
  _idleClassName: '',
};

enum Action {
  Init = 'Init',
  Run = 'Run',
  Stop = 'Stop',
  Idle = 'Idle',
  Active = 'Active',
  Event = 'Event',
  SetTimeout = 'SetTimeout',
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
      timeout?: number;
    }
  | {
      type: Action.Event;
      ev: UIEvent;
    }
  | { type: Action.SetTimeout; timeout: number };

export type IdleMonitorProps = AllHTMLAttributes<Element> & {
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
   * If a value is set, the `<div>` element that surrounds the `children`
   * will have its `className` property set to the given value when the
   * UI is active (not-idle)
   */
  activeClassName?: string;

  /**
   * If a value is set, the `<div>` element surrounding the `children`
   * will have its `className` property set to the given value when the
   * UI is idle (not-active)
   */
  idleClassName?: string;
};

export const IdleMonitorContext = createContext<IdleMonitorContext>(
  initialContextValues
);

function reducer(
  state: Readonly<IdleMonitorContext & InternalState>,
  action: Readonly<IdleMonitorActions>
): Readonly<IdleMonitorContext & InternalState> {
  switch (action.type) {
    case Action.Run: {
      const t = action.timeout || state._defaultTimeout;
      return {
        ...state,
        isIdle: false,
        isRunning: true,
        startTime: Date.now(),
        timeout: t,
        className: state._activeClassName,
        _setTimer: t,
        _currentTimeout: t,
      };
    }
    case Action.Stop:
      return {
        ...state,
        isIdle: false,
        isRunning: false,
        className: state._activeClassName,
        _setTimer: 0,
      };
    case Action.Idle:
      return {
        ...state,
        isIdle: true,
        className: state._idleClassName,
        _setTimer: 0,
      };
    case Action.Active:
      return {
        ...state,
        isIdle: false,
        startTime: Date.now(),
        timeout: action.timeout || state._currentTimeout,
        className: state._activeClassName,
        _setTimer: state._currentTimeout,
      };
    case Action.Event: {
      if (!state.isRunning || !state.isIdle) return state;
      let clientX = state._clientX;
      let clientY = state._clientY;
      if (action.ev.type === 'mousemove' || action.ev.type === 'touchmove') {
        const ev = action.ev as MouseEvent;
        clientX = ev.clientX;
        clientY = ev.clientY;
        // Ignore small mouse movements possibly due to some odd vibration or shaking
        if (
          Math.abs(state._clientX - clientX) +
            Math.abs(state._clientY - clientY) <
          20
        )
          return state;
      }
      return {
        ...state,
        _clientX: clientX,
        _clientY: clientY,
        isIdle: false,
        startTime: Date.now(),
        timeout: state._currentTimeout,
        className: state._activeClassName,
        _setTimer: state._currentTimeout,
      };
    }
    case Action.SetTimeout: {
      const t = action.timeout;
      return {
        ...state,
        _currentTimeout: t,
        _defaultTimeout: t,
        _setTimer: t,
      };
    }
    // Should never be called, but Typescript expects a return so ...
    /* istanbul ignore next */
    default:
      return state;
  }
}

// const logReducer = (
//   state: Readonly<IdleMonitorContext & InternalState>,
//   action: Readonly<IdleMonitorActions>
// ): Readonly<IdleMonitorContext & InternalState> => {
//   console.log('----- before', state, action);
//   const newState = reducer(state, action);
//   console.log('----- after', newState);
//   return newState;
// };

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
  disabled = false,
  activeClassName = '',
  idleClassName = '',
  className = '',
  ...props
}: IdleMonitorProps): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialContextValues,
    _activeClassName: activeClassName,
    className: activeClassName,
    _idleClassName: idleClassName,
    _defaultTimeout: timeout,
  });

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    const invalidProps = Object.keys(props).filter(
      name => events.indexOf(name) !== -1
    );
    if (invalidProps.length) {
      throw new Error(
        `Cannot attach event handlers to [${invalidProps.join(
          ', '
        )}] because they are already monitored by IdleMonitor`
      );
    }
    if (React.Children.count(children) === 0) {
      throw new Error('IdleMonitor must enclose children');
    }
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error(
        'A list of UI events to be monitored for activity must be supplied'
      );
    }
    if (events.some(name => !/^on[A-Z]\w+/.test(name))) {
      throw new Error('Events names must be in React Synthetic events format');
    }
  }

  const isMounted = useRef<boolean>(false);

  const run = useCallback(
    (timeout?: number): void => {
      dispatch({ type: Action.Run, timeout });
    },
    [dispatch]
  );

  const stop = useCallback((): void => {
    dispatch({
      type: Action.Stop,
    });
  }, [dispatch]);

  const idle = useCallback((): void => {
    dispatch({ type: Action.Idle });
  }, [dispatch]);

  const activate = useCallback(
    (timeout?: number): void => {
      dispatch({
        type: Action.Active,
        timeout,
      });
    },
    [dispatch]
  );

  const onEventHandler = useCallback(
    (ev): void => {
      ev.persist();
      dispatch({ type: Action.Event, ev });
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isMounted.current) return;
    if (disabled) {
      stop();
    } else run();
  }, [disabled, run, stop]);

  useEffect(() => {
    if (!isMounted.current) return;
    dispatch({
      type: Action.SetTimeout,
      timeout,
    });
  }, [timeout]);

  const timerId = useRef(0);
  useEffect(() => {
    if (!isMounted.current) return;
    if (state._setTimer) {
      timerId.current = setTimeout(idle, state._setTimer);
      return (): void => {
        clearTimeout(timerId.current);
      };
    }
  }, [state._setTimer, idle]);

  useEffect(() => {
    if (disabled) {
      stop();
    } else {
      run();
    }
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
      stop();
    };
    // This one is for initialization and teardown only
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const listenTo = useMemo(
    () =>
      events.reduce(
        (list, eventName) => ({
          ...list,
          [eventName]: onEventHandler,
        }),
        {}
      ),
    [events, onEventHandler]
  );

  const context: IdleMonitorContext = useMemo(() => {
    const { isIdle, isRunning, timeout, startTime, className } = state;
    return {
      isIdle,
      isRunning,
      timeout,
      startTime,
      className,
      run,
      stop,
      activate,
      idle,
    };
    // I only want to depend on a few properties of state,
    // not on the whole of it
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    state.isIdle,
    state.isRunning,
    state.timeout,
    state.startTime,
    run,
    stop,
    activate,
    idle,
  ]);

  return (
    <IdleMonitorContext.Provider value={context}>
      <div
        className={`${state.className} ${className}`.trim() || undefined}
        {...props}
        {...listenTo}
      >
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
  disabled: PropTypes.bool,
  activeClassName: PropTypes.string,
  idleClassName: PropTypes.string,
  className: PropTypes.string,
};
