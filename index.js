'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IdleMonitor = function (_Component) {
  _inherits(IdleMonitor, _Component);

  function IdleMonitor(props) {
    _classCallCheck(this, IdleMonitor);

    var _this = _possibleConstructorReturn(this, (IdleMonitor.__proto__ || Object.getPrototypeOf(IdleMonitor)).call(this, props));

    _this.idle = false;
    _this.onTimeoutHandler = _this.onTimeoutHandler.bind(_this);
    _this.onEventHandler = _this.onEventHandler.bind(_this);
    return _this;
  }

  _createClass(IdleMonitor, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      var _props = this.props,
          element = _props.element,
          events = _props.events;

      if (!element) return;
      events.forEach(function (ev) {
        return element.addEventListener(ev, _this2.onEventHandler);
      });
      if (this.props.enabled) {
        this.run();
      } else {
        this.stop();
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
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
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _this3 = this;

      var _props2 = this.props,
          element = _props2.element,
          events = _props2.events;

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

      var _props3 = this.props,
          reduxActionPrefix = _props3.reduxActionPrefix,
          onActive = _props3.onActive,
          dispatch = _props3.dispatch,
          activeClassName = _props3.activeClassName,
          idleClassName = _props3.idleClassName;


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
          if (activeClassName || idleClassName) this.forceUpdate();
        }
      }
    }
  }, {
    key: 'onTimeoutHandler',
    value: function onTimeoutHandler() {
      var _props4 = this.props,
          onIdle = _props4.onIdle,
          activeClassName = _props4.activeClassName,
          idleClassName = _props4.idleClassName;


      this.idle = true;

      this.notify('idle', onIdle);
      if (activeClassName || idleClassName) this.forceUpdate();
    }
  }, {
    key: 'onEventHandler',
    value: function onEventHandler(ev) {
      var pageX = this.pageX,
          pageY = this.pageY,
          startTime = this.startTime;

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
      clearTimeout(this.tId);
      this.tId = setTimeout(this.onTimeoutHandler, this.remaining || this.props.timeout);
      this.remaining = 0;
      this.startTime = Date.now();
    }
  }, {
    key: 'notify',
    value: function notify(reduxSuffix, event) {
      var _props5 = this.props,
          reduxActionPrefix = _props5.reduxActionPrefix,
          dispatch = _props5.dispatch;


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
      this.idle = false;
      this.startTimeout();

      this.notify('run', this.props.onRun);
    }
  }, {
    key: 'stop',
    value: function stop() {
      clearTimeout(this.tId);
      this.remaining = this.props.timeout - (Date.now() - this.startTime);

      this.notify('stop', this.props.onStop);
    }
  }, {
    key: 'render',
    value: function render() {
      var _props6 = this.props,
          activeClassName = _props6.activeClassName,
          idleClassName = _props6.idleClassName;

      return activeClassName || idleClassName ? _react2.default.createElement(
        'div',
        {
          className: this.idle ? idleClassName || '' : activeClassName || ''
        },
        this.props.children || null
      ) : this.props.children || null;
    }
  }]);

  return IdleMonitor;
}(_react.Component);

exports.default = IdleMonitor;


IdleMonitor.propTypes = {
  timeout: _react.PropTypes.number, // Activity timeout
  events: _react.PropTypes.arrayOf(_react.PropTypes.string), // Activity events to bind
  onIdle: _react.PropTypes.func, // Action to call when user becomes inactive
  onActive: _react.PropTypes.func, // Action to call when user becomes active
  onRun: _react.PropTypes.func,
  onStop: _react.PropTypes.func,
  element: _react.PropTypes.object, // Element ref to watch activity on
  children: _react.PropTypes.element,
  reduxActionPrefix: _react.PropTypes.string,
  dispatch: _react.PropTypes.func,
  enabled: _react.PropTypes.bool,
  activeClassName: _react.PropTypes.string,
  idleClassName: _react.PropTypes.string
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
