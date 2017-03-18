import React, { Component, PropTypes } from 'react';

export default class IdleTimer extends Component {

  constructor(props) {
    super(props);
    this.idle = false;
    this.onToggleIdleStateHandler = this.onToggleIdleStateHandler.bind(this);
    this.onEventHandler = this.onEventHandler.bind(this);
  }

  componentDidMount() {
    if (typeof document === 'undefined') return;
    const { element, events } = this.props;
    events.forEach(ev => element.addEventListener(ev, this.onEventHandler));
    this.run();
  }
  componentWillReceiveProps(nextProps) {
    if (!!nextProps.enabled !== !!this.props.enabled) {
      if (nextProps.enabled) {
        this.run();
      } else {
        this.stop();
      }
    }
  }
  componentWillUnmount() {
    clearTimeout(this.tId);
    if (typeof document === 'undefined') return;
    const { element, events } = this.props;
    events.forEach(ev => element.removeEventListener(ev, this.onEventHandler));
  }

  onToggleIdleStateHandler() {
    this.idle = !this.idle;

    const {
      onIdle,
      reduxActionPrefix,
      onActive,
      dispatch,
      activeClassName,
      idleClassName,
    } = this.props;

    // Fire the appropriate action
    if (this.idle) {
      if (dispatch && reduxActionPrefix) {
        dispatch({
          type: `${reduxActionPrefix}_idle`,
          when: Date.now(),
          start: this.startTime,
        });
      }
      if (onIdle) onIdle();
    } else {
      if (dispatch && reduxActionPrefix) {
        dispatch({
          type: `${reduxActionPrefix}_active`,
          when: Date.now(),
          start: this.startTime,
        });
      }
      if (onActive) onActive();
    }
    if (activeClassName || idleClassName) this.forceUpdate();
  }

  onEventHandler(ev) {
    const {
      pageX,
      pageY,
      startTime,
      tId,
      idle,
    } = this;

    const {
      enabled,
      timeout,
    } = this.props;

    // If not enabled, ignore events
    if (!enabled) return;

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

    // clear any existing timeout
    clearTimeout(tId);

    // if the idle timer is enabled, flip
    if (idle) this.onToggleIdleStateHandler(ev);

    this.pageX = ev.pageX; // update mouse coord
    this.pageY = ev.pageY;
    this.tId = setTimeout(this.onToggleIdleStateHandler, timeout); // set a new timeout
  }

  run() {
    const {
      timeout,
      reduxActionPrefix,
      dispatch,
    } = this.props;

    clearTimeout(this.tId);

    this.idle = false;
    this.startTime = Date.now();
    this.tId = setTimeout(this.onToggleIdleStateHandler, timeout);
    if (dispatch && reduxActionPrefix) {
      dispatch({
        type: `${reduxActionPrefix}_run`,
        when: Date.now(),
        start: this.startTime,
      });
    }
  }

  stop() {
    const {
      reduxActionPrefix,
      dispatch,
    } = this.props;
    clearTimeout(this.tId);
    if (dispatch && reduxActionPrefix) {
      dispatch({
        type: `${reduxActionPrefix}_stop`,
        when: Date.now(),
        start: this.startTime,
      });
    }
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

IdleTimer.propTypes = {
  timeout: PropTypes.number, // Activity timeout
  events: PropTypes.arrayOf(PropTypes.string), // Activity events to bind
  onIdle: PropTypes.func, // Action to call when user becomes inactive
  onActive: PropTypes.func, // Action to call when user becomes active
  element: PropTypes.object, // Element ref to watch activity on
  children: PropTypes.element,
  reduxActionPrefix: PropTypes.string,
  dispatch: PropTypes.func,
  enabled: PropTypes.bool,
  activeClassName: PropTypes.string,
  idleClassName: PropTypes.string,
};

IdleTimer.defaultProps = {
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
  reduxActionPrefix: null,
  dispatch: null,
  enabled: true,
  activeClassName: null,
  idleClassName: null,
};
