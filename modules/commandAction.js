const httpClient = require("./httpClient.js");
const notifiyAlertClient = require("./httpClient.js");

require('dotenv').config();

/* エラー時の通知先 */
notifiyAlertClient.initialize(
    `${process.env.NOTIFICATION_POST_WEBHOOK_URL}${process.env.NOTIFICATION_POST_WEBHOOK_KEY}`
);

module.exports = {
    parser(command, callback) {
        let action = command.match(/^\/([a-zA-Z]+)\s([a-zA-Z0-9\s_-]+)+?/);

        try {
            if(!action) return null;
            this[action[1]](action[2].split(' '), callback);
        } catch (e) {
            throw e;
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

        httpClient.get(
            {
                params: {
                    name:   player,
                    recent: limit
                }
            },
            process.env.BASE_API_URL + 'recent_win_ratio'
        )
        .then (res => {
            if(!res.data.api_err) {
                console.log(res.data)
                callback.send(
                    res.data.err == '' ? `${res.data.name} さんの直近 ${res.data.recent} 戦分のデータ\n勝利：${res.data.win}　敗北：${res.data.lost}　勝率：${res.data.win_ratio}%` : `${res.data.err}`
                );
            } else {
                callback.send("おや、BOTの様子がおかしいようだ。");
            }
        })
        .catch ( err => {
            notifiyAlertClient.post({content: err});
            callback.send(err);
        });


        return;
    }

}