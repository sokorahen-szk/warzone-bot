const cron = require('node-cron');
const axios = require('axios');
const path = require("path");
const fs = require("fs");

module.exports = {

    /* Global */
    temporaryPath: 'tmp',
    tauntFilePath: 'files/taunt',
    tauntVoiceMP3DownloadUrl: "http://www.enviro-studio.net/MP/pre_b2_files/others.zip",

    init() {

        try {
            let options =  {
                curPath: __dirname,
                tmpPath: path.resolve(path.join(this.temporaryPath)),
                tauntFilePath: path.resolve(path.join(this.tauntFilePath))
            }

            //MP3をダウンロードをテンポラリーに保存し、そのあと解凍して格納する
            this.schedule("tauntMP3FetchAndUncompress", "1 * * * * *", options);

        } catch (err) {
            throw err;
        }

    },

    schedule(funcName, schedule = "* * * * * *", options) {
        cron.schedule(schedule, () => this[funcName](options) );
    },

    /*
     * タウント用MP3をダウンロードする
     */
    tauntMP3FetchAndUncompress(options) {

        let execSync = require('child_process').execSync;
        let res;

        (async (execSync) => {
            res = await axios.get(this.tauntVoiceMP3DownloadUrl, {responseType: 'arraybuffer'});

            fs.writeFileSync(
                options.tmpPath + '/' + path.basename(this.tauntVoiceMP3DownloadUrl),
                new Buffer.from(res.data),
                'binary',
                (err) => {

                    if(err) {
                        throw err;
                    }

                }
            );

            execSync("unzip " + options.tmpPath + '/' + path.basename(this.tauntVoiceMP3DownloadUrl));

            console.log(`done`);
        })(execSync);

    }

}

/* Call */
module.exports.init();