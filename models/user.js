var mongoose = require('mongoose')


 mongoose.model('User',  new mongoose.Schema(
     {
         name: String,
         password: String,
         socketID:{
             type:String,
             default : ''
         }
     }

 ));

