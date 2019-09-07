import React, { useEffect, useRef } from 'react';
import IdleMonitor, { useIdleMonitor, IdleMonitorProps } from './';

type DispatchEventsType = {
  reduxActionPrefix: string;
  dispatch: (action: object) => void;
};

function DispatchEvents({
  reduxActionPrefix,
  dispatch,
}: DispatchEventsType): null {
  const { isRunning, isIdle, startTime } = useIdleMonitor();
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) return;
    const payload = {
      startTime,
      now: Date.now(),
    };
    dispatch({
      type: `${reduxActionPrefix}_${isRunning ? 'run' : 'stop'}`,
      ...payload,
    });
  }, [isRunning]);

  useEffect(() => {
    if (!isMounted.current) return;
    const payload = {
      startTime,
      now: Date.now(),
    };
    dispatch({
      type: `${reduxActionPrefix}_${isIdle ? 'idle' : 'active'}`,
      ...payload,
    });
  }, [isIdle]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  return null;
}

export function IdleMonitorRedux({
  reduxActionPrefix,
  dispatch,
  children,
  ...props
}: IdleMonitorProps & DispatchEventsType): JSX.Element {
  return (
    <IdleMonitor {...props}>
      <DispatchEvents
        reduxActionPrefix={reduxActionPrefix}
        dispatch={dispatch}
      />
      {children}
    </IdleMonitor>
  );
}

export default IdleMonitorRedux;
