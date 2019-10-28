const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new Schema({
 name:{type: String, required:true},
 email:{type: String, required: true, unique:true},
 password:{type: String, required: true},
 lists: [
    {
      type: Schema.Types.ObjectId,
      ref: 'List'
    }
  ]
},
{ timestamps: true }
);

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);