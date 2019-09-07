import React, { useEffect, useRef } from 'react';
import IdleMonitor, { useIdleMonitor, IdleMonitorProps } from './';

type FireEventsType = {
  onRun?: ({ startTime, now }: { startTime: number; now: number }) => void;
  onStop?: ({ startTime, now }: { startTime: number; now: number }) => void;
  onIdle?: ({ startTime, now }: { startTime: number; now: number }) => void;
  onActive?: ({
    startTime,
    now,
    preventActive,
  }: {
    startTime: number;
    now: number;
    preventActive: () => void;
  }) => void;
};

function FireEvents({ onRun, onStop, onIdle, onActive }: FireEventsType): null {
  const {
    isRunning,
    isIdle,
    startTime,
    activate,
    remaining,
  } = useIdleMonitor();
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) return;
    const payload = {
      startTime,
      now: Date.now(),
    };
    if (isRunning) {
      if (typeof onRun == 'function') onRun(payload);
    } else {
      if (typeof onStop == 'function') onStop(payload);
    }
  }, [isRunning]);

  function preventActive(): void {
    activate(remaining);
  }

  useEffect(() => {
    if (!isMounted.current) return;
    const payload = {
      startTime,
      now: Date.now(),
    };
    if (isIdle) {
      if (typeof onIdle == 'function') onIdle(payload);
    } else {
      if (typeof onActive == 'function')
        onActive({ ...payload, preventActive });
    }
  }, [isIdle]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  return null;
}

export function IdleMonitorEvents({
  onRun,
  onStop,
  onIdle,
  onActive,
  children,
  ...props
}: IdleMonitorProps & FireEventsType): JSX.Element {
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
