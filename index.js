'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
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


var IdleMonitor = function (_Component) {
  _inherits(IdleMonitor, _Component);

  function IdleMonitor(props) {
    _classCallCheck(this, IdleMonitor);

    var _this = _possibleConstructorReturn(this, (IdleMonitor.__proto__ || Object.getPrototypeOf(IdleMonitor)).call(this, props));

    _this.idle = false;
    _this.onTimeoutHandler = _this.onTimeoutHandler.bind(_this);
    _this.onEventHandler = _this.onEventHandler.bind(_this);
    _this.state = {
      className: props.activeClassName || '',
      hasClassName: props.activeClassName || props.idleClassName
    };
    return _this;
  }

  _createClass(IdleMonitor, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      var _props = this.props,
          element = _props.element,
          events = _props.events,
          enabled = _props.enabled;


      if (!element) return;
      events.forEach(function (ev) {
        return element.addEventListener(ev, _this2.onEventHandler);
      });
      if (enabled) {
        this.run();
      } else {
        this.stop();
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var nextEnabled = nextProps.enabled,
          nextTimeout = nextProps.timeout;
      var _props2 = this.props,
          enabled = _props2.enabled,
          timeout = _props2.timeout;

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
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _this3 = this;

      var _props3 = this.props,
          element = _props3.element,
          events = _props3.events;

      /* The only time there is no element is when doing server-side rendering,
       * and in such a case, there can be no unmounting
      */
      /* istanbul ignore if */

      if (!element) return;
      this.stop();
      events.forEach(function (ev) {
        return element.removeEventListener(ev, _this3.onEventHandler);
      });
    }
  }, {
    key: 'onActiveHandler',
    value: function onActiveHandler(event) {
      var _this4 = this;

      var _props4 = this.props,
          reduxActionPrefix = _props4.reduxActionPrefix,
          onActive = _props4.onActive,
          dispatch = _props4.dispatch,
          activeClassName = _props4.activeClassName;
      var hasClassName = this.state.hasClassName;


      var prevented = false;
      if (this.idle) {
        this.idle = false;
        if (onActive) {
          onActive({
            now: Date.now(),
            startTime: this.startTime,
            preventActive: function preventActive() {
              _this4.idle = true;
              prevented = true;
            },
            event: event
          });
        }

        if (!prevented) {
          if (dispatch && reduxActionPrefix) {
            dispatch({
              type: reduxActionPrefix + '_active',
              now: Date.now(),
              startTime: this.startTime
            });
          }
          if (hasClassName) this.setState({ className: activeClassName || '' });
        }
      }
    }
  }, {
    key: 'onTimeoutHandler',
    value: function onTimeoutHandler() {
      var _props5 = this.props,
          onIdle = _props5.onIdle,
          idleClassName = _props5.idleClassName;
      var hasClassName = this.state.hasClassName;


      this.idle = true;

      this.notify('idle', onIdle);
      if (hasClassName) this.setState({ className: idleClassName || '' });
    }
  }, {
    key: 'onEventHandler',
    value: function onEventHandler(ev) {
      var pageX = this.pageX,
          pageY = this.pageY,
          startTime = this.startTime;
      var enabled = this.props.enabled;

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
        if (typeof ev.pageX === 'undefined' && typeof ev.pageY === 'undefined') {
          return;
        }
        // under 200 ms is hard to do, and you would have to stop,
        // as continuous activity will bypass this
        if (Date.now() - startTime < 200) return;
      }

      this.onActiveHandler(ev);

      this.pageX = ev.pageX; // update mouse coord
      this.pageY = ev.pageY;

      this.startTimeout();
    }
  }, {
    key: 'startTimeout',
    value: function startTimeout() {
      var timeout = this.props.timeout;


      clearTimeout(this.tId);
      this.tId = setTimeout(this.onTimeoutHandler, this.remaining || timeout);
      this.remaining = 0;
      this.startTime = Date.now();
    }
  }, {
    key: 'notify',
    value: function notify(reduxSuffix, event) {
      var _props6 = this.props,
          reduxActionPrefix = _props6.reduxActionPrefix,
          dispatch = _props6.dispatch;


      var payload = {
        now: Date.now(),
        startTime: this.startTime
      };

      if (typeof event === 'function') {
        event(payload);
      }

      if (dispatch && reduxActionPrefix) {
        payload.type = reduxActionPrefix + '_' + reduxSuffix;
        dispatch(payload);
      }
    }
  }, {
    key: 'run',
    value: function run() {
      var onRun = this.props.onRun;


      this.idle = false;
      this.startTimeout();

      this.notify('run', onRun);
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _props7 = this.props,
          timeout = _props7.timeout,
          onStop = _props7.onStop;


      clearTimeout(this.tId);
      this.remaining = timeout - (Date.now() - this.startTime);

      this.notify('stop', onStop);
    }
  }, {
    key: 'render',
    value: function render() {
      var children = this.props.children;
      var _state = this.state,
          hasClassName = _state.hasClassName,
          className = _state.className;


      return hasClassName ? _react2.default.createElement(
        'div',
        { className: className },
        children || null
      ) : children || null;
    }
  }]);

  return IdleMonitor;
}(_react.Component);

exports.default = IdleMonitor;


IdleMonitor.propTypes = {
  timeout: _propTypes2.default.number,
  events: _propTypes2.default.arrayOf(_propTypes2.default.string),
  onIdle: _propTypes2.default.func,
  onActive: _propTypes2.default.func,
  onRun: _propTypes2.default.func,
  onStop: _propTypes2.default.func,
  element: _propTypes2.default.any,
  children: _propTypes2.default.element,
  reduxActionPrefix: _propTypes2.default.string,
  dispatch: _propTypes2.default.func,
  enabled: _propTypes2.default.bool,
  activeClassName: _propTypes2.default.string,
  idleClassName: _propTypes2.default.string
};

IdleMonitor.defaultProps = {
  timeout: 1000 * 60 * 20, // 20 minutes
  events: ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove'],
  element: typeof document !== 'undefined' && document,
  children: null,
  onIdle: null,
  onActive: null,
  onRun: null,
  onStop: null,
  reduxActionPrefix: null,
  dispatch: null,
  enabled: true,
  activeClassName: null,
  idleClassName: null
};
