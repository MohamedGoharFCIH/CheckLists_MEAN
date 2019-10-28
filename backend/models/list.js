const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const listSchema =  new Schema({
    name: { type: String, required:true},
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    // imagePath: { type: String, required: true },
    content: { type:String, required:false},
    done: { type: Number, default: 0},
    expireDate: {type: Date, required: true},
    comments: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Comment'
        }
      ]
},
{ timestamps: true }
);

module.exports = mongoose.model("List", listSchema);