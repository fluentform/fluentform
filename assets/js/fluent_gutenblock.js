/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./guten_block/src/components/controls/FluentAlignmentControl.js":
/*!***********************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentAlignmentControl.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Fluent Forms Alignment Control Component
 */

// Import React components
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect;
var __ = wp.i18n.__;

// Import WordPress components
var _wp$components = wp.components,
  ButtonGroup = _wp$components.ButtonGroup,
  Button = _wp$components.Button,
  Tooltip = _wp$components.Tooltip;

/**
 * Fluent Forms Alignment Control Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Label for the control
 * @param {string} props.value Current alignment value
 * @param {Function} props.onChange Callback when alignment changes
 * @param {Array} props.options Alignment options to display
 */
var FluentAlignmentControl = function FluentAlignmentControl(_ref) {
  var _ref$label = _ref.label,
    label = _ref$label === void 0 ? __('Alignment') : _ref$label,
    _ref$value = _ref.value,
    value = _ref$value === void 0 ? 'left' : _ref$value,
    onChange = _ref.onChange,
    _ref$options = _ref.options,
    options = _ref$options === void 0 ? [{
      value: 'left',
      icon: 'editor-alignleft',
      label: __('Left')
    }, {
      value: 'center',
      icon: 'editor-aligncenter',
      label: __('Center')
    }, {
      value: 'right',
      icon: 'editor-alignright',
      label: __('Right')
    }] : _ref$options;
  var _useState = useState(value),
    _useState2 = _slicedToArray(_useState, 2),
    alignment = _useState2[0],
    setAlignment = _useState2[1];

  // Update local state when props change
  useEffect(function () {
    if (value !== alignment) {
      setAlignment(value);
    }
  }, [value]);
  var handleAlignmentChange = function handleAlignmentChange(newAlignment) {
    setAlignment(newAlignment);
    if (onChange) {
      onChange(newAlignment);
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
    className: "ffblock-alignment-control",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
      className: "ffblock-alignment-buttons",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(ButtonGroup, {
        children: options.map(function (option) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Tooltip, {
            text: option.label,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
              icon: option.icon,
              isPrimary: alignment === option.value,
              isSecondary: alignment !== option.value,
              onClick: function onClick() {
                return handleAlignmentChange(option.value);
              },
              "aria-label": option.label
            })
          }, option.value);
        })
      })
    })
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentAlignmentControl);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentBorderControl.js":
/*!********************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentBorderControl.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./FluentColorPicker */ "./guten_block/src/components/controls/FluentColorPicker.js");
/* harmony import */ var _FluentSpaceControl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./FluentSpaceControl */ "./guten_block/src/components/controls/FluentSpaceControl.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _wp$components = wp.components,
  BaseControl = _wp$components.BaseControl,
  ToggleControl = _wp$components.ToggleControl,
  SelectControl = _wp$components.SelectControl;
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect;
var __ = wp.i18n.__;



var FluentBorderControl = function FluentBorderControl(_ref) {
  var _ref$label = _ref.label,
    label = _ref$label === void 0 ? __("Border") : _ref$label,
    enabled = _ref.enabled,
    onToggle = _ref.onToggle,
    borderType = _ref.borderType,
    onBorderTypeChange = _ref.onBorderTypeChange,
    borderColor = _ref.borderColor,
    onBorderColorChange = _ref.onBorderColorChange,
    borderWidth = _ref.borderWidth,
    onBorderWidthChange = _ref.onBorderWidthChange,
    borderRadius = _ref.borderRadius,
    onBorderRadiusChange = _ref.onBorderRadiusChange,
    _ref$defaultColor = _ref.defaultColor,
    defaultColor = _ref$defaultColor === void 0 ? "#dddddd" : _ref$defaultColor;
  var _useState = useState(!!enabled),
    _useState2 = _slicedToArray(_useState, 2),
    isEnabled = _useState2[0],
    setIsEnabled = _useState2[1];

  // Update internal state when prop changes
  useEffect(function () {
    setIsEnabled(!!enabled);
  }, [enabled]);
  var borderTypeOptions = [{
    label: __("Solid"),
    value: 'solid'
  }, {
    label: __("Dashed"),
    value: 'dashed'
  }, {
    label: __("Dotted"),
    value: 'dotted'
  }, {
    label: __("Double"),
    value: 'double'
  }];
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(BaseControl, {
    label: label,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(ToggleControl, {
      label: __("Enable Border"),
      checked: isEnabled,
      onChange: function onChange(value) {
        // Update internal state first
        setIsEnabled(!!value);
        // Then notify parent
        onToggle(!!value);
      }
    }), isEnabled && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(SelectControl, {
        label: __("Border Type"),
        value: borderType || 'solid',
        options: borderTypeOptions,
        onChange: onBorderTypeChange
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Border Color"),
        value: borderColor || '',
        onChange: onBorderColorChange,
        defaultColor: defaultColor
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_1__["default"], {
        label: __("Border Width"),
        values: borderWidth,
        onChange: onBorderWidthChange
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_1__["default"], {
        label: __("Border Radius"),
        values: borderRadius,
        onChange: onBorderRadiusChange
      })]
    })]
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentBorderControl);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentBoxShadowControl.js":
/*!***********************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentBoxShadowControl.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./FluentColorPicker */ "./guten_block/src/components/controls/FluentColorPicker.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _wp$components = wp.components,
  BaseControl = _wp$components.BaseControl,
  ToggleControl = _wp$components.ToggleControl,
  SelectControl = _wp$components.SelectControl;
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect;
var __ = wp.i18n.__;


var FluentBoxShadowControl = function FluentBoxShadowControl(_ref) {
  var _localShadow$horizont2, _localShadow$horizont3, _localShadow$vertical2, _localShadow$vertical3, _localShadow$blur2, _localShadow$blur3, _localShadow$spread2, _localShadow$spread3;
  var _ref$label = _ref.label,
    label = _ref$label === void 0 ? __("Box Shadow") : _ref$label,
    _ref$shadow = _ref.shadow,
    shadow = _ref$shadow === void 0 ? {} : _ref$shadow,
    onChange = _ref.onChange,
    _ref$defaultColor = _ref.defaultColor,
    defaultColor = _ref$defaultColor === void 0 ? "rgba(0,0,0,0.5)" : _ref$defaultColor;
  // Use internal state to track the shadow object
  var _useState = useState(_objectSpread({
      enable: false,
      color: '',
      position: 'outline',
      horizontal: {
        value: '0',
        unit: 'px'
      },
      vertical: {
        value: '0',
        unit: 'px'
      },
      blur: {
        value: '5',
        unit: 'px'
      },
      spread: {
        value: '0',
        unit: 'px'
      }
    }, shadow)),
    _useState2 = _slicedToArray(_useState, 2),
    localShadow = _useState2[0],
    setLocalShadow = _useState2[1];

  // Update internal state when props change
  useEffect(function () {
    setLocalShadow(function (prev) {
      return _objectSpread(_objectSpread({}, prev), shadow);
    });
  }, [shadow]);
  var updateShadow = function updateShadow(updates) {
    var newShadow = _objectSpread(_objectSpread({}, localShadow), updates);
    setLocalShadow(newShadow);
    if (onChange) {
      onChange(newShadow);
    }
  };
  var positionOptions = [{
    label: __("Outline"),
    value: 'outline'
  }, {
    label: __("Inset"),
    value: 'inset'
  }];
  var unitOptions = [{
    label: 'px',
    value: 'px'
  }, {
    label: 'em',
    value: 'em'
  }, {
    label: '%',
    value: '%'
  }];
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(BaseControl, {
    label: label,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(ToggleControl, {
      label: __("Enable Box Shadow"),
      checked: localShadow.enable,
      onChange: function onChange(value) {
        var updates = {
          enable: value
        };

        // Set defaults when enabling
        if (value) {
          var _localShadow$horizont, _localShadow$vertical, _localShadow$blur, _localShadow$spread;
          if (!localShadow.color) updates.color = defaultColor;
          if (!localShadow.position) updates.position = 'outline';
          if (!((_localShadow$horizont = localShadow.horizontal) !== null && _localShadow$horizont !== void 0 && _localShadow$horizont.value)) updates.horizontal = {
            value: '0',
            unit: 'px'
          };
          if (!((_localShadow$vertical = localShadow.vertical) !== null && _localShadow$vertical !== void 0 && _localShadow$vertical.value)) updates.vertical = {
            value: '0',
            unit: 'px'
          };
          if (!((_localShadow$blur = localShadow.blur) !== null && _localShadow$blur !== void 0 && _localShadow$blur.value)) updates.blur = {
            value: '5',
            unit: 'px'
          };
          if (!((_localShadow$spread = localShadow.spread) !== null && _localShadow$spread !== void 0 && _localShadow$spread.value)) updates.spread = {
            value: '0',
            unit: 'px'
          };
        }
        updateShadow(updates);
      }
    }), localShadow.enable && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Shadow Color"),
        value: localShadow.color || '',
        onChange: function onChange(value) {
          return updateShadow({
            color: value
          });
        },
        defaultColor: defaultColor
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SelectControl, {
        label: __("Shadow Position"),
        value: localShadow.position || 'outline',
        options: positionOptions,
        onChange: function onChange(value) {
          return updateShadow({
            position: value
          });
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(BaseControl, {
        label: __("Horizontal Offset"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
          className: "ffblock-unit-control",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
            type: "number",
            className: "components-text-control__input",
            value: ((_localShadow$horizont2 = localShadow.horizontal) === null || _localShadow$horizont2 === void 0 ? void 0 : _localShadow$horizont2.value) || '',
            onChange: function onChange(e) {
              return updateShadow({
                horizontal: _objectSpread(_objectSpread({}, localShadow.horizontal), {}, {
                  value: e.target.value
                })
              });
            },
            min: "-50",
            max: "50",
            placeholder: "0"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SelectControl, {
            value: ((_localShadow$horizont3 = localShadow.horizontal) === null || _localShadow$horizont3 === void 0 ? void 0 : _localShadow$horizont3.unit) || 'px',
            options: unitOptions,
            onChange: function onChange(unit) {
              return updateShadow({
                horizontal: _objectSpread(_objectSpread({}, localShadow.horizontal), {}, {
                  unit: unit
                })
              });
            }
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(BaseControl, {
        label: __("Vertical Offset"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
          className: "ffblock-unit-control",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
            type: "number",
            className: "components-text-control__input",
            value: ((_localShadow$vertical2 = localShadow.vertical) === null || _localShadow$vertical2 === void 0 ? void 0 : _localShadow$vertical2.value) || '',
            onChange: function onChange(e) {
              return updateShadow({
                vertical: _objectSpread(_objectSpread({}, localShadow.vertical), {}, {
                  value: e.target.value
                })
              });
            },
            min: "-50",
            max: "50",
            placeholder: "0"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SelectControl, {
            value: ((_localShadow$vertical3 = localShadow.vertical) === null || _localShadow$vertical3 === void 0 ? void 0 : _localShadow$vertical3.unit) || 'px',
            options: unitOptions,
            onChange: function onChange(unit) {
              return updateShadow({
                vertical: _objectSpread(_objectSpread({}, localShadow.vertical), {}, {
                  unit: unit
                })
              });
            }
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(BaseControl, {
        label: __("Blur Radius"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
          className: "ffblock-unit-control",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
            type: "number",
            className: "components-text-control__input",
            value: ((_localShadow$blur2 = localShadow.blur) === null || _localShadow$blur2 === void 0 ? void 0 : _localShadow$blur2.value) || '',
            onChange: function onChange(e) {
              return updateShadow({
                blur: _objectSpread(_objectSpread({}, localShadow.blur), {}, {
                  value: e.target.value
                })
              });
            },
            min: "0",
            max: "100",
            placeholder: "0"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SelectControl, {
            value: ((_localShadow$blur3 = localShadow.blur) === null || _localShadow$blur3 === void 0 ? void 0 : _localShadow$blur3.unit) || 'px',
            options: unitOptions,
            onChange: function onChange(unit) {
              return updateShadow({
                blur: _objectSpread(_objectSpread({}, localShadow.blur), {}, {
                  unit: unit
                })
              });
            }
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(BaseControl, {
        label: __("Spread Radius"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
          className: "ffblock-unit-control",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
            type: "number",
            className: "components-text-control__input",
            value: ((_localShadow$spread2 = localShadow.spread) === null || _localShadow$spread2 === void 0 ? void 0 : _localShadow$spread2.value) || '',
            onChange: function onChange(e) {
              return updateShadow({
                spread: _objectSpread(_objectSpread({}, localShadow.spread), {}, {
                  value: e.target.value
                })
              });
            },
            min: "-50",
            max: "50",
            placeholder: "0"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SelectControl, {
            value: ((_localShadow$spread3 = localShadow.spread) === null || _localShadow$spread3 === void 0 ? void 0 : _localShadow$spread3.unit) || 'px',
            options: unitOptions,
            onChange: function onChange(unit) {
              return updateShadow({
                spread: _objectSpread(_objectSpread({}, localShadow.spread), {}, {
                  unit: unit
                })
              });
            }
          })]
        })
      })]
    })]
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentBoxShadowControl);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentColorPicker.js":
/*!******************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentColorPicker.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Fluent Forms Custom Color Picker Component
 */
var _wp$components = wp.components,
  Button = _wp$components.Button,
  Flex = _wp$components.Flex,
  Popover = _wp$components.Popover,
  ColorPalette = _wp$components.ColorPalette;
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useRef = _wp$element.useRef,
  useEffect = _wp$element.useEffect;

// Custom Color Picker Component with direct ColorPicker and conditional reset button
var FluentColorPicker = function FluentColorPicker(_ref) {
  var label = _ref.label,
    value = _ref.value,
    _onChange = _ref.onChange,
    _ref$defaultColor = _ref.defaultColor,
    defaultColor = _ref$defaultColor === void 0 ? '' : _ref$defaultColor,
    _ref$styles = _ref.styles,
    styles = _ref$styles === void 0 ? {} : _ref$styles;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    isOpen = _useState2[0],
    setIsOpen = _useState2[1];
  var _useState3 = useState(value || defaultColor),
    _useState4 = _slicedToArray(_useState3, 2),
    currentColor = _useState4[0],
    setCurrentColor = _useState4[1];
  var _useState5 = useState(false),
    _useState6 = _slicedToArray(_useState5, 2),
    isTransparent = _useState6[0],
    setIsTransparent = _useState6[1];
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isColorChanged = _useState8[0],
    setIsColorChanged = _useState8[1];
  var containerRef = useRef(null);
  var buttonRef = useRef(null);
  var popoverRef = useRef(null);

  // Update currentColor when value changes from outside
  useEffect(function () {
    setCurrentColor(value || '');
  }, [value]);
  useEffect(function () {
    setIsColorChanged(currentColor !== defaultColor && currentColor !== undefined && currentColor !== null);
  }, [currentColor, defaultColor]);
  var toggleColorPicker = function toggleColorPicker(e) {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  var resetToDefault = function resetToDefault() {
    setCurrentColor(defaultColor);
    _onChange(defaultColor);
  };

  // Handle clicks outside to close the color picker
  useEffect(function () {
    if (!isOpen) return;
    var handleOutsideClick = function handleOutsideClick(event) {
      // Don't close if clicking on WordPress color picker elements
      if (event.target.closest('.components-color-picker, .components-color-palette')) {
        return;
      }

      // Check if the click is outside both the button and popover content
      if (buttonRef.current && !buttonRef.current.contains(event.target) && popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Use capture phase to handle before other handlers
    document.addEventListener('mousedown', handleOutsideClick, true);
    return function () {
      document.removeEventListener('mousedown', handleOutsideClick, true);
    };
  }, [isOpen]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "ffblock-control-field ffblock-control-color-wrap",
    ref: containerRef,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(Flex, {
      align: "center",
      justify: "space-between",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
        className: "ffblock-label",
        children: label
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "ffblock-flex-gap",
        children: [isColorChanged && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
          icon: "image-rotate",
          isSmall: true,
          onClick: resetToDefault,
          label: "Reset to default",
          className: "ffblock-reset-button"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
          className: "ffblock-color-button",
          onClick: toggleColorPicker,
          ref: buttonRef,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
            className: "ffblock-color-swatch ".concat(isTransparent ? 'ffblock-color-transparent-pattern' : ''),
            style: {
              backgroundColor: currentColor || "transparent"
            },
            title: currentColor || 'transparent'
          })
        })]
      })]
    }), isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Popover, {
      onClose: function onClose() {},
      anchor: buttonRef.current,
      focusOnMount: false,
      noArrow: false,
      position: "middle right",
      expandOnMobile: true,
      className: "ffblock-color-popover",
      offset: 16,
      flip: true,
      resize: true,
      __unstableSlotName: "ffblock-popover-content",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "ffblock-popover-content",
        ref: popoverRef,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          className: "ffblock-color-picker-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
            children: "Select Color"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
            className: "ffblock-color-picker-close",
            onClick: function onClick() {
              return setIsOpen(false);
            },
            icon: "no-alt",
            isSmall: true,
            label: "Close"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(ColorPalette, {
          colors: [{
            name: 'Theme Blue',
            color: '#72aee6'
          }, {
            name: 'Theme Red',
            color: '#e65054'
          }, {
            name: 'Theme Green',
            color: '#68de7c'
          }, {
            name: 'Black',
            color: '#000000'
          }, {
            name: 'White',
            color: '#ffffff'
          }, {
            name: 'Gray',
            color: '#dddddd'
          }],
          value: currentColor,
          onChange: function onChange(color) {
            setCurrentColor(color);
            _onChange(color);
            setTimeout(function () {
              setIsOpen(false);
            }, 100);
          },
          enableAlpha: true,
          clearable: true
        })]
      })
    })]
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentColorPicker);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentSeparator.js":
/*!****************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentSeparator.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");

/**
 * Fluent Forms Separator Component
 */

var __ = wp.i18n.__;

/**
 * Fluent Forms Separator Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Optional label to display in the separator
 * @param {string} props.className Additional CSS class
 * @param {string} props.style Style of separator (default, dashed, dotted)
 */
var FluentSeparator = function FluentSeparator(_ref) {
  var _ref$label = _ref.label,
    label = _ref$label === void 0 ? '' : _ref$label,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? '' : _ref$className,
    _ref$style = _ref.style,
    style = _ref$style === void 0 ? 'default' : _ref$style;
  var separatorClass = "fluent-separator fluent-separator-".concat(style, " ").concat(className);
  if (label) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
      className: separatorClass,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
        className: "fluent-separator-label",
        children: label
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("hr", {
    className: separatorClass
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentSeparator);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentSpaceControl.js":
/*!*******************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentSpaceControl.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }

function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Fluent Forms Custom Space/Margin/Padding Control
 */

var _wp$components = wp.components,
  Button = _wp$components.Button,
  ButtonGroup = _wp$components.ButtonGroup,
  TextControl = _wp$components.TextControl,
  Flex = _wp$components.Flex,
  FlexItem = _wp$components.FlexItem,
  FlexBlock = _wp$components.FlexBlock,
  Tooltip = _wp$components.Tooltip,
  DropdownMenu = _wp$components.DropdownMenu;
var _ref = wp.blockEditor || wp.editor,
  Icon = _ref.Icon;
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect;
var __ = wp.i18n.__;

// Custom Space/Margin/Padding Control
var FluentSpaceControl = function FluentSpaceControl(_ref2) {
  var label = _ref2.label,
    values = _ref2.values,
    onChange = _ref2.onChange,
    _ref2$units = _ref2.units,
    units = _ref2$units === void 0 ? [{
      value: 'px',
      key: 'px-unit'
    }, {
      value: 'em',
      key: 'em-unit'
    }, {
      value: '%',
      key: 'percent-unit'
    }] : _ref2$units;
  // Initialize state from props or defaults
  var _useState = useState('desktop'),
    _useState2 = _slicedToArray(_useState, 2),
    activeDevice = _useState2[0],
    setActiveDevice = _useState2[1];
  // Initialize isLinked based on values if available
  var initialLinkedState = values && values[activeDevice] && values[activeDevice].linked !== undefined ? values[activeDevice].linked : true;
  var _useState3 = useState(initialLinkedState),
    _useState4 = _slicedToArray(_useState3, 2),
    isLinked = _useState4[0],
    setIsLinked = _useState4[1];
  var _useState5 = useState('px'),
    _useState6 = _slicedToArray(_useState5, 2),
    activeUnit = _useState6[0],
    setActiveUnit = _useState6[1];
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    hasModifiedValues = _useState8[0],
    setHasModifiedValues = _useState8[1];
  var _useState9 = useState({}),
    _useState0 = _slicedToArray(_useState9, 2),
    currentValues = _useState0[0],
    setCurrentValues = _useState0[1];

  // Default values structure
  var defaultValues = {
    desktop: {
      unit: 'px',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      linked: true
    },
    tablet: {
      unit: 'px',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      linked: true
    },
    mobile: {
      unit: 'px',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      linked: true
    }
  };

  // Initialize values on component mount and when props change
  useEffect(function () {
    if (values) {
      var _values$desktop, _values$desktop2, _values$desktop3, _values$desktop4, _values$desktop5, _values$desktop6, _values$tablet, _values$tablet2, _values$tablet3, _values$tablet4, _values$tablet5, _values$tablet6, _values$mobile, _values$mobile2, _values$mobile3, _values$mobile4, _values$mobile5, _values$mobile6;
      // Create a properly structured object with all required properties
      var structuredValues = {
        desktop: {
          unit: ((_values$desktop = values.desktop) === null || _values$desktop === void 0 ? void 0 : _values$desktop.unit) || values.unit || 'px',
          top: ((_values$desktop2 = values.desktop) === null || _values$desktop2 === void 0 ? void 0 : _values$desktop2.top) || '',
          right: ((_values$desktop3 = values.desktop) === null || _values$desktop3 === void 0 ? void 0 : _values$desktop3.right) || '',
          bottom: ((_values$desktop4 = values.desktop) === null || _values$desktop4 === void 0 ? void 0 : _values$desktop4.bottom) || '',
          left: ((_values$desktop5 = values.desktop) === null || _values$desktop5 === void 0 ? void 0 : _values$desktop5.left) || '',
          linked: ((_values$desktop6 = values.desktop) === null || _values$desktop6 === void 0 ? void 0 : _values$desktop6.linked) !== undefined ? values.desktop.linked : true
        },
        tablet: {
          unit: ((_values$tablet = values.tablet) === null || _values$tablet === void 0 ? void 0 : _values$tablet.unit) || values.unit || 'px',
          top: ((_values$tablet2 = values.tablet) === null || _values$tablet2 === void 0 ? void 0 : _values$tablet2.top) || '',
          right: ((_values$tablet3 = values.tablet) === null || _values$tablet3 === void 0 ? void 0 : _values$tablet3.right) || '',
          bottom: ((_values$tablet4 = values.tablet) === null || _values$tablet4 === void 0 ? void 0 : _values$tablet4.bottom) || '',
          left: ((_values$tablet5 = values.tablet) === null || _values$tablet5 === void 0 ? void 0 : _values$tablet5.left) || '',
          linked: ((_values$tablet6 = values.tablet) === null || _values$tablet6 === void 0 ? void 0 : _values$tablet6.linked) !== undefined ? values.tablet.linked : true
        },
        mobile: {
          unit: ((_values$mobile = values.mobile) === null || _values$mobile === void 0 ? void 0 : _values$mobile.unit) || values.unit || 'px',
          top: ((_values$mobile2 = values.mobile) === null || _values$mobile2 === void 0 ? void 0 : _values$mobile2.top) || '',
          right: ((_values$mobile3 = values.mobile) === null || _values$mobile3 === void 0 ? void 0 : _values$mobile3.right) || '',
          bottom: ((_values$mobile4 = values.mobile) === null || _values$mobile4 === void 0 ? void 0 : _values$mobile4.bottom) || '',
          left: ((_values$mobile5 = values.mobile) === null || _values$mobile5 === void 0 ? void 0 : _values$mobile5.left) || '',
          linked: ((_values$mobile6 = values.mobile) === null || _values$mobile6 === void 0 ? void 0 : _values$mobile6.linked) !== undefined ? values.mobile.linked : true
        }
      };
      setCurrentValues(structuredValues);
      // Ensure isLinked is properly set based on the current device's linked property
      setIsLinked(structuredValues[activeDevice].linked !== false);
      setActiveUnit(structuredValues[activeDevice].unit || 'px');
      setHasModifiedValues(checkForModifiedValues(structuredValues));
    }
  }, [values, activeDevice]);

  // Helper function to check if any spacing values have been set
  var checkForModifiedValues = function checkForModifiedValues(values) {
    // Check all devices for any non-empty, non-zero values
    var devices = ['desktop', 'tablet', 'mobile'];
    for (var _i = 0, _devices = devices; _i < _devices.length; _i++) {
      var device = _devices[_i];
      if (values[device]) {
        var _deviceValues = values[device];
        // Check if any value is set and not empty or zero
        if (_deviceValues.top && _deviceValues.top !== 0 && _deviceValues.top !== '' || _deviceValues.right && _deviceValues.right !== 0 && _deviceValues.right !== '' || _deviceValues.bottom && _deviceValues.bottom !== 0 && _deviceValues.bottom !== '' || _deviceValues.left && _deviceValues.left !== 0 && _deviceValues.left !== '') {
          return true;
        }
      }
    }
    return false;
  };

  // Set initial state from props and update when device changes
  useEffect(function () {
    if (currentValues[activeDevice]) {
      // Explicitly set isLinked based on the current device's linked property
      setIsLinked(currentValues[activeDevice].linked !== false);

      // Check for unit at the top level first, then in the device object
      if (currentValues.unit) {
        setActiveUnit(currentValues.unit);
      } else if (currentValues[activeDevice].unit) {
        setActiveUnit(currentValues[activeDevice].unit);
      } else {
        setActiveUnit('px');
      }

      // Check if any values have been modified
      setHasModifiedValues(checkForModifiedValues(currentValues));
    }
  }, [activeDevice, currentValues]);
  var handleUnitChange = function handleUnitChange(unit) {
    setActiveUnit(unit);

    // Create a new values object with the updated unit
    var updatedValues = _objectSpread(_objectSpread({}, currentValues), {}, {
      unit: unit // Set unit at the top level
    });

    // Also update the unit in each device object for backward compatibility
    ['desktop', 'tablet', 'mobile'].forEach(function (device) {
      if (updatedValues[device]) {
        updatedValues[device] = _objectSpread(_objectSpread({}, updatedValues[device]), {}, {
          unit: unit
        });
      }
    });

    // Call the onChange callback with the updated values
    onChange(updatedValues);
  };
  var toggleLinked = function toggleLinked() {
    var newLinkedState = !isLinked;
    setIsLinked(newLinkedState);

    // Create a new values object with the updated linked state
    var updatedValues = _objectSpread(_objectSpread({}, currentValues), {}, _defineProperty({}, activeDevice, _objectSpread(_objectSpread({}, currentValues[activeDevice]), {}, {
      linked: newLinkedState
    })));

    // Update the parent component's state
    onChange(updatedValues);
  };
  var updateValues = function updateValues(newDeviceValues) {
    // Make sure the unit is always included in the values
    var updatedValues = _objectSpread(_objectSpread({}, currentValues), {}, _defineProperty({
      unit: activeUnit
    }, activeDevice, _objectSpread(_objectSpread({}, newDeviceValues), {}, {
      unit: activeUnit,
      // Also ensure unit is in the device object
      linked: isLinked // Explicitly preserve the linked state
    })));
    onChange(updatedValues);
  };
  var handleValueChange = function handleValueChange(position, value) {
    var numValue = value === '' ? '' : parseInt(value);

    // Set the modified flag if the value is not empty
    if (value !== '') {
      setHasModifiedValues(true);
    } else {
      // If the value is empty, check if any other values exist
      var updatedValues = _objectSpread({}, currentValues);
      var _deviceValues2 = _objectSpread({}, updatedValues[activeDevice]);
      _deviceValues2[position] = numValue;
      updatedValues[activeDevice] = _deviceValues2;
      setHasModifiedValues(checkForModifiedValues(updatedValues));
    }

    // If linked, update all values
    if (isLinked && position !== 'unit') {
      var _updatedValues = _objectSpread({}, currentValues);
      var updatedDeviceValues = _objectSpread({}, _updatedValues[activeDevice]);

      // Update all positions with the same value
      updatedDeviceValues.top = numValue;
      updatedDeviceValues.right = numValue;
      updatedDeviceValues.bottom = numValue;
      updatedDeviceValues.left = numValue;

      // Explicitly preserve the linked state
      updatedDeviceValues.linked = true;

      // Update the device values
      _updatedValues[activeDevice] = updatedDeviceValues;

      // Update local state
      setCurrentValues(_updatedValues);

      // Call onChange with updated values
      if (onChange) {
        onChange(_updatedValues);
      }
    } else {
      // Update just the changed position
      var _updatedValues2 = _objectSpread({}, currentValues);
      var _updatedDeviceValues = _objectSpread({}, _updatedValues2[activeDevice]);
      _updatedDeviceValues[position] = numValue;

      // Explicitly preserve the linked state
      _updatedDeviceValues.linked = isLinked;
      _updatedValues2[activeDevice] = _updatedDeviceValues;

      // Update local state
      setCurrentValues(_updatedValues2);

      // Call onChange with updated values
      if (onChange) {
        onChange(_updatedValues2);
      }
    }
  };
  var deviceValues = currentValues[activeDevice] || defaultValues[activeDevice];

  // Handler for reset button
  var handleReset = function handleReset() {
    // Reset to default values
    setIsLinked(true);
    setActiveUnit('px');
    setHasModifiedValues(false);

    // Create empty values
    var emptyValues = {
      desktop: {
        unit: 'px',
        top: '',
        right: '',
        bottom: '',
        left: '',
        linked: true
      },
      tablet: {
        unit: 'px',
        top: '',
        right: '',
        bottom: '',
        left: '',
        linked: true
      },
      mobile: {
        unit: 'px',
        top: '',
        right: '',
        bottom: '',
        left: '',
        linked: true
      }
    };

    // Update local state
    setCurrentValues(emptyValues);

    // Call onChange with empty values
    if (onChange) {
      onChange(emptyValues);
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "ffblock-control-field ffblock-control-space",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
      className: "ffblock-space-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
        className: "ffblock-label-container",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          className: "ffblock-label",
          children: label
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
        children: hasModifiedValues && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Tooltip, {
          text: __('Reset spacing values'),
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
            onClick: handleReset,
            className: "ffblock-reset-button",
            icon: "image-rotate",
            isSmall: true
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "ffblock-space-controls",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
          className: "ffblock-device-selector",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(DropdownMenu, {
            className: "ffblock-device-dropdown",
            icon: activeDevice === 'desktop' ? 'desktop' : activeDevice === 'tablet' ? 'tablet' : 'smartphone',
            label: __('Select device'),
            controls: [{
              value: 'desktop',
              label: __('Desktop'),
              icon: 'desktop'
            }, {
              value: 'tablet',
              label: __('Tablet'),
              icon: 'tablet'
            }, {
              value: 'mobile',
              label: __('Mobile'),
              icon: 'smartphone'
            }].map(function (device) {
              return {
                title: device.label,
                icon: device.icon,
                isActive: activeDevice === device.value,
                onClick: function onClick() {
                  setActiveDevice(device.value);
                  // Update isLinked based on the selected device's linked property
                  if (currentValues[device.value]) {
                    setIsLinked(currentValues[device.value].linked !== false);
                  }
                }
              };
            })
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
          className: "ffblock-unit-selector",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(ButtonGroup, {
            children: units.map(function (unit) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
                isSmall: true,
                isPrimary: activeUnit === unit.value,
                onClick: function onClick() {
                  return handleUnitChange(unit.value);
                },
                children: unit.value.toUpperCase()
              }, unit.key);
            })
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
      className: "ffblock-space-inputs device-".concat(activeDevice),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "ffblock-space-input-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(TextControl, {
            type: "number",
            value: deviceValues.top,
            onChange: function onChange(value) {
              return handleValueChange('top', value);
            },
            min: 0
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
            children: "TOP"
          }, "label-top")]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(TextControl, {
            type: "number",
            value: deviceValues.right,
            onChange: function onChange(value) {
              return handleValueChange('right', value);
            },
            min: 0
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
            children: "RIGHT"
          }, "label-right")]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(TextControl, {
            type: "number",
            value: deviceValues.bottom,
            onChange: function onChange(value) {
              return handleValueChange('bottom', value);
            },
            min: 0
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
            children: "BOTTOM"
          }, "label-right")]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(TextControl, {
            type: "number",
            value: deviceValues.left,
            onChange: function onChange(value) {
              return handleValueChange('left', value);
            },
            min: 0
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
            children: "LEFT"
          }, "label-left")]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
          icon: isLinked ? 'admin-links' : 'editor-unlink',
          onClick: toggleLinked,
          className: "ffblock-linked-button"
        })]
      })
    })]
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentSpaceControl);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentTypography.js":
/*!*****************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentTypography.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }

function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Fluent Forms Custom Typography Control Component
 */
