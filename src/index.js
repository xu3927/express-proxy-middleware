const httpProxyMiddleware = require("http-proxy-middleware");
const fs = require('fs');
const path = require('path');
const Log = require('log');
const log = new Log();
const errMsg1 = '读取配置文件失败';
const errMsg2 = '未找到proxy配置';


const blankMiddleware = function (req, res, next) {
    next();
}
function setDefaultFields (options) {
    const isDebug = typeof options.debug === 'undefined' ? false : options.debug;
    const defaultFields = {
        changeOrigin: true,
        autoRewrite: true
    };
    const debugFields = {
        onError (err, req, res) {
            log.error('Error:', err);
        },
        onProxyReq (proxyReq, req, res) {
            console.log('----proxyRequestHeaders----');
            console.log(req.method, req.url);
            console.log(proxyReq._headers);
        },
        onProxyRes (proxyRes, req, res) {
            console.log('----proxyResponseHeaders----');
            console.log(req.method, req.url);
            console.log(proxyRes.headers);
        }
    };
    if (isDebug) {
        Object.assign(defaultFields, debugFields);
    }
    Object.assign(options, defaultFields);
}
function getProxyConfig (param) {
    let proxyConfig;
    let config = {};
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
function getMiddlewareList (proxyConfig) {

    if(!Array.isArray(proxyConfig)) {
        proxyConfig = Object.keys(proxyConfig).map((context) => {
            let proxyOptions;
            // For backwards compatibility reasons.
            const correctedContext = context.replace(/^\*$/, "**").replace(/\/\*$/, "");

            if(typeof proxyConfig[context] === "string") {
                proxyOptions = {
                    context: correctedContext,
                    target: proxyConfig[context]
                };
            } else {
                proxyOptions = Object.assign({}, proxyConfig[context]);
                proxyOptions.context = correctedContext;
            }
            setDefaultFields(proxyOptions);
            return proxyOptions;
        });
    }

    const getProxyMiddleware = (proxyConfig) => {
        const context = proxyConfig.context || proxyConfig.path;

        // It is possible to use the `bypass` method without a `target`.
        // However, the proxy middleware has no use in this case, and will fail to instantiate.
        if(proxyConfig.target) {
            return httpProxyMiddleware(context, proxyConfig);
        }
    }

    let middlewareList = [];
    proxyConfig.forEach((proxyItemOrCallback) => {
        let proxyItem;
        let proxyMiddleware;

        if(typeof proxyItemOrCallback === "function") {
            proxyItem = proxyItemOrCallback();
        } else {
            proxyItem = proxyItemOrCallback;
        }

        proxyMiddleware = getProxyMiddleware(proxyItem);
        function _middleware (req, res, next) {
            if(typeof proxyItemOrCallback === "function") {
                const newProxyConfig = proxyItemOrCallback();
                if(newProxyConfig !== proxyItem) {
                    proxyItem = newProxyConfig;
                    proxyMiddleware = getProxyMiddleware(proxyItem);
                }
            }
            const bypass = typeof proxyItem.bypass === "function";
            const bypassUrl = bypass && proxyItem.bypass(req, res, proxyItem) || false;

            if(bypassUrl) {
                req.url = bypassUrl;
                next();
            } else if(proxyMiddleware) {
                return proxyMiddleware(req, res, next);
            } else {
                next();
            }
        };
        middlewareList.push(_middleware);
    });
    return middlewareList;
}
function initialization (param) {
    let config;
    try {
        config = getProxyConfig(param);
        if (typeof config === 'undefined' || Object.keys(config).length <= 0) {
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
    let middlewarelist = initialization(param);
    return middlewarelist;
}
