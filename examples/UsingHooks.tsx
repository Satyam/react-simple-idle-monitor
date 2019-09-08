import React from 'react';
import IdleMonitor, { useIdleMonitor } from '../';

const digitsShown = 100000;

function IdleMonitorStatus() {
  const { isIdle, isRunning, timeout, startTime } = useIdleMonitor();

  return (
    <div className="useStatus">
      <span>{isIdle ? 'Idle' : 'Active'}</span>
      <span>{isRunning ? 'Running' : 'Stopped'}</span>
      <span>Timeout: {timeout}</span>
      <span>StartTime: {startTime % digitsShown}</span>
    </div>
  );
}
function IdleMonitorActions() {
  const { activate, run, stop } = useIdleMonitor();

  return (
    <div className="actions">
      <button
        onClick={ev => {
          ev.stopPropagation();
          run();
        }}
      >
        Run (no args)
      </button>
      <button
        onClick={ev => {
          ev.stopPropagation();
          run(10000);
        }}
      >
        Run for 10 secs
      </button>
      <button
        onClick={ev => {
          ev.stopPropagation();
          stop();
        }}
      >
        Stop
      </button>
      <button
        onClick={ev => {
          ev.stopPropagation();
          activate();
        }}
      >
        Activate (no args)
      </button>
      <button
        onClick={ev => {
          ev.stopPropagation();
          activate(false);
        }}
      >
        Activate (false)
      </button>
      <button
        onClick={ev => {
          ev.stopPropagation();
          activate(5000);
        }}
      >
        Activate for 5 secs
      </button>
    </div>
  );
}
function UsingHooks() {
  return (
    <div className="UsingHooks">
      <IdleMonitor timeout={3000}>
        <h3>
          Status and action buttons using <code>useIdleMonitor</code>
        </h3>
        <IdleMonitorStatus />
        <IdleMonitorActions />
        <p>
          Activity in the buttons above is also monitored so if you want to
          start from Idle you might want to leave the cursor rest for a while on
          the button you mean to click.
        </p>
        <p>
          The click itself won't be detected as activity (thanks to{' '}
          <code>ev.stopPropagation()</code>) but moving into the button will.
        </p>
      </IdleMonitor>
    </div>
  );
}

export default UsingHooks;