var _wp$components = wp.components,
  Button = _wp$components.Button,
  Flex = _wp$components.Flex,
  Popover = _wp$components.Popover,
  FontSizePicker = _wp$components.FontSizePicker,
  SelectControl = _wp$components.SelectControl;
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect;

/**
 * Typography control component for Fluent Forms
 *
 * @param {Object} props Component properties
 * @param {string} props.label Label for the control
 * @param {Object} props.settings Typography settings object
 * @param {Function} props.onChange Callback when settings change
 * @returns {JSX.Element} Typography control component
 */
var FluentTypography = function FluentTypography(_ref) {
  var label = _ref.label,
    settings = _ref.settings,
    onChange = _ref.onChange;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    isOpen = _useState2[0],
    setIsOpen = _useState2[1];

  // Local state for typography properties
  var _useState3 = useState(settings.fontSize || ''),
    _useState4 = _slicedToArray(_useState3, 2),
    localFontSize = _useState4[0],
    setLocalFontSize = _useState4[1];
  var _useState5 = useState(settings.fontWeight || '400'),
    _useState6 = _slicedToArray(_useState5, 2),
    localFontWeight = _useState6[0],
    setLocalFontWeight = _useState6[1];
  var _useState7 = useState(settings.lineHeight || ''),
    _useState8 = _slicedToArray(_useState7, 2),
    localLineHeight = _useState8[0],
    setLocalLineHeight = _useState8[1];
  var _useState9 = useState(settings.letterSpacing || ''),
    _useState0 = _slicedToArray(_useState9, 2),
    localLetterSpacing = _useState0[0],
    setLocalLetterSpacing = _useState0[1];
  var _useState1 = useState(settings.textTransform || 'none'),
    _useState10 = _slicedToArray(_useState1, 2),
    localTextTransform = _useState10[0],
    setLocalTextTransform = _useState10[1];

  // Update local state when settings change
  useEffect(function () {
    setLocalFontSize(settings.fontSize || '');
    setLocalFontWeight(settings.fontWeight || '400');
    setLocalLineHeight(settings.lineHeight || '');
    setLocalLetterSpacing(settings.letterSpacing || '');
    setLocalTextTransform(settings.textTransform || 'none');
  }, [settings]);

  // Default values and options
  var defaultValues = {
    fontSize: '',
    fontWeight: '400',
    lineHeight: '',
    letterSpacing: '',
    textTransform: 'none'
  };
  var fontWeightOptions = [{
    value: '300',
    label: 'Light (300)'
  }, {
    value: '400',
    label: 'Regular (400)'
  }, {
    value: '500',
    label: 'Medium (500)'
  }, {
    value: '600',
    label: 'Semi Bold (600)'
  }, {
    value: '700',
    label: 'Bold (700)'
  }, {
    value: '800',
    label: 'Extra Bold (800)'
  }];
  var textTransformOptions = [{
    value: 'none',
    label: 'None'
  }, {
    value: 'capitalize',
    label: 'Capitalize'
  }, {
    value: 'uppercase',
    label: 'UPPERCASE'
  }, {
    value: 'lowercase',
    label: 'lowercase'
  }];

  // Toggle popover
  var togglePopover = function togglePopover() {
    return setIsOpen(!isOpen);
  };

  /**
   * Update a typography setting
   *
   * @param {string} property Property to update
   * @param {any} value New value
   */
  var updateSetting = function updateSetting(property, value) {
    // Update local state based on property
    switch (property) {
      case 'fontSize':
        setLocalFontSize(value);
        break;
      case 'fontWeight':
        setLocalFontWeight(value);
        break;
      case 'lineHeight':
        setLocalLineHeight(value);
        break;
      case 'letterSpacing':
        setLocalLetterSpacing(value);
        break;
      case 'textTransform':
        setLocalTextTransform(value);
        break;
    }

    // Call onChange with only the changed property
    onChange(_defineProperty({}, property, value));
  };

  /**
   * Check if any typography settings have changed from defaults
   *
   * @returns {boolean} True if any setting has changed
   */
  var isFontChanged = function isFontChanged() {
    // Check if any property has a non-default value
    return localFontSize !== '' && localFontSize != null || localFontWeight !== defaultValues.fontWeight || localLineHeight !== '' && localLineHeight != null || localLetterSpacing !== '' && localLetterSpacing != null || localTextTransform !== defaultValues.textTransform;
  };

  /**
   * Reset all typography settings to defaults
   */
  var resetToDefault = function resetToDefault() {
    // Create reset values object with a special reset flag
    var resetValues = _objectSpread({
      reset: true
    }, defaultValues);

    // Update local state
    setLocalFontSize(defaultValues.fontSize);
    setLocalFontWeight(defaultValues.fontWeight);
    setLocalLineHeight(defaultValues.lineHeight);
    setLocalLetterSpacing(defaultValues.letterSpacing);
    setLocalTextTransform(defaultValues.textTransform);

    // Close the popover if it's open
    if (isOpen) {
      setIsOpen(false);
    }

    // Call onChange with reset values
    onChange(resetValues);
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "ffblock-control-field ffblock-control-typography-wrap",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(Flex, {
      align: "center",
      justify: "space-between",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
        className: "ffblock-label",
        children: label
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "ffblock-flex-gap",
        children: [isFontChanged() && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
          icon: "image-rotate",
          isSmall: true,
          onClick: resetToDefault,
          label: "Reset to default",
          className: "ffblock-reset-button"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Button, {
          icon: "edit",
          isSmall: true,
          onClick: togglePopover,
          className: "fluent-typography-edit-btn"
        })]
      })]
    }), isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Popover, {
      className: "fluent-typography-popover",
      onClose: togglePopover,
      position: "bottom center",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "ffblock-popover-content",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(FontSizePicker, {
          fontSizes: [{
            name: 'Small',
            slug: 'small',
            size: 12
          }, {
            name: 'Medium',
            slug: 'medium',
            size: 16
          }, {
            name: 'Large',
            slug: 'large',
            size: 24
          }, {
            name: 'Extra Large',
            slug: 'x-large',
            size: 32
          }],
          value: localFontSize,
          onChange: function onChange(value) {
            return updateSetting('fontSize', value);
          },
          withSlider: true
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(SelectControl, {
          label: "Font Weight",
          value: localFontWeight,
          options: fontWeightOptions,
          onChange: function onChange(value) {
            return updateSetting('fontWeight', value);
          }
        })]
      })
    }, "typo-popover")]
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentTypography);

/***/ }),

/***/ "./guten_block/src/components/controls/FluentUnitControl.js":
/*!******************************************************************!*\
  !*** ./guten_block/src/components/controls/FluentUnitControl.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");

var _wp$components = wp.components,
  BaseControl = _wp$components.BaseControl,
  SelectControl = _wp$components.SelectControl;
var __ = wp.i18n.__;
var FluentUnitControl = function FluentUnitControl(_ref) {
  var label = _ref.label,
    value = _ref.value,
    _onChange = _ref.onChange,
    unit = _ref.unit,
    onUnitChange = _ref.onUnitChange,
    _ref$min = _ref.min,
    min = _ref$min === void 0 ? -100 : _ref$min,
    _ref$max = _ref.max,
    max = _ref$max === void 0 ? 100 : _ref$max,
    _ref$placeholder = _ref.placeholder,
    placeholder = _ref$placeholder === void 0 ? "0" : _ref$placeholder,
    _ref$units = _ref.units,
    units = _ref$units === void 0 ? [{
      label: 'px',
      value: 'px'
    }, {
      label: 'em',
      value: 'em'
    }, {
      label: '%',
      value: '%'
    }] : _ref$units;
  var unitOptions = units.map(function (unit) {
    return {
      label: unit.label,
      value: unit.value
    };
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(BaseControl, {
    label: label,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
      className: "fluent-form-unit-control",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
        type: "number",
        value: value || '',
        onChange: function onChange(e) {
          return _onChange(e.target.value);
        },
        min: min,
        max: max,
        placeholder: placeholder
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(SelectControl, {
        value: unit || 'px',
        options: unitOptions,
        onChange: onUnitChange
      })]
    })
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentUnitControl);

/***/ }),

/***/ "./guten_block/src/components/tabs/TabGeneral.js":
/*!*******************************************************!*\
  !*** ./guten_block/src/components/tabs/TabGeneral.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _controls_FluentTypography__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../controls/FluentTypography */ "./guten_block/src/components/controls/FluentTypography.js");
/* harmony import */ var _controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../controls/FluentColorPicker */ "./guten_block/src/components/controls/FluentColorPicker.js");
/* harmony import */ var _controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../controls/FluentSpaceControl */ "./guten_block/src/components/controls/FluentSpaceControl.js");
/* harmony import */ var _controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../controls/FluentBorderControl */ "./guten_block/src/components/controls/FluentBorderControl.js");
/* harmony import */ var _controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../controls/FluentBoxShadowControl */ "./guten_block/src/components/controls/FluentBoxShadowControl.js");
/* harmony import */ var _controls_FluentAlignmentControl__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../controls/FluentAlignmentControl */ "./guten_block/src/components/controls/FluentAlignmentControl.js");
/* harmony import */ var _controls_FluentSeparator__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../controls/FluentSeparator */ "./guten_block/src/components/controls/FluentSeparator.js");
/* harmony import */ var _utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/TypographyUtils */ "./guten_block/src/components/utils/TypographyUtils.js");
/* harmony import */ var _utils_ComponentUtils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/ComponentUtils */ "./guten_block/src/components/utils/ComponentUtils.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useRef = _wp$element.useRef,
  useEffect = _wp$element.useEffect,
  memo = _wp$element.memo;
var __ = wp.i18n.__;
var _wp$components = wp.components,
  PanelBody = _wp$components.PanelBody,
  SelectControl = _wp$components.SelectControl,
  PanelRow = _wp$components.PanelRow,
  RangeControl = _wp$components.RangeControl,
  TabPanel = _wp$components.TabPanel;
var useSelect = wp.data.useSelect;

// Custom components










// Constants

var DEFAULT_COLORS = [{
  name: 'Theme Blue',
  color: '#72aee6'
}, {
  name: 'Theme Red',
  color: '#e65054'
}, {
  name: 'Theme Green',
  color: '#68de7c'
}, {
  name: 'Black',
  color: '#000000'
}, {
  name: 'White',
  color: '#ffffff'
}, {
  name: 'Gray',
  color: '#dddddd'
}];

/**
 * Component for form style template selection
 */
var StyleTemplatePanel = function StyleTemplatePanel(_ref) {
  var attributes = _ref.attributes,
    setAttributes = _ref.setAttributes,
    handlePresetChange = _ref.handlePresetChange;
  var config = window.fluentform_block_vars;
  var presets = config.style_presets;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(PanelBody, {
    title: __("Form Style Template"),
    initialOpen: true,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(SelectControl, {
      label: __("Choose a Template"),
      value: attributes.themeStyle,
      options: presets,
      onChange: function onChange(themeStyle) {
        setAttributes({
          themeStyle: themeStyle,
          isThemeChange: true
        });
        if (handlePresetChange) {
          handlePresetChange(themeStyle);
        }
      }
    })
  });
};

/**
 * Component for label styling options
 */
var LabelStylesPanel = function LabelStylesPanel(_ref2) {
  var _attributes$styles$la, _attributes$styles$la2, _attributes$styles$la3, _attributes$styles$la4, _attributes$styles$la5;
  var attributes = _ref2.attributes,
    updateStyles = _ref2.updateStyles;
  var handleTypographyChange = function handleTypographyChange(changedTypo, key) {
    var updatedTypography = (0,_utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_7__.getUpdatedTypography)(changedTypo, attributes, key);
    updateStyles(_defineProperty({}, key, updatedTypography));
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(PanelBody, {
    title: __("Label Styles"),
    initialOpen: false,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
      label: "Color",
      value: attributes.styles.labelColor,
      onChange: function onChange(value) {
        return updateStyles({
          labelColor: value
        });
      },
      defaultColor: ""
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentTypography__WEBPACK_IMPORTED_MODULE_0__["default"], {
      label: "Typography",
      settings: {
        fontSize: ((_attributes$styles$la = attributes.styles.labelTypography) === null || _attributes$styles$la === void 0 || (_attributes$styles$la = _attributes$styles$la.size) === null || _attributes$styles$la === void 0 ? void 0 : _attributes$styles$la.lg) || '',
        fontWeight: ((_attributes$styles$la2 = attributes.styles.labelTypography) === null || _attributes$styles$la2 === void 0 ? void 0 : _attributes$styles$la2.weight) || '400',
        lineHeight: ((_attributes$styles$la3 = attributes.styles.labelTypography) === null || _attributes$styles$la3 === void 0 ? void 0 : _attributes$styles$la3.lineHeight) || '',
        letterSpacing: ((_attributes$styles$la4 = attributes.styles.labelTypography) === null || _attributes$styles$la4 === void 0 ? void 0 : _attributes$styles$la4.letterSpacing) || '',
        textTransform: ((_attributes$styles$la5 = attributes.styles.labelTypography) === null || _attributes$styles$la5 === void 0 ? void 0 : _attributes$styles$la5.textTransform) || 'none'
      },
      onChange: function onChange(changedTypo) {
        return handleTypographyChange(changedTypo, 'labelTypography');
      }
    })]
  });
};

