"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.behaviours = void 0;
exports.getDefaultPlugins = getDefaultPlugins;
exports.isValidBehaviour = isValidBehaviour;

var _postcssModulesLocalByDefault = _interopRequireDefault(require("postcss-modules-local-by-default"));

var _postcssModulesExtractImports = _interopRequireDefault(require("postcss-modules-extract-imports"));

var _postcssModulesScope = _interopRequireDefault(require("postcss-modules-scope"));

var _postcssModulesValues = _interopRequireDefault(require("postcss-modules-values"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const behaviours = {
  LOCAL: "local",
  GLOBAL: "global"
};
exports.behaviours = behaviours;

function getDefaultPlugins({
  behaviour,
  generateScopedName,
  exportGlobals
}) {
  const scope = (0, _postcssModulesScope.default)({
    generateScopedName,
    exportGlobals
  });
  const plugins = {
    [behaviours.LOCAL]: [_postcssModulesValues.default, (0, _postcssModulesLocalByDefault.default)({
      mode: "local"
    }), _postcssModulesExtractImports.default, scope],
    [behaviours.GLOBAL]: [_postcssModulesValues.default, (0, _postcssModulesLocalByDefault.default)({
      mode: "global"
    }), _postcssModulesExtractImports.default, scope]
  };
  return plugins[behaviour];
}

function isValidBehaviour(behaviour) {
  return Object.keys(behaviours).map(key => behaviours[key]).indexOf(behaviour) > -1;
}