//mongodb schema
var Resource = require('../models').Resource;
var Client = require('../models').Client;
var ResourceServer = require('../models').ResourceServer;
var Permission = require('../models').Permission;
//token
var Token_pat = require('../models').Token_pat;
var Token_rpt = require('../models').Token_rpt;
var Token_aat = require('../models').Token_aat;
var Ticket = require('../models').Ticket;
var Lifetime = require('../models').Lifetime;
//others
var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var https = require('https');

////////////////////////////////
/////////for resource///////////
////////////////////////////////

function findResource(query, callback) {
    Resource.find(query, function (err, resources) {
        if(err){callback(err,null)}
        else if(resources.length===0){callback(new Error('not found resources'),null)}
        else{callback(null,resources)}
    });
};
exports.findResource = findResource;

function findOneResource(query, callback) {
    Resource.findOne(query, function (err, resource) {
        if(err){callback(err,null)}
        else if(!resource){callback(new Error('not found resource'),null)}
        else{callback(null,resource)}
    });
};
exports.findOneResource = findOneResource;

//add server name for resource
function addServerNameRes(resource, callback) {//as well as attribute name
    ResourceServer.findOne({_id:resource.serverId},{},function(err,server){
        if(err){callback(err,null)}
        else if(!server){callback(new Error('not found server'),null)}
        else{
            resource.resourceServer = server.serverName;
            resource.attributeName = [];
            for(var i=0;i<resource.attributes.length;i++){
                resource.attributeName.push(resource.attributes[i].name);
            }
            callback(null,server)
        }
    });
};
exports.addServerNameRes = addServerNameRes;

////////////////////////////////
///////////for client///////////
////////////////////////////////

function findClient(query, callback) {
    Client.find(query, function (err, clients) {
        if(err){callback(err,null)}
        else if(clients.length===0){callback(new Error('not found clients'),null)}
        else{callback(null,clients)}
    });
};
exports.findClient = findClient;

function findOneClient(query, callback) {
    Client.findOne(query, function (err, client) {
        if(err){callback(err,null)}
        else if(!client){callback(new Error('not found client'),null)}
        else{callback(null,client)}
    });
};
exports.findOneClient = findOneClient;

//find the specific server in client's resource server array
function findOneServerInClient(client, serverId, callback) {
    var specServer = {}
    for(var i=0;i<client.resourceServer.length;i++){
        if(client.resourceServer[i].serverId==serverId){
            specServer = client.resourceServer[i]
        }
    }
    if(!specServer.id){//||!specServer.username
        callback(new Error('no client.resourceServer[i].serverId===serverId //findOneServerInClient'),null)
    }
    else{
        callback(null,specServer)
    }
};
exports.findOneServerInClient = findOneServerInClient;

//add server name for clients
function addServerNameCli(client, callback) {
    if(client.resourceServer.length===0){
        client.resourceServer = 'None';
        callback(null,null)
    }else{
        var serverIdSet = []
        for(var i=0;i<client.resourceServer.length;i++){
            serverIdSet[i] = client.resourceServer[i].serverId
        }
        ResourceServer.find({_id:{$in:serverIdSet}},{},function(err,servers){
            if(err){callback(err,null)}
            else if(servers.length===0){callback(new Error('not found server'),null)}
            else{
                var serverNameSet = [];
                for(var i=0;i<servers.length;i++){
                    serverNameSet[i] = servers[i].serverName;
                }
                client.resourceServer = serverNameSet;
                callback(null,null)
            }
        });
    }
};
exports.addServerNameCli = addServerNameCli;

//add server name when edit client
function addServerNameEditCli(serverSet,callback){
    async.parallel([
        function(callback){
            findOneServer({_id:serverSet.serverId},callback)
        },
        function(callback){
            findOneClient({"resourceServer.id" : serverSet.id},callback)
        },
    ],function(err,results){
        if(err){callback(err,null)}
        else{
            serverSet.serverName = results[0].serverName;
            serverSet.clientName = results[1].clientName;
            serverSet.clientType = results[1].clientType;
            callback(null,serverSet)
        }
    })

    /*ResourceServer.findOne({_id:serverSet.serverId},function(err,server){
        if(err){callback(err)}
        else if(!server){callback(new Error('not found server'),null)}
        else{
            serverSet.serverName = server.serverName;
            serverSet.clientName = "test";
            serverSet.clientType = "test";
            //clientName,clientType
            callback(null,serverSet)
        }
    })*/
}
exports.addServerNameEditCli = addServerNameEditCli;