/**
 * Component for input and textarea styling options
 */
var InputStylesPanel = function InputStylesPanel(_ref3) {
  var attributes = _ref3.attributes,
    updateStyles = _ref3.updateStyles;
  var handleTypographyChange = function handleTypographyChange(changedTypo, key) {
    var updatedTypography = (0,_utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_7__.getUpdatedTypography)(changedTypo, attributes, key);
    updateStyles(_defineProperty({}, key, updatedTypography));
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(PanelBody, {
    title: __("Input & Textarea"),
    initialOpen: false,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(TabPanel, {
      className: "input-styles-tabs",
      activeClass: "is-active",
      tabs: [{
        name: 'normal',
        title: __('Normal'),
        className: 'tab-normal'
      }, {
        name: 'focus',
        title: __('Focus'),
        className: 'tab-focus'
      }],
      children: function children(tab) {
        if (tab.name === 'normal') {
          var _attributes$styles, _attributes$styles2, _attributes$styles$in, _attributes$styles$in2, _attributes$styles$in3, _attributes$styles$in4, _attributes$styles$in5;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Text Color",
              value: ((_attributes$styles = attributes.styles) === null || _attributes$styles === void 0 ? void 0 : _attributes$styles.inputTextColor) || '',
              onChange: function onChange(value) {
                updateStyles({
                  inputTextColor: value
                });
              },
              defaultColor: ""
            }, "input-text-color-normal"), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Background Color",
              value: ((_attributes$styles2 = attributes.styles) === null || _attributes$styles2 === void 0 ? void 0 : _attributes$styles2.inputBackgroundColor) || '',
              styles: attributes.styles,
              onChange: function onChange(value) {
                updateStyles({
                  inputBackgroundColor: value
                });
              },
              defaultColor: ""
            }, "input-bg-color-normal"), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentTypography__WEBPACK_IMPORTED_MODULE_0__["default"], {
              label: "Typography",
              settings: {
                fontSize: ((_attributes$styles$in = attributes.styles.inputTypography) === null || _attributes$styles$in === void 0 || (_attributes$styles$in = _attributes$styles$in.size) === null || _attributes$styles$in === void 0 ? void 0 : _attributes$styles$in.lg) || '',
                fontWeight: ((_attributes$styles$in2 = attributes.styles.inputTypography) === null || _attributes$styles$in2 === void 0 ? void 0 : _attributes$styles$in2.weight) || '400',
                lineHeight: ((_attributes$styles$in3 = attributes.styles.inputTypography) === null || _attributes$styles$in3 === void 0 ? void 0 : _attributes$styles$in3.lineHeight) || '',
                letterSpacing: ((_attributes$styles$in4 = attributes.styles.inputTypography) === null || _attributes$styles$in4 === void 0 ? void 0 : _attributes$styles$in4.letterSpacing) || '',
                textTransform: ((_attributes$styles$in5 = attributes.styles.inputTypography) === null || _attributes$styles$in5 === void 0 ? void 0 : _attributes$styles$in5.textTransform) || 'none'
              },
              onChange: function onChange(changedTypo) {
                return handleTypographyChange(changedTypo, 'inputTypography');
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
              label: "Spacing",
              values: attributes.styles.inputSpacing,
              onChange: function onChange(value) {
                return updateStyles({
                  inputSpacing: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_3__["default"], {
              label: __("Border"),
              enabled: attributes.styles.enableInputBorder || false,
              onToggle: function onToggle(value) {
                return updateStyles({
                  enableInputBorder: value
                });
              },
              borderType: attributes.styles.inputBorderType,
              onBorderTypeChange: function onBorderTypeChange(value) {
                return updateStyles({
                  inputBorderType: value
                });
              },
              borderColor: attributes.styles.inputBorderColor,
              onBorderColorChange: function onBorderColorChange(value) {
                return updateStyles({
                  inputBorderColor: value
                });
              },
              borderWidth: attributes.styles.inputBorderWidth,
              onBorderWidthChange: function onBorderWidthChange(value) {
                return updateStyles({
                  inputBorderWidth: value
                });
              },
              borderRadius: attributes.styles.inputBorderRadius,
              onBorderRadiusChange: function onBorderRadiusChange(value) {
                return updateStyles({
                  inputBorderRadius: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_4__["default"], {
              label: __("Box Shadow"),
              shadow: attributes.styles.inputBoxShadow || {},
              onChange: function onChange(shadowObj) {
                return updateStyles({
                  inputBoxShadow: shadowObj
                });
              }
            })]
          });
        } else if (tab.name === 'focus') {
          var _attributes$styles3;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Text Color",
              value: attributes.styles.inputTextFocusColor || '',
              onChange: function onChange(value) {
                updateStyles({
                  inputTextFocusColor: value
                });
              },
              defaultColor: ""
            }, "input-text-color-focus"), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Background Color",
              value: ((_attributes$styles3 = attributes.styles) === null || _attributes$styles3 === void 0 ? void 0 : _attributes$styles3.inputBackgroundFocusColor) || '',
              onChange: function onChange(value) {
                updateStyles({
                  inputBackgroundFocusColor: value
                });
              },
              defaultColor: ""
            }, "input-bg-color-focus"), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
              label: "Spacing",
              values: attributes.styles.inputFocusSpacing,
              onChange: function onChange(value) {
                return updateStyles({
                  inputFocusSpacing: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_3__["default"], {
              label: __("Border"),
              enabled: attributes.styles.enableInputBorderFocus || false,
              onToggle: function onToggle(value) {
                return updateStyles({
                  enableInputBorderFocus: value
                });
              },
              borderType: attributes.styles.inputBorderTypeFocus,
              onBorderTypeChange: function onBorderTypeChange(value) {
                return updateStyles({
                  inputBorderTypeFocus: value
                });
              },
              borderColor: attributes.styles.inputBorderColorFocus,
              onBorderColorChange: function onBorderColorChange(value) {
                return updateStyles({
                  inputBorderColorFocus: value
                });
              },
              borderWidth: attributes.styles.inputBorderWidthFocus,
              onBorderWidthChange: function onBorderWidthChange(value) {
                return updateStyles({
                  inputBorderWidthFocus: value
                });
              },
              borderRadius: attributes.styles.inputBorderRadiusFocus,
              onBorderRadiusChange: function onBorderRadiusChange(value) {
                return updateStyles({
                  inputBorderRadiusFocus: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_4__["default"], {
              label: __("Box Shadow"),
              shadow: attributes.styles.inputBoxShadowFocus || {},
              onChange: function onChange(shadowObj) {
                return updateStyles({
                  inputBoxShadowFocus: shadowObj
                });
              }
            })]
          });
        }
        return null;
      }
    })
  });
};

/**
 * Component for button styling options
 */
var ButtonStylesPanel = function ButtonStylesPanel(_ref4) {
  var attributes = _ref4.attributes,
    updateStyles = _ref4.updateStyles;
  var handleTypographyChange = function handleTypographyChange(changedTypo, key) {
    var updatedTypography = (0,_utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_7__.getUpdatedTypography)(changedTypo, attributes, key);
    updateStyles(_defineProperty({}, key, updatedTypography));
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(PanelBody, {
    title: __('Button Styles'),
    initialOpen: false,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
        className: "ffblock-label",
        children: __('Alignment')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentAlignmentControl__WEBPACK_IMPORTED_MODULE_5__["default"], {
        value: attributes.styles.buttonAlignment,
        onChange: function onChange(value) {
          return updateStyles({
            buttonAlignment: value
          });
        },
        options: [{
          value: 'left',
          icon: 'editor-alignleft',
          label: __('Left')
        }, {
          value: 'center',
          icon: 'editor-aligncenter',
          label: __('Center')
        }, {
          value: 'right',
          icon: 'editor-alignright',
          label: __('Right')
        }]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(RangeControl, {
      label: __('Width (%)'),
      value: attributes.styles.buttonWidth,
      onChange: function onChange(value) {
        return updateStyles({
          buttonWidth: value
        });
      },
      min: 0,
      max: 100,
      allowReset: true,
      initialPosition: 0,
      help: __('Set to 0 for auto width')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(TabPanel, {
      className: "button-styles-tabs",
      activeClass: "is-active",
      tabs: [{
        name: 'normal',
        title: __('Normal'),
        className: 'tab-normal'
      }, {
        name: 'hover',
        title: __('Hover'),
        className: 'tab-hover'
      }],
      children: function children(tab) {
        if (tab.name === 'normal') {
          var _attributes$styles$bu, _attributes$styles$bu2, _attributes$styles$bu3, _attributes$styles$bu4, _attributes$styles$bu5;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Text Color",
              value: attributes.styles.buttonColor,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonColor: value
                });
              },
              defaultColor: "#ffffff"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Background Color",
              value: attributes.styles.buttonBGColor,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonBGColor: value
                });
              },
              defaultColor: "#409EFF"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentTypography__WEBPACK_IMPORTED_MODULE_0__["default"], {
              label: "Typography",
              settings: {
                fontSize: ((_attributes$styles$bu = attributes.styles.buttonTypography) === null || _attributes$styles$bu === void 0 || (_attributes$styles$bu = _attributes$styles$bu.size) === null || _attributes$styles$bu === void 0 ? void 0 : _attributes$styles$bu.lg) || '',
                fontWeight: ((_attributes$styles$bu2 = attributes.styles.buttonTypography) === null || _attributes$styles$bu2 === void 0 ? void 0 : _attributes$styles$bu2.weight) || '500',
                lineHeight: ((_attributes$styles$bu3 = attributes.styles.buttonTypography) === null || _attributes$styles$bu3 === void 0 ? void 0 : _attributes$styles$bu3.lineHeight) || '',
                letterSpacing: ((_attributes$styles$bu4 = attributes.styles.buttonTypography) === null || _attributes$styles$bu4 === void 0 ? void 0 : _attributes$styles$bu4.letterSpacing) || '',
                textTransform: ((_attributes$styles$bu5 = attributes.styles.buttonTypography) === null || _attributes$styles$bu5 === void 0 ? void 0 : _attributes$styles$bu5.textTransform) || 'none'
              },
              onChange: function onChange(changedTypo) {
                return handleTypographyChange(changedTypo, 'buttonTypography');
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
              label: "Padding",
              values: attributes.styles.buttonPadding,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonPadding: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
              label: "Margin",
              values: attributes.styles.buttonMargin,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonMargin: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_4__["default"], {
              label: __("Box Shadow"),
              shadow: attributes.styles.buttonBoxShadow || {},
              onChange: function onChange(shadowObj) {
                return updateStyles({
                  buttonBoxShadow: shadowObj
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_3__["default"], {
              label: __("Border"),
              enabled: attributes.styles.enableButtonBorder || false,
              onToggle: function onToggle(value) {
                return updateStyles({
                  enableButtonBorder: value
                });
              },
              borderType: attributes.styles.buttonBorderType,
              onBorderTypeChange: function onBorderTypeChange(value) {
                return updateStyles({
                  buttonBorderType: value
                });
              },
              borderColor: attributes.styles.buttonBorderColor,
              onBorderColorChange: function onBorderColorChange(value) {
                return updateStyles({
                  buttonBorderColor: value
                });
              },
              borderWidth: attributes.styles.buttonBorderWidth,
              onBorderWidthChange: function onBorderWidthChange(value) {
                return updateStyles({
                  buttonBorderWidth: value
                });
              },
              borderRadius: attributes.styles.buttonBorderRadius,
              onBorderRadiusChange: function onBorderRadiusChange(value) {
                return updateStyles({
                  buttonBorderRadius: value
                });
              }
            })]
          });
        } else if (tab.name === 'hover') {
          var _attributes$styles$bu6, _attributes$styles$bu7, _attributes$styles$bu8, _attributes$styles$bu9, _attributes$styles$bu0;
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Text Color",
              value: attributes.styles.buttonHoverColor,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonHoverColor: value
                });
              },
              defaultColor: "#ffffff"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
              label: "Background Color",
              value: attributes.styles.buttonHoverBGColor,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonHoverBGColor: value
                });
              },
              defaultColor: "#66b1ff"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentTypography__WEBPACK_IMPORTED_MODULE_0__["default"], {
              label: "Typography",
              settings: {
                fontSize: ((_attributes$styles$bu6 = attributes.styles.buttonHoverTypography) === null || _attributes$styles$bu6 === void 0 || (_attributes$styles$bu6 = _attributes$styles$bu6.size) === null || _attributes$styles$bu6 === void 0 ? void 0 : _attributes$styles$bu6.lg) || '',
                fontWeight: ((_attributes$styles$bu7 = attributes.styles.buttonHoverTypography) === null || _attributes$styles$bu7 === void 0 ? void 0 : _attributes$styles$bu7.weight) || '500',
                lineHeight: ((_attributes$styles$bu8 = attributes.styles.buttonHoverTypography) === null || _attributes$styles$bu8 === void 0 ? void 0 : _attributes$styles$bu8.lineHeight) || '',
                letterSpacing: ((_attributes$styles$bu9 = attributes.styles.buttonHoverTypography) === null || _attributes$styles$bu9 === void 0 ? void 0 : _attributes$styles$bu9.letterSpacing) || '',
                textTransform: ((_attributes$styles$bu0 = attributes.styles.buttonHoverTypography) === null || _attributes$styles$bu0 === void 0 ? void 0 : _attributes$styles$bu0.textTransform) || 'none'
              },
              onChange: function onChange(changedTypo) {
                return handleTypographyChange(changedTypo, 'buttonHoverTypography');
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
              label: "Padding",
              values: attributes.styles.buttonHoverPadding,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonHoverPadding: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
              label: "Margin",
              values: attributes.styles.buttonHoverMargin,
              onChange: function onChange(value) {
                return updateStyles({
                  buttonHoverMargin: value
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_4__["default"], {
              label: __("Box Shadow"),
              shadow: attributes.styles.buttonHoverBoxShadow || {},
              onChange: function onChange(shadowObj) {
                return updateStyles({
                  buttonHoverBoxShadow: shadowObj
                });
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_3__["default"], {
              label: __("Border"),
              enabled: attributes.styles.enableButtonHoverBorder || false,
              onToggle: function onToggle(value) {
                return updateStyles({
                  enableButtonHoverBorder: value
                });
              },
              borderType: attributes.styles.buttonHoverBorderType,
              onBorderTypeChange: function onBorderTypeChange(value) {
                return updateStyles({
                  buttonHoverBorderType: value
                });
              },
              borderColor: attributes.styles.buttonHoverBorderColor,
              onBorderColorChange: function onBorderColorChange(value) {
                return updateStyles({
                  buttonHoverBorderColor: value
                });
              },
              borderWidth: attributes.styles.buttonHoverBorderWidth,
              onBorderWidthChange: function onBorderWidthChange(value) {
                return updateStyles({
                  buttonHoverBorderWidth: value
                });
              },
              borderRadius: attributes.styles.buttonHoverBorderRadius,
              onBorderRadiusChange: function onBorderRadiusChange(value) {
                return updateStyles({
                  buttonHoverBorderRadius: value
                });
              }
            })]
          });
        }
        return null;
      }
    })]
  });
};

/**
 * Component for placeholder styling options
 */
var PlaceHolderStylesPanel = function PlaceHolderStylesPanel(_ref5) {
  var _attributes$styles$pl, _attributes$styles$pl2, _attributes$styles$pl3, _attributes$styles$pl4, _attributes$styles$pl5;
  var attributes = _ref5.attributes,
    updateStyles = _ref5.updateStyles;
  var handleTypographyChange = function handleTypographyChange(changedTypo, key) {
    var updatedTypography = (0,_utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_7__.getUpdatedTypography)(changedTypo, attributes, key);
    updateStyles(_defineProperty({}, key, updatedTypography));
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(PanelBody, {
    title: __('Placeholder Styles'),
    initialOpen: false,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
      label: "Text Color",
      value: attributes.styles.placeholderColor,
      onChange: function onChange(value) {
        return updateStyles({
          placeholderColor: value
        });
      },
      defaultColor: ""
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentTypography__WEBPACK_IMPORTED_MODULE_0__["default"], {
      label: "Typography",
      settings: {
        fontSize: ((_attributes$styles$pl = attributes.styles.placeholderTypography) === null || _attributes$styles$pl === void 0 || (_attributes$styles$pl = _attributes$styles$pl.size) === null || _attributes$styles$pl === void 0 ? void 0 : _attributes$styles$pl.lg) || '',
        fontWeight: ((_attributes$styles$pl2 = attributes.styles.placeholderTypography) === null || _attributes$styles$pl2 === void 0 ? void 0 : _attributes$styles$pl2.weight) || '400',
        lineHeight: ((_attributes$styles$pl3 = attributes.styles.placeholderTypography) === null || _attributes$styles$pl3 === void 0 ? void 0 : _attributes$styles$pl3.lineHeight) || '',
        letterSpacing: ((_attributes$styles$pl4 = attributes.styles.placeholderTypography) === null || _attributes$styles$pl4 === void 0 ? void 0 : _attributes$styles$pl4.letterSpacing) || '',
        textTransform: ((_attributes$styles$pl5 = attributes.styles.placeholderTypography) === null || _attributes$styles$pl5 === void 0 ? void 0 : _attributes$styles$pl5.textTransform) || 'none'
      },
      onChange: function onChange(changedTypo) {
        return handleTypographyChange(changedTypo, 'placeholderTypography');
      }
    })]
  });
};
var RadioCheckBoxStylesPanel = function RadioCheckBoxStylesPanel(_ref6) {
  var attributes = _ref6.attributes,
    updateStyles = _ref6.updateStyles;
  // Use local state to ensure the UI updates immediately
  var _useState = useState(attributes.styles.radioCheckboxItemsSize || 15),
    _useState2 = _slicedToArray(_useState, 2),
    localSize = _useState2[0],
    setLocalSize = _useState2[1];

  // Update local state when the attribute changes from outside
  useEffect(function () {
    if (attributes.styles.radioCheckboxItemsSize !== undefined && attributes.styles.radioCheckboxItemsSize !== localSize) {
      setLocalSize(attributes.styles.radioCheckboxItemsSize);
    }
  }, [attributes.styles.radioCheckboxItemsSize]);

  // Handle size change with immediate UI update
  var handleSizeChange = function handleSizeChange(value) {
    // Update local state for immediate UI feedback
    setLocalSize(value);
    // Update the actual attribute
    updateStyles({
      radioCheckboxItemsSize: value
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(PanelBody, {
    title: __('Radio & Checkbox Styles'),
    initialOpen: false,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
      label: "Items Color",
      value: attributes.styles.radioCheckboxItemsColor,
      onChange: function onChange(value) {
        return updateStyles({
          radioCheckboxItemsColor: value
        });
      },
      defaultColor: ""
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
      className: "ffblock-control-field",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
        className: "ffblock-label",
        children: "Size (px)"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(RangeControl, {
        value: localSize // Use local state for immediate UI feedback
        ,
        min: 1,
        max: 30,
        step: 1,
        onChange: handleSizeChange
      })]
    })]
  });
};

/**
 * Main TabGeneral component
 */
var TabGeneral = function TabGeneral(_ref7) {
  var setAttributes = _ref7.setAttributes,
    updateStyles = _ref7.updateStyles,
    state = _ref7.state,
    handlePresetChange = _ref7.handlePresetChange;
  var attributes = useSelect(function (select) {
    return select('core/block-editor').getSelectedBlock().attributes;
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(StyleTemplatePanel, {
      attributes: attributes,
      setAttributes: setAttributes,
      handlePresetChange: handlePresetChange
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(LabelStylesPanel, {
      attributes: attributes,
      updateStyles: updateStyles
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(InputStylesPanel, {
      attributes: attributes,
      updateStyles: updateStyles
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(PlaceHolderStylesPanel, {
      attributes: attributes,
      updateStyles: updateStyles
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(RadioCheckBoxStylesPanel, {
      attributes: attributes,
      updateStyles: updateStyles
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(ButtonStylesPanel, {
      attributes: attributes,
      updateStyles: updateStyles
    })]
  });
};
var GENERAL_TAB_ATTRIBUTES = [
// Label attributes
'labelColor', 'labelTypography',
// Input attributes
'inputTextColor', 'inputBackgroundColor', 'inputTypography', 'inputSpacing', 'inputBorder', 'inputBorderHover', 'inputTextFocusColor', 'inputBackgroundFocusColor', 'inputFocusSpacing', 'enableInputBorder', 'inputBorderType', 'inputBorderColor', 'inputBorderWidth', 'inputBorderRadius', 'enableInputBorderFocus', 'inputBorderTypeFocus', 'inputBorderColorFocus', 'inputBorderWidthFocus', 'inputBorderRadiusFocus', 'inputBoxShadow', 'inputBoxShadowFocus',
// Placeholder attributes
'placeholderColor', 'placeholderFocusColor', 'placeholderTypography',
// Radio/Checkbox attributes
'radioCheckboxLabelColor', 'radioCheckboxTypography', 'radioCheckboxItemsColor', 'radioCheckboxItemsSize', 'checkboxSize', 'checkboxBorderColor', 'checkboxBgColor', 'checkboxCheckedColor', 'radioSize', 'radioBorderColor', 'radioBgColor', 'radioCheckedColor',
// Common Button attributes
'buttonWidth', 'buttonAlignment',
// Normal Button attributes
'buttonColor', 'buttonBGColor', 'buttonTypography', 'buttonPadding', 'buttonMargin', 'buttonBoxShadow', 'enableButtonBorder', 'buttonBorderType', 'buttonBorderColor', 'buttonBorderWidth', 'buttonBorderRadius',
// Hover Button attributes
'buttonHoverColor', 'buttonHoverBGColor', 'buttonHoverTypography', 'buttonHoverPadding', 'buttonHoverMargin', 'buttonHoverBoxShadow', 'enableButtonHoverBorder', 'buttonHoverBorderType', 'buttonHoverBorderColor', 'buttonHoverBorderWidth', 'buttonHoverBorderRadius'];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (memo(TabGeneral, function (prevProps, nextProps) {
  return (0,_utils_ComponentUtils__WEBPACK_IMPORTED_MODULE_8__.arePropsEqual)(prevProps, nextProps, GENERAL_TAB_ATTRIBUTES, true);
}));

/***/ }),

/***/ "./guten_block/src/components/tabs/TabMisc.js":
/*!****************************************************!*\
  !*** ./guten_block/src/components/tabs/TabMisc.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../controls/FluentColorPicker */ "./guten_block/src/components/controls/FluentColorPicker.js");
/* harmony import */ var _controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../controls/FluentSpaceControl */ "./guten_block/src/components/controls/FluentSpaceControl.js");
/* harmony import */ var _controls_FluentAlignmentControl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../controls/FluentAlignmentControl */ "./guten_block/src/components/controls/FluentAlignmentControl.js");
/* harmony import */ var _controls_FluentTypography__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../controls/FluentTypography */ "./guten_block/src/components/controls/FluentTypography.js");
/* harmony import */ var _controls_FluentSeparator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../controls/FluentSeparator */ "./guten_block/src/components/controls/FluentSeparator.js");
/* harmony import */ var _controls_FluentUnitControl__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../controls/FluentUnitControl */ "./guten_block/src/components/controls/FluentUnitControl.js");
/* harmony import */ var _controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../controls/FluentBoxShadowControl */ "./guten_block/src/components/controls/FluentBoxShadowControl.js");
/* harmony import */ var _controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../controls/FluentBorderControl */ "./guten_block/src/components/controls/FluentBorderControl.js");
/* harmony import */ var _utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/TypographyUtils */ "./guten_block/src/components/utils/TypographyUtils.js");
/* harmony import */ var _utils_ComponentUtils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/ComponentUtils */ "./guten_block/src/components/utils/ComponentUtils.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Fluent Forms Gutenberg Block Misc Tab Component
 */
