"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generateScopedName;

var _stringHash = _interopRequireDefault(require("string-hash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function generateScopedName(name, filename, css) {
  const i = css.indexOf(`.${name}`);
  const lineNumber = css.substr(0, i).split(/[\r\n]/).length;
  const hash = (0, _stringHash.default)(css).toString(36).substr(0, 5);
  return `_${name}_${hash}_${lineNumber}`;
}