import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import IdleMonitor, { useIdleMonitor, IdleMonitorProps } from './';

export type IdleMonitorEventProps = {
  startTime: number;
  now: number;
  timeout: number;
};

type FireEventsType = {
  onRun?: ({ startTime, now, timeout }: IdleMonitorEventProps) => void;
  onStop?: ({ startTime, now, timeout }: IdleMonitorEventProps) => void;
  onIdle?: ({ startTime, now, timeout }: IdleMonitorEventProps) => void;
  onActive?: ({ startTime, now, timeout }: IdleMonitorEventProps) => void;
};

function FireEvents({ onRun, onStop, onIdle, onActive }: FireEventsType): null {
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
    const payload = {
      startTime,
      now: Date.now(),
      timeout,
    };
    if (p.isRunning !== isRunning) {
      if (isRunning) {
        /* istanbul ignore else */
        if (typeof onRun === 'function') onRun(payload);
      } else {
        /* istanbul ignore else */
        if (typeof onStop === 'function') onStop(payload);
      }
    } else if (p.isIdle !== isIdle) {
      if (isIdle) {
        /* istanbul ignore else */
        if (typeof onIdle === 'function') onIdle(payload);
      } else {
        /* istanbul ignore else */
        if (typeof onActive === 'function') onActive(payload);
      }
    } else {
      /* istanbul ignore else */
      if (typeof onActive === 'function') onActive(payload);
    }
    previous.current = { isRunning, isIdle, startTime, timeout };
  }, [isRunning, isIdle, startTime, timeout, onRun, onStop, onIdle, onActive]);

  useEffect(() => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
      /* istanbul ignore else */
      if (typeof onStop === 'function') {
        const { startTime, timeout } = previous.current;
        onStop({
          startTime,
          now: Date.now(),
          timeout,
        });
      }
    };
  }, [onStop]);

  return null;
}

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export function IdleMonitorEvents({
  onRun,
  onStop,
  onIdle,
  onActive,
  children,
  ...props
}: IdleMonitorProps & FireEventsType): JSX.Element {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    /* istanbul ignore else */
    if (onRun && typeof onRun !== 'function') {
      throw new Error('onRun attribute must be assigned a function');
    }
    /* istanbul ignore else */
    if (onStop && typeof onStop !== 'function') {
      throw new Error('onStop attribute must be assigned a function');
    }
    /* istanbul ignore else */
    if (onIdle && typeof onIdle !== 'function') {
      throw new Error('onIdle attribute must be assigned a function');
    }
    /* istanbul ignore else */
    if (onActive && typeof onActive !== 'function') {
      throw new Error('onActive attribute must be assigned a function');
    }
    /* istanbul ignore else */
    if (!onRun && !onStop && !onIdle && !onActive) {
      throw new Error(
        'At least one of the onXxxx attributes must be set, otherwise simply use IdleMonitor'
      );
    }
  }
  return (
    <IdleMonitor {...props}>
      <FireEvents
        onRun={onRun}
        onStop={onStop}
        onIdle={onIdle}
        onActive={onActive}
      />
      {children}
    </IdleMonitor>
  );
}

export default IdleMonitorEvents;

IdleMonitorEvents.propTypes = {
  ...IdleMonitor.propTypes,
  onRun: PropTypes.func,
  onStop: PropTypes.func,
  onIdle: PropTypes.func,
  onActive: PropTypes.func,
};