var _wp$element = wp.element,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect,
  memo = _wp$element.memo;
var __ = wp.i18n.__;
var _wp$components = wp.components,
  PanelBody = _wp$components.PanelBody,
  SelectControl = _wp$components.SelectControl,
  RangeControl = _wp$components.RangeControl,
  Button = _wp$components.Button,
  BaseControl = _wp$components.BaseControl,
  FontSizePicker = _wp$components.FontSizePicker;

// Import custom components











// Constants

var DEFAULT_COLORS = [{
  name: 'Theme Blue',
  color: '#72aee6'
}, {
  name: 'Theme Red',
  color: '#e65054'
}, {
  name: 'Theme Green',
  color: '#68de7c'
}, {
  name: 'Black',
  color: '#000000'
}, {
  name: 'White',
  color: '#ffffff'
}, {
  name: 'Gray',
  color: '#dddddd'
}];

/**
 * Main TabMisc component
 */
var TabMisc = function TabMisc(_ref) {
  var attributes = _ref.attributes,
    setAttributes = _ref.setAttributes,
    updateStyles = _ref.updateStyles,
    state = _ref.state;
  // Use local state for background type to ensure UI updates immediately
  var _useState = useState(attributes.styles.backgroundType || 'classic'),
    _useState2 = _slicedToArray(_useState, 2),
    localBgType = _useState2[0],
    setLocalBgType = _useState2[1];
  // Add local state for background image to ensure immediate UI update
  var _useState3 = useState(attributes.styles.backgroundImage || ''),
    _useState4 = _slicedToArray(_useState3, 2),
    localBgImage = _useState4[0],
    setLocalBgImage = _useState4[1];
  var handleTypographyChange = function handleTypographyChange(changedTypo, key) {
    var updatedTypography = (0,_utils_TypographyUtils__WEBPACK_IMPORTED_MODULE_8__.getUpdatedTypography)(changedTypo, attributes, key);
    updateStyles(_defineProperty({}, key, updatedTypography));
  };

  // Update local state when attributes change
  useEffect(function () {
    if (attributes.styles.backgroundType !== undefined && attributes.styles.backgroundType !== localBgType) {
      setLocalBgType(attributes.styles.backgroundType);
    }
  }, [attributes.styles.backgroundType]);

  // Sync local background image state with attributes
  useEffect(function () {
    if (attributes.styles.backgroundImage !== localBgImage) {
      setLocalBgImage(attributes.styles.backgroundImage || '');
    }
  }, [attributes.styles.backgroundImage]);

  // Handle background type change
  var handleBackgroundTypeChange = function handleBackgroundTypeChange(value) {
    setLocalBgType(value);
    updateStyles({
      backgroundType: value
    });
  };

  // Handle media upload
  var uploadBackgroundImage = function uploadBackgroundImage() {
    var mediaUploader = wp.media({
      title: __('Select Background Image'),
      button: {
        text: __('Use this image')
      },
      multiple: false,
      library: {
        type: 'image'
      }
    });
    mediaUploader.on('select', function () {
      var attachment = mediaUploader.state().get('selection').first().toJSON();
      setLocalBgImage(attachment.url);
      if (typeof setAttributes === 'function') {
        setAttributes({
          backgroundImage: attachment.url,
          backgroundImageId: attachment.id
        });
      }

      // Also call updateStyles as backup
      updateStyles({
        backgroundImage: attachment.url,
        backgroundImageId: attachment.id
      });
    });
    mediaUploader.open();
  };

  // Handle media removal
  var removeBackgroundImage = function removeBackgroundImage() {
    console.log('Removing background image');

    // Clear local state immediately
    setLocalBgImage('');
    if (typeof setAttributes === 'function') {
      setAttributes({
        backgroundImage: '',
        backgroundImageId: 0
      });
    }
    updateStyles({
      backgroundImage: '',
      backgroundImageId: 0
    });
  };

  // Use local state for conditional rendering
  var currentBgImage = localBgImage || attributes.styles.backgroundImage;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(PanelBody, {
      title: __("Container Styles"),
      initialOpen: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "ffblock-control-field",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("strong", {
          className: "ffblock-label",
          children: __("Background Type")
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "ffblock-radio-options",
          style: {
            display: 'flex',
            gap: '8px',
            marginTop: '8px'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(Button, {
            isPrimary: localBgType === 'classic',
            isSecondary: localBgType !== 'classic',
            onClick: function onClick() {
              return handleBackgroundTypeChange('classic');
            },
            style: {
              flex: 1,
              justifyContent: 'center'
            },
            children: __('Classic')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(Button, {
            isPrimary: localBgType === 'gradient',
            isSecondary: localBgType !== 'gradient',
            onClick: function onClick() {
              return handleBackgroundTypeChange('gradient');
            },
            style: {
              flex: 1,
              justifyContent: 'center'
            },
            children: __('Gradient')
          })]
        })]
      }), localBgType === 'classic' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "ffblock-control-field",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "ffblock-media-upload",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
            className: "ffblock-label",
            children: __('Background Image')
          }), !currentBgImage ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(Button, {
            className: "ffblock-upload-button",
            icon: "upload",
            onClick: uploadBackgroundImage,
            children: __('Upload Media')
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
            className: "ffblock-image-preview",
            style: {
              marginTop: '8px'
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
              style: {
                backgroundImage: "url(".concat(currentBgImage, ")"),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '120px',
                width: '100%',
                borderRadius: '4px',
                position: 'relative',
                marginBottom: '8px',
                border: '1px solid #ddd'
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(Button, {
                icon: "no-alt",
                onClick: removeBackgroundImage,
                isDestructive: true,
                style: {
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '4px',
                  minWidth: 'auto',
                  height: '28px',
                  width: '28px'
                }
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
              style: {
                display: 'flex',
                justifyContent: 'center'
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(Button, {
                isSecondary: true,
                onClick: uploadBackgroundImage,
                children: __('Replace Image')
              })
            })]
          })]
        }), currentBgImage && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          style: {
            marginTop: '16px'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(SelectControl, {
            label: __("Background Size"),
            value: attributes.styles.backgroundSize || 'cover',
            options: [{
              label: __("Cover"),
              value: 'cover'
            }, {
              label: __("Contain"),
              value: 'contain'
            }, {
              label: __("Auto"),
              value: 'auto'
            }],
            onChange: function onChange(value) {
              return updateStyles({
                backgroundSize: value
              });
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(SelectControl, {
            label: __("Background Position"),
            value: attributes.styles.backgroundPosition || 'center center',
            options: [{
              label: __("Center Center"),
              value: 'center center'
            }, {
              label: __("Center Top"),
              value: 'center top'
            }, {
              label: __("Center Bottom"),
              value: 'center bottom'
            }, {
              label: __("Left Center"),
              value: 'left center'
            }, {
              label: __("Left Top"),
              value: 'left top'
            }, {
              label: __("Left Bottom"),
              value: 'left bottom'
            }, {
              label: __("Right Center"),
              value: 'right center'
            }, {
              label: __("Right Top"),
              value: 'right top'
            }, {
              label: __("Right Bottom"),
              value: 'right bottom'
            }],
            onChange: function onChange(value) {
              return updateStyles({
                backgroundPosition: value
              });
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(SelectControl, {
            label: __("Background Repeat"),
            value: attributes.styles.backgroundRepeat || 'no-repeat',
            options: [{
              label: __("No Repeat"),
              value: 'no-repeat'
            }, {
              label: __("Repeat"),
              value: 'repeat'
            }, {
              label: __("Repeat X"),
              value: 'repeat-x'
            }, {
              label: __("Repeat Y"),
              value: 'repeat-y'
            }],
            onChange: function onChange(value) {
              return updateStyles({
                backgroundRepeat: value
              });
            }
          })]
        })]
      }), localBgType === 'gradient' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
          className: "ffblock-label",
          children: __('Background Gradient')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "ffblock-bg-gradient",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
            label: __("Primary Color"),
            value: attributes.styles.gradientColor1 || '',
            onChange: function onChange(value) {
              return updateStyles({
                gradientColor1: value
              });
            },
            defaultColor: ""
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
            label: __("Secondary Color"),
            value: attributes.styles.gradientColor2 || '',
            onChange: function onChange(value) {
              return updateStyles({
                gradientColor2: value
              });
            },
            defaultColor: ""
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(SelectControl, {
            label: __("Gradient Type"),
            value: attributes.styles.gradientType || 'linear',
            options: [{
              label: __("Linear"),
              value: 'linear'
            }, {
              label: __("Radial"),
              value: 'radial'
            }],
            onChange: function onChange(value) {
              return updateStyles({
                gradientType: value
              });
            }
          }), attributes.styles.gradientType === 'linear' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(RangeControl, {
            label: __("Gradient Angle (°)"),
            value: attributes.styles.gradientAngle || 90,
            onChange: function onChange(value) {
              return updateStyles({
                gradientAngle: value
              });
            },
            min: 0,
            max: 360
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Background Color"),
        value: attributes.styles.backgroundColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            backgroundColor: value
          });
        },
        defaultColor: ""
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_1__["default"], {
        label: __("Padding"),
        values: attributes.styles.containerPadding,
        onChange: function onChange(value) {
          return updateStyles({
            containerPadding: value
          });
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentSpaceControl__WEBPACK_IMPORTED_MODULE_1__["default"], {
        label: __("Margin"),
        values: attributes.styles.containerMargin,
        onChange: function onChange(value) {
          return updateStyles({
            containerMargin: value
          });
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentSeparator__WEBPACK_IMPORTED_MODULE_4__["default"], {
        label: __("Box Shadow")
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentBoxShadowControl__WEBPACK_IMPORTED_MODULE_6__["default"], {
        label: __("Box Shadow"),
        shadow: attributes.styles.containerBoxShadow || {},
        onChange: function onChange(shadowObj) {
          return updateStyles({
            containerBoxShadow: shadowObj
          });
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentSeparator__WEBPACK_IMPORTED_MODULE_4__["default"], {
        label: __("Form Border Settings")
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentBorderControl__WEBPACK_IMPORTED_MODULE_7__["default"], {
        label: __("Form Border"),
        enabled: attributes.styles.enableFormBorder || false,
        onToggle: function onToggle(value) {
          return updateStyles({
            enableFormBorder: value
          });
        },
        borderType: attributes.styles.borderType,
        onBorderTypeChange: function onBorderTypeChange(value) {
          return updateStyles({
            borderType: value
          });
        },
        borderColor: attributes.styles.borderColor,
        onBorderColorChange: function onBorderColorChange(value) {
          return updateStyles({
            borderColor: value
          });
        },
        borderWidth: attributes.styles.borderWidth,
        onBorderWidthChange: function onBorderWidthChange(value) {
          return updateStyles({
            borderWidth: value
          });
        },
        borderRadius: attributes.styles.borderRadius,
        onBorderRadiusChange: function onBorderRadiusChange(value) {
          return updateStyles({
            borderRadius: value
          });
        }
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(PanelBody, {
      title: __("Asterisk Styles"),
      initialOpen: false,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Asterisk Color"),
        value: attributes.styles.asteriskColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            asteriskColor: value
          });
        },
        defaultColor: "#ff0000"
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(PanelBody, {
      title: __("Inline Error Message Styles"),
      initialOpen: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Background Color"),
        value: attributes.styles.errorMessageBgColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            errorMessageBgColor: value
          });
        },
        defaultColor: ""
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Text Color"),
        value: attributes.styles.errorMessageColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            errorMessageColor: value
          });
        },
        defaultColor: "#ff0000"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(BaseControl, {
        label: __("Alignment"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentAlignmentControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
          value: attributes.styles.errorMessageAlignment || 'left',
          onChange: function onChange(value) {
            return updateStyles({
              errorMessageAlignment: value
            });
          },
          options: [{
            value: 'left',
            icon: 'editor-alignleft',
            title: __('Align Left')
          }, {
            value: 'center',
            icon: 'editor-aligncenter',
            title: __('Align Center')
          }, {
            value: 'right',
            icon: 'editor-alignright',
            title: __('Align Right')
          }]
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(PanelBody, {
      title: __("After Submit Success Message Styles"),
      initialOpen: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Background Color"),
        value: attributes.styles.successMessageBgColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            successMessageBgColor: value
          });
        },
        defaultColor: "#dff0d8"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Text Color"),
        value: attributes.styles.successMessageColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            successMessageColor: value
          });
        },
        defaultColor: "#3c763d"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(BaseControl, {
        label: __("Alignment"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentAlignmentControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
          value: attributes.styles.successMessageAlignment || 'left',
          onChange: function onChange(value) {
            return updateStyles({
              successMessageAlignment: value
            });
          },
          options: [{
            value: 'left',
            icon: 'editor-alignleft',
            title: __('Align Left')
          }, {
            value: 'center',
            icon: 'editor-aligncenter',
            title: __('Align Center')
          }, {
            value: 'right',
            icon: 'editor-alignright',
            title: __('Align Right')
          }]
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(PanelBody, {
      title: __("After Submit Error Message Styles"),
      initialOpen: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Background Color"),
        value: attributes.styles.submitErrorMessageBgColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            submitErrorMessageBgColor: value
          });
        },
        defaultColor: "#f2dede"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentColorPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
        label: __("Text Color"),
        value: attributes.styles.submitErrorMessageColor || '',
        onChange: function onChange(value) {
          return updateStyles({
            submitErrorMessageColor: value
          });
        },
        defaultColor: "#a94442"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(BaseControl, {
        label: __("Alignment"),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_controls_FluentAlignmentControl__WEBPACK_IMPORTED_MODULE_2__["default"], {
          value: attributes.styles.submitErrorMessageAlignment || 'left',
          onChange: function onChange(value) {
            return updateStyles({
              submitErrorMessageAlignment: value
            });
          },
          options: [{
            value: 'left',
            icon: 'editor-alignleft',
            title: __('Align Left')
          }, {
            value: 'center',
            icon: 'editor-aligncenter',
            title: __('Align Center')
          }, {
            value: 'right',
            icon: 'editor-alignright',
            title: __('Align Right')
          }]
        })
      })]
    })]
  });
};

/**
 * Compare function to determine if component should update
 */
var MISC_TAB_ATTRIBUTES = ['backgroundType', 'backgroundImage', 'backgroundImageId', 'backgroundColor', 'textColor', 'gradientColor1', 'gradientColor2', 'containerPadding', 'containerMargin', 'containerBoxShadow', 'borderType', 'borderColor', 'borderWidth', 'borderRadius', 'enableFormBorder', 'formBorder', 'formWidth', 'formAlignment', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundAttachment', 'backgroundOverlayColor', 'backgroundOverlayOpacity', 'gradientType', 'gradientAngle', 'enableBoxShadow', 'boxShadowColor', 'boxShadowPosition', 'boxShadowHorizontal', 'boxShadowHorizontalUnit', 'boxShadowVertical', 'boxShadowVerticalUnit', 'boxShadowBlur', 'boxShadowBlurUnit', 'boxShadowSpread', 'boxShadowSpreadUnit', 'asteriskColor', 'errorMessageBgColor', 'errorMessageColor', 'errorMessageAlignment', 'successMessageBgColor', 'successMessageColor', 'successMessageAlignment', 'submitErrorMessageBgColor', 'submitErrorMessageColor', 'submitErrorMessageAlignment'];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (memo(TabMisc, function (prevProps, nextProps) {
  return (0,_utils_ComponentUtils__WEBPACK_IMPORTED_MODULE_9__.arePropsEqual)(prevProps, nextProps, MISC_TAB_ATTRIBUTES, true);
}));

/***/ }),

/***/ "./guten_block/src/components/tabs/Tabs.js":
/*!*************************************************!*\
  !*** ./guten_block/src/components/tabs/Tabs.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TabGeneral__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./TabGeneral */ "./guten_block/src/components/tabs/TabGeneral.js");
/* harmony import */ var _TabMisc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./TabMisc */ "./guten_block/src/components/tabs/TabMisc.js");
/* harmony import */ var _utils_ComponentUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/ComponentUtils */ "./guten_block/src/components/utils/ComponentUtils.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * Fluent Forms Gutenberg Block Tabs Component
 * Manages the tab panel for the block inspector
 */
var __ = wp.i18n.__;
var TabPanel = wp.components.TabPanel;
var _wp$element = wp.element,
  Component = _wp$element.Component,
  memo = _wp$element.memo,
  PureComponent = _wp$element.PureComponent;

// Import tab content components




// Use PureComponent to automatically implement shouldComponentUpdate

var Tabs = /*#__PURE__*/function (_PureComponent) {
  function Tabs() {
    _classCallCheck(this, Tabs);
    return _callSuper(this, Tabs, arguments);
  }
  _inherits(Tabs, _PureComponent);
  return _createClass(Tabs, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
        attributes = _this$props.attributes,
        setAttributes = _this$props.setAttributes,
        updateStyles = _this$props.updateStyles,
        state = _this$props.state;
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(TabPanel, {
        className: "fluent-form-block-style-tabs",
        activeClass: "is-active",
        tabs: [{
          name: 'general',
          title: __('General'),
          key: 'general-tab'
        }, {
          name: 'misc',
          title: __('Misc'),
          key: 'misc-tab'
        }],
        children: function children(tab) {
          if (tab.name === 'general') {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_TabGeneral__WEBPACK_IMPORTED_MODULE_0__["default"], {
                setAttributes: setAttributes,
                updateStyles: updateStyles,
                state: state,
                handlePresetChange: state.handlePresetChange,
                toggleCustomizePreset: state.toggleCustomizePreset
              })
            }, "general-tab-content");
          } else if (tab.name === 'misc') {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_TabMisc__WEBPACK_IMPORTED_MODULE_1__["default"], {
                attributes: attributes,
                setAttributes: setAttributes,
                updateStyles: updateStyles,
                state: state
              })
            }, "misc-tab-content");
          }
          return null;
        }
      });
    }
  }]);
}(PureComponent);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (memo(Tabs, function (prevProps, nextProps) {
  return (0,_utils_ComponentUtils__WEBPACK_IMPORTED_MODULE_2__.arePropsEqual)(prevProps, nextProps, [], true);
}));

/***/ }),

/***/ "./guten_block/src/components/utils/ComponentUtils.js":
/*!************************************************************!*\
  !*** ./guten_block/src/components/utils/ComponentUtils.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   arePropsEqual: () => (/* binding */ arePropsEqual)
/* harmony export */ });
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * Checks if props have changed for component memoization
 *
 * @param {Object} prevProps Previous props
 * @param {Object} nextProps New props
 * @param {Array} attributesToCheck Array of attribute names to check
 * @param {Boolean} checkState Whether to check state properties
 * @return {Boolean} True if props are equal (no update needed)
 */
var arePropsEqual = function arePropsEqual(prevProps, nextProps) {
  var attributesToCheck = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var checkState = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var prevAttrs = prevProps.attributes;
  var nextAttrs = nextProps.attributes;

  // Check specific attributes
  var _iterator = _createForOfIteratorHelper(attributesToCheck),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var attr = _step.value;
      if (!(prevAttrs !== null && prevAttrs !== void 0 && prevAttrs.styles[attr]) || !(nextAttrs !== null && nextAttrs !== void 0 && nextAttrs.styles[attr])) {
        return false; // Props are not equal, should update
      }
      if (JSON.stringify(prevAttrs.styles[attr]) !== JSON.stringify(nextAttrs.styles[attr])) {
        return false; // Props are not equal, should update
      }
    }

    // Check state if needed
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  if (checkState && prevProps.state && nextProps.state) {
    if (prevProps.state.customizePreset !== nextProps.state.customizePreset || prevProps.state.selectedPreset !== nextProps.state.selectedPreset) {
      return false; // State changed, should update
    }
  }
  return true; // Props are equal, no need to update
};

/***/ }),

/***/ "./guten_block/src/components/utils/TypographyUtils.js":
/*!*************************************************************!*\
  !*** ./guten_block/src/components/utils/TypographyUtils.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getUpdatedTypography: () => (/* binding */ getUpdatedTypography)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// In guten_block/src/components/utils/TypographyUtils.js

/**
 * Updates typography settings with only changed values to avoid unnecessary rerenders
 * @param {Object} changedTypo - Object containing only the changed typography property
 * @param {Object} currentAttributes - Current attributes object
 * @param {string} typographyKey - Key for the typography attribute to update
 * @returns {Object} The updated typography object or empty object for reset
 */