////////////////////////////////
//////for resource server///////
////////////////////////////////

function findServer(query, callback) {
    ResourceServer.find(query, function (err, servers) {
        if(err){callback(err,null)}
        else if(servers.length===0){callback(new Error('not found server'),null)}
        else{callback(null,servers)}
    });
};
exports.findServer = findServer;

function findActiveServer(username, callback) {//useless
    async.waterfall([
        function(callback){
            Token_pat.find({_user : username}, function (err, pats) {
                if(err){callback(err,null)}
                else if(pats.length===0){callback(new Error('not found pats'),null)}
                else{
                    var today = new Date();
                    var actPATid = [];
                    for(var i=0;i<pats.length;i++){
                        if(today<pats[i].expiredDate){actPATid.push(pats[i].object_id)}
                    }
                    if(actPATid.length===0){callback(new Error('not found active pat'),null)}
                    else{callback(null,actPATid)}
                }
            });
        },
        function(actPATid,callback){
            findServer({$and:[{_user : username},{_id : {$in:actPATid}}]},callback)
        },
    ],function(err,actServers){
        if(err){callback(err,null)}
        else if(!actServers){callback(new Error('not found active server'),null)}
        else{callback(null,actServers)}
    })
};
exports.findActiveServer = findActiveServer;

function findOneServer(query, callback) {
    ResourceServer.findOne(query, function (err, server) {
        if(err){callback(err,null)}
        else if(!server){callback(new Error('not found server'),null)}
        else{callback(null,server)}
    });
};
exports.findOneServer = findOneServer;

//use ticket to find server
function ticketFindServer(ticket, callback) {//ticket is a string
    async.waterfall([
        function(callback){
            checkTicket({ticket:ticket},callback)
        },
        function(ticket,callback){
            checkPAT({_id:ticket.relatedToken},callback)
        },
        function(pat,callback){
            findOneServer({_id:pat.object_id},callback)
        },
    ],function(err,server){
        if(err){callback(err,null)}
        else{callback(null,server)}
    })
};
exports.ticketFindServer = ticketFindServer;

//find profile of resource server(server.tokenDescriptors set)
function findProfile(pat,callback) {
    async.waterfall([
        function(callback){
            checkPAT({token:pat},callback)
        },
        function(pat,callback){
            findOneServer({_id:pat.object_id},callback)
        },
        function(server,callback){
            var profiles = [];
            for(var i=0;i<server.tokenDescriptors.length;i++){
                profiles[i] = server.tokenDescriptors[i].token_type
            }
            callback(null,profiles)
        },
    ],function(err,profiles){
        if(err){callback(err,null)}
        else{callback(null,profiles)}
    })
};
exports.findProfile = findProfile;

////////////////////////////////
/////////for permission/////////
////////////////////////////////

function findPermission(query, callback) {
    Permission.find(query, function (err, permissions) {
        if(err){callback(err,null)}
        else if(permissions.length===0){callback(new Error('not found permissions'),null)}
        else{callback(null,permissions)}
    });
};
exports.findPermission = findPermission;

function findOnePermission(query, callback) {
    Permission.findOne(query, function (err, permission) {
        if(err){callback(err,null)}
        else if(!permission){callback(new Error('not found permission'),null)}
        else{callback(null,permission)}
    });
};
exports.findOnePermission = findOnePermission;

//check permission unique
function checkPermission(username,resourceID, clientID, callback) {
    Permission.findOne({$and:[{_user : username},{resourceId : resourceID},{clientId:clientID}]}, function (err, permission) {
        if(err){callback(err,null)}
        else if(permission){callback(new Error('permission for this resource-client already exist'),null)}
        else{callback(null,permission)}
    });
};
exports.checkPermission = checkPermission;

