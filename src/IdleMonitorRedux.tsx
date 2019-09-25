import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import IdleMonitor, { useIdleMonitor, IdleMonitorProps } from './';

export type IdleMonitorActionType = {
  type: string;
  startTime: number;
  now: number;
  timeout: number;
};
type DispatchActionsType = {
  reduxActionPrefix: string;
  dispatch: (action: IdleMonitorActionType) => void;
};

function DispatchActions({
  reduxActionPrefix,
  dispatch,
}: DispatchActionsType): null {
  const { isRunning, isIdle, startTime, timeout } = useIdleMonitor();
  const isMounted = useRef(false);

  const previous = useRef<{
    isRunning: boolean;
    isIdle: boolean;
    startTime: number;
    timeout: number;
  }>({ isRunning: false, isIdle: false, startTime: 0, timeout: 0 });

  useEffect(() => {
    if (!isMounted.current) return;
    const p = previous.current;

    const d = (type: string): void =>
      dispatch({
        type: `${reduxActionPrefix}_${type}`,
        startTime,
        now: Date.now(),
        timeout,
      });
    if (p.isRunning !== isRunning) {
      d(isRunning ? 'run' : 'stop');
    } else if (p.isIdle !== isIdle) {
      d(isIdle ? 'idle' : 'active');
    } else {
      d('active');
    }
    previous.current = { isRunning, isIdle, startTime, timeout };
  }, [isRunning, isIdle, startTime, timeout, dispatch, reduxActionPrefix]);

  useEffect(() => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
      const { startTime, timeout } = previous.current;
      dispatch({
        type: `${reduxActionPrefix}_stop`,
        startTime,
        now: Date.now(),
        timeout,
      });
    };
  }, [dispatch, reduxActionPrefix]);

  return null;
}

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export function IdleMonitorRedux({
  reduxActionPrefix,
  dispatch,
  children,
  ...props
}: IdleMonitorProps & DispatchActionsType): JSX.Element {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    /* istanbul ignore else */
    if (typeof dispatch !== 'function') {
      throw new Error('dispatch attribute must be assigned a function');
    }
    /* istanbul ignore else */
    if (typeof reduxActionPrefix !== 'string') {
      throw new Error('reduxActionPrefix attribute must be assigned a string');
    }
  }
  return (
    <IdleMonitor {...props}>
      <DispatchActions
        reduxActionPrefix={reduxActionPrefix}
        dispatch={dispatch}
      />
      {children}
    </IdleMonitor>
  );
}

export default IdleMonitorRedux;

IdleMonitorRedux.propTypes = {
  ...IdleMonitor.propTypes,
  dispatch: PropTypes.func.isRequired,
  reduxActionPrefix: PropTypes.string.isRequired,
};
