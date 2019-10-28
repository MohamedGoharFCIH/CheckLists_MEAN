const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment: { type: String, required:true},
    list: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true},
},
{ timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);