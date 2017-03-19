# react-simple-idle-monitor

> Simple monitor of idle time for React

Changes state to **idle** when a certain `timeout` is reached.  Changes back to **active** when user interaction is detected.
Optionally triggers various possible actions when the idle state changes.

## Features

It can do any or all of the following to indicate changes from active to idle and vice-versa:

* Fire events.
* Dispatch Redux actions.
* Change the `className` of the enclosing wrapper.

## Installation

```
npm install -save react-simple-idle-monitor
```

And then imported as a React Component:

```js
import IdleTimer from 'react-simple-idle-monitor';
```

## Usage

### Class names

Changing the `className` of the enclosing wrapper:

```js
import React from 'react';
import { render } from 'react-dom';
import IdleTimer from 'react-simple-idle-monitor';

render(
  (<IdleTimer
    activeClassName="user-is-working"
    idleClassName="UI-is-idle"
  >
      ..........
  </IdleTimer>),
  document.getElementById('#contents'),
);
```

When it has either or both of the `activeClassName` or `idleClassName` properties set, `IdleTimer` will enclose its children with a `<div>` with its `className` property set to the corresponding value. If none of the properties is set, the children will be rendered without any enclosing `<div>`.  In such a case, it makes little sense for `IdleTimer` to have children, it can be a self-closing tag: `<IdleTimer {...} />`.

### Redux actions

When using Redux via `react-redux`, `IdleTimer` can dispatch various actions to be handled as needed. `IdleMonitor` only needs to have the `reduxActionPrefix` property set and to receive `dispatch` function amongst its properties.  This can easily be done by using `react-redux` `connect` HoC to wrap it:

```js
import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import IdleTimer from 'react-simple-idle-monitor';

const MyIdleMonitor = connect()(IdleTimer);

render(
  (<div className="my-app">
    <MyIdleMonitor
      reduxActionPrefix="IdleMonitor"
    />
    ..........
  </div>),
  document.getElementById('#contents'),
);
```

Using the given prefix, `IdleTimer` will dispatch the following actions:

* *prefix*`_run` when starting or when enabled after being disabled.
* *prefix*`_idle` when the timeout expires.
* *prefix*`_active` when idle and user activity was detected.
* *prefix*`_stop` when the `enabled` property is set to false.

Considering that a Redux store contains state information that might need initialization, the run/stop action types has been provided.