var getUpdatedTypography = function getUpdatedTypography(changedTypo, currentAttributes, typographyKey) {
  // Check if this is a reset operation
  if (changedTypo.reset) {
    return {};
  }

  // Create a new typography object based on current attributes
  var updatedTypography = _objectSpread({}, currentAttributes[typographyKey] || {});

  // Get the property that changed (there should be only one)
  var changedProperty = Object.keys(changedTypo)[0];
  var newValue = changedTypo[changedProperty];

  // Update only the changed property
  switch (changedProperty) {
    case 'fontSize':
      updatedTypography.size = {
        lg: newValue
      };
      break;
    case 'fontWeight':
      updatedTypography.weight = newValue;
      break;
    case 'lineHeight':
      updatedTypography.lineHeight = newValue;
      break;
    case 'letterSpacing':
      updatedTypography.letterSpacing = newValue;
      break;
    case 'textTransform':
      updatedTypography.textTransform = newValue;
      break;
  }
  return updatedTypography;
};

/***/ }),

/***/ "./guten_block/src/edit.js":
/*!*********************************!*\
  !*** ./guten_block/src/edit.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _components_controls_FluentSeparator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/controls/FluentSeparator */ "./guten_block/src/components/controls/FluentSeparator.js");
/* harmony import */ var _utils_StyleHandler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/StyleHandler */ "./guten_block/src/utils/StyleHandler.js");
/* harmony import */ var _components_tabs_Tabs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/tabs/Tabs */ "./guten_block/src/components/tabs/Tabs.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _excluded = ["styles"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * Fluent Forms Gutenberg Block Edit Component
 * Enhanced with custom UX controls
 */


var __ = wp.i18n.__;
var _wp$blockEditor = wp.blockEditor,
  InspectorControls = _wp$blockEditor.InspectorControls,
  BlockControls = _wp$blockEditor.BlockControls,
  useBlockProps = _wp$blockEditor.useBlockProps;
var _wp = wp,
  ServerSideRender = _wp.serverSideRender;
var _wp2 = wp,
  apiFetch = _wp2.apiFetch;
var _wp$components = wp.components,
  SelectControl = _wp$components.SelectControl,
  PanelBody = _wp$components.PanelBody,
  Button = _wp$components.Button,
  Spinner = _wp$components.Spinner,
  ToolbarGroup = _wp$components.ToolbarGroup,
  ToolbarButton = _wp$components.ToolbarButton;
var _wp$element = wp.element,
  Component = _wp$element.Component,
  React = _wp$element.React,
  useState = _wp$element.useState,
  useEffect = _wp$element.useEffect;

// Import components


// Function to get form meta

var getFormMeta = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(formId, metaKey) {
    var path, response;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          if (formId) {
            _context.n = 1;
            break;
          }
          return _context.a(2);
        case 1:
          path = "".concat(window.fluentform_block_vars.rest.namespace, "/").concat(window.fluentform_block_vars.rest.version, "/settings/").concat(formId, "?meta_key=").concat(metaKey);
          _context.n = 2;
          return apiFetch({
            path: path
          });
        case 2:
          response = _context.v;
          return _context.a(2, response.length && response[0].value || false);
      }
    }, _callee);
  }));
  return function getFormMeta(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var EditComponent = /*#__PURE__*/function (_Component) {
  function EditComponent() {
    var _this;
    _classCallCheck(this, EditComponent);
    _this = _callSuper(this, EditComponent, arguments);
    _defineProperty(_this, "checkIfConversationalForm", /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(formId) {
        var isConversationalForm;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              if (formId) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              _this.setState({
                isPreviewLoading: true
              });
              _context2.n = 2;
              return getFormMeta(formId, "is_conversion_form");
            case 2:
              isConversationalForm = _context2.v;
              _this.props.setAttributes({
                isConversationalForm: isConversationalForm === "yes"
              });
              _this.setState({
                isPreviewLoading: false
              });
            case 3:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return function (_x3) {
        return _ref2.apply(this, arguments);
      };
    }());
    _defineProperty(_this, "handleFormChange", function (formId) {
      _this.setState({
        isPreviewLoading: true
      });
      _this.props.setAttributes({
        formId: formId
      });
      if (!formId) {
        _this.props.setAttributes({
          themeStyle: "",
          isThemeChange: false,
          isConversationalForm: false,
          selectedPreset: 'default',
          customizePreset: false
        });
        _this.setState({
          isPreviewLoading: false
        });
      } else {
        _this.checkIfConversationalForm(formId);
      }
    });
    _defineProperty(_this, "handlePresetChange", function (selectedPreset) {
      _this.setState({
        selectedPreset: selectedPreset,
        isPreviewLoading: true
      });
      _this.props.setAttributes({
        selectedPreset: selectedPreset,
        isThemeChange: true
      });

      // Simulate delay for preview update
      setTimeout(function () {
        _this.setState({
          isPreviewLoading: false
        });
      }, 300);
    });
    _defineProperty(_this, "toggleCustomizePreset", function () {
      var customizePreset = !_this.state.customizePreset;
      _this.setState({
        customizePreset: customizePreset
      });
      _this.props.setAttributes({
        customizePreset: customizePreset
      });
    });
    _defineProperty(_this, "setPreviewDevice", function (device) {
      _this.setState({
        previewDevice: device
      });
    });
    _this.state = {
      customizePreset: false,
      selectedPreset: 'default',
      isPreviewLoading: false,
      showSaveNotice: false,
      previewDevice: 'desktop'
    };
    _this.updateStyles = _this.updateStyles.bind(_this);
    return _this;
  }

  // Method to update styles with debouncing to prevent excessive requests
  _inherits(EditComponent, _Component);
  return _createClass(EditComponent, [{
    key: "updateStyles",
    value: function updateStyles(styleAttributes) {
      var _this$props = this.props,
        setAttributes = _this$props.setAttributes,
        attributes = _this$props.attributes;

      // Ensure styles object exists
      var currentStyles = attributes.styles || {};
      var styles = _objectSpread(_objectSpread({}, currentStyles), styleAttributes);

      // Update attributes
      setAttributes({
        styles: styles
      });

      // Apply styles immediately via JavaScript without triggering server render
      if (this.styleHandler && attributes.formId) {
        this.styleHandler.updateStyles(styles);
      }
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _window$fluentform_bl;
      var attributes = this.props.attributes;
      var maybeSetStyle = !attributes.themeStyle && ((_window$fluentform_bl = window.fluentform_block_vars) === null || _window$fluentform_bl === void 0 ? void 0 : _window$fluentform_bl.theme_style);
      var config = window.fluentform_block_vars || {};
      if (maybeSetStyle) {
        this.props.setAttributes({
          themeStyle: config.theme_style
        });
      }

      // Set initial state based on attributes
      if (attributes.formId) {
        this.checkIfConversationalForm(attributes.formId);

        // Set initial state for customization options
        this.setState({
          customizePreset: attributes.customizePreset || false,
          selectedPreset: attributes.selectedPreset || 'default'
        });
      }

      // Initialize style handler
      if (attributes.formId && attributes.styles) {
        this.styleHandler = new _utils_StyleHandler__WEBPACK_IMPORTED_MODULE_1__["default"](attributes.formId);
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      var attributes = this.props.attributes;
      var styleChanged = JSON.stringify(prevProps.attributes.styles || {}) !== JSON.stringify(attributes.styles || {});

      // Initialize or update style handler
      if (attributes.formId !== prevProps.attributes.formId) {
        if (this.styleHandler) {
          this.styleHandler.destroy();
        }
        if (attributes.formId) {
          this.styleHandler = new _utils_StyleHandler__WEBPACK_IMPORTED_MODULE_1__["default"](attributes.formId);
        }
      }

      // Handle style changes with JavaScript only
      if (styleChanged && this.styleHandler && attributes.formId) {
        this.styleHandler.updateStyles(attributes.styles);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.styleHandler) {
        this.styleHandler.destroy();
      }
    }
  }, {
    key: "render",
    value:
    // Tab rendering methods have been moved to separate components

    function render() {
      var _config$forms,
        _this2 = this;
      var _this$props2 = this.props,
        attributes = _this$props2.attributes,
        setAttributes = _this$props2.setAttributes;
      var _this$state = this.state,
        isPreviewLoading = _this$state.isPreviewLoading,
        showSaveNotice = _this$state.showSaveNotice,
        previewDevice = _this$state.previewDevice;
      var config = window.fluentform_block_vars || {};
      var presets = config.style_presets;
      // Form selection and style controls in inspector controls
      var inspectorControls = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(InspectorControls, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(PanelBody, {
          title: __('Form Selection'),
          initialOpen: attributes.formId ? false : true,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(SelectControl, {
            label: __('Select a Form'),
            value: attributes.formId || '',
            options: ((_config$forms = config.forms) === null || _config$forms === void 0 ? void 0 : _config$forms.map(function (form) {
              return {
                value: form.id,
                label: form.title,
                key: "form-".concat(form.id)
              };
            })) || [],
            onChange: this.handleFormChange
          })
        }), attributes.formId && !attributes.isConversationalForm && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_components_tabs_Tabs__WEBPACK_IMPORTED_MODULE_2__["default"], {
          attributes: attributes,
          setAttributes: setAttributes,
          updateStyles: this.updateStyles,
          state: {
            customizePreset: this.state.customizePreset,
            selectedPreset: this.state.selectedPreset,
            handlePresetChange: this.handlePresetChange,
            toggleCustomizePreset: this.toggleCustomizePreset
          }
        })]
      }, "ff-inspector-controls");

      // Main content based on selection state
      var mainContent;
      var loadingOverlay = null;

      // Create loading overlay if needed
      if (isPreviewLoading) {
        loadingOverlay = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "fluent-form-loading-overlay",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(Spinner, {}), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            children: "Loading form preview..."
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_components_controls_FluentSeparator__WEBPACK_IMPORTED_MODULE_0__["default"], {
            style: "dotted",
            className: "fluent-separator-sm"
          })]
        });
      }
      if (!attributes.formId) {
        var _config$forms2;
        // No form selected
        mainContent = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "fluent-form-initial-wrapper",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
            className: "fluent-form-logo",
            children: config.logo && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("img", {
              src: config.logo,
              alt: "Fluent Forms Logo",
              className: "fluent-form-logo-img"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(SelectControl, {
            label: __('Select a Form'),
            value: "",
            options: ((_config$forms2 = config.forms) === null || _config$forms2 === void 0 ? void 0 : _config$forms2.map(function (form) {
              return {
                value: form.id,
                label: form.title,
                key: "form-select-".concat(form.id)
              };
            })) || [],
            onChange: this.handleFormChange
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            style: {
              marginTop: '16px',
              fontSize: '13px',
              color: '#666'
            },
            children: "Select a form to display and customize its appearance."
          })]
        });
      } else if (attributes.isConversationalForm === true) {
        // Conversational form selected
        mainContent = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "fluent-form-conv-demo",
          children: [config.conversational_demo_img && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("img", {
            src: config.conversational_demo_img,
            alt: "Fluent Forms Conversational Form",
            className: "fluent-form-conv-img"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            className: "fluent-form-conv-message",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
              children: __("This is a demo preview. The actual Conversational Form will appear on your live page.")
            })
          })]
        });
      } else {
        // Regular form selected - show preview only
        // Create device-specific class for responsive preview
        var deviceClass = "preview-device-".concat(previewDevice);
        var styles = attributes.styles,
          serverAttributes = _objectWithoutProperties(attributes, _excluded);
        mainContent = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "fluent-form-preview-wrapper ".concat(deviceClass),
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
            className: "fluent-form-preview-controls",
            children: [{
              device: 'desktop',
              icon: 'desktop',
              label: 'Desktop Preview'
            }, {
              device: 'tablet',
              icon: 'tablet',
              label: 'Tablet Preview'
            }, {
              device: 'mobile',
              icon: 'smartphone',
              label: 'Mobile Preview'
            }].map(function (item) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(Button, {
                icon: item.icon,
                isSmall: true,
                isPrimary: previewDevice === item.device,
                onClick: function onClick() {
                  return _this2.setPreviewDevice(item.device);
                },
                label: item.label
              }, item.device);
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(ServerSideRender, {
            block: "fluentfom/guten-block",
            attributes: serverAttributes
          }, "ff-preview-".concat(attributes.formId, "-").concat(attributes.selectedPreset, "-").concat(attributes.isThemeChange))]
        });
      }
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "fluentform-guten-wrapper",
        children: [inspectorControls, attributes.formId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(BlockControls, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(ToolbarGroup, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(ToolbarButton, {
              icon: "edit",
              label: __('Edit Form'),
              onClick: function onClick() {
                return window.open("admin.php?page=fluent_forms&route=editor&form_id=".concat(attributes.formId), '_blank', 'noopener');
              }
            })
          })
        }), mainContent, loadingOverlay]
      });
    }
  }]);
}(Component); // Functional wrapper component that uses useBlockProps for API Version 3
function Edit(props) {
  var blockProps = useBlockProps({
    className: 'fluentform-guten-wrapper'
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", _objectSpread(_objectSpread({}, blockProps), {}, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(EditComponent, _objectSpread({}, props))
  }));
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Edit);

/***/ }),

/***/ "./guten_block/src/utils/StyleHandler.js":
/*!***********************************************!*\
  !*** ./guten_block/src/utils/StyleHandler.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * JavaScript Style Handler for FluentForm Gutenberg Block
 * Converts PHP styling logic to client-side JavaScript
 */
var FluentFormStyleHandler = /*#__PURE__*/function () {
  function FluentFormStyleHandler(formId) {
    _classCallCheck(this, FluentFormStyleHandler);
    this.formId = formId;
    this.styleElementId = "fluentform-block-custom-styles-".concat(formId);
    this.baseSelector = ".fluentform-guten-wrapper .ff_guten_block.ff_guten_block-".concat(formId);
    this.initStyleElement();
  }
  return _createClass(FluentFormStyleHandler, [{
    key: "initStyleElement",
    value: function initStyleElement() {
      if (this.styleElement) {
        this.styleElement.innerHTML = '';
      }
    }
  }, {
    key: "setStyleElement",
    value: function setStyleElement() {
      var styleElement = document.getElementById(this.styleElementId);
      if (styleElement) {
        this.styleElement = styleElement;
      } else {
        var style = document.createElement('style');
        style.id = this.styleElementId;
        document.head.appendChild(style);
        this.styleElement = style;
      }
    }
  }, {
    key: "updateStyles",
    value: function updateStyles(styles) {
      if (!styles) return;
      if (!this.styleElement) {
        this.setStyleElement();
      }
      this.styleElement.innerHTML = this.generateAllStyles(styles);
    }
  }, {
    key: "generateAllStyles",
    value: function generateAllStyles(styles) {
      var css = '';

      // Container styles
      css += this.generateContainerStyles(styles);

      // Label styles
      css += this.generateLabelStyles(styles);

      // Input styles
      css += this.generateInputStyles(styles);

      // Placeholder styles
      css += this.generatePlaceholderStyles(styles);

      // Button styles
      css += this.generateButtonStyles(styles);

      // Radio/Checkbox styles
      css += this.generateRadioCheckboxStyles(styles);

      // Message styles
      css += this.generateMessageStyles(styles);
      return css;
    }
  }, {
    key: "generateContainerStyles",
    value: function generateContainerStyles(styles) {
      var css = '';
      var selector = this.baseSelector;
      var styleRules = [];
      if (styles.backgroundColor) {
        styleRules.push("background-color: ".concat(styles.backgroundColor));
      }
      if (styles.containerPadding) {
        var padding = this.generateSpacing(styles.containerPadding);
        if (padding) styleRules.push(padding);
      }

      // Container box shadow
      if (styles.containerBoxShadow && styles.containerBoxShadow.enable) {
        var boxShadow = this.generateBoxShadow(styles.containerBoxShadow);
        if (boxShadow) styleRules.push("box-shadow: ".concat(boxShadow));
      }
      if (styleRules.length > 0) {
        css += "".concat(selector, " { ").concat(styleRules.join('; '), "; }\n");
      }
      return css;
    }
  }, {
    key: "generateLabelStyles",
    value: function generateLabelStyles(attributes) {
      var css = '';
      var labelSelector = "".concat(this.baseSelector, " .ff-el-input--label label");
      var styles = [];
      if (attributes.labelColor) {
        styles.push("color: ".concat(attributes.labelColor));
      }
      if (attributes.labelTypography) {
        var typography = this.generateTypography(attributes.labelTypography);
        if (typography) styles.push(typography);
      }
      if (styles.length > 0) {
        css += "".concat(labelSelector, " { ").concat(styles.join('; '), "; }\n");
      }
      return css;
    }
  }, {
    key: "generateInputStyles",
    value: function generateInputStyles(attributes) {
      var css = '';
      var inputSelectors = ["".concat(this.baseSelector, " .ff-el-form-control"), "".concat(this.baseSelector, " .ff-el-input--content input"), "".concat(this.baseSelector, " .ff-el-input--content textarea"), "".concat(this.baseSelector, " .ff-el-input--content select")];
      var inputSelector = inputSelectors.join(', ');

      // Normal state
      var normalStyles = [];
      if (attributes.inputTextColor) {
        normalStyles.push("color: ".concat(attributes.inputTextColor));
      }
      if (attributes.inputBackgroundColor) {
        normalStyles.push("background-color: ".concat(attributes.inputBackgroundColor));
      }
      if (attributes.inputTypography) {
        var typography = this.generateTypography(attributes.inputTypography);
        if (typography) normalStyles.push(typography);
      }
      if (attributes.inputBorder) {
        var border = this.generateBorder(attributes.inputBorder);
        if (border) normalStyles.push(border);
      }
      if (attributes.inputSpacing) {
        var spacing = this.generateSpacing(attributes.inputSpacing);
        if (spacing) normalStyles.push(spacing);
      }

      // Input box shadow
      if (attributes.inputBoxShadow && attributes.inputBoxShadow.enable) {
        var boxShadow = this.generateBoxShadow(attributes.inputBoxShadow);
        if (boxShadow) normalStyles.push("box-shadow: ".concat(boxShadow));
      }
      if (normalStyles.length > 0) {
        css += "".concat(inputSelector, " { ").concat(normalStyles.join('; '), "; }\n");
      }

      // Focus state
      var focusStyles = [];
      var focusSelector = inputSelectors.map(function (sel) {
        return "".concat(sel, ":focus");
      }).join(', ');
      if (attributes.inputTextColorFocus) {
        focusStyles.push("color: ".concat(attributes.inputTextColorFocus));
      }
      if (attributes.inputBackgroundColorFocus) {
        focusStyles.push("background-color: ".concat(attributes.inputBackgroundColorFocus));
      }
      if (attributes.inputBorderFocus) {
        var borderFocus = this.generateBorder(attributes.inputBorderFocus);
        if (borderFocus) focusStyles.push(borderFocus);
      }

      // Input box shadow focus
      if (attributes.inputBoxShadowFocus && attributes.inputBoxShadowFocus.enable) {
        var boxShadowFocus = this.generateBoxShadow(attributes.inputBoxShadowFocus);
        if (boxShadowFocus) focusStyles.push("box-shadow: ".concat(boxShadowFocus));
      }
      if (focusStyles.length > 0) {
        css += "".concat(focusSelector, " { ").concat(focusStyles.join('; '), "; }\n");
      }
      return css;
    }
  }, {
    key: "generatePlaceholderStyles",
    value: function generatePlaceholderStyles(attributes) {
      var css = '';
      if (attributes.placeholderColor) {
        var placeholderSelectors = ["".concat(this.baseSelector, " .ff-el-input--content input::placeholder"), "".concat(this.baseSelector, " .ff-el-input--content textarea::placeholder")];
        css += "".concat(placeholderSelectors.join(', '), " { color: ").concat(attributes.placeholderColor, "; }\n");
      }
      if (attributes.placeholderTypography) {
        var typography = this.generateTypography(attributes.placeholderTypography);
        if (typography) {
          var _placeholderSelectors = ["".concat(this.baseSelector, " .ff-el-input--content input::placeholder"), "".concat(this.baseSelector, " .ff-el-input--content textarea::placeholder")];
          css += "".concat(_placeholderSelectors.join(', '), " { ").concat(typography, "; }\n");
        }
      }
      return css;
    }
  }, {
    key: "generateButtonStyles",
    value: function generateButtonStyles(attributes) {
      var css = '';
      var buttonSelector = "".concat(this.baseSelector, " .ff-btn-submit");

      // Button alignment
      if (attributes.buttonAlignment) {
        css += "".concat(this.baseSelector, " .ff_submit_btn_wrapper { text-align: ").concat(attributes.buttonAlignment, "; }\n");
      }

      // Normal state
      var normalStyles = [];
      if (attributes.buttonColor) {
        normalStyles.push("color: ".concat(attributes.buttonColor));
      }
      if (attributes.buttonBGColor) {
        normalStyles.push("background-color: ".concat(attributes.buttonBGColor));
      }
      if (attributes.buttonTypography) {
        var typography = this.generateTypography(attributes.buttonTypography);
        if (typography) normalStyles.push(typography);
      }
      if (attributes.buttonBorder) {
        var border = this.generateBorder(attributes.buttonBorder);
        if (border) normalStyles.push(border);
      }
      if (attributes.buttonSpacing) {
        var spacing = this.generateSpacing(attributes.buttonSpacing);
        if (spacing) normalStyles.push(spacing);
      }

      // Button box shadow
      if (attributes.buttonBoxShadow && attributes.buttonBoxShadow.enable) {
        var boxShadow = this.generateBoxShadow(attributes.buttonBoxShadow);
        if (boxShadow) normalStyles.push("box-shadow: ".concat(boxShadow));
      }
      if (normalStyles.length > 0) {
        css += "".concat(buttonSelector, " { ").concat(normalStyles.join('; '), "; }\n");
      }

      // Hover state
      var hoverStyles = [];
      var hoverSelector = "".concat(buttonSelector, ":hover");
      if (attributes.buttonColorHover) {
        hoverStyles.push("color: ".concat(attributes.buttonColorHover));
      }
      if (attributes.buttonBGColorHover) {
        hoverStyles.push("background-color: ".concat(attributes.buttonBGColorHover));
      }

      // Button hover box shadow
      if (attributes.buttonHoverBoxShadow && attributes.buttonHoverBoxShadow.enable) {
        var boxShadowHover = this.generateBoxShadow(attributes.buttonHoverBoxShadow);
        if (boxShadowHover) hoverStyles.push("box-shadow: ".concat(boxShadowHover));
      }
      if (hoverStyles.length > 0) {
        css += "".concat(hoverSelector, " { ").concat(hoverStyles.join('; '), "; }\n");
      }
      return css;
    }
  }, {
    key: "generateRadioCheckboxStyles",
    value: function generateRadioCheckboxStyles(attributes) {
      var css = '';
      if (attributes.radioCheckboxItemsColor) {
        css += "".concat(this.baseSelector, " .ff-el-form-check { color: ").concat(attributes.radioCheckboxItemsColor, "; }\n");
      }
      if (attributes.radioCheckboxItemsSize) {
        var size = "".concat(attributes.radioCheckboxItemsSize, "px");
        css += "".concat(this.baseSelector, " input[type=\"radio\"], ").concat(this.baseSelector, " input[type=\"checkbox\"] { width: ").concat(size, "; height: ").concat(size, "; }\n");
      }
      return css;
    }
  }, {
    key: "generateMessageStyles",
    value: function generateMessageStyles(attributes) {
      var css = '';

      // Success message
      if (attributes.successMessageColor) {
        css += "".concat(this.baseSelector, " .ff-message-success { color: ").concat(attributes.successMessageColor, "; }\n");
      }

      // Error message
      if (attributes.errorMessageColor) {
        css += "".concat(this.baseSelector, " .ff-errors-in-stack, ").concat(this.baseSelector, " .error { color: ").concat(attributes.errorMessageColor, "; }\n");
      }

      // Asterisk
      if (attributes.asteriskColor) {
        css += "".concat(this.baseSelector, " .asterisk-right label:after, ").concat(this.baseSelector, " .asterisk-left label:before { color: ").concat(attributes.asteriskColor, "; }\n");
      }
      return css;
    }
  }, {
    key: "generateTypography",
    value: function generateTypography(typography) {
      if (!typography) return '';
      var styles = [];
      if (typography.size && typography.size.lg) {
        styles.push("font-size: ".concat(typography.size.lg, "px"));
      }
      if (typography.weight) {
        styles.push("font-weight: ".concat(typography.weight));
      }
      if (typography.lineHeight) {
        styles.push("line-height: ".concat(typography.lineHeight));
      }
      if (typography.letterSpacing) {
        styles.push("letter-spacing: ".concat(typography.letterSpacing, "px"));
      }
      if (typography.textTransform) {
        styles.push("text-transform: ".concat(typography.textTransform));
      }
      return styles.join('; ');
    }
  }, {
    key: "generateBorder",
    value: function generateBorder(border) {
      if (!border) return '';
      var styles = [];
      if (border.width) {
        styles.push("border-width: ".concat(border.width, "px"));
      }
      if (border.style) {
        styles.push("border-style: ".concat(border.style));
      }
      if (border.color) {
        styles.push("border-color: ".concat(border.color));
      }
      if (border.radius) {
        styles.push("border-radius: ".concat(border.radius, "px"));
      }
      return styles.join('; ');
    }
  }, {
    key: "generateSpacing",
    value: function generateSpacing(spacing) {
      var property = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'padding';
      if (!spacing) return '';
      var styles = [];
      if (spacing.top) {
        styles.push("".concat(property, "-top: ").concat(spacing.top, "px"));
      }
      if (spacing.right) {
        styles.push("".concat(property, "-right: ").concat(spacing.right, "px"));
      }
      if (spacing.bottom) {
        styles.push("".concat(property, "-bottom: ").concat(spacing.bottom, "px"));
      }
      if (spacing.left) {
        styles.push("".concat(property, "-left: ").concat(spacing.left, "px"));
      }
      return styles.join('; ');
    }
  }, {
    key: "generateBoxShadow",
    value: function generateBoxShadow(boxShadow) {
      var _boxShadow$horizontal, _boxShadow$horizontal2, _boxShadow$vertical, _boxShadow$vertical2, _boxShadow$blur, _boxShadow$blur2, _boxShadow$spread, _boxShadow$spread2;
      if (!boxShadow || !boxShadow.enable || !boxShadow.color) return '';

      // Get position (inset or outline)
      var position = boxShadow.position === 'inset' ? 'inset ' : '';

      // Get values with units
      var horizontal = "".concat(((_boxShadow$horizontal = boxShadow.horizontal) === null || _boxShadow$horizontal === void 0 ? void 0 : _boxShadow$horizontal.value) || '0').concat(((_boxShadow$horizontal2 = boxShadow.horizontal) === null || _boxShadow$horizontal2 === void 0 ? void 0 : _boxShadow$horizontal2.unit) || 'px');
      var vertical = "".concat(((_boxShadow$vertical = boxShadow.vertical) === null || _boxShadow$vertical === void 0 ? void 0 : _boxShadow$vertical.value) || '0').concat(((_boxShadow$vertical2 = boxShadow.vertical) === null || _boxShadow$vertical2 === void 0 ? void 0 : _boxShadow$vertical2.unit) || 'px');
      var blur = "".concat(((_boxShadow$blur = boxShadow.blur) === null || _boxShadow$blur === void 0 ? void 0 : _boxShadow$blur.value) || '5').concat(((_boxShadow$blur2 = boxShadow.blur) === null || _boxShadow$blur2 === void 0 ? void 0 : _boxShadow$blur2.unit) || 'px');
      var spread = "".concat(((_boxShadow$spread = boxShadow.spread) === null || _boxShadow$spread === void 0 ? void 0 : _boxShadow$spread.value) || '0').concat(((_boxShadow$spread2 = boxShadow.spread) === null || _boxShadow$spread2 === void 0 ? void 0 : _boxShadow$spread2.unit) || 'px');
      // Build the box-shadow value
      return "".concat(position).concat(horizontal, " ").concat(vertical, " ").concat(blur, " ").concat(spread, " ").concat(boxShadow.color);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.styleElement) {
        this.styleElement.remove();
      }
    }
  }]);
}();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FluentFormStyleHandler);

