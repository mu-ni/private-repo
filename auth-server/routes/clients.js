//mongodb schema
var ObjectID = require('mongoose/node_modules/mongodb').ObjectID;
var Client = require('../models').Client;
var ResourceServer = require('../models').ResourceServer;
var Permission = require('../models').Permission;
//middleware
var requiredAuthentication = require('../middleware').requiredAuthentication;
var fc = require('../middleware/functions');
//others
var async = require('async');
var https = require('https');
//https.globalAgent.maxSockets = 100;
//routes
module.exports = function(app){
    app.get('/client', requiredAuthentication,function (req, res){
        //add resource server
        Client.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,clients){
            if(err){return res.status(403).send({error: err.message})}
            //if(clients.length===0){return res.status(403).send('not found client!')}//display empty list
            async.each(clients,fc.addServerNameCli,function(err){
                if(err){
                    console.log(err)
                    return res.status(403).send({error: err.message})
                }
                res.render('Clients/clients',{
                    title: 'Clients',
                    clientList : clients
                });
            });
        });
    });

    app.get('/addClient', requiredAuthentication,function (req, res){
        fc.findServer({_user : req.session.user.username},function(err,servers){
            if(err){return res.status(403).send({error: err.message})}
            res.render('Clients/addClient',{
                title: 'Add New Client',
                serverList : servers,
                id : new ObjectID()
            });
        })
    });

    app.post('/client', function (req, res){//requiredAuthentication
        console.log(req.body)
        var serverIdSet = req.body.serverId;
        var host = req.headers.host;
        var id = new ObjectID();
        if(req.body.identify){//form resource server
            console.log('from resourceServer')
            async.waterfall([
                function(callback){
                    fc.findOneServer({clientId:req.body.clientId},callback)
                },
                function(server,callback){
                    if(server.scope.indexOf('uma_protection:client')<0){
                        return res.render('ResourceServer/unAuthorized', {
                            title: 'Scope error',
                            description: 'Can\'t find client in the scope!'
                        });
                    }
                    var client = new Client({
                        _id : id,
                        _user : server._user,
                        clientName : req.body.clientName,
                        clientType : req.body.clientType,
                        clientUrl : "https://"+host+"/client/"+id,
                        tokenType : req.body.tokenType,
                        resourceServer : [{id : req.body.id, serverId : server._id.toString(), username : req.body.username}],
                        clientId : fc.randomString(20),
                        clientSecret : fc.randomString(40)
                    }).save(function (err,doc){
                            if(err){callback(err,null)}
                            else{callback(null,id)}
                        });
                },
            ],function(err,auth_id){
                if(err){return res.status(403).send({error: err.message})}
                res.status(201).send({auth_id: auth_id});
            })
        }else{//from auth server/////////2th server delay
            console.log('from auth server')
            var username = req.session.user.username;
            if(!Array.isArray(serverIdSet)){serverIdSet = [req.body.serverId];}
            async.waterfall([
                function(callback){
                    var client = new Client({
                        _id : id,
                        _user : username,
                        clientName : req.body.clientName,
                        clientType : req.body.clientType,
                        clientUrl : "https://"+host+"/client/"+id,
                        tokenType : req.body.tokenType,
                        pinCode : req.body.pinCode,
                        resourceServer : [],//be back later
                        clientId : fc.randomString(20),
                        clientSecret : fc.randomString(40)
                    }).save(function (err,doc){
                            if(err){callback(err,null)}
                            else{callback(null,client.emitted.fulfill[0])}
                        });
                },
                function(client,callback){
                    if(typeof(serverIdSet[0])=='undefined'){
                        callback(null,null)
                    }else{
                        async.waterfall([
                            /*function(callback){//no check
                                fc.checkPATs({$and:[{_user : username},{object_id:{$in:serverIdSet}}]},callback)
                            },
                            function(pats,callback){//find and check server umaCompliant or not*/
                            function(callback){//find and check server umaCompliant or not
                                fc.findServer({$and:[{_user : username},{_id:{$in:serverIdSet}}]},callback)
                            },
                            function(servers,callback){
                                //async.each(servers, fc.httpsResp.bind(null,URL,rpt.token),callback)
                                servers.forEach(function(server){//check serverCompliant
                                    if(server.umaCompliant){
                                        callback(null,null)
                                    }else{//server.umaCompliant==false//several callback==move to the end
                                        async.waterfall([
                                            function(callback){
                                                async.parallel([
                                                    function(callback){
                                                        fc.createRPT(username,client._id,"Client",server.scope,callback)
                                                    },
                                                    function(callback){
                                                        fc.getURL(server,'client_endpoint',callback)
                                                    }
                                                ],function(err,results){
                                                    if(err){callback(err,null)}
                                                    else{callback(null,results[0],results[1])}//0-rpt,1-url
                                                })
                                            },
                                            function(rpt,URL,callback){
                                                var data = JSON.stringify({
                                                    name : client.clientName,
                                                    type : client.clientType,
                                                    token_type : client.tokenType,
                                                    auth_id : client._id,
                                                    clientId : server.clientId
                                                });
                                                fc.httpsResp("POST",data,URL,rpt.token,callback)
                                            },
                                            function(body,callback){
                                                console.log(body)
                                                var newResourceServer = {id:body.id, serverId:server._id.toString(), username:body.client_id};
                                                Client.update({_id:client._id},{$push:{
                                                    resourceServer : newResourceServer
                                                }},{safe:true}, function (err, doc) {
                                                    if(err){callback(err,null)}
                                                    else{callback(null,null)}
                                                });
                                            },
                                        ],function(err,results){
                                            if(err){callback(err,null)}
                                            else{callback(null,null)}
                                        })
                                    }
                                })//for each
                            },
                        ],function(err,results){
                            if(err){callback(err,null)}
                            else{callback(null,null)}
                        })
                    }
                },
            ],function(err,results){
                if(err){return res.status(403).send({error: err.message})}
                res.redirect("/client");
            })
        }//from auth server
    });

    app.get('/client/:id', requiredAuthentication,function (req, res){
        fc.findOneClient({_id:req.params.id},function(err,client){
            if(!client){return res.status(403).send("not found client")}
            async.each(client.resourceServer,fc.addServerNameEditCli,function(err){
                if(err){
                    console.log(err)
                    return res.status(403).send({error: err.message})
                }
                res.render('Clients/editClient', {
                    title: 'Edit Client',
                    edit_cli : client
                });
            })
        })
    });

    app.put('/client/:id',requiredAuthentication,function (req, res){
        var cli_id = req.params.id;
        Client.update({_id:cli_id},{$set:{
            clientName : req.body.clientName,
            clientType : req.body.clientType
        }},{safe:true}, function (err, doc) {
            if(err){return res.status(403).send(err)}
            res.redirect("/client");
        });
    });

    app.delete('/client/:id', requiredAuthentication,function (req, res){
        async.series([
            function(callback){
                Permission.findOne({$and:[{_user : req.session.user.username},{clientId:req.params.id}]}, function (err, permission) {
                    if(err){callback(err,null)}
                    else if(permission){
                        callback(new Error('Can\'t delete!! This client is used in permission!'),null)
                    }
                    else{callback(null,permission)}
                });
            },
            function(callback){
                Client.remove({_id : req.params.id}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,null)}
                });
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/client");
        })
    });

    app.post('/check-server',requiredAuthentication,function(req,res){
        var value = req.body.value;
        //console.log(value)
        var username = req.session.user.username;
        if(!value){return res.json(null)}
        //console.log(value)
        Client.find({$and:[{_user : username},{_id:{$in:value}}]}, function (err, checkedClients) {
            if(err){return res.status(403).send(err)}
            if(checkedClients.length===0){return res.status(403).send('not found client!')}
            var serverId = [];
            for(var i=0;i<checkedClients.length;i++){
                for(var j=0;j<checkedClients[i].resourceServer.length;j++){
                    serverId = serverId.concat(checkedClients[i].resourceServer[j].serverId)
                }
            }
            //console.log(serverId)
            Client.find({$and:[{_user : username},{_id:{$nin:value}},{"resourceServer.serverId":{$in:serverId}}]}, function (err, clients) {
                if(err){return res.status(403).send(err)}
                if(clients.length===0){return res.json(null)}
                //console.log(clients)//clients with the different server//checkable
                res.json(clients)
            });
        });
    });

    app.post('/merge-clients',requiredAuthentication,function(req,res){
        var id = new ObjectID();
        var host = req.headers.host;
        var mergeId = req.body.clients;
        var username = req.session.user.username;
        Client.find({$and:[{_user : username},{_id:{$in:mergeId}}]}, function (err, clients) {
            if(err){return res.status(403).send(err)}
            if(clients.length===0){return res.status(403).send('not found client!')}
            console.log(clients)
            var resourceServer = []//resourceServer : [{"id" : "55b9e83a518538a0049f6eac","serverId" : "55ae41fb6cabaf30153a6c1d","username" : "muni"}]
            var clientName = [];
            var clientType = [];
            for(var i=0;i<clients.length;i++){
                resourceServer = resourceServer.concat(clients[i].resourceServer);
                clientName = clientName.concat(clients[i].clientName);
                clientType = clientType.concat(clients[i].clientType);
            }
            console.log(resourceServer)
            console.log(clientName)
            console.log(clientType)
            var serverId = [];
            for(var i=0;i<resourceServer.length;i++){
                serverId = serverId.concat(resourceServer[i].serverId)
            }
            //console.log(serverId)
            var client = new Client({
                _id : id,
                _user : username,
                clientName : clientName,//string/array
                clientType : clientType,//string/array
                clientUrl : "https://"+host+"/client/"+id,
                tokenType : "undefined",
                resourceServer : resourceServer,
                clientId : fc.randomString(20),
                clientSecret : fc.randomString(40)
            }).save(function (err,doc){
                    if(err){return res.status(403).send(err)}
                    //delete old clients and push new client to resourceServers
                    //////Client.remove({_id : {$in:removeId}}, function (err, doc) {
                            //if (err) {return res.status(403).send(err)}
                            //push to update new id in auth server
                            ResourceServer.find({$and:[{_user : username},{_id:{$in:serverId}}]}, function (err, servers) {
                                if(err){return res.status(403).send(err)}
                                if(servers.length===0){return res.status(403).send('not found server!')}
                                console.log(resourceServer)
                                servers.forEach(function(server){
                                    console.log(server)
                                    var server_id = '';
                                    for(var i=0;i<resourceServer.length;i++){
                                        if(resourceServer[i].serverId===server._id.toString()){
                                            server_id = resourceServer[i].id
                                        }
                                    }
                                    var data = JSON.stringify({
                                        server_id : server_id,
                                        auth_id : id
                                    });
                                    //console.log(server.serverUrl)
                                    var options = {
                                        host: server.serverUrl.substring(8).substring(0,server.serverUrl.substring(8).lastIndexOf(":")),
                                        port: server.serverUrl.substring(8).substring(server.serverUrl.substring(8).lastIndexOf(":")+1),
                                        path: '/update/auth_id',
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Content-Length': Buffer.byteLength(data)
                                        }
                                    };
                                    var request = https.request(options, function(response) {});
                                    request.on('error', function(err) {console.log(err)});
                                    request.write(data);
                                    request.end();
                                });
                                res.send({result:'OK'})///////////
                            });
                    //});
                });
        })
    });

}
/**
 * Created by nmu on 01/04/2015.
 */
