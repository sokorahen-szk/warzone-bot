const axios = require("axios");
require('dotenv').config();

module.exports = {
    parser(command, callback) {
        let action = command.match(/^\/([a-zA-Z]+)\s([a-zA-Z0-9\s]+)+?/);

        try {
            if(!action) return null;
            return this[action[1]](action[2].split(' '), callback);
        } catch (e) {
            return null;
        }
    },

    history(options, callback) {

        let player = options[0];
        let limit = options[1] ? options[1] : 10;

        axios.get(
            process.env.BASE_API_URL + 'recent_win_ratio_bulk',
            {
                params: {
                    recent: limit
                }
            }
        )
        .then (res => {
            let result = '';
            if(res.data.err == '') {
                result = res.data.results.find( res => {
                    return player == res.name;
                });
                callback.send(
                    result ? `${result.name} さんの直近 ${limit} 戦分のデータ\n勝利：${result.win}　敗北：${result.lost}　勝率：${result.win_ratio}%` : 'そんな人いないようです・・・'
                );
            }
        });

    }

}