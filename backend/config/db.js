const mongoose = require("mongoose");

module.exports = () => {
  mongoose.connect("mongodb://127.0.0.1:27017/erp_finance")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));
};
