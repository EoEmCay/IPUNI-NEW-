const { googleLogin } = require('./src/modules/auth/auth.service');
googleLogin('invalid_token').catch(err => console.log('CAUGHT:', err)).then(() => process.exit(0));
