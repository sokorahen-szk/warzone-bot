module.exports = {
    parser(command) {
        let action = command.match(/^\/([a-zA-Z]+)\s([a-zA-Z0-9\s]+)+/);
        try {
            if(!action) return null;
            return this[action[1]](action[2].split(' '));
        } catch (e) {
            return null;
        }
    },

    history(options) {
        console.log(options)
    }

}