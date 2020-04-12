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

        return commands;

    },

    /*
     * コマンドチェック
     */
    isCommandCheck(command, prefix = this.prefix) {
        return command.indexOf(prefix) === 0;
    }
};