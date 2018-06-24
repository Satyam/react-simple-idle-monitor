/**
 * React Simple Idle Monitor
 *
 * @author Daniel Barreiro
 *
 * Portions taken from:
 * https://github.com/SupremeTechnopriest/react-idle-timer/blob/master/src/index.js
 * By  Randy Lebeau
 *
 *
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class IdleMonitor extends Component {

  constructor(props) {
    super(props);
    this.idle = false;
    this.onTimeoutHandler = this.onTimeoutHandler.bind(this);
    this.onEventHandler = this.onEventHandler.bind(this);
    this.state = {
      className: props.activeClassName || '',
      hasClassName: props.activeClassName || props.idleClassName,
    };
  }

  componentDidMount() {
    const { element, events, enabled } = this.props;
    if (!element) return;
    events.forEach(ev => element.addEventListener(ev, this.onEventHandler));
    if (enabled) {
      this.run();
    } else {
      this.stop();
    }
  }
  componentWillReceiveProps(nextProps) {
    const { enabled: nextEnabled, timeout: nextTimeout } = nextProps;
    const { enabled, timeout } = this.props;
    /* istanbul ignore else */
    if (!!nextEnabled !== !!enabled) {
      if (nextEnabled) {
        this.run();
      } else {
        this.stop();
      }
    }
    if (nextTimeout !== timeout) {
      this.remaining = nextTimeout;
      this.startTimeout();
    }
  }
  componentWillUnmount() {
    const { element, events } = this.props;
    /* The only time there is no element is when doing server-side rendering,
     * and in such a case, there can be no unmounting
    */
    /* istanbul ignore if */
    if (!element) return;
    this.stop();
    events.forEach(ev => element.removeEventListener(ev, this.onEventHandler));
  }

  onActiveHandler(event) {
    const {
      reduxActionPrefix,
      onActive,
      dispatch,
      activeClassName,
    } = this.props;
    const { hasClassName } = this.state;

    let prevented = false;
    if (this.idle) {
      this.idle = false;
      if (onActive) {
        onActive(
          {
            now: Date.now(),
            startTime: this.startTime,
            preventActive: () => {
              this.idle = true;
              prevented = true;
            },
            event,
          },
        );
      }

      if (!prevented) {
        if (dispatch && reduxActionPrefix) {
          dispatch({
            type: `${reduxActionPrefix}_active`,
            now: Date.now(),
            startTime: this.startTime,
          });
        }
        if (hasClassName) this.setState({ className: activeClassName || '' });
      }
    }
  }

  onTimeoutHandler() {
    const {
      onIdle,
      idleClassName,
    } = this.props;
    const { hasClassName } = this.state;

    this.idle = true;

    this.notify('idle', onIdle);
    if (hasClassName) this.setState({ className: idleClassName || '' });
  }

  onEventHandler(ev) {
    const {
      pageX,
      pageY,
      startTime,
    } = this;
    const { enabled } = this.props;

    // If not enabled, ignore events
    if (!enabled) return;

    /*
      The following is taken verbatim from
      https://github.com/SupremeTechnopriest/react-idle-timer/blob/master/src/index.js
      It seems to make sense, but I was unable to figure out a unit test for it
    */
    // Mousemove event
    /* istanbul ignore if */
    if (ev.type === 'mousemove') {
      // if coord are same, it didn't move
      if (ev.pageX === pageX && ev.pageY === pageY) return;
      // if coord don't exist how could it move
      if (typeof ev.pageX === 'undefined' && typeof ev.pageY === 'undefined') return;
      // under 200 ms is hard to do, and you would have to stop,
      // as continuous activity will bypass this
      if ((Date.now() - startTime) < 200) return;
    }

    this.onActiveHandler(ev);

    this.pageX = ev.pageX; // update mouse coord
    this.pageY = ev.pageY;

    this.startTimeout();
  }

  startTimeout() {
    const { timeout } = this.props;
    clearTimeout(this.tId);
    this.tId = setTimeout(this.onTimeoutHandler, this.remaining || timeout);
    this.remaining = 0;
    this.startTime = Date.now();
  }

  notify(reduxSuffix, event) {
    const {
      reduxActionPrefix,
      dispatch,
    } = this.props;

    const payload = {
      now: Date.now(),
      startTime: this.startTime,
    };

    if (typeof event === 'function') {
      event(payload);
    }

    if (dispatch && reduxActionPrefix) {
      payload.type = `${reduxActionPrefix}_${reduxSuffix}`;
      dispatch(payload);
    }
  }

  run() {
    const { onRun } = this.props;
    this.idle = false;
    this.startTimeout();

    this.notify('run', onRun);
  }

  stop() {
    const { timeout, onStop } = this.props;
    clearTimeout(this.tId);
    this.remaining = timeout - (Date.now() - this.startTime);

    this.notify('stop', onStop);
  }

  render() {
    const { activeClassName, idleClassName, children } = this.props;
    const { hasClassName, className} = this.state;
    return hasClassName
      ? (
        <div
          className={className}
        >{children || null}</div>)
      : children || null;
  }

}

IdleMonitor.propTypes = {
  timeout: PropTypes.number,
  events: PropTypes.arrayOf(PropTypes.string),
  onIdle: PropTypes.func,
  onActive: PropTypes.func,
  onRun: PropTypes.func,
  onStop: PropTypes.func,
  element: PropTypes.any,
  children: PropTypes.element,
  reduxActionPrefix: PropTypes.string,
  dispatch: PropTypes.func,
  enabled: PropTypes.bool,
  activeClassName: PropTypes.string,
  idleClassName: PropTypes.string,
};

IdleMonitor.defaultProps = {
  timeout: 1000 * 60 * 20, // 20 minutes
  events: [
    'mousemove',
    'keydown',
    'wheel',
    'DOMMouseScroll',
    'mouseWheel',
    'mousedown',
    'touchstart',
    'touchmove',
    'MSPointerDown',
    'MSPointerMove',
  ],
  element: (typeof document !== 'undefined') && document,
  children: null,
  onIdle: null,
  onActive: null,
  onRun: null,
  onStop: null,
  reduxActionPrefix: null,
  dispatch: null,
  enabled: true,
  activeClassName: null,
  idleClassName: null,
};
