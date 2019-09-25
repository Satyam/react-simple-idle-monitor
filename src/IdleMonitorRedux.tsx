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
  const st = useRef(startTime);
  const t = useRef(timeout);

  useEffect(() => {
    st.current = startTime;
  }, [startTime]);

  useEffect(() => {
    t.current = timeout;
  }, [timeout]);

  useEffect(() => {
    if (!isMounted.current) return;
    dispatch({
      type: `${reduxActionPrefix}_${isRunning ? 'run' : 'stop'}`,
      startTime: st.current,
      now: Date.now(),
      timeout: t.current,
    });
  }, [isRunning, dispatch, reduxActionPrefix]);

  useEffect(() => {
    if (!isMounted.current || !isRunning) return;
    dispatch({
      type: `${reduxActionPrefix}_${isIdle ? 'idle' : 'active'}`,
      startTime: st.current,
      now: Date.now(),
      timeout: t.current,
    });
  }, [isIdle, dispatch, reduxActionPrefix, isRunning]);

  useEffect(() => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
      dispatch({
        type: `${reduxActionPrefix}_stop`,
        startTime: st.current,
        now: Date.now(),
        timeout: t.current,
      });
    };
  }, [dispatch, reduxActionPrefix]);

  return null;
}

export function IdleMonitorRedux({
  reduxActionPrefix,
  dispatch,
  children,
  ...props
}: IdleMonitorProps & DispatchActionsType): JSX.Element {
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
