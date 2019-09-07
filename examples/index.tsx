import React from 'react';
import ReactDOM from 'react-dom';
import IdleMonitor from '../';
import IdleMonitorRedux from '../lib/IdleMonitorRedux';

import IdleMonitorEvents from '../lib/IdleMonitorEvents';

const digitsShown = 100000;
function dispatch(action) {
  console.log('action', action);
  const reduxLog = document.getElementById('reduxLog');
  reduxLog.innerHTML += `\ntype: ${action.type}, startTime: ${action.startTime %
    digitsShown}, now: ${action.now % digitsShown}`;
  reduxLog.scrollTop = reduxLog.scrollHeight;
}
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
function App() {
  return (
    <>
      <div className="idleMonitorArea">
        <IdleMonitor
          timeout={3000}
          activeClassName="active"
          idleClassName="idle"
        >
          <p>
            In 3 seconds it will turn idle the background will switch to gray.
          </p>
          <p>
            Moving your cursor over it or moving the wheel while positioned over
            will switch back
          </p>
          <p>
            Typing any key in this box or even pressing any key (shift, ctrl,
            alt) should also switch &nbsp;
            <input tabIndex={0} />
          </p>
        </IdleMonitor>
      </div>
      <div className="inactive-area">
        <p>Nothing should happen if you move within this area</p>
      </div>
      <div className="idleMonitorReduxArea">
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
      <div className="IdleMonitorEventsArea">
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
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
