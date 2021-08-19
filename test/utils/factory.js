const schema = require('../../core/server/data/schema').tables;
const faker = require('faker');
const _ = require('lodash');
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'ghost',
        password: 'ghost',
        database: 'ghost'
    }
});

faker.ghost = {
    id: () => {
        // TODO: replace this with Ghost's id generation
        return faker.datatype.uuid().substr(0,24);
    },
    memberStatus: () => {
        return faker.random.arrayElement(['free', 'paid', 'comped']);
    }
};

module.exports = class GhostFactory {
    constructor(model, attrs) {
        this._model = model;
        this._attrs = attrs;
        this._count = 1;
        this._created = [];
        this.regenerate();
    }
    regenerate() {
        this._data = {};
        for (const k in schema[this._model]) {
            if (schema[this._model].hasOwnProperty(k)) {
                if (schema[this._model][k].hasOwnProperty('fake')) {
                    this._data[k] = _.get(faker, schema[this._model][k].fake)();
                }
            }
        }
        Object.assign(this._data, this._attrs);
        return this;
    }
    count(count) {
        this._count = count;
        return this;
    }
    async create() {
        this._created = [];
        for (let i = 0; i < this._count; i++) {
            this.regenerate();
            this._created.push(this._data);
            await this._save();
        }
        return this._created;
    }
    async _save() {
        return knex(this._model).insert(this._data);
    }
};
