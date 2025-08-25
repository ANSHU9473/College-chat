
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  anonymousName: { type: String },
  isOnline: { type: Boolean },
  isBusy: { type: Boolean },
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);

