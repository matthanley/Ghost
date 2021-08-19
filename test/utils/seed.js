#!/usr/bin/env node

const GhostFactory = require('./factory');
const prettyCLI = require('@tryghost/pretty-cli');
const ui = prettyCLI.ui;
const chalk = require('chalk');

// This main function runs the functionality either as a command line tool or as a require
async function main() {
    prettyCLI.preface('Command line utility for seeding data into Ghost\'s database')
        .command('all', {
            desc: 'Seed all tables',
            run: async (argv) => {
                let factory = new GhostFactory('benefits', {name: 'Benefit'});
                // TODO: this never returns - maybe create() leaks promises?
                let created = await factory.count(10).create();
                ui.log(created);
            }
        })
        .strict()
        .parseAndExit();
}

if (require.main === module) {
    main();
}

module.exports = prettyCLI;
