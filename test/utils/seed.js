#!/usr/bin/env node

const GhostFactory = require('./factory');
const prettyCLI = require('@tryghost/pretty-cli');
const ui = prettyCLI.ui;
const chalk = require('chalk');
const faker = require('faker');

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
        .command('member', {
            desc: 'Seed a single member, with related records',
            run: async (argv) => {
                let memberFactory = new GhostFactory('members', {created_by: 1});
                let createdMembers = await memberFactory.create();
                createdMembers.forEach(async (member) => {
                    ui.log(member);
                    let memberLoginEventFactory = new GhostFactory('members_login_events', {member_id: member.id});
                    let memberLoginEvents = await memberLoginEventFactory.count(faker.datatype.number(5)).create();
                    ui.log(memberLoginEvents);
                });
            }
        })
        .strict()
        .parseAndExit();
}

if (require.main === module) {
    main();
}

module.exports = prettyCLI;
