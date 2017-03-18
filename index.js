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

var IdleTimer = function (_Component) {
  _inherits(IdleTimer, _Component);

  function IdleTimer(props) {
    _classCallCheck(this, IdleTimer);

    var _this = _possibleConstructorReturn(this, (IdleTimer.__proto__ || Object.getPrototypeOf(IdleTimer)).call(this, props));

    _this.idle = false;
    _this.onToggleIdleStateHandler = _this.onToggleIdleStateHandler.bind(_this);
    _this.onEventHandler = _this.onEventHandler.bind(_this);
    return _this;
  }

  _createClass(IdleTimer, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      if (typeof document === 'undefined') return;
      var _props = this.props,
          element = _props.element,
          events = _props.events;

      events.forEach(function (ev) {
        return element.addEventListener(ev, _this2.onEventHandler);
      });
      this.run();
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
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _this3 = this;

      clearTimeout(this.tId);
      if (typeof document === 'undefined') return;
      var _props2 = this.props,
          element = _props2.element,
          events = _props2.events;

      events.forEach(function (ev) {
        return element.removeEventListener(ev, _this3.onEventHandler);
      });
    }
  }, {
    key: 'onToggleIdleStateHandler',
    value: function onToggleIdleStateHandler() {
      this.idle = !this.idle;

      var _props3 = this.props,
          onIdle = _props3.onIdle,
          reduxActionPrefix = _props3.reduxActionPrefix,
          onActive = _props3.onActive,
          dispatch = _props3.dispatch,
          activeClassName = _props3.activeClassName,
          idleClassName = _props3.idleClassName;

      // Fire the appropriate action

      if (this.idle) {
        if (dispatch && reduxActionPrefix) {
          dispatch({
            type: reduxActionPrefix + '_idle',
            when: Date.now(),
            start: this.startTime
          });
        }
        if (onIdle) onIdle();
      } else {
        if (dispatch && reduxActionPrefix) {
          dispatch({
            type: reduxActionPrefix + '_active',
            when: Date.now(),
            start: this.startTime
          });
        }
        if (onActive) onActive();
      }
      if (activeClassName || idleClassName) this.forceUpdate();
    }
  }, {
    key: 'onEventHandler',
    value: function onEventHandler(ev) {
      var pageX = this.pageX,
          pageY = this.pageY,
          startTime = this.startTime,
          tId = this.tId,
          idle = this.idle;
      var _props4 = this.props,
          enabled = _props4.enabled,
          timeout = _props4.timeout;

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
        if (Date.now() - startTime < 200) return;
      }

      // clear any existing timeout
      clearTimeout(tId);

      // if the idle timer is enabled, flip
      if (idle) this.onToggleIdleStateHandler(ev);

      this.pageX = ev.pageX; // update mouse coord
      this.pageY = ev.pageY;
      this.tId = setTimeout(this.onToggleIdleStateHandler, timeout); // set a new timeout
    }
  }, {
    key: 'run',
    value: function run() {
      var _props5 = this.props,
          timeout = _props5.timeout,
          reduxActionPrefix = _props5.reduxActionPrefix,
          dispatch = _props5.dispatch;


      clearTimeout(this.tId);

      this.idle = false;
      this.startTime = Date.now();
      this.tId = setTimeout(this.onToggleIdleStateHandler, timeout);
      if (dispatch && reduxActionPrefix) {
        dispatch({
          type: reduxActionPrefix + '_run',
          when: Date.now(),
          start: this.startTime
        });
      }
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _props6 = this.props,
          reduxActionPrefix = _props6.reduxActionPrefix,
          dispatch = _props6.dispatch;

      clearTimeout(this.tId);
      if (dispatch && reduxActionPrefix) {
        dispatch({
          type: reduxActionPrefix + '_stop',
          when: Date.now(),
          start: this.startTime
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props7 = this.props,
          activeClassName = _props7.activeClassName,
          idleClassName = _props7.idleClassName;

      return activeClassName || idleClassName ? _react2.default.createElement(
        'div',
        {
          className: this.idle ? idleClassName || '' : activeClassName || ''
        },
        this.props.children || null
      ) : this.props.children || null;
    }
  }]);

  return IdleTimer;
}(_react.Component);

exports.default = IdleTimer;


IdleTimer.propTypes = {
  timeout: _react.PropTypes.number, // Activity timeout
  events: _react.PropTypes.arrayOf(_react.PropTypes.string), // Activity events to bind
  onIdle: _react.PropTypes.func, // Action to call when user becomes inactive
  onActive: _react.PropTypes.func, // Action to call when user becomes active
  element: _react.PropTypes.object, // Element ref to watch activity on
  children: _react.PropTypes.element,
  reduxActionPrefix: _react.PropTypes.string,
  dispatch: _react.PropTypes.func,
  enabled: _react.PropTypes.bool,
  activeClassName: _react.PropTypes.string,
  idleClassName: _react.PropTypes.string
};

IdleTimer.defaultProps = {
  timeout: 1000 * 60 * 20, // 20 minutes
  events: ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove'],
  element: typeof document !== 'undefined' && document,
  children: null,
  onIdle: null,
  onActive: null,
  reduxActionPrefix: null,
  dispatch: null,
  enabled: true,
  activeClassName: null,
  idleClassName: null
};
