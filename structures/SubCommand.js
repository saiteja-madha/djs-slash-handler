module.exports = class SubCommand {
    /**
     * @typedef {Object} SubCommandData
     * @property {string} description - subcommand description
     * @property {string[]} options - subcommand options
     * @property {Function} callback - subcommand callback
     */

    /**
     * @param {string} name
     * @param {SubCommandData} data
     */
    constructor(name, data) {
        this.constructor.validate(name, data);
        this.name = name;
        this.description = data.description;
        this.options = data.options;
        this.callback = data.callback;
    }

    get json() {
        return {
            name: this.name,
            description: this.description,
            type: 1,
            options: this.options,
        };
    }

    static validate(name, data) {
        if (typeof data.description !== "string") throw new TypeError(`SubCommand description must be a string: ${name}`);
    }
};
