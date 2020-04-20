const cron = require('node-cron');
const axios = require('axios');
const path = require("path");
const fs = require('fs');
const moment = require('moment');

console.log(moment().format("YYYY-MM-DD hh:mm:ss"));

module.exports = {

    /* Global */
    temporaryPath: 'tmp',
    tauntFilePath: 'files/taunt',
    tauntVoiceMP3DownloadUrl: "http://warzone.php.xdomain.jp/test.zip",

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
        let distFileName = path.basename(this.tauntVoiceMP3DownloadUrl);

        console.log("ダウンロード");

        (async (execSync, distFileName) => {
            res = await axios.get(this.tauntVoiceMP3DownloadUrl, {responseType: 'arraybuffer'});

            fs.writeFileSync(
                options.tmpPath + '/' + distFileName,
                new Buffer.from(res.data),
                'binary',
                (err) => {

                    if(err) {
                        throw err;
                    }

                }
            );

            console.log("%s ダウンロード完了...", this.tauntVoiceMP3DownloadUrl);

            //ダウンロードしたファイルの解凍
            execSync(`unzip ${options.tmpPath+'/'+distFileName} -d ${options.tmpPath}`, (err) => {
                if(err) {
                    throw err;
                }
                this._getCurrentDir(options.tmpPath + '/' + distFileName.split('.').shift());
            });

        })(execSync, distFileName);

    },

    _move() {

    },

    _getCurrentDir(path) {
        fs.readdir(path, function(err, files){
            if (err) throw err;
            var fileList = files.filter(function(file){
                return fs.statSync(file).isFile() && /.*\.mp3$/.test(file); //絞り込み
            })
            console.log(fileList);
        });
    }

}

/* Call */
module.exports.init();