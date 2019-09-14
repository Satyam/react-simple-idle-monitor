import React from 'react';
import IdleMonitor from '../';

function UsingClassNames(): JSX.Element {
  return (
    <div className="UsingClassNames">
      <IdleMonitor timeout={3000} activeClassName="active" idleClassName="idle">
        <h3>Switching background colors by using classNames</h3>
        <p>
          In 3 seconds it will turn idle the background will switch to gray.
        </p>
        <p>
          Moving your cursor over it or moving the wheel while positioned over
          will switch back
        </p>
        <p>
          Typing any key in this box or even pressing any key (shift, ctrl, alt)
          should also switch &nbsp;
          <input tabIndex={0} />
        </p>
      </IdleMonitor>
    </div>
  );
}

export default UsingClassNames;