//add Resource and Client Name for permission
function addResCliName(permission, callback) {
    async.parallel([
        function(callback){
            findOneResource({_id:permission.resourceId},callback)
        },
        function(callback){
            findOneClient({_id:permission.clientId},callback)
        },
        function(callback){
            async.waterfall([
                function(callback){
                    findOneResource({_id:permission.resourceId},callback)
                },
                function(resource,callback){
                    findOneServer({_id:resource.serverId},callback)
                },
            ],function(err,server){
                if(err){callback(err,null)}
                else{callback(null,server)}
            })
        },
    ],function(err,results){
        if(err){callback(err)}
        else{
            permission.resourceName = results[0].resourceName;
            permission.clientName = results[1].clientName;
            permission.resourceServer = results[2].serverName;
            callback(null,permission)
        }
    })
};
exports.addResCliName = addResCliName;

//check scope in permission
function checkScope(permission, scope, callback) {//scope form ticket
    if(!permission.actions){return callback(new Error('not found permission.actions'),null)}
    var actions = permission.actions;
    var found = true;
    for (var i = 0; i < scope.length; i++) {
        if (actions.indexOf(scope[i]) === -1) {
            found = false;//no match
        }
    }
    if(found){callback(null,found)}
    else{callback(new Error('scope not matched'),null)}
};
exports.checkScope = checkScope;

////////////////////////////////
////////////for AAT/////////////
////////////////////////////////

//create and return aat
function createAAT(client,scope,callback) {
    async.waterfall([
        function(callback){
            findLifetime({$and:[{_user : client._user},{type:'aat'}]},callback)
        },
        function(lt,callback){
            var createdDate, expiredDate = new Date();
            expiredDate.setMinutes(expiredDate.getMinutes()+lt.lifetime);
            var aat = new Token_aat({
                _user: client._user,
                token: randomString(256),
                object_id: client._id,
                object_name: client.clientName,
                object_type: "Client",
                createdDate: createdDate,
                lifetime: lt.lifetime,
                expiredDate: expiredDate,
                scope: scope
            }).save(function (err,doc){
                    if(err){callback(err,null)}
                    else{callback(null,aat.emitted.fulfill[0])}
                })
        },
    ],function(err,aat){
        if(err){callback(err,null)}
        else{callback(null,aat)}
    })
};
exports.createAAT = createAAT;

//check and return aat
function checkAAT(query, callback) {
    Token_aat.findOne(query, function (err, aat) {
        if(err){callback(err,null)}
        else if(!aat){callback(new Error('not found AAT'),null)}
        else if(new Date()>aat.expiredDate){callback(new Error('AAT expired'),null)}
        else{callback(null,aat)}
    })
};
exports.checkAAT = checkAAT;

////////////////////////////////
////////////for PAT/////////////
////////////////////////////////

//find pat, not check, for refresh
function findOnePAT(query, callback) {
    Token_pat.findOne(query, function (err, pat) {
        if(err){callback(err,null)}
        else if(!pat){callback(new Error('not found pat'),null)}
        else{callback(null,pat)}
    });
};
exports.findOnePAT = findOnePAT;

//check and return pat
function checkPAT(query, callback) {
    Token_pat.findOne(query, function (err, pat) {
        if(err){callback(err,null)}
        else if(!pat){callback(new Error('not found PAT'),null)}
        else if(new Date()>pat.expiredDate){callback(new Error('PAT expired'),null)}
        else{callback(null,pat)}
    })
};
exports.checkPAT = checkPAT;

//check pat for every server
function checkPATs(query, callback) {////after only display active resource server, remove it
    var today = new Date();
    Token_pat.find(query, function (err, pats) {
        if(err){callback(err,null)}
        else if(pats.length===0){callback(new Error('not found PAT'),null)}
        else{
            var checkToken = true;
            pats.forEach(function(pat){
                if(today > pat.expiredDate){checkToken = false;}
            });
            if(!checkToken){callback(new Error('token expired(at least 1 server)'),null)}
            else{callback(null,pats)}
        }
    })
};
exports.checkPATs = checkPATs;

////////////////////////////////
////////////for RPT/////////////
////////////////////////////////

