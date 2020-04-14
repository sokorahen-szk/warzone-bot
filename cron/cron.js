const cron = require('node-cron');

module.exports = {

    /* Global */
    temporaryPath: 'tmp',
    tauntFilePath: 'files/taunt',

    tauntVoiceMP3: {
        host: "www.enviro-studio.net",
        path: "/MP/pre_b2_files/others.zip"
    },

    init() {

        let curPath = __dirname;
        let tmpPath = require("path").resolve(require("path").join(this.temporaryPath));
        let tauntFilePath = require("path").resolve(require("path").join(this.tauntFilePath));

        //MP3をダウンロードをテンポラリーに保存し、そのあと解凍して格納する
        //this.schedule("tauntMP3FetchAndUncompress", "1 * * * * *");

    },

    schedule(funcName, schedule = "* * * * * *") {
        cron.schedule(schedule, () => this[funcName]() );
    },

    /*
     * タウント用MP3をダウンロードする
     */
    tauntMP3FetchAndUncompress() {



    }

}

/* Call */
module.exports.init();