const moment = require("moment-timezone");
const timezone = moment.tz("Asia/Tokyo");

module.exports = {
  now(format) {
    return format ? timezone.clone().format(format) : timezone.clone();
  },
  convertToSeconds(value) {
    let seconds = 0;
    if(value.indexOf('d') !== -1) seconds = Number(value.replace('d', '')) * 24 * 3600;
    if(value.indexOf('h') !== -1) seconds = Number(value.replace('h', '')) * 3600;
    if(value.indexOf('m') !== -1) seconds = Number(value.replace('m', '')) * 60;
    if(value.indexOf('s') !== -1) seconds = Number(value.replace('s', ''));
    return seconds;
  }
};