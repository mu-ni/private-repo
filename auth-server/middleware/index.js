var User = require('../models').User;
var ResourceServer = require('../models').ResourceServer;
var Token_pat = require('../models').Token_pat;
var passport = require('passport');
exports.requiredAuthentication = function(req, res, next) {
    if (req.session.user) {
        next();
    }else{
        console.log('Authorize failed!')
        req.session.error = 'Please login first!';
        //res.redirect('/login');
        res.render("login", {
            title: 'Gemalto Login',
            error: req.session.error
        });
    }
}

exports.checkUser = function(req, res, next) {
    var username = req.params.username;
    if (username===req.session.user.username) {
        next();
    } else {
        req.session.destroy(function () {
            res.render("login", {
                title: 'Gemalto Login',
                error: 'please login as '+username+'!'
            });
        });
    }
}

exports.userExist = function(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = "User Exist"
            res.redirect("/signup");
        }
    });
}

exports.checkClientId = function(req, res, next) {
    var clientId = req.query.client_id;
    var username = req.session.user.username;
    ResourceServer.findOne({$and:[{_user : username},{clientId:clientId}]},{},function(err,server){
        if(err){return res.status(403).send(err)}
        if(server){
            next();
        }else{
            //res.send('client id not exist!!!')
            res.render('ResourceServer/unAuthorized', {
                title: 'Unauthorized client',
                description: 'ClientId is not exist! Please check your ClientId!'
            });
        }
    });
}

exports.checkStatus = function(req, res, next) {
    var clientId = req.query.client_id;
    var username = req.session.user.username;
    ResourceServer.findOne({$and:[{_user : username},{clientId:clientId}]},{},function(err,server){
        if(err){return res.status(403).send(err)}
        if(!server){return res.status(403).send('not found server!')}
        if(server.status===true){
            next();
        }else{
            res.render('ResourceServer/unAuthorized', {
                title: 'ResourceServer is inactive',
                description: 'ResourceServer is inactive! Please check your ResourceServer!'
            });
        }
    });
}

/*exports.checkClientSecret = function(req, res, next) {
    var clientSecret = req.body.client_secret;
    var clientId = req.query.client_id;
    //var username = req.session.user.username;
    console.log('execute here!!!')
    ResourceServer.findOne({$and:[{clientId : clientId},{clientSecret:clientSecret}]},{},function(err,doc){
    //ResourceServer.findOne({$and:[{_user : username},{clientSecret:clientSecret}]},{},function(err,doc){
        if(doc){
            next();
        }else{
            res.render('ResourceServer/unAuthorized', {
                title: 'Unauthorized client',
                description: 'ClientSecret not exist! Please check your ClientSecret!'
            });
        }
    });
}*/

exports.checkToken = function(req, res, next) {
    console.log('check token function')
    next()
}

exports.checkResourceServerUnique = function(req, res, next) {
    var username = req.session.user.username;
    var serverName = req.body.serverName;
    ResourceServer.findOne({$and:[{_user : username},{serverName:serverName}]}, function (err, doc) {
        if (doc) {
         req.session.error = 'This serverName already exist!';
         res.redirect("/add-resource-server");
         }
         else {
            next()
        }
    });
}

//module.exports.requiredAuthentication = requiredAuthentication;
//module.exports.userExist = userExist;

exports.findResourceServer = function(id, done) {
    ResourceServer.findOne({_id:id},{},function(err,server){
        if(err){return done(null, null);}
        if(!server){return console.log('not found server!')}
        else{
            return done(null, server);
        }
    });
};

exports.findByClientId = function(clientId, done) {
    ResourceServer.findOne({clientId:clientId},{},function(err,server){
        if(err){return done(null, null);}
        if(!server){return console.log('not found server!')}
        else{
            return done(null, server);
        }
    });
};

exports.findUser = function(id, done) {
    User.findOne({_id:id},{},function(err,user){
        if(err){return done(null, null);}
        if(!user){return console.log('not found user!')}
        else{
            return done(null, user);
        }
    });
};

exports.findByUsername = function(username, done) {
    User.findOne({username:username},{},function(err,user){
        if(err){return done(null, null);}
        if(!user){return console.log('not found user!')}
        else{
            return done(null, user);
        }
    });
};

var tokens = {};
exports.findToken = function(key, done) {
    var token = tokens[key];
    return done(null, token);
};

/*exports.saveToken = function(token, userID, clientID, done) {
    tokens[token] = { userID: userID, clientID: clientID };
    console.log("------------")
    console.log(tokens)
    console.log("------------")
    return done(null);
};*/

exports.saveToken = function(user, token, refreshToken, objectId, objectName, objectType, createdDate, lifetime, expiredDate, scope, done) {
    //tokens[token] = { userID: userID, clientID: clientID };
    //console.log("------------")
     //console.log(tokens)
     //console.log("------------")
    //var scope = req.body.scope;
    //createdDate.setSeconds(createdDate.getSeconds()+lifetime);
    //console.log(expiredDate)
    var token_pat = new Token_pat({
        _user : user,//
        token : token,
        refreshToken : refreshToken,
        object_id : objectId,
        object_name : objectName,
        object_type : objectType,
        createdDate : createdDate,
        lifetime : lifetime,
        expiredDate : expiredDate,
        scope : scope
    }).save(function (err,doc){
            if(err){console.log(err);}
            else{return done(null);}
        });
}


var codes = {};
exports.findAuthCode = function(key, done) {
    var code = codes[key];
    return done(null, code);
};

exports.saveAuthCode = function(code, clientID, redirectURI, userID, done) {
    codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID };
    return done(null);
};

exports.clientInfo = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
        //no use
        res.json({ client_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
        console.log('clientInfo!!!!!!!!!!!!!!')
        console.log(req.user)
    }
]

exports.userInfo = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
        res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
        console.log('userInfo!!!!!!!!!!!!!!')
        console.log(req.user)
    }
]

/*exports.uid = function(len) {
    var buf = [];
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }
    return buf.join('');
};
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}*/


/**
 * Created by nmu on 23/04/2015.
 */
