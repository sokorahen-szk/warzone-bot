const Discord = require("discord.js");
const discordClient = new Discord.Client();
const moment = require("moment");
const firebase = require("firebase/app");

require("firebase/database");
require('dotenv').config();

firebase.initializeApp(require("./firebase.json"));

const db = firebase.database();
const ref = db.ref(process.env.FIREBASE_OBJECT_KEY);

( _this => {

    let discord;

    /* 起動時の処理 */
    _this.on("ready", () => {
        discord = ref.once("value").then( res => {
            return res.val();
        });
    });

    /* メッセージ送信時 */
    _this.on("message", message => {

        if(_this.checkBot(message)) return;

        let msg = message.content;

        discord.then( res => {
            message.reply(res.message)
                .then( success => console.log("send message"))
                .catch(console.error);
        });

        return;
    });

    /* チャンネル参加時 */
    _this.on("guildMemberAdd", member => {
        if (!member.guild.channels.cache.find(ch => ch.name == process.env.GUIDELINE_CHANNEL_NAME)) {
            return;
        }

        channel.send(`Welcome to the server, ${member}`);
    });

    /* 自分がBOTかどうか */
    _this.checkBot = (message => {
        return message.author.bot;
    });

    /*
     * BOTをログインさせる
     */
    _this.login(process.env.BOT_ACCESS_TOKEN_KEY);

})(discordClient);