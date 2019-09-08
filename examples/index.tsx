import React from 'react';
import ReactDOM from 'react-dom';

import UsingClassNames from './UsingClassNames';
import UsingRedux from './UsingRedux';
import UsingEvents from './UsingEvents';
import UsingHooks from './UsingHooks';

function App() {
  return (
    <>
      <UsingClassNames />
      <div className="inactive-area">
        <p>Nothing should happen if you move within this area</p>
      </div>
      <UsingRedux />
      <UsingEvents />
      <UsingHooks />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
