const httpClient = require("./httpClient.js");
const notifiyAlertClient = require("./httpClient.js");
const commandConfig = require("../config/commandConfig.json");
const path = require("path");
const agh = require('agh.sprintf');
require('dotenv').config();

/* エラー時の通知先 */
notifiyAlertClient.initialize(
    `${process.env.NOTIFICATION_POST_WEBHOOK_URL}${process.env.NOTIFICATION_POST_WEBHOOK_KEY}`
);

module.exports = {
    parser(command, callback, botClient) {
        let action;
        if(command.indexOf(' ') !== -1) {
            action = command.match(/^\/([a-zA-Z]+)\s?([a-zA-Z0-9\s_-]+)+?/);
        } else {
            action = command.match(/^\/([a-zA-Z^\s]+)/);
        }

        try {
            if(!action) return null;
            if(action.length == 3) this[action[1]](callback, botClient, action[2].split(' '));
            if(action.length == 2) this[action[1]](callback, botClient);
        } catch (e) {
            throw e;
        }
    },

    /*
     * 試合数から勝率データを表示する
     */
    history(callback, botClient, options = []) {

        let player = typeof options[0] != 'undefined' ? options[0].toLowerCase() : '';
        let limit = typeof options[1] != 'undefined' ? Number(options[1]) : 10;

        //バリデーション入れるまで　バグ回避用にへんてこコードを追加しとくぜ！
        if( !Number.isInteger(limit) || limit < 1 || player.length < 2) {
            callback.channel.send("フォーマットが正しくありません\n例：　/history <プレイヤー名> <試合数>　");
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
                callback.channel.send(
                    res.data.err == '' ? `${res.data.name} さんの直近 ${res.data.recent} 戦分のデータ\n勝利：${res.data.win}　敗北：${res.data.lost}　勝率：${res.data.win_ratio}%` : `${res.data.err}`
                );
            } else {
                callback.channel.send("おや、BOTの様子がおかしいようだ。");
            }
        })
        .catch ( err => {
            notifiyAlertClient.post({content: err});
        });

        return;
    },

    /*
     * タウントを鳴らす
     */
    taunt(callback, botClient, options = []) {
        let tauntNo = typeof options[0] != 'undefined' ? Number(options[0]) : null;

        //バリデーション入れるまで　バグ回避用にへんてこコードを追加しとくぜ！
        if( !Number.isInteger(tauntNo) || tauntNo === null || tauntNo < 1 || 11 < tauntNo || tauntNo == 100) {
            callback.channel.send("フォーマットが正しくありません\n例：　/taunt <タウント番号 範囲 1 - 11>　");
            return;
        }

        callback.member.voice.channel.join()
        .then( connection => {
            const dispatcher = connection.play(
                path.resolve(path.join("files", "taunt")) + '/' + agh.sprintf("%.2d", tauntNo) + '.mp3',
                {
                    volume: 1
                }
            );

            dispatcher.on('finish', () => {
                connection.disconnect();
            });

        })
        .catch( err => {
            notifiyAlertClient.post({content: err});
        });

        return;
    },

    /*
     * 生放送リスト
     */
    live(callback, botClient) {

        httpClient.get(
            {
                category: ''
            },
            process.env.BASE_API_URL + 'live'
        )
        .then( res => {
            if(!res.data.api_err) {
                if(0 < res.data.results.length) {
                    res.data.results.forEach( video => {
                        callback.channel.send({
                            embed: {
                                author: {
                                    name: video.user + ' の配信を見る',
                                    url: video.link,
                                },
                                thumbnail: {
                                    url: video.thumbnail
                                },
                                description: video.status,
                                url: video.link,
                                fields: [
                                    {
                                        name: "視聴者数",
                                        value: video.viewers.replace(/\(|\)/g, ''),
                                    },
                                    {
                                        name: "経過時間",
                                        value: video.showtime,
                                    }
                                ]
                            }
                        });
                    });
                } else {
                    callback.channel.send(res.data.err);
                }
            } else {
                callback.channel.send("おや、BOTの様子がおかしいようだ。");
            }
        })
        .catch( err => {
            notifiyAlertClient.post({content: err});
        });

        return;
    },

    /*
     * ヘルプ
     */
    help(callback, botClient) {
        let commandList = ['```', '', '```'];

        Object.keys(commandConfig).forEach( key => {
            commandList[1] += `${commandConfig[key].command}\n\t\t${commandConfig[key].description}\n\n`;
        });

        callback.channel.send(commandList.join(''));

        return;
    }

}