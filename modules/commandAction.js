const httpClient = require("./httpClient.js");
const notifiyAlertClient = require("./httpClient.js");
const commandParser = require("./commandParser.js");
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

        try {

            action = commandParser.parse(command);

            // エラーがある場合
            if(action.fails) {
                callback.channel.send(action.errors.join('\n'));
                return null;
            }

            this[action.cmd](callback, botClient, action.options);
        } catch (e) {
            throw e;
        }
    },

    /*
     * 試合数から勝率データを表示する
     */
    history(callback, botClient, options) {

        let player = options.player.toLowerCase();
        let limit = Number(options.gameCount);

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
            if(res.data.err == '') {
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
        let tauntNo = Number(options.tauntNo);

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
    },

    /*
     * 投票
     */
    async vote(callback, botClient, options = {}) {


        //投票開始
        callback.channel.send('a').then( async (res) => {
            await res.react('1️⃣');   //下方修正希望
            await res.react('2️⃣');   //現状維持
            await res.react('3️⃣');   //上方修正希望
            const messageId = res.channel.lastMessageID;
            console.log(messageId)
        });
    }

}