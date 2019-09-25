import React from 'react';
import IdleMonitorRedux from 'react-simple-idle-monitor/lib/IdleMonitorRedux.js';

const digitsShown = 100000;

function dispatch(action): void {
  // console.log('action', action);
  const reduxLog = document.getElementById('reduxLog');
  if (reduxLog) {
    reduxLog.innerHTML += `\ntype: ${
      action.type
    }, startTime: ${action.startTime % digitsShown}, timeout: ${action.timeout %
      digitsShown}, now: ${action.now % digitsShown}`;
    reduxLog.scrollTop = reduxLog.scrollHeight;
  }
}

function UsingRedux(): JSX.Element {
  return (
    <div className="UsingRedux">
      <IdleMonitorRedux
        dispatch={dispatch}
        reduxActionPrefix="idle_monitor"
        timeout={3000}
        activeClassName="active"
        idleClassName="idle"
      >
        <h3>Redux Actions should be logged below</h3>
        <p>(only the last 5 digits of the timestamps are shown)</p>
        <pre id="reduxLog"></pre>
      </IdleMonitorRedux>
    </div>
  );
}
export default UsingRedux;
