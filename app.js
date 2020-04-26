const Discord = require("discord.js");
const commandAction = require("./modules/commandAction.js");
const httpClient = require("./modules/httpClient.js");
const date = require("./modules/date.js");
require('dotenv').config();

//require("./cron/cron.js");

/* エラー時の通知先 */
httpClient.initialize(
    `${process.env.NOTIFICATION_POST_WEBHOOK_URL}${process.env.NOTIFICATION_POST_WEBHOOK_KEY}`
);

// BOTのIDをリスト化
const botList = ["695273363123208373"];

// 保存されるキャッシュ情報
let store = {
    votes: [
        /*
            id: message.channel.lastMessageID      String
            author: <voteを開始した人>               String
            beginDate: <投票開始日時>                Date
            endDate: <投票終了日時>                  Date
            voteMemory: {
                voters: <投票者>                    String
                status: <投票番号>                  Number
                count: < 1 or -1 >                Number
                createdAt: <投票時間>               Date
            }
        */
    ]
};

const discordClient = new Discord.Client();

( _this => {

    let discordConfig;

    /* 起動時の処理 */
    _this.on("ready", () => {
    });

    /*
     * メッセージ送信時
     * 主にユーザが入力したコマンドを解釈する時にここに分岐を書いて行きます
     */
    _this.on("message", message => {

        if(_this.checkBot(message)) return;
        try {
            commandAction.parser(message.content, message, store, this);
        } catch(err) {
            httpClient.post({content: err});
        }

        return;
    });

    /* チャンネル参加時 */
    _this.on("guildMemberAdd", member => {

        if(_this.checkBot(message)) return;

        let dC = member.guild.channels.cache.find(ch => ch.name == process.env.GUIDELINE_CHANNEL_NAME);

        if (dC) {
            /*
            discordConfig.then( res => {
                dC.send(
                    `<@${member.user.id}>\n` +
                    _this.messageOptimize(res.message), {
                        files: [res.snap_image1]
                    }
                );
            })
            .catch( err => {
                httpClient.post({content: err});
            })
            */
        }

        return;
    });

    /* リアクション追加 */
    _this.on('messageReactionAdd', async (reaction, user) => {
        if(botList.find( item => item != `${user.id}`)) {
            if(store.votes[`${reaction.message.channel.lastMessageID}`]) {
                store.votes[`${reaction.message.channel.lastMessageID}`].voteMemory.push({
                    voters: user.username,
                    voterId: user.id,
                    status: reaction._emoji.name,
                    count:  1,
                    createdAt: date.now("YYYY-MM-DD HH:mm:ss")
                });
            }
            console.log({lastMessageID: reaction.message.channel.lastMessageID})
            console.log(store.votes[`${reaction.message.channel.lastMessageID}`]);
        }
    })
    /* リアクション削除 */
    _this.on('messageReactionRemove', async (reaction, user) => {
        if(botList.find( item => item != `${user.id}`)) {
            if(store.votes[`${reaction.message.channel.lastMessageID}`]) {
                store.votes[`${reaction.message.channel.lastMessageID}`].voteMemory.push({
                    voters: user.username,
                    voterId: user.id,
                    status: reaction._emoji.name,
                    count:  -1,
                    createdAt: date.now("YYYY-MM-DD HH:mm:ss")
                });
            }
            console.log({lastMessageID: reaction.message.channel.lastMessageID})
            console.log(store.votes[`${reaction.message.channel.lastMessageID}`]);
        }
    })

    /* 切断 */
    _this.on('disconnect', () => {
        clearTimeout(_this.ws.connection.ratelimit.resetTimer);
    });

    /* 自分がBOTかどうか */
    _this.checkBot = (message => {
        return message.author.bot;
    });

    /* 改行コードを入れる */
    _this.messageOptimize = (message => {
        return message.replace(/##/g, '\n');
    });

    /*
     * BOTをログインさせる
     */
    _this.login(process.env.BOT_ACCESS_TOKEN_KEY);

})(discordClient);