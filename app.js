const Discord = require("discord.js");
const moment = require("moment");
const firebase = require("firebase/app");

const commandAction = require("./modules/commandAction.js");

require("firebase/database");
require('dotenv').config();

firebase.initializeApp(require("./config/firebase.json"));

const discordClient = new Discord.Client();
const db = firebase.database();
const ref = db.ref(process.env.FIREBASE_OBJECT_KEY);

let response = commandAction.parser("/history dsdsddsc 3ddsds 2332");
console.log(response);

( _this => {

    let discord;

    /* 起動時の処理 */
    _this.on("ready", () => {
        discord = ref.once("value").then( res => {
            return res.val();
        });
    });

    /*
     * メッセージ送信時
     * 主にユーザが入力したコマンドを解釈する時にここに分岐を書いて行きます
     */
    _this.on("message", message => {

        let response;

        if(_this.checkBot(message)) return;

        response = commandAction.parser(message.content);

        if( !response ) return;

        return;
    });

    /* チャンネル参加時 */
    _this.on("guildMemberAdd", member => {

        if(_this.checkBot(message)) return;

        let dC = member.guild.channels.cache.find(ch => ch.name == process.env.GUIDELINE_CHANNEL_NAME);

        if (dC) {
            discord.then( res => {
                dC.send(
                    `<@${member.user.id}>\n` +
                    _this.messageOptimize(res.message), {
                        files: [res.snap_image1]
                    }
                );
            });
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