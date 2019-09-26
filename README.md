# react-simple-idle-monitor

> Simple monitor of idle time for React

[![Build Status](https://travis-ci.org/Satyam/react-simple-idle-monitor.svg?branch=v0.4.1)](https://travis-ci.org/Satyam/react-simple-idle-monitor)

Changes state to **idle** when a certain `timeout` is reached. Changes back to **active** when user interaction is detected.
Optionally triggers various possible actions when the idle state changes.

## New release

A new [v1.0.0-next.1](https://www.npmjs.com/package/react-simple-idle-monitor/v/1.0.0-next.1) version is available for download and testing. A [running issue](https://github.com/Satyam/react-simple-idle-monitor/issues/5) has been created on GitHub to receive comments/suggestions.

## Features

It can do any or all of the following to indicate changes from active to idle and vice-versa:

- Fire events.
- Dispatch Redux actions.
- Change the `className` of the enclosing wrapper.

## Installation

```
npm install -save react-simple-idle-monitor
```

And then imported as a React Component:

```js
import IdleMonitor from 'react-simple-idle-monitor';
```

## Usage

### Class names

Changing the `className` of the enclosing wrapper:

```js
import React from 'react';
import { render } from 'react-dom';
import IdleMonitor from 'react-simple-idle-monitor';

render(
  <IdleMonitor activeClassName="user-is-working" idleClassName="UI-is-idle">
    ..........
  </IdleMonitor>,
  document.getElementById('#contents')
);
```

When it has either or both of the `activeClassName` or `idleClassName` properties set, `IdleMonitor` will enclose its children with a `<div>` with its `className` property set to the corresponding value. If none of the properties is set, the children will be rendered without any enclosing `<div>`. In such a case it makes little sense for `IdleMonitor` to have children thus it can be a self-closing tag: `<IdleMonitor {...} />`.

### Redux actions

When using Redux via `react-redux`, `IdleMonitor` can dispatch various actions to be handled as needed. `IdleMonitor` only needs to have the `reduxActionPrefix` property set and to receive the `dispatch` function amongst its properties. This can easily be done by using `react-redux` [`connect`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) HoC to wrap it:

```js
import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import IdleMonitor from 'react-simple-idle-monitor';

const MyIdleMonitor = connect()(IdleMonitor);

render(
  <div className="my-app">
    <MyIdleMonitor reduxActionPrefix="IdleMonitor" />
    ..........
  </div>,
  document.getElementById('#contents')
);
```

Using the given _prefix_, `IdleMonitor` will dispatch the following actions:

- _prefix_`_run` when starting or when enabled after being disabled.
- _prefix_`_idle` when the timeout expires.
- _prefix_`_active` when idle and user activity is detected.
- _prefix_`_stop` when the `enabled` property is set to false or component is unmounted

All actions have properties `startTime` set to the timestamp (i.e.: milliseconds since epoch) when the most recent timeout started counting and `now`, the timestamp when the event was triggered. For the `..._idle` action there should be about `timeout` milliseconds in between the two. For the `..._active` action the `startTime` property would contain the timestamp when the previous timeout started counting. (Admitedly, the information might be of little use.)

### Events

The component has the following properties which can be set to handlers to listen for state changes.

- `onRun`: fired when starting or when enabled after being disabled.
- `onIdle`: when the timeout expires.
- `onActive`: when idle and user activity is detected.
- `onStop`: when the `enabled` property is set to false or component is unmounted.

All events have the same `startTime` and `now` properties as described for the Redux actions.

```js
import React from 'react';
import { render } from 'react-dom';
import { connect } from 'reac-redux';

import IdleTimer from 'react-simple-idle-monitor';

import {
  idleMonitorRunActionCreator,
  idleMonitorIdleActionCreator,
  idleMonitorActiveActionCreator,
  idleMonitorStopActionCreator,
} from '_store/actions';

const mapDispatchToProps = dispatch => ({
  onRun: ev => dispatch(idleMonitorRunActionCreator(ev)),
  onIdle: ev => dispatch(idleMonitorIdleActionCreator(ev)),
  onActive: ev => dispatch(idleMonitorActiveActionCreator(ev)),
  onStop: ev => dispatch(idleMonitorStopActionCreator(ev)),
});

const MyIdleMonitor = connect(
  null,
  mapDispatchToProps
)(IdleTimer);

render(
  <div className="my-app">
    <MyIdleMonitor />
    ..........
  </div>,
  document.getElementById('#contents')
);
```

The code above uses the second argument of [`react-redux` `connect` method](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) to add the `onXxxx` event handler functions to the properties of `IdleMonitor` which will dispatch actions associated to each event. It assumes the corresponding action creators are available to import from elsewhere. This would mostly mimic the effect of using the `reduxActionPrefix` property, however, it would also give a higher degree of control. Obviously, the event handlers can point to any suitable function.

If `mapDispatchToProps` is set as shown above, `connect` will not supply a `dispatch` property when `mapDispatchToProps` is given thus, even if the `reduxActionPrefix` is set, other Redux actions as [shown above](#redux-actions) will not be dispatched because of the lack of a `dispatch` property.

In addition to `startTime` and `now`, the `onActive` event handler will receive two additional properties:

- `event`: the original `event` object that caused `onActive` to be fired, allowing the developer, for example, to prevent further propagation of the event that cause activation or the execution of the default action (if the application starts a screen saver, the developer might want to consume the first interaction, less the triggering event propagates to the underlying propagates).
- `preventActive`: a function that can be called to prevent `IdleMonitor` to go into active state, thus remaining idle. For example, the following code would prevent the left Shift key from taking the application out from its _idle_ state.

```js
import React from 'react';
import { render } from 'react-dom';

import IdleMonitor from 'react-simple-idle-monitor';

const onActive = ev => {
  if (ev.event.type === 'keydown' && ev.event.code === 'ShiftLeft')
    ev.preventActive();
};

render(
  <div className="my-app">
    <IdleMonitor onActive={onActive} />
    ..........
  </div>,
  document.getElementById('#contents')
);
```

### API

The following properties are available. If default values are not mentioned they are `null`:

- `timeout`: (in milliseconds, defaults to 20 minutes), the delay without activity that will make it switch to an idle state and fire/dispatch the corresponding actions. Changing this value after initialization will re-start the timer with the new value.
- `events`: (array of strings, [defaults](https://github.com/Satyam/react-simple-idle-monitor/blob/master/src/index.jsx#L198)): list of DOM events (not React synthetic events) it should listen to in order to detect user activity. If this property is changed over the lifetime of the component, such changes will be ignored.
- `element`: (actual DOM element, defaults to `document`): the DOM element to attach the above event listeners to. In a browser environment, it defaults to `document`. In a server environment (for _universal_ or _isomorphic_ applications), it will be `undefined` which will disable the component, if an `activeClassName` is provided, it will always render as _active_. This property should not be changed over the lifetime of the component.
- `onIdle`, `onActive`, `onRun`, `onStop` (functions): Event handlers, see [above](#events).
- `reduxActionPrefix` (string): the prefix to be used on the action types for all actions dispatched. The suffixes `_run`, `_idle`, `_active` or `_stop` will be appended for each type. The `dispatch` property also has to be set.
- `dispatch` (function): a reference to Redux's store `dispatch` function, usually provided by the `connect` High-order Component from `react-redux`.
- `enabled` (boolean, defaults to `true`): If set to `false` monitoring will be suspended and, if set, the `onStop` event fired and/or the _prefix_`_onStop` action dispatched. When re-enabled, monitoring will resume for whatever time remained when it was disabled and the _run_ event/action fired/dispatched.
- `activeClassName`, `idleClassName` (strings): If either of them is present and `IdleMonitor` has children, a `<div>` with the className corresponding to the active/idle state will enclose those children. An update of the component and its children will be queued with React. If neither className is given, `IdleMonitor` will not create any DOM elements nor will it ever ask React to refresh the screen.