/***/ }),

/***/ "./node_modules/react/cjs/react-jsx-runtime.development.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react/cjs/react-jsx-runtime.development.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



if (true) {
  (function() {
'use strict';

var React = __webpack_require__(/*! react */ "./node_modules/react/index.js");

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for('react.element');
var REACT_PORTAL_TYPE = Symbol.for('react.portal');
var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
var REACT_CONTEXT_TYPE = Symbol.for('react.context');
var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
var REACT_MEMO_TYPE = Symbol.for('react.memo');
var REACT_LAZY_TYPE = Symbol.for('react.lazy');
var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
}

var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

function error(format) {
  {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  // When changing this logic, you might want to also
  // update consoleWithStackDev.www.js as well.
  {
    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var stack = ReactDebugCurrentFrame.getStackAddendum();

    if (stack !== '') {
      format += '%s';
      args = args.concat([stack]);
    } // eslint-disable-next-line react-internal/safe-string-coercion


    var argsWithFormat = args.map(function (item) {
      return String(item);
    }); // Careful: RN currently depends on this prefix

    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging

    Function.prototype.apply.call(console[level], console, argsWithFormat);
  }
}

// -----------------------------------------------------------------------------

var enableScopeAPI = false; // Experimental Create Event Handle API.
var enableCacheElement = false;
var enableTransitionTracing = false; // No known bugs, but needs performance testing

var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.

var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

var REACT_MODULE_REFERENCE;

{
  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
}

function isValidElementType(type) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
    // types supported by any Flight configuration anywhere since
    // we don't know which Flight build this will end up being used
    // with.
    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
      return true;
    }
  }

  return false;
}

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || '';
  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
} // Keep in sync with react-reconciler/getComponentNameFromFiber


function getContextName(type) {
  return type.displayName || 'Context';
} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.


function getComponentNameFromType(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  {
    if (typeof type.tag === 'number') {
      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
    }
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }

  if (typeof type === 'string') {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';

    case REACT_PORTAL_TYPE:
      return 'Portal';

    case REACT_PROFILER_TYPE:
      return 'Profiler';

    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';

    case REACT_SUSPENSE_TYPE:
      return 'Suspense';

    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';

  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        var context = type;
        return getContextName(context) + '.Consumer';

      case REACT_PROVIDER_TYPE:
        var provider = type;
        return getContextName(provider._context) + '.Provider';

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, 'ForwardRef');

      case REACT_MEMO_TYPE:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type) || 'Memo';

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            return getComponentNameFromType(init(payload));
          } catch (x) {
            return null;
          }
        }

      // eslint-disable-next-line no-fallthrough
    }
  }

  return null;
}

var assign = Object.assign;

// Helpers to patch console.logs to avoid logging during side-effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
var disabledDepth = 0;
var prevLog;
var prevInfo;
var prevWarn;
var prevError;
var prevGroup;
var prevGroupCollapsed;
var prevGroupEnd;

function disabledLog() {}

disabledLog.__reactDisabledLog = true;
function disableLogs() {
  {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevGroupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

      var props = {
        configurable: true,
        enumerable: true,
        value: disabledLog,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        info: props,
        log: props,
        warn: props,
        error: props,
        group: props,
        groupCollapsed: props,
        groupEnd: props
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    disabledDepth++;
  }
}
function reenableLogs() {
  {
    disabledDepth--;

    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      var props = {
        configurable: true,
        enumerable: true,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        log: assign({}, props, {
          value: prevLog
        }),
        info: assign({}, props, {
          value: prevInfo
        }),
        warn: assign({}, props, {
          value: prevWarn
        }),
        error: assign({}, props, {
          value: prevError
        }),
        group: assign({}, props, {
          value: prevGroup
        }),
        groupCollapsed: assign({}, props, {
          value: prevGroupCollapsed
        }),
        groupEnd: assign({}, props, {
          value: prevGroupEnd
        })
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    if (disabledDepth < 0) {
      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
    }
  }
}

var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
var prefix;
function describeBuiltInComponentFrame(name, source, ownerFn) {
  {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        var match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = match && match[1] || '';
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.


    return '\n' + prefix + name;
  }
}
var reentry = false;
var componentFrameCache;

{
  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap();
}

function describeNativeComponentFrame(fn, construct) {
  // If something asked for a stack inside a fake render, it should get ignored.
  if ( !fn || reentry) {
    return '';
  }

  {
    var frame = componentFrameCache.get(fn);

    if (frame !== undefined) {
      return frame;
    }
  }

  var control;
  reentry = true;
  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

  Error.prepareStackTrace = undefined;
  var previousDispatcher;

  {
    previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.

    ReactCurrentDispatcher.current = null;
    disableLogs();
  }

  try {
    // This should throw.
    if (construct) {
      // Something should be setting the props in the constructor.
      var Fake = function () {
        throw Error();
      }; // $FlowFixMe


      Object.defineProperty(Fake.prototype, 'props', {
        set: function () {
          // We use a throwing setter instead of frozen or non-writable props
          // because that won't throw in a non-strict mode function.
          throw Error();
        }
      });

      if (typeof Reflect === 'object' && Reflect.construct) {
        // We construct a different control for this case to include any extra
        // frames added by the construct call.
        try {
          Reflect.construct(Fake, []);
        } catch (x) {
          control = x;
        }

        Reflect.construct(fn, [], Fake);
      } else {
        try {
          Fake.call();
        } catch (x) {
          control = x;
        }

        fn.call(Fake.prototype);
      }
    } else {
      try {
        throw Error();
      } catch (x) {
        control = x;
      }

      fn();
    }
  } catch (sample) {
    // This is inlined manually because closure doesn't do it for us.
    if (sample && control && typeof sample.stack === 'string') {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      var sampleLines = sample.stack.split('\n');
      var controlLines = control.stack.split('\n');
      var s = sampleLines.length - 1;
      var c = controlLines.length - 1;

      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
        // We expect at least one stack frame to be shared.
        // Typically this will be the root most one. However, stack frames may be
        // cut off due to maximum stack limits. In this case, one maybe cut off
        // earlier than the other. We assume that the sample is longer or the same
        // and there for cut off earlier. So we should find the root most frame in
        // the sample somewhere in the control.
        c--;
      }

      for (; s >= 1 && c >= 0; s--, c--) {
        // Next we find the first one that isn't the same which should be the
        // frame that called our sample function and the control.
        if (sampleLines[s] !== controlLines[c]) {
          // In V8, the first line is describing the message but other VMs don't.
          // If we're about to return the first line, and the control is also on the same
          // line, that's a pretty good indicator that our sample threw at same line as
          // the control. I.e. before we entered the sample frame. So we ignore this result.
          // This can happen if you passed a class to function component, or non-function.
          if (s !== 1 || c !== 1) {
            do {
              s--;
              c--; // We may still have similar intermediate frames from the construct call.
              // The next one that isn't the same should be our match though.

              if (c < 0 || sampleLines[s] !== controlLines[c]) {
                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.


                if (fn.displayName && _frame.includes('<anonymous>')) {
                  _frame = _frame.replace('<anonymous>', fn.displayName);
                }

                {
                  if (typeof fn === 'function') {
                    componentFrameCache.set(fn, _frame);
                  }
                } // Return the line we found.


                return _frame;
              }
            } while (s >= 1 && c >= 0);
          }

          break;
        }
      }
    }
  } finally {
    reentry = false;

    {
      ReactCurrentDispatcher.current = previousDispatcher;
      reenableLogs();
    }

    Error.prepareStackTrace = previousPrepareStackTrace;
  } // Fallback to just using the name if we couldn't make it throw.


  var name = fn ? fn.displayName || fn.name : '';
  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

  {
    if (typeof fn === 'function') {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }

  return syntheticFrame;
}
function describeFunctionComponentFrame(fn, source, ownerFn) {
  {
    return describeNativeComponentFrame(fn, false);
  }
}

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

  if (type == null) {
    return '';
  }

  if (typeof type === 'function') {
    {
      return describeNativeComponentFrame(type, shouldConstruct(type));
    }
  }

  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type);
  }

  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame('Suspense');

    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame('SuspenseList');
  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render);

      case REACT_MEMO_TYPE:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            // Lazy may contain any component type so we recursively resolve it.
            return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
          } catch (x) {}
        }
    }
  }

  return '';
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

var loggedTypeFailures = {};
var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
      ReactDebugCurrentFrame.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame.setExtraStackFrame(null);
    }
  }
}

function checkPropTypes(typeSpecs, values, location, componentName, element) {
  {
    // $FlowFixMe This is okay but Flow doesn't know it.
    var has = Function.call.bind(hasOwnProperty);

    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.

        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            // eslint-disable-next-line react-internal/prod-error-codes
            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
            err.name = 'Invariant Violation';
            throw err;
          }

          error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
        } catch (ex) {
          error$1 = ex;
        }

        if (error$1 && !(error$1 instanceof Error)) {
          setCurrentlyValidatingElement(element);

          error('%s: type specification of %s' + ' `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error$1);

          setCurrentlyValidatingElement(null);
        }

        if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error$1.message] = true;
          setCurrentlyValidatingElement(element);

          error('Failed %s type: %s', location, error$1.message);

          setCurrentlyValidatingElement(null);
        }
      }
    }
  }
}

var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

/*
 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */
// $FlowFixMe only called in DEV, so void return is not possible.
function typeName(value) {
  {
    // toStringTag is needed for namespaced types like Temporal.Instant
    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
    return type;
  }
} // $FlowFixMe only called in DEV, so void return is not possible.


function willCoercionThrow(value) {
  {
    try {
      testStringCoercion(value);
      return false;
    } catch (e) {
      return true;
    }
  }
}

function testStringCoercion(value) {
  // If you ended up here by following an exception call stack, here's what's
  // happened: you supplied an object or symbol value to React (as a prop, key,
  // DOM attribute, CSS property, string ref, etc.) and when React tried to
  // coerce it to a string using `'' + value`, an exception was thrown.
  //
  // The most common types that will cause this exception are `Symbol` instances
  // and Temporal objects like `Temporal.Instant`. But any object that has a
  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
  // exception. (Library authors do this to prevent users from using built-in
  // numeric operators like `+` or comparison operators like `>=` because custom
  // methods are needed to perform accurate arithmetic or comparison.)
  //
  // To fix the problem, coerce this object or symbol value to a string before
  // passing it to React. The most reliable way is usually `String(value)`.
  //
  // To find which value is throwing, check the browser or debugger console.
  // Before this exception was thrown, there should be `console.error` output
  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
  // problem and how that type was used: key, atrribute, input value prop, etc.
  // In most cases, this console output also shows the component and its
  // ancestor components where the exception happened.
  //
  // eslint-disable-next-line react-internal/safe-string-coercion
  return '' + value;
}
function checkKeyStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before before using it here.', typeName(value));

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}

var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};
var specialPropKeyWarningShown;
var specialPropRefWarningShown;
var didWarnAboutStringRefs;

{
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  {
    if (hasOwnProperty.call(config, 'ref')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.ref !== undefined;
}

function hasValidKey(config) {
  {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.key !== undefined;
}

function warnIfStringRefCannotBeAutoConverted(config, self) {
  {
    if (typeof config.ref === 'string' && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
      var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);

      if (!didWarnAboutStringRefs[componentName]) {
        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://reactjs.org/link/strict-mode-string-ref', getComponentNameFromType(ReactCurrentOwner.current.type), config.ref);

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}

function defineKeyPropWarningGetter(props, displayName) {
  {
    var warnAboutAccessingKey = function () {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;

        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
      }
    };

    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, 'key', {
      get: warnAboutAccessingKey,
      configurable: true
    });
  }
}

function defineRefPropWarningGetter(props, displayName) {
  {
    var warnAboutAccessingRef = function () {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;

        error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
      }
    };

    warnAboutAccessingRef.isReactWarning = true;
    Object.defineProperty(props, 'ref', {
      get: warnAboutAccessingRef,
      configurable: true
    });
  }
}
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */


var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,
    // Record the component responsible for creating this element.
    _owner: owner
  };

  {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    }); // self and source are DEV only properties.

    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    }); // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.

    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });

    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */

function jsxDEV(type, config, maybeKey, source, self) {
  {
    var propName; // Reserved names are extracted

    var props = {};
    var key = null;
    var ref = null; // Currently, key can be spread in as a prop. This causes a potential
    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
    // but as an intermediary step, we will use jsxDEV for everything except
    // <div {...props} key="Hi" />, because we aren't currently able to tell if
    // key is explicitly declared to be undefined or not.

    if (maybeKey !== undefined) {
      {
        checkKeyStringCoercion(maybeKey);
      }

      key = '' + maybeKey;
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    }

    if (hasValidRef(config)) {
      ref = config.ref;
      warnIfStringRefCannotBeAutoConverted(config, self);
    } // Remaining properties are added to a new props object


    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    } // Resolve default props


    if (type && type.defaultProps) {
      var defaultProps = type.defaultProps;

      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }

    if (key || ref) {
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }

    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
  }
}

var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement$1(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
    }
  }
}

var propTypesMisspellWarningShown;

{
  propTypesMisspellWarningShown = false;
}
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */


function isValidElement(object) {
  {
    return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
  }
}

function getDeclarationErrorAddendum() {
  {
    if (ReactCurrentOwner$1.current) {
      var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);

      if (name) {
        return '\n\nCheck the render method of `' + name + '`.';
      }
    }

    return '';
  }
}

function getSourceInfoErrorAddendum(source) {
  {
    if (source !== undefined) {
      var fileName = source.fileName.replace(/^.*[\\\/]/, '');
      var lineNumber = source.lineNumber;
      return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
    }

    return '';
  }
}
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */


var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  {
    var info = getDeclarationErrorAddendum();

    if (!info) {
      var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;

      if (parentName) {
        info = "\n\nCheck the top-level render call using <" + parentName + ">.";
      }
    }

    return info;
  }
}
/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */


function validateExplicitKey(element, parentType) {
  {
    if (!element._store || element._store.validated || element.key != null) {
      return;
    }

    element._store.validated = true;
    var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
      return;
    }

    ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
    // property, it may be the creator of the child that's responsible for
    // assigning it a key.

    var childOwner = '';

    if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
      // Give the component that originally created this child.
      childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
    }

    setCurrentlyValidatingElement$1(element);

    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

    setCurrentlyValidatingElement$1(null);
  }
}
/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */


function validateChildKeys(node, parentType) {
  {
    if (typeof node !== 'object') {
      return;
    }

    if (isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        var child = node[i];

        if (isValidElement(child)) {
          validateExplicitKey(child, parentType);
        }
      }
    } else if (isValidElement(node)) {
      // This element was passed in a valid location.
      if (node._store) {
        node._store.validated = true;
      }
    } else if (node) {
      var iteratorFn = getIteratorFn(node);

      if (typeof iteratorFn === 'function') {
        // Entry iterators used to provide implicit keys,
        // but now we print a separate warning for them later.
        if (iteratorFn !== node.entries) {
          var iterator = iteratorFn.call(node);
          var step;

          while (!(step = iterator.next()).done) {
            if (isValidElement(step.value)) {
              validateExplicitKey(step.value, parentType);
            }
          }
        }
      }
    }
  }
}
/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */


function validatePropTypes(element) {
  {
    var type = element.type;

    if (type === null || type === undefined || typeof type === 'string') {
      return;
    }

    var propTypes;

    if (typeof type === 'function') {
      propTypes = type.propTypes;
    } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
    // Inner props are checked in the reconciler.
    type.$$typeof === REACT_MEMO_TYPE)) {
      propTypes = type.propTypes;
    } else {
      return;
    }

    if (propTypes) {
      // Intentionally inside to avoid triggering lazy initializers:
      var name = getComponentNameFromType(type);
      checkPropTypes(propTypes, element.props, 'prop', name, element);
    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

      var _name = getComponentNameFromType(type);

      error('Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', _name || 'Unknown');
    }

    if (typeof type.getDefaultProps === 'function' && !type.getDefaultProps.isReactClassApproved) {
      error('getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.');
    }
  }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */


function validateFragmentProps(fragment) {
  {
    var keys = Object.keys(fragment.props);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key !== 'children' && key !== 'key') {
        setCurrentlyValidatingElement$1(fragment);

        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

        setCurrentlyValidatingElement$1(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement$1(fragment);

      error('Invalid attribute `ref` supplied to `React.Fragment`.');

      setCurrentlyValidatingElement$1(null);
    }
  }
}

