//mongodb schema
var ObjectID = require('mongoose/node_modules/mongodb').ObjectID;
var Resource = require('../models').Resource;
var Client = require('../models').Client;
var Permission = require('../models').Permission;
var ResourceServer = require('../models').ResourceServer;
//middleware
var requiredAuthentication = require('../middleware').requiredAuthentication;
var fc = require('../middleware/functions');
//others
var async = require('async');
var https = require('https');
//https.globalAgent.maxSockets = 100;
//routes
module.exports = function(app){
    app.get('/permission', requiredAuthentication,function (req, res){
        Permission.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,permissions){
            if(err){return res.status(403).send({error: err.message})}
            //if(permissions.length===0){return res.status(403).send('not found permission!')}//display empty list
            async.each(permissions,fc.addResCliName,function(err){//resourceName and clientName are from their collections
                if(err){
                    console.log(err)
                    return res.status(403).send({error: err.message})
                }
                res.render('Permissions/permissions',{
                    title: 'Permissions',
                    permissionList : permissions
                });
            });
        });
    });

    app.get('/addPermission', requiredAuthentication,function (req, res){
        var username = req.session.user.username;
        async.waterfall([
            function(callback){
                fc.findResource({_user : username},callback)
            },
            function(resources, callback){
                async.parallel([
                    function(callback){
                        //var serverId = new ObjectID(resources[0].serverId);
                        fc.findClient({$and:[{_user : username},{"resourceServer.serverId" : resources[0].serverId}]},callback)
                    },
                    function(callback){
                        fc.findOneServer({$and:[{_user : username},{_id: resources[0].serverId}]},callback)
                    }
                ],function(err,results){
                    if(err){callback(err,null,null,null)}
                    else{
                        callback(null,resources,results[0],results[1])
                        //callback(null,clients,server)
                    }
                })
            }
        ],function(err,resources,clients,server){
            if(err){return res.status(403).send({error: err.message})}
            res.render('Permissions/addPermission', {
                title: 'Add New Permission',
                resourceList : resources,
                clientList : clients,
                client_id : server.clientId,
                id : new ObjectID()
            });
        });
    });

    app.post('/permission',requiredAuthentication,function (req, res){//check resource-client unique
        var username = req.session.user.username;
        var resourceID = req.body.resource;
        var clientID = req.body.client;
        var permissionId = req.body.id;
        var actions = req.body.actions;
        if(!Array.isArray(actions)){actions = [req.body.actions];}
        async.waterfall([
            function(callback){
                fc.checkPermission(username,resourceID,clientID,callback)
            },
            function(permission,callback){
                fc.findOneResource({_id:resourceID},callback)
            },
            function(resource,callback){
                async.series([
                    function(callback){
                        fc.checkPAT({object_id:resource.serverId},callback)
                    },
                    function(callback){
                        fc.findOneServer({_id:resource.serverId},callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{
                        callback(null,results[1],resource)//0-pat,1-server
                    }
                })
            },
            function(server,resource,callback){
                async.parallel([
                    function(callback){
                        var permission = new Permission({
                            _id : permissionId,
                            _user : username,
                            resourceId : resourceID,
                            clientId : clientID,
                            actions : actions,
                            createdDate : new Date()
                            //serverId : server._id,
                            //server_id : "None",
                        }).save(function (err,doc){
                                if(err){callback(err,null)}
                                else{callback(null,permission.emitted.fulfill[0])}});
                    },
                    function(callback){
                        fc.getURL(server,'permission_endpoint',callback)
                    },
                    function(callback){
                        fc.createRPT(username,permissionId,"Permission",actions,callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{
                        callback(null,results[0],results[1],results[2],resource)//0-permission,1-URL,2-rpt
                    }
                })
            },
            function(permission,URL,rpt,resource,callback){
                async.waterfall([
                    function(callback){
                        fc.findOneClient({_id:clientID},callback)
                    },
                    function(client,callback){
                        fc.findOneServerInClient(client,resource.serverId,callback)
                    },
                    function(specServer,callback){
                        console.log(!actions)
                        var data = JSON.stringify({
                                id: permissionId,
                                resource_id: resource.server_id,
                                client_id: specServer.id,
                                actions: actions,
                                clientID: req.body.client_id
                            });
                            fc.httpsFunc('POST',data,URL,rpt.token,callback)//ok
                    },
                ],function(err,OK){
                    if(err){callback(err,null)}
                    else{callback(null,OK)}
                })
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.redirect('/permission')
        })
    });

    app.get('/editPermission/:id', requiredAuthentication,function (req, res){
        async.waterfall([
            function(callback){
                fc.findOnePermission({_id:req.params.id},callback)
            },
            function(permission,callback){
                async.parallel([
                    function(callback){
                        fc.addResCliName(permission,callback)
                    },
                    function(callback){
                        fc.findOneResource({_id:permission.resourceId},callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{callback(null,results[0],results[1])}//results[0]permission//results[1]resource
                })
            },
        ],function(err,permission,resource){
            if(err){return res.status(403).send({error: err.message})}
            res.render('Permissions/editPermission', {
                title: 'Edit Permission',
                edit_per : permission,
                resource : resource
            });
        })
    });

    app.put('/permission/:id',requiredAuthentication,function (req, res){
        var actions = req.body.actions;
        //if (!actions) actions="None"
        async.waterfall([
            function(callback){
                fc.findOnePermission({_id:req.params.id},callback)
            },
            function(permission,callback){
                async.parallel([
                    function(callback){
                        fc.findOneResource({_id:permission.resourceId},callback)
                    },
                    function(callback){
                        fc.findOneClient({_id:permission.clientId},callback)
                    },
                    function(callback){
                        fc.createRPT(permission._user,permission._id,"Permission",permission.actions,callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{callback(null,results[0],results[1],results[2],permission)}//0-resource,1-client,1-rpt
                })
            },
            function(resource,client,rpt,permission,callback){
                async.waterfall([
                    function(callback){
                        fc.findOneServer({_id:resource.serverId},callback)
                    },
                    function(server,callback){
                        fc.getURL(server,'permission_endpoint',callback)
                    },
                    function(URL,callback){
                        async.waterfall([
                            function(callback){
                                fc.findOneServerInClient(client,resource.serverId,callback)
                            },
                            function(specServer,callback){
                                var data = JSON.stringify({
                                    resource_id : resource.server_id,
                                    client_id : specServer.id,
                                    actions : permission.actions
                                });
                                fc.httpsFunc('DELETE',data,URL,rpt.token,callback)
                            },
                        ],function(err,OK){
                            if(err){callback(err,null)}
                            else{callback(null,URL)}
                        })
                    },
                    function(URL,callback){
                        async.waterfall([
                            function(callback){
                                fc.findOneServerInClient(client,resource.serverId,callback)
                            },
                            function(specServer,callback){
                                if(!actions){callback(null,null)}
                                else{
                                    var data = JSON.stringify({
                                        id: req.params.id,
                                        resource_id: resource.server_id,
                                        client_id: specServer.id,
                                        actions: actions,
                                        clientID: req.body.client_id
                                    });
                                    fc.httpsFunc('POST',data,URL,rpt.token,callback)
                                }
                            },
                        ],function(err,OK){
                            if(err){callback(err,null)}
                            else{callback(null,OK)}
                        })
                    },
                    function(OK,callback){
                        Permission.update({_id:req.params.id},{$set:{
                            actions : actions
                        }},{safe:true}, function (err, doc) {
                            if(err){callback(err,null)}
                            else{callback(null,null)}
                        });
                    },
                ],function(err,results){//null
                    if(err){callback(err,null)}
                    else{callback(null,results)}
                })
            },
        ],function(err,results){//null
            if(err){return res.status(403).send({error: err.message})}
            res.redirect('/permission')
        })
    });


    app.get('/clientPermission/:id', requiredAuthentication,function (req, res){
        async.waterfall([
            function(callback){
                fc.findOneClient({_id:req.params.id},callback)
            },
            function(client,callback){
                fc.findPermission({$and:[{_user : req.session.user.username},{clientId:client._id}]},callback)
            },
        ],function(err,permissions){
            if(err){return res.status(403).send({error: err.message})}
            res.render('Permissions/permissions', {
                title: 'Client Permissions',
                permissionList : permissions
            });
        })
    });

    app.delete('/permission/:id', requiredAuthentication,function (req, res){
        async.waterfall([
            function(callback){
                fc.findOnePermission({_id:req.params.id},callback)
            },
            function(permission,callback){
                async.parallel([
                    function(callback){
                        fc.findOneResource({_id:permission.resourceId},callback)
                    },
                    function(callback){
                        fc.findOneClient({_id:permission.clientId},callback)
                    },
                    function(callback){
                        fc.createRPT(permission._user,permission._id,"Permission",permission.actions,callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{callback(null,results[0],results[1],results[2],permission)}//0-resource,1-client,1-rpt
                })
            },
            function(resource,client,rpt,permission,callback){
                async.waterfall([
                    function(callback){
                        fc.findOneServer({_id:resource.serverId},callback)
                    },
                    function(server,callback){
                        fc.getURL(server,'permission_endpoint',callback)
                    },
                    function(URL,callback){
                        async.waterfall([
                            function(callback){
                                fc.findOneServerInClient(client,resource.serverId,callback)
                            },
                            function(specServer,callback){
                                if(!permission.actions){callback(null,null)}
                                else{
                                    var data = JSON.stringify({
                                        resource_id : resource.server_id,
                                        client_id : specServer.id,
                                        actions : permission.actions
                                    });
                                    fc.httpsFunc('DELETE',data,URL,rpt.token,callback)
                                }
                            },
                        ],function(err,OK){
                            if(err){callback(err,null)}
                            else{callback(null,OK)}
                        })
                    },
                    function(OK,callback){
                        Permission.remove({_id : req.params.id}, function (err, doc) {
                            if(err){callback(err,null)}
                            else{callback(null,null)}
                        });
                    },
                ],function(err,results){//null
                    if(err){callback(err,null)}
                    else{callback(null,results)}
                })
            },
        ],function(err,results){//null
            if(err){return res.status(403).send({error: err.message})}
            res.redirect('/permission')
        })
    });

    app.post('/resourceChange',requiredAuthentication,function(req,res){
        var username = req.session.user.username;
        var resourceId = req.body.resourceId;
        async.waterfall([
            function(callback){
                fc.findOneResource({_id:resourceId},callback)
            },
            function(resource,callback){
                async.parallel([
                    function(callback){
                        callback(null,resource)
                    },
                    function(callback){
                        fc.findClient({$and:[{_user : username},{'resourceServer.serverId': resource.serverId }]},callback)
                    }
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{
                        callback(null,results[0],results[1])
                        //callback(null,resource,clients)
                    }
                })

            },
        ],function(err,resource,clients){
            if(err){return res.status(403).send({error: err.message})}
            res.json({
                resource: resource,
                clients : clients
            });
        })
    });

}
/**
 * Created by nmu on 01/04/2015.
 */
