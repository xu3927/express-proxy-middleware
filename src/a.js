console.log(__dirname);
console.log(`Current directory: ${process.cwd()}`);
const Log = require('log');
const log = new Log('error');
log.info('info', 143);
log.debug('preparing email');
log.info('sending email');
log.error('failed to send email');