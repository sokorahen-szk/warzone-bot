const httpClient = require("./httpClient.js");
const notifiyAlertClient = require("./httpClient.js");
const fireStore = require("./firestore.js");
const commandParser = require("./commandParser.js");
const commandConfig = require("../config/commandConfig.json");
const date = require("./date.js");
const path = require("path");
const agh = require('agh.sprintf');
require('dotenv').config();

/* エラー時の通知先 */
notifiyAlertClient.initialize(
    `${process.env.NOTIFICATION_POST_WEBHOOK_URL}${process.env.NOTIFICATION_POST_WEBHOOK_KEY}`
);

module.exports = {
    parser(command, callback, store, botClient) {
        let action;

        try {

            action = commandParser.parse(command);

            //／コマンドではない場合
            if(action==null) return null;

            // エラーがある場合
            if(action['fails']) {
                callback.channel.send(action.errors.join('\n'));
                return null;
            }

            this[action.cmd](callback, botClient, action.options, store);
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
    async vote(callback, botClient, options = {}, store) {

        let voteChannel = callback.guild.channels.cache.find( channel => channel.name == "vote")
        let seconds = date.convertToSeconds(options.times);
        let startDate = date.now("YYYY-MM-DD HH:mm:ss");
        let endDate = date.now().add(seconds, "seconds").format("YYYY-MM-DD HH:mm:ss");

        // 対象者
        let player = {
            "id"   : 2,
            "name" : `${options.player}`,
            "beforeRate": 1000, //ここは可変
            "afterRate": options.setRate
        };

        // リアクション格納
        let reactions = [];

        //投票開始
        voteChannel.send(`投票リクエスト\n\`\`\`対象者： ${player.name}さん\n\n変更前：${player.beforeRate} →　変更後：${player.afterRate}\n投票期間：${startDate} 〜 ${endDate}\`\`\`\n1️⃣-\`賛成\`\n2️⃣-\`現状維持\`\n3️⃣-\`反対\``)
        .then( async (res) => {

            let voteId = res.createdTimestamp;

            callback.channel.send(`${player.name} さんの投票リクエストが提出されました。\n投票ID：${voteId}`);

            reactions.push(await res.react('1️⃣'));   //賛成
            reactions.push(await res.react('2️⃣'));   //現状維持
            reactions.push(await res.react('3️⃣'));   //反対

            console.log(res)

            // Storeにキャッシュ
            store.votes[`${voteId}`] = {
                "author": callback.author.username,
                "authorId": callback.author.id,
                "player": player,
                "beginDate": startDate,
                "endDate": endDate,
                "callback": {
                    "reactions": reactions,
                    "this": res
                }
            };

            fireStore.setVote(voteId, {
                id: voteId,
                author: callback.author.username,
                authorId: callback.author.id,
                beginDate: startDate,
                endDate: endDate,
                player: player,
                agreeCount: 0,
                opposition: 0,
                keep: 0,
            });

        });

        return;
    },

    /*
     * 投票　取り消し
     */
    async voteremove(callback, botClient, options = {}, store) {

        //取り消し処理
        if(store.votes[`${options.voteId}`]) {

            // 投票を作った人しか、投票の取り消しはできない
            // 近い将来、Discordのロールでも取り消せるようにする
            if(callback.author.id == store.votes[`${options.voteId}`].authorId) {

                // リアクション削除
                store.votes[`${options.voteId}`]["callback"]["reactions"].forEach( reaction => {
                    reaction.remove();
                });

                // 取り消しメッセージを表示する
                store.votes[`${options.voteId}`]["callback"]["this"].edit("投票を取り消しました。");

                // 投票のデータ削除
                delete store.votes[`${options.voteId}`];

                if(!store.votes[`${options.voteId}`]) {
                    callback.channel.send(`投票ID:${options.voteId} の投票を取り消しました。`);
                } else {
                    callback.channel.send(`投票ID:${options.voteId} の投票を取り消せませんでした。`);
                }
            }
        } else {
            callback.channel.send(`投票ID:${options.voteId} は存在しない投票IDです。`);
        }

        return;
    }

}