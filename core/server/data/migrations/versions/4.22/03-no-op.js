const logging = require('@tryghost/logging');
const {createTransactionalMigration} = require('../../utils.js');

module.exports = createTransactionalMigration(
    async function up() {
        logging.info('Nothing to do');
    },

    async function down() {
        logging.info('Nothing to do');
    }
);
