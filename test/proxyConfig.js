module.exports = {
    'proxy': {
        '/proxy1': {
            'target': 'http://localhost:9000',
            debug: true
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
