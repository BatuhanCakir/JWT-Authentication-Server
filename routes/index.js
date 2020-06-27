var express = require('express');
var router = express.Router();

router.post('/username', (req, res) => {
  console.log(req.body)
  console.log('sdasd')
  res.redirect('http://localhost:4000/');
});
/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.protocol + '://' + req.get('host') );
  res.render('index', { title: 'Express' });
});




module.exports = router;
