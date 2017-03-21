import React, { Component, PropTypes } from 'react';

export default class IdleMonitor extends Component {

  constructor(props) {
    super(props);
    this.idle = false;
    this.onTimeoutHandler = this.onTimeoutHandler.bind(this);
    this.onEventHandler = this.onEventHandler.bind(this);
  }

  componentDidMount() {
    const { element, events } = this.props;
    if (!element) return;
    events.forEach(ev => element.addEventListener(ev, this.onEventHandler));
    if (this.props.enabled) {
      this.run();
    } else {
      this.stop();
    }
  }
  componentWillReceiveProps(nextProps) {
    if (!!nextProps.enabled !== !!this.props.enabled) {
      if (nextProps.enabled) {
        this.run();
      } else {
        this.stop();
      }
    }
    if (nextProps.timeout !== this.props.timeout) {
      this.remaining = nextProps.timeout;
      this.startTimeout();
    }
  }
  componentWillUnmount() {
    const { element, events } = this.props;
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
      idleClassName,
    } = this.props;

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
        if (activeClassName || idleClassName) this.forceUpdate();
      }
    }
  }

  onTimeoutHandler() {
    const {
      onIdle,
      activeClassName,
      idleClassName,
    } = this.props;

    this.idle = true;

    this.notify('idle', onIdle);
    if (activeClassName || idleClassName) this.forceUpdate();
  }

  onEventHandler(ev) {
    const {
      pageX,
      pageY,
      startTime,
    } = this;

    // If not enabled, ignore events
    if (!this.props.enabled) return;

    // Mousemove event
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
    clearTimeout(this.tId);
    this.tId = setTimeout(this.onTimeoutHandler, this.remaining || this.props.timeout);
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
    this.idle = false;
    this.startTimeout();

    this.notify('run', this.props.onRun);
  }

  stop() {
    clearTimeout(this.tId);
    this.remaining = this.props.timeout - (Date.now() - this.startTime);

    this.notify('stop', this.props.onStop);
  }

  render() {
    const { activeClassName, idleClassName } = this.props;
    return (activeClassName || idleClassName)
      ? (
        <div
          className={this.idle
            ? (idleClassName || '')
            : (activeClassName || '')
          }
        >{this.props.children || null}</div>)
      : this.props.children || null;
  }

}

IdleMonitor.propTypes = {
  timeout: PropTypes.number, // Activity timeout
  events: PropTypes.arrayOf(PropTypes.string), // Activity events to bind
  onIdle: PropTypes.func, // Action to call when user becomes inactive
  onActive: PropTypes.func, // Action to call when user becomes active
  onRun: PropTypes.func,
  onStop: PropTypes.func,
  element: PropTypes.object, // Element ref to watch activity on
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
