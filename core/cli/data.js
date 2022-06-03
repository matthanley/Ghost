const _ = require('lodash');
const knex = require('../server/data/db/connection');
const {faker} = require('@faker-js/faker');
const Command = require('./command');

const emailFields = {
    members: ['email'],
    email_recipients: ['member_email'],
    members_email_change_events: ['to_email', 'from_email'],
    members_stripe_customers: ['email']
};

module.exports = class Data extends Command {
    async cleanOfferRedemptions() {
        // delete orphaned redemptions
        await knex('offer_redemptions')
            .whereNotIn(
                'subscription_id',
                knex('members_stripe_customers_subscriptions')
                    .select('id')
            )
            .del();
    }

    async cleanUnusedTags() {
        await knex('tags')
            .whereNotIn(
                'id',
                knex('posts_tags')
                    .select('tag_id')
            )
            .del();
    }

    async cleanUnusedLabels() {
        await knex('labels')
            .whereNotIn(
                'id',
                knex('members_labels')
                    .select('label_id')
            )
            .del();
    }

    async mapReplyTo() {
        const replyToEmails = await knex('emails')
            .distinct()
            .pluck('reply_to');
        this.debug(replyToEmails);

        const emailMap = new Map();
        replyToEmails.forEach((item) => {
            emailMap.set(item, `test+${faker.word.adjective()}@ghost.org`);
        });
        this.debug(emailMap);

        for (const email of emailMap.keys()) {
            this.info(`mapping ${email} -> ${emailMap.get(email)}`);
            await knex('emails')
                .where('reply_to', email)
                .update('reply_to', emailMap.get(email));
        }
    }

    async mapEmails() {
        this.info('updating emails');
        const emailMap = new Map();
        const newEmails = new Set();

        for (const table in emailFields) {
            for (const column of emailFields[table]) {
                const emails = await knex(table)
                    .select('id', column);
                const progressBar = this.progressBar(emails.length);
                for (const row of emails) {
                    const email = row[column];
                    if (!emailMap.has(email)) {
                        let newEmail = faker.internet.email();

                        // ensure the new email is unique
                        while (newEmails.has(newEmail)) {
                            let [user, host] = newEmail.split('@');
                            user = [user.split('+')[0], faker.word.verb()].join('+');
                            newEmail = [user, host].join('@');
                        }

                        newEmails.add(newEmail);
                        emailMap.set(email, newEmail);
                    }
                    progressBar.update({status: `[${table}.${column}] mapping ${email} -> ${emailMap.get(email)}`});
                    await knex(table)
                        .where('id', row.id)
                        .update(column, emailMap.get(email));
                    progressBar.increment();
                }
                progressBar.stop();
                this.ok(`=> updated ${table}.${column}`);
            }
        }
    }

    async updateMembers() {
        this.info('updating members');
        const members = await knex('members')
            .select('id', 'note');

        const progressBar = this.progressBar(members.length);
        for (const m of members) {
            const member = {
                name: faker.name.findName(),
                geolocation: JSON.stringify({
                    region: faker.address.state(),
                    country: faker.address.country(),
                    country_code: faker.address.countryCode()
                }),
                note: m.note ? faker.lorem.paragraph() : null
            };
            await knex('members')
                .update(member)
                .where({id: m.id});
            progressBar.increment();
        }
        progressBar.stop();
        this.ok('=> updated member data');
    }

    async handle(argv = {}) {
        // await this.cleanOfferRedemptions();
        // await this.mapEmails();
        // await this.updateMembers();
        // await this.mapReplyTo();
        // await this.cleanUnusedTags();
        // await this.cleanUnusedLabels();

        knex.destroy();
        this.info('done.');
    }
};
