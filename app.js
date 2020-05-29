const express = require('express');
const md5 = require("crypto-js/md5");
const session = require('express-session');
var fs = require('fs');
const app = express();

app.use(express.urlencoded({extended: false}));

let sess = {
    secret: 'keyboard cat',
    cookie: {},
    resave: true,
    saveUninitialized: true,
}
if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}
app.use(session(sess))

app.get('/', (req, res) => {
    res.send('index.html')
});

app.post('/api/v1/login', (req, res) => {
    if (sess.userId) {
        res.status(200).send({userId: sess.userId})
    } else {
        if (req.body.password != undefined) {
            const pass = md5('admin').words
            const userPass = md5(req.body.password).words
            let same = true
            for(let x = 0; x < pass.length; x++) {
                if (pass[x] != userPass[x]) {
                    same = false
                    break
                }
            }
            if (same) {
                if(req.body.username === 'admin'){
                    sess = req.session
                    sess.userId = 1
                    res.status(200).send({userId:1})
                } else {
                    res.status(204).send({})
                }
            } else {
                res.status(204).send({})
            }
        } else {
            res.status(204).send({})
        }
    }
});

app.get('/api/v1/config', (req, res) => {
    if (sess.userId) {
        let rawdata = fs.readFileSync('config.json');
        let config = JSON.parse(rawdata);
        if (config.length === 0) {
            res.status(204).send(config)    
        } else {
            res.status(200).send(config)
        }
    } else {
        res.status(401).send('please login')
    } 
});

app.post('/api/v1/config', (req, res) => {
    if (sess.userId) {
        // cek all required field
        if (req.body.address !== undefined 
            && req.body.username !== undefined
            && req.body.password !== undefined
            && req.body.port !== undefined
            ) {
            let rawdata = fs.readFileSync('config.json');
            let config = JSON.parse(rawdata);
            config.push({
                address: req.body.address,
                username: req.body.username,
                password: md5(req.body.password),
                port: req.body.port
            }); 
            let json = JSON.stringify(config); //convert it back to json
            fs.writeFile('config.json', json, (err, result) => {
                if(err) console.log('error', err);
            }); // write it back 
            res.status(200).send(config)
        } else {
            res.status(417).send('all fields are required')
        }
    } else {
        res.status(401).send('please login')
    } 
});

app.put('/api/v1/config/:id', (req, res) => {
    if (sess.userId) {
        if (req.params.id !== undefined) {
            if (req.body.address !== undefined 
                && req.body.username !== undefined
                && req.body.password !== undefined
                && req.body.port !== undefined
                ) {
                let rawdata = fs.readFileSync('config.json');
                let config = JSON.parse(rawdata);
                if (config[req.params.id] !== undefined) {
                    config[req.params.id] = {
                        address: req.body.address,
                        username: req.body.username,
                        password: md5(req.body.password),
                        port: req.body.port
                    } 
                    let json = JSON.stringify(config); //convert it back to json
                    fs.writeFile('config.json', json, (err, result) => {
                        if(err) console.log('error', err);
                    }); // write it back 
                    res.status(200).send(config)
                } else {
                    res.status(204).send('no data with that id')
                }
            } else {
                res.status(417).send('all fields are required')
            }
        } else {
            res.status(417).send('id is required')
        }
    } else {
        res.status(401).send('please login')
    } 
});

app.delete('/api/v1/config/:id', (req, res) => {
    if (sess.userId) {
        if (req.params.id !== undefined) {
            let rawdata = fs.readFileSync('config.json');
            let config = JSON.parse(rawdata);
            if (config[req.params.id] !== undefined) {
                config.splice(req.params.id,1) 
                let json = JSON.stringify(config); //convert it back to json
                fs.writeFile('config.json', json, (err, result) => {
                    if(err) console.log('error', err);
                }); // write it back 
                res.status(200).send('deleted')
            } else {
                res.status(204).send('no data with that id')
            }
        } else {
            res.status(417).send('id is required')
        }
    } else {
        res.status(401).send('please login')
    } 
});

app.listen(3000);