var didWarnAboutKeySpread = {};
function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
  {
    var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.

    if (!validType) {
      var info = '';

      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
      }

      var sourceInfo = getSourceInfoErrorAddendum(source);

      if (sourceInfo) {
        info += sourceInfo;
      } else {
        info += getDeclarationErrorAddendum();
      }

      var typeString;

      if (type === null) {
        typeString = 'null';
      } else if (isArray(type)) {
        typeString = 'array';
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
        info = ' Did you accidentally export a JSX literal instead of a component?';
      } else {
        typeString = typeof type;
      }

      error('React.jsx: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
    }

    var element = jsxDEV(type, props, key, source, self); // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.

    if (element == null) {
      return element;
    } // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)


    if (validType) {
      var children = props.children;

      if (children !== undefined) {
        if (isStaticChildren) {
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              validateChildKeys(children[i], type);
            }

            if (Object.freeze) {
              Object.freeze(children);
            }
          } else {
            error('React.jsx: Static children should always be an array. ' + 'You are likely explicitly calling React.jsxs or React.jsxDEV. ' + 'Use the Babel transform instead.');
          }
        } else {
          validateChildKeys(children, type);
        }
      }
    }

    {
      if (hasOwnProperty.call(props, 'key')) {
        var componentName = getComponentNameFromType(type);
        var keys = Object.keys(props).filter(function (k) {
          return k !== 'key';
        });
        var beforeExample = keys.length > 0 ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}' : '{key: someKey}';

        if (!didWarnAboutKeySpread[componentName + beforeExample]) {
          var afterExample = keys.length > 0 ? '{' + keys.join(': ..., ') + ': ...}' : '{}';

          error('A props object containing a "key" prop is being spread into JSX:\n' + '  let props = %s;\n' + '  <%s {...props} />\n' + 'React keys must be passed directly to JSX without using spread:\n' + '  let props = %s;\n' + '  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);

          didWarnAboutKeySpread[componentName + beforeExample] = true;
        }
      }
    }

    if (type === REACT_FRAGMENT_TYPE) {
      validateFragmentProps(element);
    } else {
      validatePropTypes(element);
    }

    return element;
  }
} // These two functions exist to still get child warnings in dev
// even with the prod transform. This means that jsxDEV is purely
// opt-in behavior for better messages but that we won't stop
// giving you warnings if you use production apis.

function jsxWithValidationStatic(type, props, key) {
  {
    return jsxWithValidation(type, props, key, true);
  }
}
function jsxWithValidationDynamic(type, props, key) {
  {
    return jsxWithValidation(type, props, key, false);
  }
}

var jsx =  jsxWithValidationDynamic ; // we may want to special case jsxs internally to take advantage of static children.
// for now we can ship identical prod functions

var jsxs =  jsxWithValidationStatic ;

exports.Fragment = REACT_FRAGMENT_TYPE;
exports.jsx = jsx;
exports.jsxs = jsxs;
  })();
}


/***/ }),

/***/ "./node_modules/react/cjs/react.development.js":
/*!*****************************************************!*\
  !*** ./node_modules/react/cjs/react.development.js ***!
  \*****************************************************/
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



if (true) {
  (function() {

          'use strict';

/* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart ===
    'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
}
          var ReactVersion = '18.3.1';

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for('react.element');
var REACT_PORTAL_TYPE = Symbol.for('react.portal');
var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
var REACT_CONTEXT_TYPE = Symbol.for('react.context');
var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
var REACT_MEMO_TYPE = Symbol.for('react.memo');
var REACT_LAZY_TYPE = Symbol.for('react.lazy');
var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
}

/**
 * Keeps track of the current dispatcher.
 */
var ReactCurrentDispatcher = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

/**
 * Keeps track of the current batch's configuration such as how long an update
 * should suspend for if it needs to.
 */
var ReactCurrentBatchConfig = {
  transition: null
};

var ReactCurrentActQueue = {
  current: null,
  // Used to reproduce behavior of `batchedUpdates` in legacy mode.
  isBatchingLegacy: false,
  didScheduleLegacyUpdate: false
};

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
var ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

var ReactDebugCurrentFrame = {};
var currentExtraStackFrame = null;
function setExtraStackFrame(stack) {
  {
    currentExtraStackFrame = stack;
  }
}

{
  ReactDebugCurrentFrame.setExtraStackFrame = function (stack) {
    {
      currentExtraStackFrame = stack;
    }
  }; // Stack implementation injected by the current renderer.


  ReactDebugCurrentFrame.getCurrentStack = null;

  ReactDebugCurrentFrame.getStackAddendum = function () {
    var stack = ''; // Add an extra top frame while an element is being validated

    if (currentExtraStackFrame) {
      stack += currentExtraStackFrame;
    } // Delegate to the injected renderer-specific implementation


    var impl = ReactDebugCurrentFrame.getCurrentStack;

    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}

// -----------------------------------------------------------------------------

var enableScopeAPI = false; // Experimental Create Event Handle API.
var enableCacheElement = false;
var enableTransitionTracing = false; // No known bugs, but needs performance testing

var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.

var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

var ReactSharedInternals = {
  ReactCurrentDispatcher: ReactCurrentDispatcher,
  ReactCurrentBatchConfig: ReactCurrentBatchConfig,
  ReactCurrentOwner: ReactCurrentOwner
};

{
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
  ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
}

// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.

function warn(format) {
  {
    {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      printWarning('warn', format, args);
    }
  }
}
function error(format) {
  {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  // When changing this logic, you might want to also
  // update consoleWithStackDev.www.js as well.
  {
    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var stack = ReactDebugCurrentFrame.getStackAddendum();

    if (stack !== '') {
      format += '%s';
      args = args.concat([stack]);
    } // eslint-disable-next-line react-internal/safe-string-coercion


    var argsWithFormat = args.map(function (item) {
      return String(item);
    }); // Careful: RN currently depends on this prefix

    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging

    Function.prototype.apply.call(console[level], console, argsWithFormat);
  }
}

var didWarnStateUpdateForUnmountedComponent = {};

function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    var componentName = _constructor && (_constructor.displayName || _constructor.name) || 'ReactClass';
    var warningKey = componentName + "." + callerName;

    if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
      return;
    }

    error("Can't call %s on a component that is not yet mounted. " + 'This is a no-op, but it might indicate a bug in your application. ' + 'Instead, assign to `this.state` directly or define a `state = {};` ' + 'class property with the desired state in the %s component.', callerName, componentName);

    didWarnStateUpdateForUnmountedComponent[warningKey] = true;
  }
}
/**
 * This is the abstract API for an update queue.
 */


var ReactNoopUpdateQueue = {
  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function (publicInstance) {
    return false;
  },

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
  enqueueForceUpdate: function (publicInstance, callback, callerName) {
    warnNoop(publicInstance, 'forceUpdate');
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
  enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
    warnNoop(publicInstance, 'replaceState');
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} Name of the calling function in the public API.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState, callback, callerName) {
    warnNoop(publicInstance, 'setState');
  }
};

var assign = Object.assign;

var emptyObject = {};

{
  Object.freeze(emptyObject);
}
/**
 * Base class helpers for the updating state of a component.
 */


function Component(props, context, updater) {
  this.props = props;
  this.context = context; // If a component has string refs, we will assign a different object later.

  this.refs = emptyObject; // We initialize the default updater but the real one gets injected by the
  // renderer.

  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};
/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */

Component.prototype.setState = function (partialState, callback) {
  if (typeof partialState !== 'object' && typeof partialState !== 'function' && partialState != null) {
    throw new Error('setState(...): takes an object of state variables to update or a ' + 'function which returns an object of state variables.');
  }

  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */


Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */


{
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };

  var defineDeprecationWarning = function (methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function () {
        warn('%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);

        return undefined;
      }
    });
  };

  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

function ComponentDummy() {}

ComponentDummy.prototype = Component.prototype;
/**
 * Convenience component with default shallow equality check for sCU.
 */

function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context; // If a component has string refs, we will assign a different object later.

  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
pureComponentPrototype.constructor = PureComponent; // Avoid an extra prototype jump for these methods.

assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;

// an immutable object with a single mutable value
function createRef() {
  var refObject = {
    current: null
  };

  {
    Object.seal(refObject);
  }

  return refObject;
}

var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

/*
 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */
// $FlowFixMe only called in DEV, so void return is not possible.
function typeName(value) {
  {
    // toStringTag is needed for namespaced types like Temporal.Instant
    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
    return type;
  }
} // $FlowFixMe only called in DEV, so void return is not possible.


function willCoercionThrow(value) {
  {
    try {
      testStringCoercion(value);
      return false;
    } catch (e) {
      return true;
    }
  }
}

function testStringCoercion(value) {
  // If you ended up here by following an exception call stack, here's what's
  // happened: you supplied an object or symbol value to React (as a prop, key,
  // DOM attribute, CSS property, string ref, etc.) and when React tried to
  // coerce it to a string using `'' + value`, an exception was thrown.
  //
  // The most common types that will cause this exception are `Symbol` instances
  // and Temporal objects like `Temporal.Instant`. But any object that has a
  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
  // exception. (Library authors do this to prevent users from using built-in
  // numeric operators like `+` or comparison operators like `>=` because custom
  // methods are needed to perform accurate arithmetic or comparison.)
  //
  // To fix the problem, coerce this object or symbol value to a string before
  // passing it to React. The most reliable way is usually `String(value)`.
  //
  // To find which value is throwing, check the browser or debugger console.
  // Before this exception was thrown, there should be `console.error` output
  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
  // problem and how that type was used: key, atrribute, input value prop, etc.
  // In most cases, this console output also shows the component and its
  // ancestor components where the exception happened.
  //
  // eslint-disable-next-line react-internal/safe-string-coercion
  return '' + value;
}
function checkKeyStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before before using it here.', typeName(value));

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || '';
  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
} // Keep in sync with react-reconciler/getComponentNameFromFiber


function getContextName(type) {
  return type.displayName || 'Context';
} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.


function getComponentNameFromType(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  {
    if (typeof type.tag === 'number') {
      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
    }
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }

  if (typeof type === 'string') {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';

    case REACT_PORTAL_TYPE:
      return 'Portal';

    case REACT_PROFILER_TYPE:
      return 'Profiler';

    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';

    case REACT_SUSPENSE_TYPE:
      return 'Suspense';

    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';

  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        var context = type;
        return getContextName(context) + '.Consumer';

      case REACT_PROVIDER_TYPE:
        var provider = type;
        return getContextName(provider._context) + '.Provider';

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, 'ForwardRef');

      case REACT_MEMO_TYPE:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type) || 'Memo';

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            return getComponentNameFromType(init(payload));
          } catch (x) {
            return null;
          }
        }

      // eslint-disable-next-line no-fallthrough
    }
  }

  return null;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};
var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;

{
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  {
    if (hasOwnProperty.call(config, 'ref')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.ref !== undefined;
}

function hasValidKey(config) {
  {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function () {
    {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;

        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
      }
    }
  };

  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function () {
    {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;

        error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
      }
    }
  };

  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

function warnIfStringRefCannotBeAutoConverted(config) {
  {
    if (typeof config.ref === 'string' && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
      var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);

      if (!didWarnAboutStringRefs[componentName]) {
        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */


var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,
    // Record the component responsible for creating this element.
    _owner: owner
  };

  {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    }); // self and source are DEV only properties.

    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    }); // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.

    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });

    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */

function createElement(type, config, children) {
  var propName; // Reserved names are extracted

  var props = {};
  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;

      {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source; // Remaining properties are added to a new props object

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  } // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.


  var childrenLength = arguments.length - 2;

  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);

    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }

    props.children = childArray;
  } // Resolve default props


  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;

    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  {
    if (key || ref) {
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}
function cloneAndReplaceKey(oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
  return newElement;
}
/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */

function cloneElement(element, config, children) {
  if (element === null || element === undefined) {
    throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
  }

  var propName; // Original props are copied

  var props = assign({}, element.props); // Reserved names are extracted

  var key = element.key;
  var ref = element.ref; // Self is preserved since the owner is preserved.

  var self = element._self; // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.

  var source = element._source; // Owner will be preserved, unless ref is overridden

  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    } // Remaining properties override existing props


    var defaultProps;

    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  } // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.


  var childrenLength = arguments.length - 2;

  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);

    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
}
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */

function isValidElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}

var SEPARATOR = '.';
var SUBSEPARATOR = ':';
/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = key.replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });
  return '$' + escapedString;
}
/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */


var didWarnAboutMaps = false;
var userProvidedKeyEscapeRegex = /\/+/g;

function escapeUserProvidedKey(text) {
  return text.replace(userProvidedKeyEscapeRegex, '$&/');
}
/**
 * Generate a key string that identifies a element within a set.
 *
 * @param {*} element A element that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */


function getElementKey(element, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (typeof element === 'object' && element !== null && element.key != null) {
    // Explicit key
    {
      checkKeyStringCoercion(element.key);
    }

    return escape('' + element.key);
  } // Implicit key determined by the index in the set


  return index.toString(36);
}

function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  var invokeCallback = false;

  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;

      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }

    }
  }

  if (invokeCallback) {
    var _child = children;
    var mappedChild = callback(_child); // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows:

    var childKey = nameSoFar === '' ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;

    if (isArray(mappedChild)) {
      var escapedChildKey = '';

      if (childKey != null) {
        escapedChildKey = escapeUserProvidedKey(childKey) + '/';
      }

      mapIntoArray(mappedChild, array, escapedChildKey, '', function (c) {
        return c;
      });
    } else if (mappedChild != null) {
      if (isValidElement(mappedChild)) {
        {
          // The `if` statement here prevents auto-disabling of the safe
          // coercion ESLint rule, so we must manually disable it below.
          // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
          if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
            checkKeyStringCoercion(mappedChild.key);
          }
        }

        mappedChild = cloneAndReplaceKey(mappedChild, // Keep both the (mapped) and old keys if they differ, just as
        // traverseAllChildren used to do for objects as children
        escapedPrefix + ( // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
        mappedChild.key && (!_child || _child.key !== mappedChild.key) ? // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
        // eslint-disable-next-line react-internal/safe-string-coercion
        escapeUserProvidedKey('' + mappedChild.key) + '/' : '') + childKey);
      }

      array.push(mappedChild);
    }

    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.

  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
    }
  } else {
    var iteratorFn = getIteratorFn(children);

    if (typeof iteratorFn === 'function') {
      var iterableChildren = children;

      {
        // Warn about using Maps as children
        if (iteratorFn === iterableChildren.entries) {
          if (!didWarnAboutMaps) {
            warn('Using Maps as children is not supported. ' + 'Use an array of keyed ReactElements instead.');
          }

          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(iterableChildren);
      var step;
      var ii = 0;

      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
      }
    } else if (type === 'object') {
      // eslint-disable-next-line react-internal/safe-string-coercion
      var childrenString = String(children);
      throw new Error("Objects are not valid as a React child (found: " + (childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString) + "). " + 'If you meant to render a collection of children, use an array ' + 'instead.');
    }
  }

  return subtreeCount;
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenmap
 *
 * The provided mapFunction(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var result = [];
  var count = 0;
  mapIntoArray(children, result, '', '', function (child) {
    return func.call(context, child, count++);
  });
  return result;
}
/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrencount
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */


function countChildren(children) {
  var n = 0;
  mapChildren(children, function () {
    n++; // Don't return anything
  });
  return n;
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenforeach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  mapChildren(children, function () {
    forEachFunc.apply(this, arguments); // Don't return anything.
  }, forEachContext);
}
/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrentoarray
 */


function toArray(children) {
  return mapChildren(children, function (child) {
    return child;
  }) || [];
}
/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenonly
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */


function onlyChild(children) {
  if (!isValidElement(children)) {
    throw new Error('React.Children.only expected to receive a single React element child.');
  }

  return children;
}

function createContext(defaultValue) {
  // TODO: Second argument used to be an optional `calculateChangedBits`
  // function. Warn to reserve for future use?
  var context = {
    $$typeof: REACT_CONTEXT_TYPE,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    // These are circular
    Provider: null,
    Consumer: null,
    // Add these to use same hidden class in VM as ServerContext
    _defaultValue: null,
    _globalName: null
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context
  };
  var hasWarnedAboutUsingNestedContextConsumers = false;
  var hasWarnedAboutUsingConsumerProvider = false;
  var hasWarnedAboutDisplayNameOnConsumer = false;

  {
    // A separate object, but proxies back to the original context object for
    // backwards compatibility. It has a different $$typeof, so we can properly
    // warn for the incorrect usage of Context as a Consumer.
    var Consumer = {
      $$typeof: REACT_CONTEXT_TYPE,
      _context: context
    }; // $FlowFixMe: Flow complains about not setting a value, which is intentional here

    Object.defineProperties(Consumer, {
      Provider: {
        get: function () {
          if (!hasWarnedAboutUsingConsumerProvider) {
            hasWarnedAboutUsingConsumerProvider = true;

            error('Rendering <Context.Consumer.Provider> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Provider> instead?');
          }

          return context.Provider;
        },
        set: function (_Provider) {
          context.Provider = _Provider;
        }
      },
      _currentValue: {
        get: function () {
          return context._currentValue;
        },
        set: function (_currentValue) {
          context._currentValue = _currentValue;
        }
      },
      _currentValue2: {
        get: function () {
          return context._currentValue2;
        },
        set: function (_currentValue2) {
          context._currentValue2 = _currentValue2;
        }
      },
      _threadCount: {
        get: function () {
          return context._threadCount;
        },
        set: function (_threadCount) {
          context._threadCount = _threadCount;
        }
      },
      Consumer: {
        get: function () {
          if (!hasWarnedAboutUsingNestedContextConsumers) {
            hasWarnedAboutUsingNestedContextConsumers = true;

            error('Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Consumer> instead?');
          }

          return context.Consumer;
        }
      },
      displayName: {
        get: function () {
          return context.displayName;
        },
        set: function (displayName) {
          if (!hasWarnedAboutDisplayNameOnConsumer) {
            warn('Setting `displayName` on Context.Consumer has no effect. ' + "You should set it directly on the context with Context.displayName = '%s'.", displayName);

            hasWarnedAboutDisplayNameOnConsumer = true;
          }
        }
      }
    }); // $FlowFixMe: Flow complains about missing properties because it doesn't understand defineProperty

    context.Consumer = Consumer;
  }

  {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}

var Uninitialized = -1;
var Pending = 0;
var Resolved = 1;
var Rejected = 2;

function lazyInitializer(payload) {
  if (payload._status === Uninitialized) {
    var ctor = payload._result;
    var thenable = ctor(); // Transition to the next state.
    // This might throw either because it's missing or throws. If so, we treat it
    // as still uninitialized and try again next time. Which is the same as what
    // happens if the ctor or any wrappers processing the ctor throws. This might
    // end up fixing it if the resolution was a concurrency bug.

    thenable.then(function (moduleObject) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        // Transition to the next state.
        var resolved = payload;
        resolved._status = Resolved;
        resolved._result = moduleObject;
      }
    }, function (error) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        // Transition to the next state.
        var rejected = payload;
        rejected._status = Rejected;
        rejected._result = error;
      }
    });

    if (payload._status === Uninitialized) {
      // In case, we're still uninitialized, then we're waiting for the thenable
      // to resolve. Set it as pending in the meantime.
      var pending = payload;
      pending._status = Pending;
      pending._result = thenable;
    }
  }

  if (payload._status === Resolved) {
    var moduleObject = payload._result;

    {
      if (moduleObject === undefined) {
        error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
        'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))\n\n" + 'Did you accidentally put curly braces around the import?', moduleObject);
      }
    }

    {
      if (!('default' in moduleObject)) {
        error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
        'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))", moduleObject);
      }
    }

    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

function lazy(ctor) {
  var payload = {
    // We use these fields to store the result.
    _status: Uninitialized,
    _result: ctor
  };
  var lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer
  };

  {
    // In production, this would just set it on the object.
    var defaultProps;
    var propTypes; // $FlowFixMe

    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get: function () {
          return defaultProps;
        },
        set: function (newDefaultProps) {
          error('React.lazy(...): It is not supported to assign `defaultProps` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

          defaultProps = newDefaultProps; // Match production behavior more closely:
          // $FlowFixMe

          Object.defineProperty(lazyType, 'defaultProps', {
            enumerable: true
          });
        }
      },
      propTypes: {
        configurable: true,
        get: function () {
          return propTypes;
        },
        set: function (newPropTypes) {
          error('React.lazy(...): It is not supported to assign `propTypes` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

          propTypes = newPropTypes; // Match production behavior more closely:
          // $FlowFixMe

          Object.defineProperty(lazyType, 'propTypes', {
            enumerable: true
          });
        }
      }
    });
  }

  return lazyType;
}

function forwardRef(render) {
  {
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      error('forwardRef requires a render function but received a `memo` ' + 'component. Instead of forwardRef(memo(...)), use ' + 'memo(forwardRef(...)).');
    } else if (typeof render !== 'function') {
      error('forwardRef requires a render function but was given %s.', render === null ? 'null' : typeof render);
    } else {
      if (render.length !== 0 && render.length !== 2) {
        error('forwardRef render functions accept exactly two parameters: props and ref. %s', render.length === 1 ? 'Did you forget to use the ref parameter?' : 'Any additional parameter will be undefined.');
      }
    }

    if (render != null) {
      if (render.defaultProps != null || render.propTypes != null) {
        error('forwardRef render functions do not support propTypes or defaultProps. ' + 'Did you accidentally pass a React component?');
      }
    }
  }

  var elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render: render
  };

  {
    var ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
        ownName = name; // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.forwardRef((props, ref) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.

        if (!render.name && !render.displayName) {
          render.displayName = name;
        }
      }
    });
  }

  return elementType;
}

var REACT_MODULE_REFERENCE;

{
  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
}

function isValidElementType(type) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
    // types supported by any Flight configuration anywhere since
    // we don't know which Flight build this will end up being used
    // with.
    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
      return true;
    }
  }

  return false;
}

function memo(type, compare) {
  {
    if (!isValidElementType(type)) {
      error('memo: The first argument must be a component. Instead ' + 'received: %s', type === null ? 'null' : typeof type);
    }
  }

  var elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: compare === undefined ? null : compare
  };

  {
    var ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
        ownName = name; // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.memo((props) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.

        if (!type.name && !type.displayName) {
          type.displayName = name;
        }
      }
    });
  }

  return elementType;
}

function resolveDispatcher() {
  var dispatcher = ReactCurrentDispatcher.current;

  {
    if (dispatcher === null) {
      error('Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' + ' one of the following reasons:\n' + '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' + '2. You might be breaking the Rules of Hooks\n' + '3. You might have more than one copy of React in the same app\n' + 'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.');
    }
  } // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.


  return dispatcher;
}
function useContext(Context) {
  var dispatcher = resolveDispatcher();

  {
    // TODO: add a more generic warning for invalid values.
    if (Context._context !== undefined) {
      var realContext = Context._context; // Don't deduplicate because this legitimately causes bugs
      // and nobody should be using this in existing code.

      if (realContext.Consumer === Context) {
        error('Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' + 'removed in a future major release. Did you mean to call useContext(Context) instead?');
      } else if (realContext.Provider === Context) {
        error('Calling useContext(Context.Provider) is not supported. ' + 'Did you mean to call useContext(Context) instead?');
      }
    }
  }

  return dispatcher.useContext(Context);
}
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
function useRef(initialValue) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
function useEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}
function useInsertionEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useInsertionEffect(create, deps);
}
function useLayoutEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}
function useCallback(callback, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}
function useMemo(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
}
function useImperativeHandle(ref, create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}
function useDebugValue(value, formatterFn) {
  {
    var dispatcher = resolveDispatcher();
    return dispatcher.useDebugValue(value, formatterFn);
  }
}
function useTransition() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}
function useDeferredValue(value) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value);
}
function useId() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useId();
}
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Helpers to patch console.logs to avoid logging during side-effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
var disabledDepth = 0;
var prevLog;
var prevInfo;
var prevWarn;
var prevError;
var prevGroup;
var prevGroupCollapsed;
var prevGroupEnd;

