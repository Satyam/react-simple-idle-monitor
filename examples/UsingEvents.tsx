import React from 'react';
import IdleMonitorEvents from '../lib/IdleMonitorEvents';

const digitsShown = 100000;

function eventLog(type) {
  return state => {
    const entry = {
      type,
      ...state,
    };
    console.log('event', entry);
    const eventLog = document.getElementById('eventLog');
    eventLog.innerHTML += `\ntype: ${entry.type}, startTime: ${entry.startTime %
      digitsShown}, now: ${entry.now % digitsShown}`;
    eventLog.scrollTop = eventLog.scrollHeight;
  };
}

function UsingEvents() {
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
