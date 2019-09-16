import React from 'react';
import IdleMonitorEvents from 'react-simple-idle-monitor/lib/IdleMonitorEvents.js';

const digitsShown = 100000;

function eventLog(type): (state: { now: number; startTime: number }) => void {
  return (state): void => {
    const entry = {
      type,
      ...state,
    };
    // console.log('event', entry);
    const eventLog = document.getElementById('eventLog');
    if (eventLog) {
      eventLog.innerHTML += `\ntype: ${
        entry.type
      }, startTime: ${entry.startTime % digitsShown}, now: ${entry.now %
        digitsShown}`;
      eventLog.scrollTop = eventLog.scrollHeight;
    }
  };
}

function UsingEvents(): JSX.Element {
  return (
    <div className="UsingEvents">
      <IdleMonitorEvents
        timeout={3000}
        activeClassName="active"
        idleClassName="idle"
        onRun={eventLog('run')}
        onStop={eventLog('stop')}
        onActive={eventLog('active')}
        onIdle={eventLog('idle')}
      >
        <h3>Event calls should be logged below</h3>
        <p>(only the last 5 digits of the timestamps are shown)</p>
        <pre id="eventLog"></pre>
      </IdleMonitorEvents>
    </div>
  );
}
export default UsingEvents;
