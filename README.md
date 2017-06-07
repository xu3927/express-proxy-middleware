# express-proxy-middleware

抽离 [webpack-dev-server](https://github.com/webpack/webpack-dev-server) 中的代理功能作为一个中间件
方便传入一个path, 或者proxy对象来生成express中间件.

## 配置
支持webpack-dev-server配置中的 [proxy](https://webpack.js.org/configuration/dev-server/#devserver-proxy) 配置规则.

## 参考

转发功能采用 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) 库实现

## 其他

开发node版本 6.5.0