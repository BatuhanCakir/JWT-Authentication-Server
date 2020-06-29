var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const port = 8000
var app = require('express')();
var http = require('http');
var server = app.listen(port);
let io     = require('socket.io')(server);
app.use(session({secret: 'mySecret', resave: false, saveUninitialized: false}));

app.use(express.static(path.join(__dirname, 'static')));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(bodyParser.json());
require('dotenv').config();
require('./models/user')

const mongoose = require('mongoose');
var User = mongoose.model('User');
mongoose.connect(process.env.MONGODB_URL,{
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify:false
})

app.post('/register', (req, res,next) => {
  User.findOne({
      name : req.body.name
    }, function (err, user) {
      if (err) return next(err);
      if (user) return  next({message: 'User already exists'})
      const hashedPassword =  bcrypt.hashSync(req.body.password, 10)
      let newUser = new User({
        name: req.body.name,
        password: hashedPassword
      })
      newUser.save()

    accessToken = generateAccessToken({user: req.body.name})
    res.cookie('token', accessToken, { httpOnly: true });
    res.send('/chat')

    })

});
app.get('/register', function(req, res, next) {
  res.render('register')

});
app.post('/login',(req,res,next)=>{
  User.findOne({
    name: req.body.name
  },function (err,user) {
    if(err) return next(err)
    if (user == null)return res.status(500).send('No User found');
    if(bcrypt.compareSync(req.body.password, user.password)) {
      const accessToken = generateAccessToken({user: user.name})
      const refreshToken = jwt.sign({name: user.name}, process.env.REFRESH_TOKEN)

      res.cookie('token', accessToken, { httpOnly: true ,overwrite: true,maxAge: 30000000});
      res.cookie('refreshToken', refreshToken, { httpOnly: true ,overwrite: true})
      res.status(200).send('/chat');

    } else {
      res.send('Not Allowed')
    }



})})

function generateAccessToken(user){
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5min'})
}
function authenticateToken(req,res,next){
  const token = req.cookies.token
  if (token == null) return res.status(401).redirect('/')
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
    if(err) return  req.session.data = req.url ,res.status(403).redirect('/token')
    req.user = user
    next()
  })
}

app.get('/', function(req, res, next) {
  res.render('username')

});

app.get('/token', function(req, res) {
  const refreshToken = req.cookies.refreshToken
  if (refreshToken== null) return res.status(401).redirect('/')
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN,(err,user)=>{
    if(err) return res.status(403).redirect('/')
    const accessToken = generateAccessToken({user:user.name})
    var url = req.session.data
    req.session.data = null;
    res.cookie('token', accessToken, { httpOnly: true ,overwrite: true,maxAge: 30000000});
    req.user = user
    res.redirect(url)
  })
})
app.get('/chat',authenticateToken, function(req, res, next) {
 var context= req.user.user;
  res.render('index' ,{username:context});


});

app.get('/logout', function(req, res, next) {
  req.clearCookie('refreshToken')
  res.redirect('/');
});


users = []
io.on('connection', (socket) => {


  socket.on('chat message', (msg) => {

      socket.broadcast.emit('chat message', socket.username+' '+msg);


  });

  socket.on('new user',(username)=>{
    User.findOneAndUpdate({name:username},{socketID:socket.id},{new: true},function(err, doc) {
      if (err) console.log(err)
      doc.save()
    });
    socket.username = username
    var message = username + ' connected ';
    socket.broadcast.emit('user connected',message)



  })
  socket.on('disconnect', function() {
    var message =   socket.username +' disconnected'
    socket.broadcast.emit('chat message', message);
  });
  socket.on('typing', function(typing, stopped){
    var msg =socket.username+' is typing...'
    if (typing === false ){
      socket.broadcast.emit('typing', msg )
    }else if(stopped === true){
      socket.broadcast.emit('stopped');
    }
  });
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
