"use strict";

var _postcss = _interopRequireDefault(require("postcss"));

var _lodash = _interopRequireDefault(require("lodash.camelcase"));

var _genericNames = _interopRequireDefault(require("generic-names"));

var _unquote = _interopRequireDefault(require("./unquote"));

var _parser = _interopRequireDefault(require("./css-loader-core/parser"));

var _loader = _interopRequireDefault(require("./css-loader-core/loader"));

var _generateScopedName = _interopRequireDefault(require("./generateScopedName"));

var _saveJSON = _interopRequireDefault(require("./saveJSON"));

var _behaviours = require("./behaviours");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PLUGIN_NAME = "postcss-modules";

function getDefaultScopeBehaviour(opts) {
  if (opts.scopeBehaviour && (0, _behaviours.isValidBehaviour)(opts.scopeBehaviour)) {
    return opts.scopeBehaviour;
  }

  return _behaviours.behaviours.LOCAL;
}

function getScopedNameGenerator(opts) {
  const scopedNameGenerator = opts.generateScopedName || _generateScopedName.default;
  if (typeof scopedNameGenerator === "function") return scopedNameGenerator;
  return (0, _genericNames.default)(scopedNameGenerator, {
    context: process.cwd(),
    hashPrefix: opts.hashPrefix
  });
}

function getLoader(opts, plugins) {
  const root = typeof opts.root === "undefined" ? "/" : opts.root;
  return typeof opts.Loader === "function" ? new opts.Loader(root, plugins, opts.fileResolve) : new _loader.default(root, plugins, opts.fileResolve);
}

function isGlobalModule(globalModules, inputFile) {
  return globalModules.some(regex => inputFile.match(regex));
}

function getDefaultPluginsList(opts, inputFile) {
  const globalModulesList = opts.globalModulePaths || null;
  const exportGlobals = opts.exportGlobals || false;
  const defaultBehaviour = getDefaultScopeBehaviour(opts);
  const generateScopedName = getScopedNameGenerator(opts);

  if (globalModulesList && isGlobalModule(globalModulesList, inputFile)) {
    return (0, _behaviours.getDefaultPlugins)({
      behaviour: _behaviours.behaviours.GLOBAL,
      generateScopedName,
      exportGlobals
    });
  }

  return (0, _behaviours.getDefaultPlugins)({
    behaviour: defaultBehaviour,
    generateScopedName,
    exportGlobals
  });
}

function isOurPlugin(plugin) {
  return plugin.postcssPlugin === PLUGIN_NAME;
}

function dashesCamelCase(string) {
  return string.replace(/-+(\w)/g, (_, firstLetter) => firstLetter.toUpperCase());
}

module.exports = (opts = {}) => {
  return {
    postcssPlugin: PLUGIN_NAME,

    async OnceExit(css, {
      result
    }) {
      const getJSON = opts.getJSON || _saveJSON.default;
      const inputFile = css.source.input.file;
      const pluginList = getDefaultPluginsList(opts, inputFile);
      const resultPluginIndex = result.processor.plugins.findIndex(plugin => isOurPlugin(plugin));

      if (resultPluginIndex === -1) {
        throw new Error("Plugin missing from options.");
      } // resolve and fileResolve can't be used together


      if (typeof opts.resolve === "function" && typeof opts.fileResolve == "function") {
        throw new Error('Please use either the "resolve" or the "fileResolve" option.');
      }

      const earlierPlugins = result.processor.plugins.slice(0, resultPluginIndex);
      const loaderPlugins = [...earlierPlugins, ...pluginList];
      const loader = getLoader(opts, loaderPlugins);

      const fetcher = (file, relativeTo, depTrace) => {
        const unquoteFile = (0, _unquote.default)(file);
        const resolvedResult = typeof opts.resolve === "function" && opts.resolve(unquoteFile);
        const resolvedFile = resolvedResult instanceof Promise ? resolvedResult : Promise.resolve(resolvedResult);
        return resolvedFile.then(f => {
          return loader.fetch.call(loader, `"${f || unquoteFile}"`, relativeTo, depTrace);
        });
      };

      const parser = new _parser.default(fetcher);
      await (0, _postcss.default)([...pluginList, parser.plugin()]).process(css, {
        from: inputFile
      });
      const out = loader.finalSource;
      if (out) css.prepend(out);

      if (opts.localsConvention) {
        const isFunc = typeof opts.localsConvention === "function";
        parser.exportTokens = Object.entries(parser.exportTokens).reduce((tokens, [className, value]) => {
          if (isFunc) {
            tokens[opts.localsConvention(className, value, inputFile)] = value;
            return tokens;
          }

          switch (opts.localsConvention) {
            case "camelCase":
              tokens[className] = value;
              tokens[(0, _lodash.default)(className)] = value;
              break;

            case "camelCaseOnly":
              tokens[(0, _lodash.default)(className)] = value;
              break;

            case "dashes":
              tokens[className] = value;
              tokens[dashesCamelCase(className)] = value;
              break;

            case "dashesOnly":
              tokens[dashesCamelCase(className)] = value;
              break;
          }

          return tokens;
        }, {});
      }

      result.messages.push({
        type: "export",
        plugin: "postcss-modules",
        exportTokens: parser.exportTokens
      }); // getJSON may return a promise

      return getJSON(css.source.input.file, parser.exportTokens, result.opts.to);
    }

  };
};

module.exports.postcss = true;