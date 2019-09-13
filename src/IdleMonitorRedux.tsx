import React, { useEffect, useRef } from 'react';
import IdleMonitor, { useIdleMonitor, IdleMonitorProps } from './';

type DispatchActionsType = {
  reduxActionPrefix: string;
  dispatch: (action: object) => void;
};

function DispatchActions({
  reduxActionPrefix,
  dispatch,
}: DispatchActionsType): null {
  const { isRunning, isIdle, startTime } = useIdleMonitor();
  const isMounted = useRef(false);
  const st = useRef(startTime);

  useEffect(() => {
    st.current = startTime;
  }, [startTime]);

  useEffect(() => {
    if (!isMounted.current) return;
    dispatch({
      type: `${reduxActionPrefix}_${isRunning ? 'run' : 'stop'}`,
      startTime: st.current,
      now: Date.now(),
    });
  }, [isRunning, dispatch, reduxActionPrefix]);

  useEffect(() => {
    if (!isMounted.current || !isRunning) return;
    dispatch({
      type: `${reduxActionPrefix}_${isIdle ? 'idle' : 'active'}`,
      startTime: st.current,
      now: Date.now(),
    });
  }, [isIdle, dispatch, reduxActionPrefix]);

  useEffect(() => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
      dispatch({
        type: `${reduxActionPrefix}_stop`,
        startTime: st.current,
        now: Date.now(),
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
