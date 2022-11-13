const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bLogSchema = new Schema({
   title:String,
   image:[{
      url:String,
      filename: String
   }
    

   ],
   description:String,
   

});

module.exports = mongoose.model('Blog',bLogSchema);