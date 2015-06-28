// select which module to export

module.exports = function(opts) {
  var ad;
  switch(opts.mode) {
  case 'r':
    if (opts.noHigher)
      ad = require('./adRevRestricted');
    else
      ad = require('./adRev');
    break;
  default:
    ad = require('./ad');
  }
  return ad;
}
