# express-proxy-middleware

抽离 [webpack-dev-server](https://github.com/webpack/webpack-dev-server) 中的代理功能作为一个中间件
方便传入一个path, 或者proxy对象来生成express中间件.

## 配置
支持webpack-dev-server配置中的 [proxy](https://webpack.js.org/configuration/dev-server/#devserver-proxy) 配置规则.

## 使用

- 安装

```bash
npm install express-proxy-middleware
```

- 配置文件

参考 

```javascript
// 如 proxy.config.js, 文件名不限 
module.exports = {
    'proxy': {
        '/proxy1': {
            'target': 'http://localhost:9000'
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

## 使用

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