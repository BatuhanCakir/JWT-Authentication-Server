require('dotenv').config()

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
mongoose.connect('mongodb://localhost:27017/chatroom-db',{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
var User = mongoose.model('User');
app.post('/register', async(req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password,10)
        const user = {
            name : req.body.name ,
            password : hashedPassword
        }
        req.session.context = req.body.name;
        users.push(user);
        res.send('/chat')
    }catch (e) {
        res.status(500).send()
    }
});
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}
let refreshTokens = []
app.post('/token',(req,res)=>{
    const refreshToken = req.body.token
    if(refreshToken==null)return res.sendStatus(401)
    if(!refreshTokens.includes(refreshToken))return res.sendStatus(401)
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN,(err,user)=>{
        if(err) return res.sendStatus(403)
        const accessToken = genererateAccesToken({user: user.name, password:user.password
        })
        res.send({accesToken:accessToken})
    })
})
app.delete('/delete',(req,user)=>{
    refreshTokens = refreshTokens.filter(token=> token !== req.body.token)
    res.sendStatus(204)
})
app.post('/login',async (req,res)=>{
    const user = await User.findOne({
        name: req.body.name
    })

    if (user == null){
        return res.status(500).send('No User found')
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)) {
            const accessToken =genererateAccesToken(user)
            const refreshToken = jwt.sign(user,process.env.REFRESH_TOKEN)
            refreshTokens.push(refreshToken)
            res.send('/chat',
                {accessToken: accessToken,
                  refreshToken : refreshToken
                });

        } else {
            res.send('Not Allowed')
        }
    } catch {
        res.status(500).send()
    }})

function genererateAccesToken(user){
    jwt.sign(user.name,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '10min'})
}

app.get('/',(req,res)=>{
    res.json({name:'name'})
    })

app.listen(9000)