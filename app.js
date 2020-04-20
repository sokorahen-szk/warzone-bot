const Discord = require("discord.js");
const firebase = require("firebase/app");
require('firebase/auth');
require('firebase/database');

const commandAction = require("./modules/commandAction.js");
const httpClient = require("./modules/httpClient.js");

require('dotenv').config();

//require("./cron/cron.js");

/* エラー時の通知先 */
httpClient.initialize(
    `${process.env.NOTIFICATION_POST_WEBHOOK_URL}${process.env.NOTIFICATION_POST_WEBHOOK_KEY}`
);

/* Firebaseの設定 */
firebase.initializeApp(require("./config/firebase.json"));

const discordClient = new Discord.Client();
const db = firebase.database();
const ref = db.ref(process.env.FIREBASE_OBJECT_KEY);

( _this => {

    let discordConfig;

    /* 起動時の処理 */
    _this.on("ready", () => {
        discordConfig = ref.once("value").then( res => {
            return res.val();
        })
        .catch( err => {
            httpClient.post({content: err});
        });
    });

    /*
     * メッセージ送信時
     * 主にユーザが入力したコマンドを解釈する時にここに分岐を書いて行きます
     */
    _this.on("message", message => {

        if(_this.checkBot(message)) return;
        try {
            commandAction.parser(message.content, message, this);
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
        }

        return;
    });

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