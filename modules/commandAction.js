const axios = require("axios");
require('dotenv').config();

module.exports = {
    parser(command, callback) {
        let action = command.match(/^\/([a-zA-Z]+)\s([a-zA-Z0-9\s_-]+)+?/);

        try {
            if(!action) return null;
            return this[action[1]](action[2].split(' '), callback);
        } catch (e) {
            console.log(e)
            return null;
        }
    },

    history(options, callback) {
        let player = typeof options[0] != 'undefined' ? options[0].toLowerCase() : '';
        let limit = typeof options[1] != 'undefined' ? Number(options[1]) : 10;

        //バリデーション入れるまで　バグ回避用にへんてこコードを追加しとくぜ！
        if( !Number.isInteger(limit) || limit < 1 || player.length < 2) {
            callback.send("フォーマットが正しくありません\n例：　/history <プレイヤー名> <自然数>　");
            return;
        }

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
                    return player == res.name.toLowerCase();
                });
                callback.send(
                    result ? `${result.name} さんの直近 ${limit} 戦分のデータ\n勝利：${result.win}　敗北：${result.lost}　勝率：${result.win_ratio}%` : `${player}さんって人はいないです・・・`
                );
            }
        })
        .catch ( error => {
            callback.send("おや、BOTの様子がおかしいようだ。");
        });

    }

}