# express-proxy-middleware

提取 [webpack-dev-server](https://github.com/webpack/webpack-dev-server) 中的代理功能作为一个中间件
方便传入一个path, 或者含有proxy属性的对象来生成express中间件.

## 配置

支持webpack-dev-server配置中的 [proxy](https://webpack.js.org/configuration/dev-server/#devserver-proxy) 配置规则.

- 安装

```bash
npm install express-proxy-middleware
```

## 使用

参数支持传入一个配置对象或包含配置对象的配置文件路径, 路径支持绝对路径或相对路径.

- 配置文件参考 

```javascript
// 如配置文件为 proxy.config.js
module.exports = {
    proxy: {
        '/proxy1': {
            // 目标地址, 必须带完整的协议(如 http:// 或 https://)
            'target': 'http://localhost:9000',
             // whether to print Http headers. default false
             debug: false
            // 设置请求header
            'headers': {
                // 转发的请求携带的cookie
                cookie: 'id=abcdefg;',
                // 请求头host字段, 该字段不需要带协议
                host: 'localhost'
            }
        },
        '/api/proxy2': {
            'target': 'http://localhost:9001',
            'pathRewrite': { '^/api': '' }
        },
        '/foo': {
            target: 'http://localhost:9001',
            'bypass': function(req) {
                if (/\.html$/.test(req.path)) {
                    return '/foo/a/index.html';
                }
            }
        }
    }
}

```

- 配置对象参考

```javascript
const proxyConfig = {
     proxy: {
         '/proxy1': {
             'target': 'http://localhost:9000',
             // whether to print Http headers. default false
             debug: false
         },
         '/api/proxy2': {
             'target': 'http://localhost:9001',
             'pathRewrite': { '^/api': '' }
         },
         '/foo': {
             target: 'http://localhost:9001',
             'bypass': function(req) {
                 if (/\.html$/.test(req.path)) {
                     return '/foo/a/index.html';
                 }
             }
         }
     }
 };
                     
```


配置对象需要包含proxy属性. 

```javascript
const express = require('express');
const proxyMiddleware = require('express-proxy-middleware');
var app = express();
/**
 * proxyMiddleware 转发中间件
 * @param object | string;  可以直接传配置对象, 或配置文件路径
 * 配置文件路径支持绝对路径或相对路径.
 */
app.use(proxyMiddleware(path.resovle(__dirname, 'proxy.config.js')));
app.listen(3000);

```

## 参考

转发功能采用 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) 库实现

## 其他

开发node版本 6.5.0