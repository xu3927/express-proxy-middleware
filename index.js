const httpProxyMiddleware = require("http-proxy-middleware");
const fs = require('fs');
const path = require('path');
const Log = require('log');
const log = new Log('info');

function getProxyConfig (param) {
    let proxyConfig;
    let config = {};
    const errMsg = '没有找到proxy配置';
    if (typeof param === 'string') {
        try {
            if (!path.isAbsolute(param)) {
                param = path.resolve(process.cwd(), param);
            }
            config = require(path.resolve(param));
        } catch (err) {
            log.error('读取配置文件失败');
        }
    } else if (typeof param === 'object') {
        config = param.proxy;
    }
    if (config.proxy) {
        proxyConfig = config.proxy;
    } else {
        log.error(errMsg);
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
    let config = getProxyConfig(param);
    middlewarelist = getMiddlewareList(config);
    return middlewarelist;
}


module.exports = function (param) {
    let middlewarelist = initialization(param);
    return middlewarelist;
}
