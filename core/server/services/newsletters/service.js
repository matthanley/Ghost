const {knex} = require('../../data/db');
const ObjectID = require('bson-objectid');
const debug = require('@tryghost/debug')('services:newsletters');
class NewslettersService {
    /**
     *
     * @param {Object} options
     * @param {Object} options.NewsletterModel
     */
    constructor({NewsletterModel}) {
        this.NewsletterModel = NewsletterModel;
    }

    /**
     *
     * @param {Object} options browse options
     * @returns
     */
    async browse(options) {
        let newsletters = await this.NewsletterModel.findAll(options);

        return newsletters.toJSON();
    }

    async add(attrs, options) {
        // create newsletter and assign members in the same transaction
        if (!options.transacting) {
            return this.NewsletterModel.transaction((transacting) => {
                options.transacting = transacting;
                return this.add(attrs, options);
            });
        }

        // add the model now because we need the ID for sending verification emails
        const newsletter = await this.NewsletterModel.add(attrs, options);

        // subscribe existing members if opt_in_existing=true
        if (options.opt_in_existing) {
            debug(`Subscribing members to newsletter '${newsletter.get('name')}'`);

            // subscribe members that have an existing subscription to an active newsletter
            // refs https://ghost.slack.com/archives/C02G9E68C/p1650404678237709?thread_ts=1650277304.685079&cid=C02G9E68C
            // we use raw queries instead of model relationships because model hydration is expensive
            const memberIds = await knex('members_newsletters')
                .join('newsletters', 'members_newsletters.newsletter_id', '=', 'newsletters.id')
                .where('newsletters.status', 'active')
                .distinct('member_id as id')
                .transacting(options.transacting);

            if (memberIds.length) {
                debug(`Found ${memberIds.length} members to subscribe`);

                let pivotRows = [];
                for (const memberId of memberIds) {
                    pivotRows.push({
                        id: ObjectID().toHexString(),
                        member_id: memberId.id,
                        newsletter_id: newsletter.id
                    });
                }

                await knex.batchInsert('members_newsletters', pivotRows)
                    .transacting(options.transacting);
            }
        }

        return newsletter;
    }
}

module.exports = NewslettersService;

