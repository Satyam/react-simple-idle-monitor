<!-- prettier-ignore -->
# react-simple-idle-monitor

> Simple monitor of idle time for React

[![Build Status](https://travis-ci.org/Satyam/react-simple-idle-monitor.svg?branch=v1.0.0)](https://travis-ci.org/Satyam/react-simple-idle-monitor)

Changes state to **idle** when a certain `timeout` is reached. Changes back to **active** when user interaction is detected.

Optionally triggers various possible actions when the idle state changes.

## Releases

The current v1.0.0 is only partly compatible with the previous [v.0.4.1](https://github.com/Satyam/react-simple-idle-monitor/tree/v0.4.1) which has maintained compatibility since first published.

Please check the [CHANGELOG.md](https://github.com/Satyam/react-simple-idle-monitor/blob/master/CHANGELOG.md) file for differences.

The current version requires at least React 16.8 as it uses React Hooks and avoids the unsafe life-cycle methods it previously relied upon.

It is also written in TypeScript.

## Features

It can do any or all of the following to indicate changes from active to idle and vice-versa:

- **new** Provides a `useIdleMonitor` React custom hook to read status information and act upon the component.
- Changes the `className` of the enclosing `div` element.
- Fire events (when using [`IdleMonitorEvents`](#IdleMonitorEvents)).
- Dispatch Redux actions (when using [`IdleMonitorRedux`](#IdleMonitorRedux)).

The last two features were available in the core of the previous versions and are now provided by separate components, if needed. The new `useIdleMonitor` hook is deemed much better and flexible.

## Table of Contents

- [react-simple-idle-monitor](#react-simple-idle-monitor)
  - [Releases](#releases)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Class names](#class-names)
    - [useIdleMonitor hook.](#useidlemonitor-hook)
      - [isIdle](#isidle)
      - [isRunning](#isrunning)
      - [timeout](#timeout)
      - [startTime](#starttime)
      - [className](#classname)
      - [run](#run)
      - [stop](#stop)
      - [idle](#idle)
      - [activate](#activate)
    - [Properties](#properties)
      - [disabled property](#disabled-property)
      - [timeout property](#timeout-property)
      - [events property](#events-property)
      - [activeClassName and idleClassName properties](#activeclassname-and-idleclassname-properties)
      - [Other properties](#other-properties)
  - [Migration](#migration)
    - [IdleMonitorRedux](#idlemonitorredux)
      - [reduxActionPrefix](#reduxactionprefix)
      - [dispatch](#dispatch)
    - [IdleMonitorEvents](#idlemonitorevents)
      - [onRun](#onrun)
      - [onIdle](#onidle)
      - [onActive](#onactive)
      - [onStop](#onstop)

## Installation

```
npm install -save react-simple-idle-monitor
```

And then import it as a React Component:

```js
import IdleMonitor from 'react-simple-idle-monitor';

// The additional wrappers for events and redux actions can be imported as
import IdleMonitorEvents from 'react-simple-idle-monitor/lib/IdleMonitorEvents';
import IdleMonitorRedux from 'react-simple-idle-monitor/lib/IdleMonitorRedux';
```

## Usage

An instance of `IdleMonitor` should be placed along with other context providers as high up in the tree as possible:

<!-- prettier-ignore -->
```js
import React from 'react';
import ReactDOM from 'react-dom';

import IdleMonitor from 'react-simple-idle-monitor';

function App() {
  return (<IdleMonitor>
    {/* other context providers or routes */}
  </IdleMonitor>);
}

ReactDOM.render(<App />, document.getElementById('root'));
```

`IdleMonitor` is a context provider but it also creates a single `<div>` element to which it attaches several UI event listeners, to detect user interaction, and also, if [classNames](#class-names) are provided, it will set its className according to the state.

`IdleMonitor` can be placed anywhere in the tree but then the UI activity detection will
be limited to the enclosed screen area. There can also be several `IdleMonitor` components enclosing various separate areas, which will respond independently of one another. In such a case, each branch enclosed in each `IdleMonitor` follows the normal scoping rules for Context Providers.

### Class names

When it has either or both of the `activeClassName` or `idleClassName` properties set, `IdleMonitor` will set the `className` property of the enclosing `<div>` to either value depending on the state.

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

Will be rendered in either of the following two, depending on the state:

```html
<div class="user-is-working">.....</div>
<!-- or -->
<div class="UI-is-idle">.....</div>
```

This value is also available through the [`className`](#classname) property from the `useIdleMonitor` hook as described in the next section.

The default for both properties is an empty string, resulting in no `className` set on the `<div>`. The values of these properties are set when mounted, changing them afterwards will not affect the resulting HTML.

### `useIdleMonitor` hook.

The `useIdleMonitor` hook provides access to the context information provided by the monitor.

For example, the `className` property can easily be accessed anywhere in the tree by doing:

```js
const { className } = useIdleMonitor();
```

For TypeScript users, `useIdleMonitor` returns an object of the `IdleMonitorContext`. It contains the following properties:

#### `isIdle`

A boolean, it is `true` when no UI activity has been detected for the `timeout` period, signalling the application is in idle mode, otherwise it is active. `isIdle` is false when initially mounted and will also be false after un-mounting. Calling the [`idle`](#idle) and [`activate`](#activate) functions also affect its state.

#### `isRunning`

A boolean, it is `false` both right after mounting and after un-mounting. In both cases, `isIdle` will also be false. It will switch to `true` after the first render, if the [`disabled`](#disabled-property) property is not set (the default). Calling the [`run`](#run) and [`stop`](#stop) functions will also affect its state.

#### `timeout`

A number, in milliseconds, of the currently or last activity timer. It defaults to the [`timeout`](#timeout-property), but can be changed by calling [`run(newTimeout)`](#run) or [`activate(newTimeout)`](#activate).

The property is not updated to reflect the remaining time for the current inactivity timer, as that would adversely impact the context consumers by forcing them to re-render. See [`startTime`](#starttime) next for a suggestion on how to calculate one, if needed.

#### `startTime`

A number, in milliseconds (taken from `Date.now()`) indicating when the inactivity timer was last launched. It can be used in conjunction with [`timeout`](#timeout) above to provide a running timer.

<!-- prettier-ignore -->
```js
const { isRunning, isIdle, timeout, startTime } = useIdleMonitor();
const remaining = isRunning && !isIdle 
    ? (startTime + timeout - Date.now()) / 1000 
    : 0;
    // will produce, in seconds the time remaining until idle, 
    // or 0 if already idle or not running.
```

#### `className`

A string. If `isIdle === true`, `className` will be the value of [`idleClassName`](#activeclassname-and-idleclassname-properties), otherwise [`activeClassName`](#activeclassname-and-idleclassname-properties). Either of them might be an empty string.

#### `run`

A function, it allows to start the monitor. If it is already running, it will restart it. It takes an optional number argument representing the timeout (in ms) for this and successive inactivity timers. If no argument is provided, it will restore the default [`timeout`](#timeout-property).

Calling this function will result in:

- [`isRunning`](#isrunning) === true
- [`isIdle`](#isidle) === false
- [`startTime`](#starttime) === `Date.now()`
- [`timeout`](#timeout) === the given `newTimeout` or the default [`timeout`](#timeout-property)
- [`className](#classname) === value of the [`activeClassName`](#activeclassname-and-idleclassname-properties) property

#### `stop`

A function, it allows to stop monitoring. Calling this property will result in:

- [`isRunning`](#isrunning) === false
- [`isIdle`](#isidle) === false
- [`className](#classname) === value of the [`activeClassName`](#activeclassname-and-idleclassname-properties) property

Other properties remain unchanged and are mostly irrelevant.

#### `idle`

A function, it is the same function called when the inactivity timer times out. It will have no effect if [`isRunning`](#isrunning) is false. It will result in

- [`isIdle`](#isidle) === true
- [`className](#classname) === value of the [`idleClassName`](#activeclassname-and-idleclassname-properties) property

Other properties remain unchanged and are mostly irrelevant.

#### `activate`

A function, will ensure the monitor is active. It will have no effect if [`isRunning`](#isrunning) is false. It will re-launch the inactivity timer as if a UI event had been detected. It will take an optional number argument which will become the new [`timeout`](#timeout) for the new inactivity timer. Unlike the `newTimeout` argument in [`run`](#run), the one given in `activate` will only be used for the current timer, successive timers will use the previous value. It will result in:

- [`isIdle`](#isidle) === false
- [`startTime`](#starttime) === `Date.now()`
- [`timeout`](#timeout) === the given `newTimeout` or the default [`timeout`](#timeout_prop)
- [`className](#classname) === value of the [`activeClassName`](#activeclassname-and-idleclassname-properties) property

### Properties

`IdleMonitor` accepts the following properties.

#### `disabled` property

A boolean, defaults to `false`, if `true`, monitoring will not be running. This property replaces the `enabled` property from previous versions as `disabled` is a standard property for HTML Elements.

```jsx
<IdleMonitor disabled>...</IdleMonitor>
```

#### `timeout` property

A number, in milliseconds, to be used for the inactivity timer. It defaults to 20 minutes.

```jsx
<IdleMonitor timeout={10 * 60 * 1000 /* 10 minutes */}> ... </IdleMonitor>
```

#### `events` property

An array of strings, represents the names of the events the monitor is to listen to in order to detect user activity. They must be given in React [Synthetic Events](https://reactjs.org/docs/events.html#reference) format. The defaults cover keyboard, mouse, touch and wheel activity and rarely need overriding. This is a write-once property, changing it when `IdleMonitor` is already mounted will not affect the component.

```jsx
<IdleMonitor events={['onMouseMove', 'onKeyDown']}>...</IdleMonitor>
```

#### `activeClassName` and `idleClassName` properties

Both string properties, they default to _falsy_ (an empty string). Their value will be assigned to the `className` attribute of the `<div>` wrapper rendered by the component and the [`className`](#classname) context property. They are both write-once, changing their value once the component is mounted will have no effect.

#### Other properties

All other properties assigned to `IdleMonitor` will be passed on to the `<div>` it creates, except for `className` which will be appended to the classnames created by the component depending on the status.

## Migration

`react-simple-idle-monitor` has been stable for all its existence and the various versions have resulted from testing it with updated dependencies. However, it used soon to be deprecated life-cycle methods and lacked many features.

The new version has been completely re-written in TypeScript, uses React Hooks and Context.

A few of the original features have been dropped or changed:

- `element`: a DOM element on which to attach the events to detect UI activity. It defaulted to `document`. Now it attaches the events to the `<div>` created by the `IdleMonitor` component itself.
- `events`: since it now uses React [Synthetic Events](https://reactjs.org/docs/events.html#reference) the name of the events should be given in proper React format.
- `enabled`: A bad choice from the start, as its opposite, `disabled` is already a standard attribute on HTML Elements.

Neither of the first two properties should be missed as the defaults would usually suffice. `enabled` wasn't much used and, by now, should be totally obsolete as the [`run`](#run) and [`stop`](#stop) functions provided by the [`useIdleMonitor`](#useidlemonitor-hook) are much easier to use. It has been dropped in favor of `disabled` with the corresponding logic reversal. It should be easy to refactor by doing the following replacements:

- `/\benabled={false}/g` with `disabled`
- `/\benabled={([^}]+)}/g` with `disabled={!($1)}`

Two extra helper components are available to provide for old features no longer available in the core component. These helpers add the following properties no longer in the core:

- `dispatch` and `reduxActionPrefix` in [`IdleMonitorRedux`](#IdleMonitorRedux)
- `onRun`, `onStop`, `onIdle` and `onActive` in [`IdleMonitorEvents`](#IdleMonitorEvents)

No helper function contains all the features of these two separate helpers, because even though not mutually incompatible, it was deemed improbable to use them both at once.

Both components are available in the `react-simple-idle-monitor/lib` folder.

### `IdleMonitorRedux`

`IdleMonitorRedux` is a wrapper around `IdleMonitor` and it has all its features plus, when using Redux via `react-redux`, `IdleMonitorRedux` can dispatch various actions to be handled as needed. `IdleMonitorRedux` only needs to have the [`reduxActionPrefix`](#reduxActionPrefix) property set and to receive the [`dispatch`](#dispatch) function amongst its properties. This can easily be done by using `react-redux` [`connect`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) HoC to wrap it:

<!-- prettier-ignore -->
```js
import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import IdleMonitorRedux from 'react-simple-idle-monitor/lib/IdleMonitorRedux';

const MyIdleMonitor = connect()(IdleMonitorRedux);

render(
  <div className="my-app">
    <MyIdleMonitor reduxActionPrefix="IdleMonitor" />
    ..........
  </div>,
  document.getElementById('#contents')
);
```

#### `reduxActionPrefix`

A string, defaults to `undefined`. Using the given _prefix_, `IdleMonitorRedux` will dispatch actions of the following types:

- _prefix_`_run` after mounted, unless disabled, or when [`run`](#run) is called.
- _prefix_`_idle` when the timeout expires or [`idle`](#idle) is called.
- _prefix_`_active` when user activity is detected or [`activate`](#activate) is called
- _prefix_`_stop` when unmounted or otherwise stopped

Actions are called as little as possible, i.e., re-starting a running monitor should not call the run action again.

The component cannot distinguish in between a call to `run()` when it is already running from a call to `activate()` as the only difference in between the two is whether the optional `newTimeout` argument is persisted for future inactivity timers, an information not available throw the `useIdleMonitor` hook. Both will be reported via an action of type _prefix_`_active`.

All actions have properties:

- `type`: as described above,
- `startTime`: set to the timestamp (i.e.: milliseconds since epoch) when the most recent timeout started counting.
- `now`: the timestamp when the event was triggered. This data has always been mostly pointless, as the operation has always been synchronous, but is kept for backwards compatibility.
- `timeout`: the value of the timeout for the operation. It will be the `newTimeout` argument passed to the most recent call to [`activate`](#activate) or [`run`](#run), if any, the value set through the [`timeout`](#timeout-property) property or the default timeout (20 min) in milliseconds.

#### `dispatch`

A function that will receive an object as described above. It is expected to be the `dispatch` function from React-Redux but it might as well be any other function taking an object, such as that resulting from calling React `useReducer` hook. The component doesn't check the return of calling `dispatch` nor does it wait should it return a Promise.

### `IdleMonitorEvents`

`IdleMonitorEvents` is another wrapper around `IdleMonitor` so it has all its features plus the following properties which can be set to handler functions that will be called when state changes.

#### `onRun`

If the component does not have the [`disabled`](#disabled_property) property set (the default), it is fired immediately after mounted and whenever [`isRunning`](#isrunning) changes to true.

#### `onIdle`

It is called when the timeout expires, that is, when [`isIdle`](#isidle) turns true.

#### `onActive`

It is called when [`isIdle`](#isidle) turns false.

#### `onStop`

It is called when the components stops running, that is, [`isRunning`](#isrunning) turns false and also when unmounted.

All events have the same `startTime`, `now` and `timeout` properties as described for the [Redux actions](#reduxActionPrefix).

Unlike the earlier versions of the component (pre- v1.x), the `onActive` event will not receive the extra properties `event`, with the actual event causing activation or the `preventActive` method to prevent the activation, as it did before.

The component cannot distinguish in between a call to `run()` when it is already running from a call to `activate()` as the only difference in between the two is whether the optional `newTimeout` argument is persisted for future inactivity timers, an information not available throw the `useIdleMonitor` hook. Both will be reported via the `onActive` event.

<!-- prettier-ignore -->
```js
import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import IdleMonitorEvents from 'react-simple-idle-monitor/lib/IdleMonitorEvents';

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
)(IdleMonitorEvents);

render(
  <div className="my-app">
    <MyIdleMonitor />
    ..........
  </div>,
  document.getElementById('#contents')
);
```

The code above uses the second argument of [`react-redux` `connect` method](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) to add the `onXxxx` event handler functions to the properties of `IdleMonitor` which will dispatch actions associated to each event. It assumes the corresponding action creators are available to import from elsewhere. This would mostly mimic the effect of using the `reduxActionPrefix` property, however, it would also give a higher degree of control. Obviously, the event handlers can point to any suitable function.

If `mapDispatchToProps` is set as shown above, `connect` will not supply a `dispatch` property when `mapDispatchToProps` is given thus, even if the `reduxActionPrefix` is set, other Redux actions as [shown above](#IdleMonitorRedux) will not be dispatched because of the lack of a `dispatch` property.
