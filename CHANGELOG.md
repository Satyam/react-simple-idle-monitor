# 1.0.0-next.1 (2019-09-25)

- The `enabled` property has been replaced with `disabled` which is standard for HTML elements.
- Both `IdleMonitorRedux` and `IdleMonitorEvents` report the timeout in their payloads.
- Both have been re-written and are more simple and reliable
- Code has been added to check the existence and type of parameters and throw errors when not in production mode.
- The methods available in the hook are no longer kept in the internal state as they don't change and can be added at the end.
- All extra properties passed on to the component are passed on to the `<div>` element, except for `className` which is properly appended to the class names generated.
  
# 1.0.0-next.0 (2019-09-21)

Complete rewrite of the component. It uses React hooks and provides a `useIdleMonitor` hook to access its features. Written in TypeScript.

With the `useIdleMonitor` hook providing much more flexibility than the older interfaces, some of them (i.e.: Redux and Events interfaces) have been taken out of the core into separate components which wrap around the core `IdleMonitor`.

## v0.4.0 (2019-09-21)

Following [this post](https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html) the _unsafe_ method names have been renamed, to avoid the warning produced by React. Otherwise the code is exactly the same as in v0.3 so, if your React version is above v16.3, you may update and avoid the warning. For earlier versions of React, v0.3 will still work just the same.

This version will no longer be maintained, except for critical bug fixes. For future developments, see v1.0.0-next.0

### Breaking changes

- `componentWillReceiveProps` has been renamed `UNSAFE_componentWillReceiveProps`.
- The dependencies list in `package.json` has been updated to require React v16.3 or higher.

## v0.3.3 (2019-06-07)

This ChangeLog file had not been created at this point, the Releases tab on GitHub provides the greater detail.

No great changes had been made to this component since it was first published, except being periodically checked for compatibility against newer versions of React and the test tools thus, up to this point, most of the changes were in the allowed versions of the dependencies.
