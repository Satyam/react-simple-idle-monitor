import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import IdleMonitor, { useIdleMonitor, IdleMonitorProps } from './';

type FireEventsType = {
  onRun?: ({ startTime, now }: { startTime: number; now: number }) => void;
  onStop?: ({ startTime, now }: { startTime: number; now: number }) => void;
  onIdle?: ({ startTime, now }: { startTime: number; now: number }) => void;
  onActive?: ({ startTime, now }: { startTime: number; now: number }) => void;
};

function FireEvents({ onRun, onStop, onIdle, onActive }: FireEventsType): null {
  const { isRunning, isIdle, startTime } = useIdleMonitor();
  const isMounted = useRef(false);
  const st = useRef(startTime);

  useEffect(() => {
    st.current = startTime;
  }, [startTime]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (isRunning) {
      /* istanbul ignore else */
      if (typeof onRun === 'function')
        onRun({
          startTime: st.current,
          now: Date.now(),
        });
    } else {
      /* istanbul ignore else */
      if (typeof onStop === 'function')
        onStop({
          startTime: st.current,
          now: Date.now(),
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
        });
    } else {
      /* istanbul ignore else */
      if (typeof onActive === 'function')
        onActive({
          startTime: st.current,
          now: Date.now(),
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
  timeout: PropTypes.number,
  events: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool,
  activeClassName: PropTypes.string,
  idleClassName: PropTypes.string,
  onRun: PropTypes.func,
  onStop: PropTypes.func,
  onIdle: PropTypes.func,
  onActive: PropTypes.func,
};
