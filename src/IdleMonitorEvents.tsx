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
    if (isRunning) {
      /* istanbul ignore else */
      if (typeof onRun === 'function')
        onRun({
          startTime: st.current,
          now: Date.now(),
          timeout: t.current,
        });
    } else {
      /* istanbul ignore else */
      if (typeof onStop === 'function')
        onStop({
          startTime: st.current,
          now: Date.now(),
          timeout: t.current,
        });
    }
  }, [isRunning, onRun, onStop]);

  useEffect(() => {
    if (!isMounted.current || !isRunning) return;
    if (isIdle) {
      /* istanbul ignore else */
      if (typeof onIdle === 'function')
        onIdle({
          startTime: st.current,
          now: Date.now(),
          timeout: t.current,
        });
    } else {
      /* istanbul ignore else */
      if (typeof onActive === 'function')
        onActive({
          startTime: st.current,
          now: Date.now(),
          timeout: t.current,
        });
    }
    // isRunning is missing because I don't want this to be triggered
    // when it changed, though I do want to check it when others change
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [isIdle, onIdle, onActive]);

  useEffect(() => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
      /* istanbul ignore else */
      if (typeof onStop === 'function') {
        onStop({
          startTime: st.current,
          now: Date.now(),
          timeout: t.current,
        });
      }
    };
  }, [onStop]);

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

IdleMonitorEvents.propTypes = {
  ...IdleMonitor.propTypes,
  onRun: PropTypes.func,
  onStop: PropTypes.func,
  onIdle: PropTypes.func,
  onActive: PropTypes.func,
};
