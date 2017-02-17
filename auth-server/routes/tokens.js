//oauth2
var oauth2orize = require('oauth2orize');
var server = oauth2orize.createServer();
//mongodb schema
var Token_pat = require('../models').Token_pat;
var Token_rpt = require('../models').Token_rpt;
var Token_aat = require('../models').Token_aat;
var Lifetime = require('../models').Lifetime;
var ResourceServer = require('../models').ResourceServer;
//middleware
var oauth2 = require('../middleware/oauth2');
var requiredAuthentication = require('../middleware').requiredAuthentication;
var checkClientId = require('../middleware').checkClientId;
var checkStatus = require('../middleware').checkStatus;
var fc = require('../middleware/functions');
//others
var async = require('async');
var https = require('https');
//https.globalAgent.maxSockets = 100;
//routes
module.exports = function(app){
    app.get('/token_pat', requiredAuthentication,function (req, res){
        Token_pat.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,tokens){
            if(err){return res.status(403).send({error: err.message})}
            //if(tokens.length===0){return res.status(403).send('not found token!')}//display empty list
            res.render('Tokens/tokens', {
                title: 'Tokens PAT',
                tokenList: tokens,
                today : new Date()
            });
        });
    });

    app.get('/token_rpt', requiredAuthentication,function (req, res){
        Token_rpt.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,tokens){
            if(err){return res.status(403).send({error: err.message})}
            //if(tokens.length===0){return res.status(403).send('not found token!')}//display empty list
            res.render('Tokens/tokens', {
                title: 'Tokens RPT',
                tokenList: tokens,
                today : new Date()
            });
        });
    });

    app.get('/token_aat', requiredAuthentication,function (req, res){
        Token_aat.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,tokens){
            if(err){return res.status(403).send({error: err.message})}
            //if(tokens.length===0){return res.status(403).send('not found token!')}//display empty list
            res.render('Tokens/tokens', {
                title: 'Tokens AAT',
                tokenList: tokens,
                today : new Date()
            });
        });
    });

    app.get('/dialog/authorize',requiredAuthentication, checkClientId, checkStatus, oauth2.authorization, oauth2.authorizationCallback);

    app.post('/dialog/authorize/decision',requiredAuthentication,oauth2.decision);

    app.post('/oauth/token', oauth2.token);//if requiredAuthentication, no token saved in auth server

    app.delete('/token_pat/:id', requiredAuthentication,function (req, res){
        Token_pat.remove({_id : req.params.id}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/token_pat");
        });
    });

    app.delete('/token_aat/:id', requiredAuthentication,function (req, res){
        Token_aat.remove({_id : req.params.id}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/token_aat");
        });
    });

    app.delete('/token_rpt/:id', requiredAuthentication,function (req, res){
        Token_rpt.remove({_id : req.params.id}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/token_rpt");
        });
    });

    app.get('/token-exp', requiredAuthentication,function (req, res){
        var host = req.headers.host;
        var referer= req.header('referer');
        var tokenType = "";
        if (referer==="https://"+host+"/token_pat"){
            tokenType = "pat"
        }else if(referer==="https://"+host+"/token_rpt"){
            tokenType = "rpt"
        }else if(referer==="https://"+host+"/token_aat"){
            tokenType = "aat"
        }else if(referer==="https://"+host+"/ticket"){
            tokenType = "ticket"
        }else{}
        Lifetime.findOne({$and:[{_user : req.session.user.username},{type:tokenType}]},{}, function(err,lt){
            if(err){return res.status(403).send({error: err.message})}
            var lifetime = ''
            if(!lt){lifetime = "undefined"}
            else{lifetime = lt.lifetime}
            res.render('Tokens/setLifetime', {
                title: 'Set '+tokenType.toUpperCase()+' Lifetime',
                description: 'Please input the token\'s lifetime(in minutes)',
                type: tokenType,
                lifetime : lifetime
            });
        });
    });

    app.post('/token-exp', requiredAuthentication,function (req, res){
        var host = req.headers.host;
        var tokenLT = parseInt(req.body.tokenLT);
        var type = req.body.tokenType;
        var username = req.session.user.username;
        var referer= req.header('referer');
        var url = "";
        if (referer==="https://"+host+"/token_pat"){
            url = "/token_pat"
        }else if(referer==="https://"+host+"/token_rpt"){
            url = "/token_rpt"
        }else if(referer==="https://"+host+"/token_aat"){
            url = "/token_aat"
        }else if(referer==="https://"+host+"/ticket"){
            url = "/ticket"
        }else{url = "/"}
        //console.log(!isNaN(parseFloat(tokenLT)) && isFinite(tokenLT));//number---true
        if(!isNaN(parseFloat(tokenLT)) && isFinite(tokenLT)){
            Lifetime.findOne({$and:[{_user : username},{type:type}]},{}, function(err,tok){
                if(err){return res.status(403).send({error: err.message})}
                if(tok){//update
                    Lifetime.update({$and:[{_user : username},{type:type}]},{$set:{
                        lifetime : tokenLT
                    }},{safe:true}, function (err, doc) {
                        if(err){return res.status(403).send({error: err.message})}
                        //console.log(req.header('referer'))
                        res.redirect(url)//referer
                    });
                }else{//create
                    var lifetime = new Lifetime({
                        _user : username,
                        type : type,
                        lifetime : tokenLT
                    }).save(function (err,doc){
                            if(err){return res.status(403).send({error: err.message})}
                            res.redirect(url)//referer
                        });
                }
            });
        }else{
            req.session.error = 'Input must be a number!!';
            res.redirect('/token-exp');
        }
    });

    app.post('/refresh/token',function (req, res){
        var accessToken = req.body.accessToken;
        var refreshToken = req.body.refreshToken;
        var newToken = fc.randomString(256);
        var newRefreshToken = fc.randomString(256);
        async.parallel([
            function(callback){
                fc.findOneServer({$and:[{clientId : req.body.clientId},{scope:req.body.type}]},callback)
            },
            function(callback){
                async.waterfall([
                    function(callback){
                        fc.findOnePAT({$and:[{token : accessToken},{refreshToken:refreshToken}]},callback)
                    },
                    function(pat,callback){
                        fc.findLifetime({$and:[{_user : pat._user},{type:'pat'}]},callback)
                    },
                ],function(err,lifetime){
                    if(err){callback(err,null)}
                    else{callback(null,lifetime)}
                })
            },
        ],function(err,results){//null,server,lifetime
            if(err){return res.status(403).send({error: err.message})}
            var server = results[0];
            var lifetime = results[1].lifetime;
            var expiredDate = new Date();
            expiredDate.setMinutes(expiredDate.getMinutes()+lifetime);
            Token_pat.update({$and:[{token : accessToken},{refreshToken : refreshToken}]},{$set:{
                token : newToken,
                expiredDate : expiredDate,
                scope : server.scope
            }},{safe:true}, function (err, doc) {
                if(err){return res.status(403).send({error: err.message})}
                var data = JSON.stringify({
                    user : server._user,
                    accessToken : accessToken,
                    refreshToken : refreshToken,
                    newToken : newToken,
                    newRefreshToken : newRefreshToken,
                    expiredDate : expiredDate,
                    scope : server.scope
                });
                var options = {
                    host: server.serverUrl.substring(8).substring(0,server.serverUrl.substring(8).lastIndexOf(":")),
                    port: server.serverUrl.substring(8).substring(server.serverUrl.substring(8).lastIndexOf(":")+1),
                    path: '/update/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                };
                var request = https.request(options, function(response) {});
                request.on('error', function(err) {console.log(err);});
                request.write(data);
                request.end();
            });
        })
    });

    app.post('/refresh/provider',function (req, res){//update token for this provider pat, update scope
        console.log("POST /refresh/provider")
        console.log(req.body)
        async.series([
            function(callback){
                fc.findOnePAT({$and:[{token : req.body.accessToken},{refreshToken:req.body.refreshToken}]},callback)
            },
            function(callback){
                async.waterfall([
                    function(callback){
                        fc.findOneServer({$and:[{clientId : req.body.clientId},{clientSecret:req.body.clientSecret}]},callback)
                    },
                    function(server,callback){
                        async.parallel([
                            function(callback){
                                callback(null,server)
                            },
                            function(callback){
                                fc.findLifetime({$and:[{_user : server._user},{type:'pat'}]},callback)
                            },
                        ],function(err,results){
                            if(err){callback(err,null)}
                            else{
                                callback(null,results[0],results[1])
                                //callback(null,server,lifetime)
                            }
                        })

                    },
                ],function(err,server,lifetime){
                    if(err){callback(err,null)}
                    else{
                        var newToken = fc.randomString(256);
                        var expiredDate = new Date();
                        expiredDate.setMinutes(expiredDate.getMinutes()+lifetime.lifetime);
                        Token_pat.update({$and:[{_user : server._user},{object_id:server._id}]},{$set:{////update related token in ticket
                            token : newToken,
                            expiredDate : expiredDate,
                            scope : server.scope
                        }},{safe:true}, function (err, doc) {
                            if(err){callback(err,null)}
                            else{callback(null,server,newToken,expiredDate)}
                        });
                    }
                })
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            //var pat = results[0];
            var server = results[1][0];
            var newToken = results[1][1];
            var expiredDate = results[1][2];
            var data = JSON.stringify({
                clientId : server.clientId,
                scope : server.scope,
                newToken : newToken,
                expiredDate : expiredDate
            });
            var options = {
                host: 'localhost',
                port: 3000,
                //host: server.serverUrl.substring(8).substring(0,server.serverUrl.substring(8).lastIndexOf(":")),
                //port: server.serverUrl.substring(8).substring(server.serverUrl.substring(8).lastIndexOf(":")+1),
                path: '/refresh/scope/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            var request = https.request(options, function(res) {});
            request.on('error', function(err) {console.log(err);});
            request.write(data);
            request.end();
        })
    });

}
/**
 * Created by nmu on 01/04/2015.
 */