//create and return rpt
function createRPT(user,object_id,object_type,scope,callback){
    async.waterfall([
        function(callback){
            findLifetime({$and:[{_user : user},{type:'rpt'}]},callback)
        },
        function(lt,callback){
            var rpt = randomString(256);
            var lifetime = lt.lifetime;
            var today = new Date();
            var expiredDate = new Date();
            expiredDate.setMinutes(expiredDate.getMinutes()+lifetime);
            var token_rpt = new Token_rpt({
                _user: user,
                token: rpt,//scope ticket//object server
                object_id: object_id,
                object_type: object_type,
                createdDate: today,
                lifetime: lifetime,
                expiredDate: expiredDate,
                scope: scope
            }).save(function (err,doc){
                    if(err){callback(err,null)}
                    else{callback(null,token_rpt.emitted.fulfill[0])}
                })
        },
    ],function(err,rpt){
        if(err){callback(err,null)}
        else{callback(null,rpt)}
    })
}
exports.createRPT = createRPT;

//check and return rpt
function checkRPT(query, callback) {
    Token_rpt.findOne(query, function (err, rpt) {
        if(err){callback(err,null)}
        else if(!rpt){callback(new Error('not found RPT'),null)}
        else if(new Date()>rpt.expiredDate){callback(new Error('RPT expired'),null)}
        else{callback(null,rpt)}
    })
};
exports.checkRPT = checkRPT;

////////////////////////////////
//////////for Ticket////////////
////////////////////////////////

//create and return ticket
function createTicket(pat,object_id,object_type,scope,callback) {
    async.waterfall([
        function(callback){
            findLifetime({$and:[{_user : pat._user},{type:'ticket'}]},callback)
        },
        function(lt,callback){
            var createdDate,expiredDate = new Date();
            expiredDate.setMinutes(expiredDate.getMinutes()+lt.lifetime);
            var ticket = new Ticket({
                _user : pat._user,
                ticket: randomString(128),
                object_id: object_id,
                object_type: object_type,
                createdDate: createdDate,
                lifetime: lt.lifetime,
                expiredDate: expiredDate,
                scope: scope,
                relatedToken: pat._id
            }).save(function (err,doc){
                    if(err){callback(err,null)}
                    else{callback(null,ticket.emitted.fulfill[0])}
                });
        },
    ],function(err,ticket){
        if(err){callback(err,null)}
        else{callback(null,ticket)}
    })
};
exports.createTicket = createTicket;

//check and return ticket
function checkTicket(query, callback) {
    Ticket.findOne(query, function (err, ticket) {
        if(err){callback(err,null)}
        else if(!ticket){callback(new Error('not found ticket'),null)}
        else if(new Date()>ticket.expiredDate){callback(new Error('ticket expired'),null)}
        else{callback(null,ticket)}
    })
};
exports.checkTicket = checkTicket;

////////////////////////////////
//////////for lifetime//////////
////////////////////////////////

//use username and type to find lifetime
function findLifetime(query, callback) {
    Lifetime.findOne(query, function (err, lifetime) {
        if(err){callback(err,null)}
        else if(!lifetime){callback(new Error('not found lifetime'),null)}
        else{callback(null,lifetime)}
    })
};
exports.findLifetime = findLifetime;

////////////////////////////////
////////////for files///////////
////////////////////////////////

function checkFileExist(file, callback) {
    fs.exists(file, function(exists) {
        if (exists) {callback(null,null)}
        else{
            callback(new Error(file + ' not exist'),null)
            console.log(file + ' not exist')
        }
    });
};
exports.checkFileExist = checkFileExist;

