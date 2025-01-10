const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  reg: { type: String, required: true, unique: true },
  yos: { type: String, required: true },
  ministry: { type: String, required: true},
  course: { type: String, required: true},
  et: { type: String, required: true},
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);