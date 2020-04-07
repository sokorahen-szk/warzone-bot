const config = require("../config/axios.json");

module.exports = {

    /* global */
    client: require('axios'),
    method: 'post',
    params: {},
    url: '',

    initialize(url, headers) {
        if(typeof url != 'undefined') this.url = url;
        if(typeof headers != 'undefined' && headers) {
            Object.keys(headers).forEach( key => {
                config[key] = headers[key];
            });
        }
    },

    call() {
        try {
            return this.client[this.method](this.url, this.params, config);
        } catch(e) {
            console.log(e)
            return null;
        }
    },

    get(params, url) {
        this.method = 'get';
        this.params = params;
        if(url) this.url = url;
        return this.call();
    },

    post(params, url) {
        this.method = 'post';
        this.params = params;
        if(url) this.url = url;
        return this.call();
    }
};