//mongodb schema
var ObjectID = require('mongoose/node_modules/mongodb').ObjectID;
var Resource = require('../models').Resource;
var ResourceServer = require('../models').ResourceServer;
var Client = require('../models').Client;
var Permission = require('../models').Permission;
var Token_pat = require('../models').Token_pat;
var Token_rpt = require('../models').Token_rpt;
var Ticket = require('../models').Ticket;
//middleware
var fc = require('../middleware/functions');
//others
var https = require('https');
var async = require('async');
//https.globalAgent.maxSockets = 100;
module.exports = function(app){
    var host = 'valika3.otrux.com:4001';
    //var host = 'localhost:4001';
    app.get('/discovery',function (req, res){
        //var host = req.headers.host;
        res.status(200).send({
            token_endpoint : 'https://'+host+'/api/token',
            authorization_endpoint : 'https://'+host+'/dialog/authorize',
            introspection_endpoint : 'https://'+host+'/intro',
            resource_set_registration_endpoint : 'https://'+host+'/api/resource',
            client_registration_endpoint : 'https://'+host+'/api/client',
            server_registration_endpoint : 'https://'+host+'/api/resource-server',
            permission_registration_endpoint : 'https://'+host+'/api/permission',
            rpt_endpoint : 'https://'+host+'/api/rpt'
        });
    });

    app.get('/api/discovery',function (req, res){
        //var host = req.headers.host;
        res.status(200).send({
            token_endpoint : 'https://'+host+'/api/token',
            rpt_endpoint : 'https://'+host+'/api/rpt'
        });
    });

    app.get('/uma-configuration',function (req, res){
        //var host = req.headers.host;
        res.status(200).send({
            version : 1.0,
            issuer : 'https://'+host,
            pat_profiles_supported : '[bearer]',
            aat_profiles_supported : '[bearer]',
            rpt_profiles_supported : '[bearer]',
            pat_grant_types_supported : '[authorization_code]',
            aat_grant_types_supported : '[authorization_code]',
            claim_profiles_supported : '[openid]',
            token_endpoint : 'https://'+host+'/api/token',
            authorization_endpoint : 'https://'+host+'/dialog/authorize',
            introspection_endpoint : 'https://'+host+'/intro',
            resource_set_registration_endpoint : 'https://'+host+'/api/resource',
            client_registration_endpoint : 'https://'+host+'/api/client',
            server_registration_endpoint : 'https://'+host+'/api/resource-server',
            permission_registration_endpoint : 'https://'+host+'/api/ticket',
            rpt_endpoint : 'https://'+host+'/api/rpt',
            se_endpoint : 'https://'+host+'/api/csr',
            ca_endpoint : 'https://'+host+'/api/ca'
        });
    });

    app.get('/api/uma-configuration',function (req, res){
        //var host = req.headers.host;
        res.status(200).send({
            token_endpoint : 'https://'+host+'/api/token',
            rpt_endpoint : 'https://'+host+'/api/rpt'
        });
    });

    app.post('/api/csr',function (req, res){
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        if(!req.body.ticket){return res.status(400).send('not found req.body.ticket');}
        var aat = req.headers.authorization.substring(7);
        var ticket = req.body.ticket.code;
        async.waterfall([
            function(callback){
                fc.checkAAT({token:aat},callback)
            },
            function(aat,callback){
                fc.findOneClient({_id:aat.object_id},callback)
            },
            function(client,callback){
                async.waterfall([
                    function(callback){
                        fc.ticketFindServer(ticket,callback)
                    },
                    function(server,callback){
                        fc.findOneServerInClient(client,server._id,callback)
                    },
                    function(data,callback){
                        callback(null,client,data)
                    },
                ],function(err,client,data){
                    if(err){callback(err,null)}
                    else{callback(null,client,data)}
                })
            },
        ],function(err,client,data){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send({
                pinCode : client.pinCode,
                username : data.username
            })
        })
    });

    app.post('/api/token',function (req, res){
        if(!req.body.grant_type){return res.status(400).send('not found req.body.grant_type');}
        if(!req.body.scope){return res.status(400).send('not found req.body.scope');}
        if(!req.body.client_id){return res.status(400).send('not found req.body.client_id');}
        if(!req.body.client_secret){return res.status(400).send('not found req.body.client_secret');}
        var grantType = req.body.grant_type;
        var scope = req.body.scope;
        if(grantType==="code"){
            //auth code flow
        }
        if(grantType==="password"){
            async.waterfall([
                function(callback){
                    fc.findOneClient({$and:[{clientId : req.body.client_id},{clientSecret:req.body.client_secret}]},callback)
                },
                function(client,callback){
                    fc.createAAT(client,scope,callback)
                },
            ],function(err,aat){
                if(err){return res.status(403).send({error: err.message})}
                res.status(201).send({
                    token : aat.token,
                    createdDate : aat.createdDate,
                    lifetime : aat.lifetime,
                    expiredDate : aat.expiredDate,
                    scope : scope
                })
            })
        }
    });

    app.post('/intro',function (req, res){
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        if(!req.body.token){return res.status(400).send('not found req.body.token');}
        var pat = req.headers.authorization.substring(7);
        var rpt = req.body.token;
        Token_pat.findOne({token:pat}, function (err, pat) {
            var today = new Date();
            if(err){return res.status(403).send({error: err.message})}
            if(!pat){return res.status(403).send('not found token_pat');}
            if(today > pat.expiredDate){return res.status(403).send('token_pat expired');}
            Token_rpt.findOne({token:rpt}, function (err, rpt) {
                if(err){return res.status(403).send({error: err.message})}
                if(!rpt){return res.status(403).send('not found token_rpt');}
                if(today > rpt.expiredDate){return res.status(403).send('token_rpt expired');}
                res.status(200).send({
                    active : true,
                    scope : rpt.scope,
                    Iat : rpt.createdDate,
                    Exp : rpt.expiredDate,
                    object_id : rpt.object_id,
                    object_type : rpt.object_type
                });
            });
        });
    });

    app.post('/api/ticket',function (req, res){
        console.log(req.body)
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        if(!req.body.scope){return res.status(400).send('not found req.body.scope');}
        if(!req.body.object_id){return res.status(400).send('not found req.body.object_id');}
        if(!req.body.object_type){return res.status(400).send('not found req.body.object_type');}
        var pat = req.headers.authorization.substring(7);
        var scope = req.body.scope;
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                async.parallel([
                    function(callback){
                        fc.createTicket(pat,req.body.object_id,req.body.object_type,scope,callback)
                    },
                    function(callback){
                        fc.findProfile(pat.token,callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{
                        callback(null,results[0],results[1])//callback(null,ticket,profiles)
                    }
                })
            },
        ],function(err,ticket,profiles){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send({ticket : {
                profiles : profiles,
                code : ticket.ticket
            }});
        })
    });

    app.post('/api/rpt',function (req, res){
        console.log(req.headers)
        console.log(req.body)
        if(!req.body.ticket.code){return res.status(400).send('not found req.body.ticket.code');}
        if(!req.body.ticket.profiles){return res.status(400).send('not found req.body.ticket.profiles');}
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        //if(!req.body.rpt){return res.status(403).send('not found req.body.rpt');}
        //var bodyRpt = req.body.rpt;//no use now
        var ticket = req.body.ticket.code;
        var aat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                async.waterfall([
                    function(callback){
                        fc.checkAAT({token : aat},callback)
                    },
                    function(aat,callback){
                        fc.findOneClient({_id:aat.object_id},callback)
                    },
                ],function(err,client){
                    if(err){callback(err,null)}
                    else{callback(null,client)}
                })
            },
            function(client,callback){
                async.waterfall([
                    function(callback){
                        fc.checkTicket({ticket : ticket},callback)
                    },
                    function(ticket,callback){
                        async.parallel([
                            function(callback){
                                fc.createRPT(ticket._user,ticket.object_id,ticket.object_type,ticket.scope,callback)
                            },
                            function(callback){
                                if(ticket.scope.length===1&&ticket.scope[0]==="connection"){
                                    console.log('ticket.scope === connection')
                                    fc.findOneServer({_id:ticket.object_id},callback)
                                }else{
                                    console.log('ticket.scope !== connection')
                                    fc.findOneResource({_id:ticket.object_id},callback)
                                }
                            },
                        ],function(err,results){//0-rpt,1-serRes
                            if(err){callback(err,null)}
                            else{
                                callback(null,results[0],results[1],ticket)//callback(null,rpt,serRes,ticket)
                            }
                        })
                    },
                    function(rpt,serRes,ticket,callback){
                        if(ticket.scope.length===1 && (ticket.scope[0]==="connection" || ticket.scope[0]==="access")){/////////////
                            if (req.body.ticket.profiles.indexOf(client.tokenType) === -1){
                                callback(new Error('token type isn\'t in profiles'),null)
                            }else{//if don't compare profiles and client.tokenType, just remove this if-else
                                if(client.tokenType==="certificate"){
                                    console.log("tokenType===certificate")
                                    if(!req.body.csr){return callback(new Error('not found req.body.csr'),null)}
                                    fc.CSRtoCRT(req.body.csr,callback)
                                }else if(client.tokenType==="password"){
                                    console.log("tokenType===password")
                                    if(ticket.scope[0]==="connection"){
                                        var server = serRes;//object
                                    }else{//ticket.scope[0]==="access"
                                        var resource = serRes;//object
                                    }
                                    async.waterfall([
                                        function(callback){//get specific server in client
                                            async.parallel([
                                                function(callback){
                                                    if(ticket.scope[0]==="connection"){
                                                        fc.findOneServerInClient(client,server._id,callback)
                                                    }else{//ticket.scope[0]==="access"
                                                        fc.findOneServerInClient(client,resource.serverId,callback)
                                                    }
                                                },
                                                function(callback){
                                                    if(ticket.scope[0]==="connection"){
                                                        fc.getURL(server,'client_endpoint',callback)
                                                    }else{//ticket.scope[0]==="access"
                                                        async.waterfall([
                                                            function(callback){
                                                                fc.findOnePermission({$and:[{resourceId : resource._id},{clientId:client._id}]},callback)
                                                            },
                                                            function(permission,callback) {
                                                                fc.checkScope(permission,ticket.scope,callback)
                                                            },
                                                            function(checkScope,callback){
                                                                fc.findOneServer({_id : resource.serverId},callback)
                                                            },
                                                            function(server,callback){
                                                                fc.getURL(server,'client_endpoint',callback)
                                                            },
                                                        ],function(err,URL){
                                                            if(err){callback(err,null)}
                                                            else{callback(null,URL)}
                                                        })
                                                    }
                                                },
                                            ],function(err,results){//0-specServer,1-json-host/port/path
                                                if(err){callback(err,null)}
                                                else{
                                                    callback(null,results[0],results[1])//callback(null,specServer,URL)
                                                }
                                            })
                                        },
                                        function(specServer,URL,callback){//0-specServer,1-json-host/port/path
                                            var username = specServer.username;
                                            var password = fc.randomString(32);
                                            async.series([
                                                function(callback){
                                                    var credential_str = JSON.stringify({
                                                        token_type : "password",
                                                        password : password
                                                    });
                                                    var newURL = {
                                                        host: URL.host,
                                                        port: URL.port,
                                                        path: URL.path + '/'+specServer.id+'/token'
                                                    }
                                                    fc.httpsFunc('POST',credential_str,newURL,rpt.token,callback)//ok
                                                },
                                                function(callback){
                                                    var credential = {
                                                        username : username,
                                                        password : password
                                                    };
                                                    callback(null,credential)
                                                },
                                                function(callback){
                                                    Ticket.remove({ticket : ticket.ticket}, function (err, doc) {
                                                        if(err){callback(err,null)}
                                                        else{
                                                            console.log('ticket for credential deleted')
                                                            callback(null,null)
                                                        }
                                                    });
                                                },
                                            ],function(err,results){
                                                if(err){callback(err,null)}
                                                else{callback(null,results[1])}//0-OK,1-credential,2-null
                                            })
                                        },
                                    ],function(err,credential){
                                        if(err){callback(err,null)}
                                        else{callback(null,credential)}
                                    })
                                }else{callback(new Error('tokenType===???'),null)}
                            }//check profiles
                        }else{//permission
                            var resource = serRes;
                            async.waterfall([
                                function(callback){
                                    fc.findOnePermission({$and:[{resourceId : resource._id},{clientId:client._id}]},callback)
                                },
                                function(permission,callback) {
                                    fc.checkScope(permission,ticket.scope,callback)
                                },
                                function(found,callback){
                                    async.waterfall([
                                        function(callback){
                                            fc.ticketFindServer(ticket.ticket,callback)
                                        },
                                        function(server,callback){
                                            fc.getURL(server,'permission_endpoint',callback)
                                        },
                                    ],function(err,URL){
                                        if(err){callback(err,null)}
                                        else{callback(null,URL)}
                                    })
                                },
                                function(URL,callback){
                                    var uma = false;
                                    async.waterfall([
                                        function(callback){
                                            fc.findOneServerInClient(client,resource.serverId,callback)
                                        },
                                        function(specServer,callback){
                                            if(specServer.umaCompliant===true){
                                                uma = true;
                                                fc.createRPT(ticket._user,ticket.object_id,ticket.object_type,ticket.scope,callback)
                                            }else{
                                                var body = JSON.stringify({
                                                    resource_id : resource.server_id,
                                                    client_id : specServer.id,
                                                    actions : ticket.scope
                                                });
                                                fc.httpsFunc('POST',body,URL,rpt.token,callback)
                                            }
                                        },
                                        function(rpt,callback){//rpt or OK
                                            Ticket.remove({ticket : ticket.ticket}, function (err, doc) {
                                                if(err){callback(err,null)}
                                                else{
                                                    console.log('ticket for permission deleted')
                                                    if(uma===true){
                                                        callback(null,{ rpt: rpt.token })
                                                    }else{
                                                        callback(null,{ result: 'OK' })
                                                    }
                                                }
                                            });
                                        },
                                    ],function(err,OK){
                                        if(err){callback(err,null)}
                                        else{callback(null,OK)}
                                    })
                                },
                            ],function(err,results){//OK
                                if(err){callback(err,null)}
                                else{callback(null,results)
                                }
                            })
                        }
                    },//waterfall
                ],function(err,results){//credential or result OK
                    if(err){callback(err,null)}
                    else{callback(null,results)}
                })
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send(results)
        })
    });

    /*app.get('/dialog/authorize',function (req, res){
        res.status(302).setHeader({ location : '$REDIRECT_URI$? … &code=$AUTH_CODE$' });
    });*/

    //server
    app.post('/api/resource-server',function (req, res){//update resource server
        console.log(req.body)
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        if(!req.body.name){return res.status(400).send('not found req.body.name');}
        if(!req.body.discovery_url){return res.status(400).send('not found req.body.discovery_url');}
        if(!req.body.description){return res.status(400).send('not found req.body.description');}
        if(!req.body.token_descriptors){return res.status(400).send('not found req.body.token_descriptors');}
        var pat = req.headers.authorization.substring(7);//server
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                ResourceServer.update({_id:pat.object_id},{$set:{
                    serverName : req.body.name,
                    serverUser : pat._user,
                    discoveryUrl : req.body.discovery_url,
                    description : req.body.description,
                    timeSelfManagement : req.body.time_self_mngmnt || false,
                    tokenDescriptors : req.body.token_descriptors,
                    umaCompliant : req.body.uma_compliant
                }},{safe:true}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,{
                        result: 'OK',
                        id: pat.object_id
                    })}
                });
                //if(req.body.uma_compliant){
                    //console.log("uma_compliant is TRUE")
                /*}else{
                    console.log("uma_compliant is FALSE")
                    var resourceId = new ObjectID();
                    var resource = new Resource({
                        _id : resourceId,
                        _user : pat._user,
                        resourceName : "uma_connection_resource",
                        resourceType : "server_connection",
                        resourceUrl : "https://"+host+"/resource/"+resourceId,
                        actions : ['access'],
                        serverId : pat.object_id,
                        umaCompliant : false
                    }).save(function (err,doc){
                            if(err){callback(err,null)}
                            else{callback(null,{
                                id: pat.object_id,
                                connection_id: resourceId
                            })}
                        });
                }*/
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send(results);
        })
    });

    app.get('/api/resource-server',function (req, res){
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findServer({_user:pat._user},callback)
            },
            function(servers,callback){
                var json=[];
                for(var i=0; i<servers.length; i++){
                    json[i]={
                        URL : servers[i].serverUrl,
                        Name : servers[i].serverName,
                        Description : servers[i].description,
                        Time_self_management : servers[i].timeSelfManagement,
                        Scope : servers[i].scope,
                        tokenDescriptors : servers[i].tokenDescriptors
                    }
                }
                callback(null,{ResourceServers : [json]})
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send(results);
        })
    });

    app.put('/api/resource-server/:id',function (req, res){
        if(!req.headers.authorization){return res.status(400).send('not found req.headers.authorization');}
        if(!req.headers.modifications){return res.status(400).send('not found req.headers.modifications');}
        var pat = req.headers.authorization.substring(7);
        var modifications = req.headers.modifications;
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findOneServer({_id:req.params.id},callback)
            },
            function(server,callback){
                var mod={};
                var section =[];
                for(var i=0;i<modifications.length;i++){
                    var item={};
                    mod[modifications[i].name] = modifications[i].value;
                    item['name'] = modifications[i].name;
                    //item['value'] = modifications[i].value;
                    item['value'] = server[modifications[i].name];
                    section[i]=item;
                }
                var json = {modified:section};
                ResourceServer.update({_id:req.params.id},{$set:mod},{safe:true}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,json)}
                });
            },
        ],function(err,json){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send(json);
        })
    });

    app.get('/api/resource-server/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findOneServer({_id:req.params.id},callback)
            },
        ],function(err,server){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({
                URL : server.serverUrl,
                Name : server.serverName,
                Description : server.description,
                Time_self_management : server.timeSelfManagement,
                Scope : server.scope,
                tokenDescriptors : server.tokenDescriptor
            });
        })
    });

    app.delete('/api/resource-server/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                var id = req.params.id;
                ResourceServer.remove({_id : id}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,id)}
                });
            },
        ],function(err,id){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({result : 'OK', id : id});
        })
    });

    //client
    app.post('/api/client',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                var id = new ObjectID();
                var client = new Client({
                    _id : id,
                    _user : pat._user,
                    clientName : req.body.name||null,
                    clientUrl : "https://"+host+"/client/"+id,
                    tokenType : req.body.token_type||null,
                    resourceServer : [{id : req.body.id||null, serverId : pat.object_id, username : req.body.username||null}],
                    clientId : fc.randomString(20),
                    clientSecret : fc.randomString(40)
                }).save(function (err,doc){
                        if(err){callback(err,null)}
                        else{callback(null,client.emitted.fulfill[0])}
                    });
            },
        ],function(err,client){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send({ id : client._id })
        })
    });

    app.get('/api/client',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findClient({_user:pat._user},callback)
            },
            function(clients,callback){
                var json=[];
                for(var i=0; i<clients.length; i++){
                    var server_id = []
                    for(var j=0; j<clients[i].resourceServer.length; j++){
                        server_id[j] = clients[i].resourceServer[j].id;
                    }
                    json[i]={
                        Auth_id : clients[i]._id,
                        server_id : server_id,
                        name : clients[i].clientName,
                        token_type : clients[i].tokenType
                    }
                }
                callback(null,json)
            },
        ],function(err,json){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({ResourceServers : [json]});
        })
    });

    app.put('/api/client/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        if(!req.body.modifications){return res.status(403).send('not found req.body.modifications');}
        var pat = req.headers.authorization.substring(7);
        var modifications = req.body.modifications;
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findOneClient({id:req.params.id},callback)
            },
            function(client,callback){
                var mod={};
                var section =[];
                for(var i=0;i<modifications.length;i++){
                    var item={};
                    mod[modifications[i].name] = modifications[i].value;
                    item['name'] = modifications[i].name;
                    //item['value'] = modifications[i].value;
                    item['value'] = client[modifications[i].name];
                    section[i]=item;
                }
                var json = {modified:section};
                Client.update({_id:req.params.id},{$set:mod},{safe:true}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,json)}
                });
            },
        ],function(err,json){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send(json);
        })
    });

    app.get('/api/client/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findOneClient({_id:req.params.id},callback)
            },
        ],function(err,client){
            if(err){return res.status(403).send({error: err.message})}
            var server_id = [];
            for(var i=0;i<client.resourceServer.length;i++){
                server_id[i] = client.resourceServer[i].id;
            }
            res.status(200).send({
                Auth_id : client._id,
                server_id : server_id,
                name : client.clientName,
                token_type : client.tokenType
            });
        })
    });

    app.delete('/api/client/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        var id = req.params.id;
        async.waterfall([
            function(callback){
                async.series([
                    function(callback){
                        fc.checkPAT({token:pat},callback)
                    },
                    function(callback){
                        fc.findOneClient({_id : id},callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{callback(null,results[0],results[1])}//0-pat,1-client
                })
            },
            function(pat,client,callback){
                for(var i = 0; i < client.resourceServer.length; i++) {
                    if(client.resourceServer[i].serverId === pat.object_id) {
                        client.resourceServer.splice(i, 1);
                        break;
                    }
                }
                console.log(client.resourceServer)
                Client.update({_id:id},{$set:{
                    resourceServer : client.resourceServer
                }},{safe:true}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,id)}
                });
                /*Client.remove({_id : id}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,id)}
                });*/
            },
        ],function(err,id){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({result : 'OK', id : id});
        })
    });

    //resource
    app.post('/api/resource',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                var id = new ObjectID();
                var resource = new Resource({
                    _id : id,
                    _user : pat._user,
                    server_id : req.body.id||null,
                    serverId : pat.object_id,
                    resourceName : req.body.name||null,
                    resourceType : req.body.type||null,
                    resourceUrl : "https://"+host+"/resource/"+id,
                    description : req.body.description||null,
                    actions : req.body.actions||null,
                    attributes : req.body.attributes||null,
                    options : [req.body.options]||null
                }).save(function (err,doc){
                        if(err){callback(err,null)}
                        else{callback(null,resource.emitted.fulfill[0])}
                    });
            },
        ],function(err,resource){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send({ id : resource._id });
        })
    });

    app.get('/api/resource',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findResource({_user:pat._user},callback)
            },
            function(resources,callback){
                var json=[];
                for(var i=0; i<resources.length; i++){
                    json[i]={
                        Auth_id : resources[i]._id,
                        server_id : resources[i].server_id,
                        type : resources[i].resourceType,
                        name : resources[i].clientName,
                        description : resources[i].description,
                        actions : resources[i].actions,
                        attributes: resources[i].attributes,
                        options : resources[i].options
                    }
                }
                callback(null,json)
            },
        ],function(err,json){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({resources : [json]});
        })
    });

    app.put('/api/resource/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        if(!req.headers.modifications){return res.status(403).send('not found req.headers.modifications');}
        var pat = req.headers.authorization.substring(7);
        var modifications = req.headers.modifications;
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findOneResource({_id:req.params.id},callback)
            },
            function(resource,callback){
                var mod={};
                var section =[];
                for(var i=0;i<modifications.length;i++){
                    var item={};
                    mod[modifications[i].name] = modifications[i].value;
                    item['name'] = modifications[i].name;
                    //item['value'] = req.body.modifications[i].value;
                    item['value'] = resource[modifications[i].name];
                    section[i]=item;
                }
                var json = {modified:section};
                Resource.update({_id:req.params.id},{$set:mod},{safe:true}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,json)}
                });
            },
        ],function(err,json){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send(json);
        })
    });

    app.get('/api/resource/:id',function (req, res){
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        async.waterfall([
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(pat,callback){
                fc.findOneResource({_id:req.params.id},callback)
            },
        ],function(err,resource){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({
                resource : {
                    Auth_id : resource._id,
                    server_id : resource.server_id,
                    type : resource.resourceType,
                    name : resource.clientName,
                    description : resource.description,
                    actions : resource.actions,
                    attributes: resource.attributes,
                    options : resource.options
                }
            });
        })
    });

    app.delete('/api/resource/:id',function (req, res){
        console.log('/api/resource/:id')
        console.log(req.headers.authorization)
        console.log(req.params.id)
        if(!req.headers.authorization){return res.status(403).send('not found req.headers.authorization');}
        var pat = req.headers.authorization.substring(7);
        var id = req.params.id;
        async.series([
            /*function(callback){
                Permission.findOne({resourceId:id}, function (err, permission) {
                    if(err){callback(err,null)}
                    else if(permission){
                        callback(new Error('Can\'t delete!! This client is used in permission!'),null)
                    }
                    else{callback(null,null)}
                });
            },*/
            function(callback){
                fc.checkPAT({token:pat},callback)
            },
            function(callback){
                Resource.remove({_id : id}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,null)}
                });
            },
            function(callback){
                Permission.remove({resourceId:id}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,null)}
                });
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.status(200).send({result : 'OK', id : id});
        })
    });

    app.post('/test',function(req,res){
        res.send('test!!!')
    });
};
/**
 * Created by nmu on 02/06/2015.
 */

