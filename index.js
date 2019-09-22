"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var IdleMonitor =
/*#__PURE__*/
function (_Component) {
  _inherits(IdleMonitor, _Component);

  function IdleMonitor(props) {
    var _this;

    _classCallCheck(this, IdleMonitor);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(IdleMonitor).call(this, props));
    _this.idle = false;
    _this.onTimeoutHandler = _this.onTimeoutHandler.bind(_assertThisInitialized(_this));
    _this.onEventHandler = _this.onEventHandler.bind(_assertThisInitialized(_this));
    _this.state = {
      className: props.activeClassName || '',
      hasClassName: props.activeClassName || props.idleClassName
    };
    return _this;
  }

  _createClass(IdleMonitor, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      var _this$props = this.props,
          element = _this$props.element,
          events = _this$props.events,
          enabled = _this$props.enabled;
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
    /* eslint-disable-next-line */

  }, {
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(nextProps) {
      var nextEnabled = nextProps.enabled,
          nextTimeout = nextProps.timeout;
      var _this$props2 = this.props,
          enabled = _this$props2.enabled,
          timeout = _this$props2.timeout;
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
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var _this3 = this;

      var _this$props3 = this.props,
          element = _this$props3.element,
          events = _this$props3.events;
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
    key: "onActiveHandler",
    value: function onActiveHandler(event) {
      var _this4 = this;

      var _this$props4 = this.props,
          reduxActionPrefix = _this$props4.reduxActionPrefix,
          onActive = _this$props4.onActive,
          dispatch = _this$props4.dispatch,
          activeClassName = _this$props4.activeClassName;
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
              type: "".concat(reduxActionPrefix, "_active"),
              now: Date.now(),
              startTime: this.startTime
            });
          }

          if (hasClassName) this.setState({
            className: activeClassName || ''
          });
        }
      }
    }
  }, {
    key: "onTimeoutHandler",
    value: function onTimeoutHandler() {
      var _this$props5 = this.props,
          onIdle = _this$props5.onIdle,
          idleClassName = _this$props5.idleClassName;
      var hasClassName = this.state.hasClassName;
      this.idle = true;
      this.notify('idle', onIdle);
      if (hasClassName) this.setState({
        className: idleClassName || ''
      });
    }
  }, {
    key: "onEventHandler",
    value: function onEventHandler(ev) {
      var pageX = this.pageX,
          pageY = this.pageY,
          startTime = this.startTime;
      var enabled = this.props.enabled; // If not enabled, ignore events

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
        if (ev.pageX === pageX && ev.pageY === pageY) return; // if coord don't exist how could it move

        if (typeof ev.pageX === 'undefined' && typeof ev.pageY === 'undefined') {
          return;
        } // under 200 ms is hard to do, and you would have to stop,
        // as continuous activity will bypass this


        if (Date.now() - startTime < 200) return;
      }

      this.onActiveHandler(ev);
      this.pageX = ev.pageX; // update mouse coord

      this.pageY = ev.pageY;
      this.startTimeout();
    }
  }, {
    key: "startTimeout",
    value: function startTimeout() {
      var timeout = this.props.timeout;
      clearTimeout(this.tId);
      this.tId = setTimeout(this.onTimeoutHandler, this.remaining || timeout);
      this.remaining = 0;
      this.startTime = Date.now();
    }
  }, {
    key: "notify",
    value: function notify(reduxSuffix, event) {
      var _this$props6 = this.props,
          reduxActionPrefix = _this$props6.reduxActionPrefix,
          dispatch = _this$props6.dispatch;
      var payload = {
        now: Date.now(),
        startTime: this.startTime
      };

      if (typeof event === 'function') {
        event(payload);
      }

      if (dispatch && reduxActionPrefix) {
        payload.type = "".concat(reduxActionPrefix, "_").concat(reduxSuffix);
        dispatch(payload);
      }
    }
  }, {
    key: "run",
    value: function run() {
      var onRun = this.props.onRun;
      this.idle = false;
      this.startTimeout();
      this.notify('run', onRun);
    }
  }, {
    key: "stop",
    value: function stop() {
      var _this$props7 = this.props,
          timeout = _this$props7.timeout,
          onStop = _this$props7.onStop;
      clearTimeout(this.tId);
      this.remaining = timeout - (Date.now() - this.startTime);
      this.notify('stop', onStop);
    }
  }, {
    key: "render",
    value: function render() {
      var children = this.props.children;
      var _this$state = this.state,
          hasClassName = _this$state.hasClassName,
          className = _this$state.className;
      return hasClassName ? _react["default"].createElement("div", {
        className: className
      }, children || null) : children || null;
    }
  }]);

  return IdleMonitor;
}(_react.Component);

exports["default"] = IdleMonitor;
IdleMonitor.propTypes = {
  timeout: _propTypes["default"].number,
  events: _propTypes["default"].arrayOf(_propTypes["default"].string),
  onIdle: _propTypes["default"].func,
  onActive: _propTypes["default"].func,
  onRun: _propTypes["default"].func,
  onStop: _propTypes["default"].func,
  element: _propTypes["default"].any,
  children: _propTypes["default"].element,
  reduxActionPrefix: _propTypes["default"].string,
  dispatch: _propTypes["default"].func,
  enabled: _propTypes["default"].bool,
  activeClassName: _propTypes["default"].string,
  idleClassName: _propTypes["default"].string
};
IdleMonitor.defaultProps = {
  timeout: 1000 * 60 * 20,
  // 20 minutes
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