function CSRtoCRT(csr, callback) {
    async.series([
        function(callback){
            fs.writeFileSync('./cert/client.csr', csr, 'utf8')
            callback(null,null)
        },
        function(callback){
            async.series([
                function(callback){
                    checkFileExist('./cert/client.csr',callback)
                },
                function(callback){
                    exec('openssl x509 -req -in cert/client.csr -CA cert/ca.crt -CAkey cert/ca.key -CAcreateserial -out cert/client.crt -days 365',
                        function (err, stderr, stdout) {
                            if (err !== null) {
                                callback(err,null)
                                console.log('exec error: ' + err)
                            }else if(stdout !==null){
                                callback(null,null)
                                console.log('stdout: ' + stdout)
                            }else{
                                callback(stderr,null)
                                console.log('stderr: ' + stderr)
                            }
                        });
                },
            ],function(err,results){//results is null
                if(err){callback(err,null)}
                else{callback(null,results)}
            })
        },
        function(callback){
            async.series([
                function(callback){
                    checkFileExist('./cert/client.crt',callback)
                },
                function(callback){
                    callback(null,fs.readFileSync('./cert/client.crt','utf8'))
                },
            ],function(err,results){
                if(err){callback(err,null)}
                else{callback(null,results[1])}
            })
        },
    ],function(err,results){
        if(err){callback(err,null)}
        else{callback(null,results[2])}
    })
};
exports.CSRtoCRT = CSRtoCRT;

////////////////////////////////
////////////for https///////////
////////////////////////////////

//generate randomString
function randomString(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;
    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }
    return buf.join('');
};
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.randomString = randomString;

function discovery(server, callback) {
    var host = server.serverUrl.substring(8).substring(0,server.serverUrl.substring(8).lastIndexOf(":"));
    var port = server.serverUrl.substring(8).substring(server.serverUrl.substring(8).lastIndexOf(":")+1);
    var options = {
        host: host,
        port: port,
        path: '/api/discovery',
        method: 'GET'
    };
    var data = '';
    var request = https.request(options, function(response) {
        var body = ''
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end',function(){
            var discovery = JSON.parse(body);
            callback(null,discovery)
        });
    });
    request.on('error', function(err) {callback(err,null)});
    request.write(data);
    request.end();
};
exports.discovery = discovery;

function separateURL(URL, callback) {
    var arr = URL.split("/");
    var host = URL.substring(8).substring(0,URL.substring(8).lastIndexOf(":"));
    var port = URL.substring(URL.lastIndexOf(":")+1,URL.lastIndexOf(arr[3])-1);
    var path = URL.substring(URL.lastIndexOf(arr[3])-1);
    var url = {
        host : host,
        port : port,
        path : path
    }
    callback(null,url)
};
exports.separateURL = separateURL;

function getURL(server,endpoint,callback) {
    async.waterfall([
        function(callback){
            discovery(server,callback)
        },
        function(discovery,callback){
            separateURL(discovery[endpoint],callback)
        },
    ],function(err,URL){
        if(err){callback(err,null)}
        else{callback(null,URL)}
    })
}
exports.getURL = getURL;

function httpsFunc(method,data,URL,rptToken,callback) {//no response body
    var options = {
        host: URL.host,
        port: URL.port,
        path: URL.path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'authorization' : 'Bearer ' + rptToken
        }
    };
    var request = https.request(options, function(response) {
        if(response.statusCode===201){
            callback(null,{ result: 'OK' })
            /*var res_body = ''
            response.on('data', function (chunk) {
                res_body += chunk;
            });
            response.on('end',function(){
                var body = JSON.parse(res_body);
                callback(null,body)
            });*/
        }else{
            callback(new Error('resource server not permit'),null)
        }
    });
    request.on('error', function(err) {callback(err,null)});
    request.write(data);
    request.end();
    /*async.waterfall([
        function(callback){
            getURL(server,endpoint,callback)
        },
        function(URL,callback){

        },
    ],function(err,body){
        if(err){callback(err,null)}
        else{callback(null,body)}
    })*/
};
exports.httpsFunc = httpsFunc;

function httpsResp(method,data,URL,rptToken,callback) {
    var options = {
        host: URL.host,
        port: URL.port,
        path: URL.path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'authorization' : 'Bearer ' + rptToken
        }
    };
    var request = https.request(options, function(response) {
        if(response.statusCode===201){
            //callback(null,{ result: 'OK' })
            var res_body = ''
             response.on('data', function (chunk) {
             res_body += chunk;
             });
             response.on('end',function(){
             var body = JSON.parse(res_body);
             callback(null,body)
             });
        }else{
            callback(new Error('resource server not permit'),null)
        }
    });
    request.on('error', function(err) {callback(err,null)});
    request.write(data);
    request.end();
};
exports.httpsResp = httpsResp;

/**
 * Created by nmu on 24/07/2015.
 */