function disabledLog() {}

disabledLog.__reactDisabledLog = true;
function disableLogs() {
  {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevGroupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

      var props = {
        configurable: true,
        enumerable: true,
        value: disabledLog,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        info: props,
        log: props,
        warn: props,
        error: props,
        group: props,
        groupCollapsed: props,
        groupEnd: props
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    disabledDepth++;
  }
}
function reenableLogs() {
  {
    disabledDepth--;

    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      var props = {
        configurable: true,
        enumerable: true,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        log: assign({}, props, {
          value: prevLog
        }),
        info: assign({}, props, {
          value: prevInfo
        }),
        warn: assign({}, props, {
          value: prevWarn
        }),
        error: assign({}, props, {
          value: prevError
        }),
        group: assign({}, props, {
          value: prevGroup
        }),
        groupCollapsed: assign({}, props, {
          value: prevGroupCollapsed
        }),
        groupEnd: assign({}, props, {
          value: prevGroupEnd
        })
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    if (disabledDepth < 0) {
      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
    }
  }
}

var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
var prefix;
function describeBuiltInComponentFrame(name, source, ownerFn) {
  {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        var match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = match && match[1] || '';
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.


    return '\n' + prefix + name;
  }
}
var reentry = false;
var componentFrameCache;

{
  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap();
}

function describeNativeComponentFrame(fn, construct) {
  // If something asked for a stack inside a fake render, it should get ignored.
  if ( !fn || reentry) {
    return '';
  }

  {
    var frame = componentFrameCache.get(fn);

    if (frame !== undefined) {
      return frame;
    }
  }

  var control;
  reentry = true;
  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

  Error.prepareStackTrace = undefined;
  var previousDispatcher;

  {
    previousDispatcher = ReactCurrentDispatcher$1.current; // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.

    ReactCurrentDispatcher$1.current = null;
    disableLogs();
  }

  try {
    // This should throw.
    if (construct) {
      // Something should be setting the props in the constructor.
      var Fake = function () {
        throw Error();
      }; // $FlowFixMe


      Object.defineProperty(Fake.prototype, 'props', {
        set: function () {
          // We use a throwing setter instead of frozen or non-writable props
          // because that won't throw in a non-strict mode function.
          throw Error();
        }
      });

      if (typeof Reflect === 'object' && Reflect.construct) {
        // We construct a different control for this case to include any extra
        // frames added by the construct call.
        try {
          Reflect.construct(Fake, []);
        } catch (x) {
          control = x;
        }

        Reflect.construct(fn, [], Fake);
      } else {
        try {
          Fake.call();
        } catch (x) {
          control = x;
        }

        fn.call(Fake.prototype);
      }
    } else {
      try {
        throw Error();
      } catch (x) {
        control = x;
      }

      fn();
    }
  } catch (sample) {
    // This is inlined manually because closure doesn't do it for us.
    if (sample && control && typeof sample.stack === 'string') {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      var sampleLines = sample.stack.split('\n');
      var controlLines = control.stack.split('\n');
      var s = sampleLines.length - 1;
      var c = controlLines.length - 1;

      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
        // We expect at least one stack frame to be shared.
        // Typically this will be the root most one. However, stack frames may be
        // cut off due to maximum stack limits. In this case, one maybe cut off
        // earlier than the other. We assume that the sample is longer or the same
        // and there for cut off earlier. So we should find the root most frame in
        // the sample somewhere in the control.
        c--;
      }

      for (; s >= 1 && c >= 0; s--, c--) {
        // Next we find the first one that isn't the same which should be the
        // frame that called our sample function and the control.
        if (sampleLines[s] !== controlLines[c]) {
          // In V8, the first line is describing the message but other VMs don't.
          // If we're about to return the first line, and the control is also on the same
          // line, that's a pretty good indicator that our sample threw at same line as
          // the control. I.e. before we entered the sample frame. So we ignore this result.
          // This can happen if you passed a class to function component, or non-function.
          if (s !== 1 || c !== 1) {
            do {
              s--;
              c--; // We may still have similar intermediate frames from the construct call.
              // The next one that isn't the same should be our match though.

              if (c < 0 || sampleLines[s] !== controlLines[c]) {
                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.


                if (fn.displayName && _frame.includes('<anonymous>')) {
                  _frame = _frame.replace('<anonymous>', fn.displayName);
                }

                {
                  if (typeof fn === 'function') {
                    componentFrameCache.set(fn, _frame);
                  }
                } // Return the line we found.


                return _frame;
              }
            } while (s >= 1 && c >= 0);
          }

          break;
        }
      }
    }
  } finally {
    reentry = false;

    {
      ReactCurrentDispatcher$1.current = previousDispatcher;
      reenableLogs();
    }

    Error.prepareStackTrace = previousPrepareStackTrace;
  } // Fallback to just using the name if we couldn't make it throw.


  var name = fn ? fn.displayName || fn.name : '';
  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

  {
    if (typeof fn === 'function') {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }

  return syntheticFrame;
}
function describeFunctionComponentFrame(fn, source, ownerFn) {
  {
    return describeNativeComponentFrame(fn, false);
  }
}

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

  if (type == null) {
    return '';
  }

  if (typeof type === 'function') {
    {
      return describeNativeComponentFrame(type, shouldConstruct(type));
    }
  }

  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type);
  }

  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame('Suspense');

    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame('SuspenseList');
  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render);

      case REACT_MEMO_TYPE:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            // Lazy may contain any component type so we recursively resolve it.
            return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
          } catch (x) {}
        }
    }
  }

  return '';
}

var loggedTypeFailures = {};
var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
    }
  }
}

function checkPropTypes(typeSpecs, values, location, componentName, element) {
  {
    // $FlowFixMe This is okay but Flow doesn't know it.
    var has = Function.call.bind(hasOwnProperty);

    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.

        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            // eslint-disable-next-line react-internal/prod-error-codes
            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
            err.name = 'Invariant Violation';
            throw err;
          }

          error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
        } catch (ex) {
          error$1 = ex;
        }

        if (error$1 && !(error$1 instanceof Error)) {
          setCurrentlyValidatingElement(element);

          error('%s: type specification of %s' + ' `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error$1);

          setCurrentlyValidatingElement(null);
        }

        if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error$1.message] = true;
          setCurrentlyValidatingElement(element);

          error('Failed %s type: %s', location, error$1.message);

          setCurrentlyValidatingElement(null);
        }
      }
    }
  }
}

function setCurrentlyValidatingElement$1(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
      setExtraStackFrame(stack);
    } else {
      setExtraStackFrame(null);
    }
  }
}

var propTypesMisspellWarningShown;

{
  propTypesMisspellWarningShown = false;
}

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = getComponentNameFromType(ReactCurrentOwner.current.type);

    if (name) {
      return '\n\nCheck the render method of `' + name + '`.';
    }
  }

  return '';
}

function getSourceInfoErrorAddendum(source) {
  if (source !== undefined) {
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
  }

  return '';
}

function getSourceInfoErrorAddendumForProps(elementProps) {
  if (elementProps !== null && elementProps !== undefined) {
    return getSourceInfoErrorAddendum(elementProps.__source);
  }

  return '';
}
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */


var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;

    if (parentName) {
      info = "\n\nCheck the top-level render call using <" + parentName + ">.";
    }
  }

  return info;
}
/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */


function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }

  element._store.validated = true;
  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

  if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
    return;
  }

  ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.

  var childOwner = '';

  if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
    // Give the component that originally created this child.
    childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
  }

  {
    setCurrentlyValidatingElement$1(element);

    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

    setCurrentlyValidatingElement$1(null);
  }
}
/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */


function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }

  if (isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];

      if (isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);

    if (typeof iteratorFn === 'function') {
      // Entry iterators used to provide implicit keys,
      // but now we print a separate warning for them later.
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;

        while (!(step = iterator.next()).done) {
          if (isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}
/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */


function validatePropTypes(element) {
  {
    var type = element.type;

    if (type === null || type === undefined || typeof type === 'string') {
      return;
    }

    var propTypes;

    if (typeof type === 'function') {
      propTypes = type.propTypes;
    } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
    // Inner props are checked in the reconciler.
    type.$$typeof === REACT_MEMO_TYPE)) {
      propTypes = type.propTypes;
    } else {
      return;
    }

    if (propTypes) {
      // Intentionally inside to avoid triggering lazy initializers:
      var name = getComponentNameFromType(type);
      checkPropTypes(propTypes, element.props, 'prop', name, element);
    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

      var _name = getComponentNameFromType(type);

      error('Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', _name || 'Unknown');
    }

    if (typeof type.getDefaultProps === 'function' && !type.getDefaultProps.isReactClassApproved) {
      error('getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.');
    }
  }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */


function validateFragmentProps(fragment) {
  {
    var keys = Object.keys(fragment.props);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key !== 'children' && key !== 'key') {
        setCurrentlyValidatingElement$1(fragment);

        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

        setCurrentlyValidatingElement$1(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement$1(fragment);

      error('Invalid attribute `ref` supplied to `React.Fragment`.');

      setCurrentlyValidatingElement$1(null);
    }
  }
}
function createElementWithValidation(type, props, children) {
  var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
  // succeed and there will likely be errors in render.

  if (!validType) {
    var info = '';

    if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
      info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
    }

    var sourceInfo = getSourceInfoErrorAddendumForProps(props);

    if (sourceInfo) {
      info += sourceInfo;
    } else {
      info += getDeclarationErrorAddendum();
    }

    var typeString;

    if (type === null) {
      typeString = 'null';
    } else if (isArray(type)) {
      typeString = 'array';
    } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
      typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
      info = ' Did you accidentally export a JSX literal instead of a component?';
    } else {
      typeString = typeof type;
    }

    {
      error('React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
    }
  }

  var element = createElement.apply(this, arguments); // The result can be nullish if a mock or a custom function is used.
  // TODO: Drop this when these are no longer allowed as the type argument.

  if (element == null) {
    return element;
  } // Skip key warning if the type isn't valid since our key validation logic
  // doesn't expect a non-string/function type and can throw confusing errors.
  // We don't want exception behavior to differ between dev and prod.
  // (Rendering will throw with a helpful message and as soon as the type is
  // fixed, the key warnings will appear.)


  if (validType) {
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], type);
    }
  }

  if (type === REACT_FRAGMENT_TYPE) {
    validateFragmentProps(element);
  } else {
    validatePropTypes(element);
  }

  return element;
}
var didWarnAboutDeprecatedCreateFactory = false;
function createFactoryWithValidation(type) {
  var validatedFactory = createElementWithValidation.bind(null, type);
  validatedFactory.type = type;

  {
    if (!didWarnAboutDeprecatedCreateFactory) {
      didWarnAboutDeprecatedCreateFactory = true;

      warn('React.createFactory() is deprecated and will be removed in ' + 'a future major release. Consider using JSX ' + 'or use React.createElement() directly instead.');
    } // Legacy hook: remove it


    Object.defineProperty(validatedFactory, 'type', {
      enumerable: false,
      get: function () {
        warn('Factory.type is deprecated. Access the class directly ' + 'before passing it to createFactory.');

        Object.defineProperty(this, 'type', {
          value: type
        });
        return type;
      }
    });
  }

  return validatedFactory;
}
function cloneElementWithValidation(element, props, children) {
  var newElement = cloneElement.apply(this, arguments);

  for (var i = 2; i < arguments.length; i++) {
    validateChildKeys(arguments[i], newElement.type);
  }

  validatePropTypes(newElement);
  return newElement;
}

function startTransition(scope, options) {
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  var currentTransition = ReactCurrentBatchConfig.transition;

  {
    ReactCurrentBatchConfig.transition._updatedFibers = new Set();
  }

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;

    {
      if (prevTransition === null && currentTransition._updatedFibers) {
        var updatedFibersCount = currentTransition._updatedFibers.size;

        if (updatedFibersCount > 10) {
          warn('Detected a large number of updates inside startTransition. ' + 'If this is due to a subscription please re-write it to use React provided hooks. ' + 'Otherwise concurrent mode guarantees are off the table.');
        }

        currentTransition._updatedFibers.clear();
      }
    }
  }
}

var didWarnAboutMessageChannel = false;
var enqueueTaskImpl = null;
function enqueueTask(task) {
  if (enqueueTaskImpl === null) {
    try {
      // read require off the module object to get around the bundlers.
      // we don't want them to detect a require and bundle a Node polyfill.
      var requireString = ('require' + Math.random()).slice(0, 7);
      var nodeRequire = module && module[requireString]; // assuming we're in node, let's try to get node's
      // version of setImmediate, bypassing fake timers if any.

      enqueueTaskImpl = nodeRequire.call(module, 'timers').setImmediate;
    } catch (_err) {
      // we're in a browser
      // we can't use regular timers because they may still be faked
      // so we try MessageChannel+postMessage instead
      enqueueTaskImpl = function (callback) {
        {
          if (didWarnAboutMessageChannel === false) {
            didWarnAboutMessageChannel = true;

            if (typeof MessageChannel === 'undefined') {
              error('This browser does not have a MessageChannel implementation, ' + 'so enqueuing tasks via await act(async () => ...) will fail. ' + 'Please file an issue at https://github.com/facebook/react/issues ' + 'if you encounter this warning.');
            }
          }
        }

        var channel = new MessageChannel();
        channel.port1.onmessage = callback;
        channel.port2.postMessage(undefined);
      };
    }
  }

  return enqueueTaskImpl(task);
}

var actScopeDepth = 0;
var didWarnNoAwaitAct = false;
function act(callback) {
  {
    // `act` calls can be nested, so we track the depth. This represents the
    // number of `act` scopes on the stack.
    var prevActScopeDepth = actScopeDepth;
    actScopeDepth++;

    if (ReactCurrentActQueue.current === null) {
      // This is the outermost `act` scope. Initialize the queue. The reconciler
      // will detect the queue and use it instead of Scheduler.
      ReactCurrentActQueue.current = [];
    }

    var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
    var result;

    try {
      // Used to reproduce behavior of `batchedUpdates` in legacy mode. Only
      // set to `true` while the given callback is executed, not for updates
      // triggered during an async event, because this is how the legacy
      // implementation of `act` behaved.
      ReactCurrentActQueue.isBatchingLegacy = true;
      result = callback(); // Replicate behavior of original `act` implementation in legacy mode,
      // which flushed updates immediately after the scope function exits, even
      // if it's an async function.

      if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
        var queue = ReactCurrentActQueue.current;

        if (queue !== null) {
          ReactCurrentActQueue.didScheduleLegacyUpdate = false;
          flushActQueue(queue);
        }
      }
    } catch (error) {
      popActScope(prevActScopeDepth);
      throw error;
    } finally {
      ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
    }

    if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
      var thenableResult = result; // The callback is an async function (i.e. returned a promise). Wait
      // for it to resolve before exiting the current scope.

      var wasAwaited = false;
      var thenable = {
        then: function (resolve, reject) {
          wasAwaited = true;
          thenableResult.then(function (returnValue) {
            popActScope(prevActScopeDepth);

            if (actScopeDepth === 0) {
              // We've exited the outermost act scope. Recursively flush the
              // queue until there's no remaining work.
              recursivelyFlushAsyncActWork(returnValue, resolve, reject);
            } else {
              resolve(returnValue);
            }
          }, function (error) {
            // The callback threw an error.
            popActScope(prevActScopeDepth);
            reject(error);
          });
        }
      };

      {
        if (!didWarnNoAwaitAct && typeof Promise !== 'undefined') {
          // eslint-disable-next-line no-undef
          Promise.resolve().then(function () {}).then(function () {
            if (!wasAwaited) {
              didWarnNoAwaitAct = true;

              error('You called act(async () => ...) without await. ' + 'This could lead to unexpected testing behaviour, ' + 'interleaving multiple act calls and mixing their ' + 'scopes. ' + 'You should - await act(async () => ...);');
            }
          });
        }
      }

      return thenable;
    } else {
      var returnValue = result; // The callback is not an async function. Exit the current scope
      // immediately, without awaiting.

      popActScope(prevActScopeDepth);

      if (actScopeDepth === 0) {
        // Exiting the outermost act scope. Flush the queue.
        var _queue = ReactCurrentActQueue.current;

        if (_queue !== null) {
          flushActQueue(_queue);
          ReactCurrentActQueue.current = null;
        } // Return a thenable. If the user awaits it, we'll flush again in
        // case additional work was scheduled by a microtask.


        var _thenable = {
          then: function (resolve, reject) {
            // Confirm we haven't re-entered another `act` scope, in case
            // the user does something weird like await the thenable
            // multiple times.
            if (ReactCurrentActQueue.current === null) {
              // Recursively flush the queue until there's no remaining work.
              ReactCurrentActQueue.current = [];
              recursivelyFlushAsyncActWork(returnValue, resolve, reject);
            } else {
              resolve(returnValue);
            }
          }
        };
        return _thenable;
      } else {
        // Since we're inside a nested `act` scope, the returned thenable
        // immediately resolves. The outer scope will flush the queue.
        var _thenable2 = {
          then: function (resolve, reject) {
            resolve(returnValue);
          }
        };
        return _thenable2;
      }
    }
  }
}

function popActScope(prevActScopeDepth) {
  {
    if (prevActScopeDepth !== actScopeDepth - 1) {
      error('You seem to have overlapping act() calls, this is not supported. ' + 'Be sure to await previous act() calls before making a new one. ');
    }

    actScopeDepth = prevActScopeDepth;
  }
}

function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
  {
    var queue = ReactCurrentActQueue.current;

    if (queue !== null) {
      try {
        flushActQueue(queue);
        enqueueTask(function () {
          if (queue.length === 0) {
            // No additional work was scheduled. Finish.
            ReactCurrentActQueue.current = null;
            resolve(returnValue);
          } else {
            // Keep flushing work until there's none left.
            recursivelyFlushAsyncActWork(returnValue, resolve, reject);
          }
        });
      } catch (error) {
        reject(error);
      }
    } else {
      resolve(returnValue);
    }
  }
}

var isFlushing = false;

function flushActQueue(queue) {
  {
    if (!isFlushing) {
      // Prevent re-entrance.
      isFlushing = true;
      var i = 0;

      try {
        for (; i < queue.length; i++) {
          var callback = queue[i];

          do {
            callback = callback(true);
          } while (callback !== null);
        }

        queue.length = 0;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        queue = queue.slice(i + 1);
        throw error;
      } finally {
        isFlushing = false;
      }
    }
  }
}

var createElement$1 =  createElementWithValidation ;
var cloneElement$1 =  cloneElementWithValidation ;
var createFactory =  createFactoryWithValidation ;
var Children = {
  map: mapChildren,
  forEach: forEachChildren,
  count: countChildren,
  toArray: toArray,
  only: onlyChild
};

exports.Children = Children;
exports.Component = Component;
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.PureComponent = PureComponent;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
exports.act = act;
exports.cloneElement = cloneElement$1;
exports.createContext = createContext;
exports.createElement = createElement$1;
exports.createFactory = createFactory;
exports.createRef = createRef;
exports.forwardRef = forwardRef;
exports.isValidElement = isValidElement;
exports.lazy = lazy;
exports.memo = memo;
exports.startTransition = startTransition;
exports.unstable_act = act;
exports.useCallback = useCallback;
exports.useContext = useContext;
exports.useDebugValue = useDebugValue;
exports.useDeferredValue = useDeferredValue;
exports.useEffect = useEffect;
exports.useId = useId;
exports.useImperativeHandle = useImperativeHandle;
exports.useInsertionEffect = useInsertionEffect;
exports.useLayoutEffect = useLayoutEffect;
exports.useMemo = useMemo;
exports.useReducer = useReducer;
exports.useRef = useRef;
exports.useState = useState;
exports.useSyncExternalStore = useSyncExternalStore;
exports.useTransition = useTransition;
exports.version = ReactVersion;
          /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop ===
    'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
}
        
  })();
}


/***/ }),

/***/ "./node_modules/react/index.js":
/*!*************************************!*\
  !*** ./node_modules/react/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (false) // removed by dead control flow
{} else {
  module.exports = __webpack_require__(/*! ./cjs/react.development.js */ "./node_modules/react/cjs/react.development.js");
}


/***/ }),

/***/ "./node_modules/react/jsx-runtime.js":
/*!*******************************************!*\
  !*** ./node_modules/react/jsx-runtime.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (false) // removed by dead control flow
{} else {
  module.exports = __webpack_require__(/*! ./cjs/react-jsx-runtime.development.js */ "./node_modules/react/cjs/react-jsx-runtime.development.js");
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************************!*\
  !*** ./guten_block/src/index.js ***!
  \**********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./edit */ "./guten_block/src/edit.js");
var __ = wp.i18n.__;
var registerBlockType = wp.blocks.registerBlockType;

var fluentLogo = wp.element.createElement("svg", {
  width: 20,
  height: 20
}, wp.element.createElement("path", {
  d: "M15.57,0H4.43A4.43,4.43,0,0,0,0,4.43V15.57A4.43,4.43,0,0,0,4.43,20H15.57A4.43,4.43,0,0,0,20,15.57V4.43A4.43,4.43,0,0,0,15.57,0ZM12.82,14a2.36,2.36,0,0,1-1.66.68H6.5A2.31,2.31,0,0,1,7.18,13a2.36,2.36,0,0,1,1.66-.68l4.66,0A2.34,2.34,0,0,1,12.82,14Zm3.3-3.46a2.36,2.36,0,0,1-1.66.68H3.21a2.25,2.25,0,0,1,.68-1.64,2.36,2.36,0,0,1,1.66-.68H16.79A2.25,2.25,0,0,1,16.12,10.53Zm0-3.73a2.36,2.36,0,0,1-1.66.68H3.21a2.25,2.25,0,0,1,.68-1.64,2.36,2.36,0,0,1,1.66-.68H16.79A2.25,2.25,0,0,1,16.12,6.81Z"
}));
registerBlockType("fluentfom/guten-block", {
  title: __("Fluent Forms"),
  icon: fluentLogo,
  category: "formatting",
  keywords: [__("Contact Form"), __("Fluent Forms"), __("Forms"), __("Advanced Forms"), __("fluentforms-gutenberg-block")],
  apiVersion: 2,
  edit: _edit__WEBPACK_IMPORTED_MODULE_0__["default"]
});
})();

/******/ })()
;
//# sourceMappingURL=fluent_gutenblock.js.map