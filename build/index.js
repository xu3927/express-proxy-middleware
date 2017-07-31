'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var httpProxyMiddleware = require("http-proxy-middleware");
var fs = require('fs');
var path = require('path');
var Log = require('log');
var log = new Log();
var errMsg1 = '读取配置文件失败';
var errMsg2 = '未找到proxy配置';

var blankMiddleware = function blankMiddleware(req, res, next) {
    next();
};
function setDefaultFields(options) {
    var isDebug = typeof options.debug === 'undefined' ? false : options.debug;
    var defaultFields = {
        changeOrigin: true,
        autoRewrite: true
    };
    var debugFields = {
        onError(err, req, res) {
            log.error('Error:', err);
        },
        onProxyReq(proxyReq, req, res) {
            console.log('----proxyRequestHeaders----');
            console.log(req.method, req.url);
            console.log(proxyReq._headers);
        },
        onProxyRes(proxyRes, req, res) {
            console.log('----proxyResponseHeaders----');
            console.log(req.method, req.url);
            console.log(proxyRes.headers);
        }
    };
    if (isDebug) {
        (0, _assign2.default)(defaultFields, debugFields);
    }
    (0, _assign2.default)(options, defaultFields);
}
function getProxyConfig(param) {
    var proxyConfig = void 0;
    var config = {};
    if (typeof param === 'string') {
        try {
            if (!path.isAbsolute(param)) {
                param = path.resolve(process.cwd(), param);
            }
            delete require.cache[path.resolve(param)];
            config = require(path.resolve(param));
        } catch (err) {
            log.error(errMsg1);
        }
    } else if (typeof param === 'object') {
        config = param.proxy;
    }
    if (config.proxy) {
        proxyConfig = config.proxy;
    } else {
        log.error(errMsg2);
    }
    return proxyConfig;
}
function getMiddlewareList(proxyConfig) {

    if (!Array.isArray(proxyConfig)) {
        proxyConfig = (0, _keys2.default)(proxyConfig).map(function (context) {
            var proxyOptions = void 0;
            // For backwards compatibility reasons.
            var correctedContext = context.replace(/^\*$/, "**").replace(/\/\*$/, "");

            if (typeof proxyConfig[context] === "string") {
                proxyOptions = {
                    context: correctedContext,
                    target: proxyConfig[context]
                };
            } else {
                proxyOptions = (0, _assign2.default)({}, proxyConfig[context]);
                proxyOptions.context = correctedContext;
            }
            setDefaultFields(proxyOptions);
            return proxyOptions;
        });
    }

    var getProxyMiddleware = function getProxyMiddleware(proxyConfig) {
        var context = proxyConfig.context || proxyConfig.path;

        // It is possible to use the `bypass` method without a `target`.
        // However, the proxy middleware has no use in this case, and will fail to instantiate.
        if (proxyConfig.target) {
            return httpProxyMiddleware(context, proxyConfig);
        }
    };

    var middlewareList = [];
    proxyConfig.forEach(function (proxyItemOrCallback) {
        var proxyItem = void 0;
        var proxyMiddleware = void 0;

        if (typeof proxyItemOrCallback === "function") {
            proxyItem = proxyItemOrCallback();
        } else {
            proxyItem = proxyItemOrCallback;
        }

        proxyMiddleware = getProxyMiddleware(proxyItem);
        function _middleware(req, res, next) {
            if (typeof proxyItemOrCallback === "function") {
                var newProxyConfig = proxyItemOrCallback();
                if (newProxyConfig !== proxyItem) {
                    proxyItem = newProxyConfig;
                    proxyMiddleware = getProxyMiddleware(proxyItem);
                }
            }
            var bypass = typeof proxyItem.bypass === "function";
            var bypassUrl = bypass && proxyItem.bypass(req, res, proxyItem) || false;

            if (bypassUrl) {
                req.url = bypassUrl;
                next();
            } else if (proxyMiddleware) {
                return proxyMiddleware(req, res, next);
            } else {
                next();
            }
        };
        middlewareList.push(_middleware);
    });
    return middlewareList;
}
function initialization(param) {
    var config = void 0;
    try {
        config = getProxyConfig(param);
        if (typeof config === 'undefined' || (0, _keys2.default)(config).length <= 0) {
            throw new Error(errMsg2);
        }
    } catch (err) {
        log.info(errMsg2);
        return blankMiddleware;
    }
    return getMiddlewareList(config);
}

module.exports = function (param) {
    if (!param) {
        log.info(errMsg2);
        return blankMiddleware;
    };
    var middlewarelist = initialization(param);
    return middlewarelist;
};