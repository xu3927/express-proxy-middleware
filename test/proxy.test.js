const path = require('path');
const express = require('express');
const chai = require('chai');
const expect = chai.expect;
const ProxyMiddleware = require('../index.js');
const request = require('supertest');

function startProxyServers () {
    const listeners = [];
    const proxy1 = express();
    const proxy2 = express();
    proxy1.use(logPath('proxy1'));
    proxy2.use(logPath('proxy2'));
    proxy1.get('/proxy1', function (req, res, next) {
        res.send('from proxy1');
    });
    proxy1.get('/api', function (req, res, next) {
        res.send('from proxy1 /api');
    });
    proxy2.get('/proxy2', function (req, res, next) {
        res.send('from proxy2');
    });
    proxy2.get('/foo/*', function (req, res, next) {
        res.send('from proxy2 代理 foo');
    });
    listeners.push(proxy1.listen('9000'), proxy2.listen('9001'));
    function logPath (name) {
        return function (req, res, next) {
            next();
        }
    }
    return function closeProxyServers () {
        listeners.forEach(_listener => {
           _listener.close();
        });
    }
}

function startHttpServer (dir) {
    dir = dir || './proxyConfig.js';
    let server = express();
    server.all('*', (req, res, next) => {
        next();
    });
    server.use(ProxyMiddleware(path.resolve(__dirname, dir)));
    server.get('/foo/*', function (req, res) {
        res.send('bypass url');
    })
    server.all('*', (req, res, next) => {
        res.send('3000server');
    });
    let listener = server.listen('3000');
    return {
        server: listener,
        close: function () {
            listener.close();
        }
    }
}

describe('读取配置文件', function () {
    it('生成代理中间件数组', function () {
        let res = ProxyMiddleware(path.resolve(__dirname, './proxyConfig.js'));
        expect(res instanceof Array).to.be.ok;
    })
});
describe('测试代理功能', function () {
    let closeProxyServers;
    let httpServer;
    let req;
    before(function () {
        closeProxyServers = startProxyServers();
        httpServer = startHttpServer('./proxyConfig.js');
        req = request(httpServer.server);
    });
    after(function () {
        closeProxyServers();
        httpServer.close();
    });
    describe('target', function () {
        it('测试proxy的target转发功能', function (done) {
           req
               .get('/proxy1')
               .expect(200, 'from proxy1', done);
        });
    });
    describe('pathRewrite', function () {
        it('测试proxy的pathRewrite', done => {
            req.get('/api/proxy2')
                .expect(200, 'from proxy2', done)
        });
    });
    describe('bypass', function () {
        it('测试proxy的bypass', done => {
            req.get('/foo/index.html')
                .expect(200, 'bypass url', done)
        });
    });

});