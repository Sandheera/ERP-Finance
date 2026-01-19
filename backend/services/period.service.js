const Period = require("../models/Period");

async function isPeriodClosed(month) {
  const period = await Period.findOne({ month });
  return period && period.closed;
}

module.exports = { isPeriodClosed };
