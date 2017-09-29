const massive = require('massive');
const config = require('../config');

const connectionString = config.dbstring;
module.exports = massive.connectSync({connectionString: connectionString});
