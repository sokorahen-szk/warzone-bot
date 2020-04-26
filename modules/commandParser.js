const validation = require("../config/validation.json");
const Validator = require('validatorjs');
module.exports = {

    /* global */
    prefix: '/',

    /*
     * パーサー
     */
    parse(command) {

        let commands = {
            cmd: null,
            options: []
        }

        // コマンド出ない場合は Null
        if(! this.isCommandCheck(command)) return null;

        if(command.match(/^\/([a-zA-Z]+)$/)) {
            commands.cmd = command.match(/^\/([a-zA-Z]+)$/)[1];
        } else if(command.match(/^\/([a-zA-Z]+)\s(.+)/)) {
            commands.cmd = command.match(/^\/([a-zA-Z]+)\s(.+)/)[1];
            commands.options = command.match(/^\/([a-zA-Z]+)\s(.+)/)[2].split(' ');
        }

        return this.validCheck(commands);

    },

    /*
     * コマンドチェック
     */
    isCommandCheck(command, prefix = this.prefix) {
        return command.indexOf(prefix) === 0;
    },

    /*
     * コマンドチェック
     */
    validCheck(commands) {

        let validate;
        let order;
        let data;
        let result = {
            cmd: commands.cmd,
            options: {},
            errors: [],
            fails: false,
        };

        if( !validation[commands.cmd] ) {
            result.errors.push("コマンドが存在しません。");
            result.fails = true;
            return result;
        }

        if(commands.options.length < validation[commands.cmd].requireOption) {
            result.errors.push("オプションが足りません。");
            result.fails = true;
            return result;
        }

        if(0 < validation[commands.cmd].option && 0 < commands.options.length ) {
            commands.options.forEach( (option, index) => {

                order = validation[commands.cmd].order[index];
                data = {};
                data[order] = option;

                validate = new Validator(data, validation[commands.cmd].rules[index]);

                // バリデーション通過したら格納する
                if(validate.passes()) {
                    result.options[order] = option;
                } else {
                    result.errors.push(validation[commands.cmd].errors[order]);
                }
            });

            // デフォルトの値をセットする
            Object.keys(validation[commands.cmd].default).forEach( key => {
                if(Object.keys(result.options).indexOf(key) === -1) {
                    result.options[key] = validation[commands.cmd].default[key];
                }
            });
        }

        // オプション項目が正しい確認
        if(0 < validation[commands.cmd].option && 0 < Object.keys(validation[commands.cmd].default).length) {
            validation[commands.cmd].order.forEach( order => {
                if(Object.keys(result.options).indexOf(order) == -1) {
                    result.errors.push(validation[commands.cmd].errors[order]);
                }
            });
        }

        // エラーメッセージが１件でもあれば、エラーとして処理
        if(0 < result.errors.length) result.fails = true;

        return result;
    }

};