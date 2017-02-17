//mongodb schema
var ObjectID = require('mongoose/node_modules/mongodb').ObjectID;
var Resource = require('../models').Resource;
var Permission = require('../models').Permission;
var ResourceServer = require('../models').ResourceServer;
//middleware
var requiredAuthentication = require('../middleware').requiredAuthentication;
var fc = require('../middleware/functions');
//others
var async = require('async');
var https = require('https');
//https.globalAgent.maxSockets = 100;
//var request = require('request');
module.exports = function(app){
    app.get('/resource', requiredAuthentication,function (req, res){
        //resource server name
        Resource.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,resources){
            if(err){return res.status(403).send({error: err.message})}
            //if(resources.length===0){return res.status(403).send('not found resource!')}//display empty list
            async.each(resources,fc.addServerNameRes,function(err){
                if(err){
                    console.log(err)
                    return res.status(403).send({error: err.message})
                }
                res.render('Resources/resources',{
                    title: 'Resources',
                    resourceList : resources
                });
            });
        });
    });

    app.post('/resource',function (req, res){
        var host = req.headers.host;
        var resourceId = new ObjectID();
        async.waterfall([
            function(callback){
                fc.findOneServer({clientId:req.body.clientId},callback)
            },
            function(server,callback){
                var resource = new Resource({
                    _id : resourceId,
                    _user : server._user,
                    server_id : req.body.id,
                    resourceName : req.body.resourceName,
                    resourceType : req.body.resourceType,
                    resourceUrl : "https://"+host+"/resource/"+resourceId,
                    actionName : req.body.actionName,
                    actions : req.body.actions,
                    attributeName : req.body.attributeName,
                    attributes : req.body.attributes,
                    serverId : server._id
                }).save(function (err,doc){
                        if(err){callback(err,null)}
                        else{callback(null,resource.emitted.fulfill[0])}
                    });
            },
        ],function(err,resource){
            if(err){return res.status(403).send({error: err.message})}
            res.status(201).send({auth_id: resourceId});
        })
    });

    app.get('/resource/:id', requiredAuthentication,function (req, res){
        async.waterfall([
            function(callback){
                fc.findOneResource({_id:req.params.id},callback)
            },
            function(resource,callback){
                async.parallel([
                    function(callback){
                        callback(null,resource)
                    },
                    function(callback){
                        fc.findOneServer({_id:resource.serverId},callback)
                    },
                ],function(err,results){
                    if(err){callback(err,null)}
                    else{
                        callback(null,results[0],results[1])
                        //callback(null,resource,server)
                    }
                })

            },
        ],function(err,resource,server){
            if(err){return res.status(403).send({error: err.message})}
            res.render('Resources/viewResource', {
                title: 'View Resource',
                view_res : resource,
                server : server
            });
        })
    });

    app.delete('/resource/:id', requiredAuthentication,function (req, res){
        async.series([
            function(callback){
                Permission.findOne({$and:[{_user : req.session.user.username},{resourceId:req.params.id}]}, function (err, permission) {
                    if(err){callback(err,null)}
                    else if(permission){
                        callback(new Error('Can\'t delete!! This client is used in permission!'),null)
                    }
                    else{callback(null,permission)}
                });
            },
            function(callback){
                Resource.remove({_id : req.params.id}, function (err, doc) {
                    if(err){callback(err,null)}
                    else{callback(null,null)}
                });
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/resource");
        })
    });

    app.post('/resourece-set',requiredAuthentication,function(req,res){
        var resourceIdSet = req.body.resources;
        var host = req.headers.host;
        var id = new ObjectID();
        async.waterfall([
            function(callback){
                fc.findResource({_id:{$in:resourceIdSet}},callback)
            },
            function(resources,callback){
                var idSet = [];
                var setName = [];
                var setType = [];
                var server_id = [];
                for(var i=0;i<resources.length;i++){
                    idSet = idSet.concat(resources[i]._id);
                    server_id = server_id.concat(resources[i].server_id);
                    setName = setName.concat(resources[i].resourceName);
                    setType = setType.concat(resources[i].resourceType);
                }
                var resource = new Resource({
                    _id : id,
                    _user : resources[0]._user,
                    server_id : "55c1df41c0a244040cc3c1e5",
                    resourceName : setName.toString(),
                    resourceType : setType.toString(),
                    resourceUrl : "https://"+host+"/resource/"+id,
                    serverId : "55ae41fb6cabaf30153a6c1d"
                }).save(function (err,doc){
                        if(err){callback(err,null)}
                        else{callback(null,resource.emitted.fulfill[0])}
                    });
            },
        ],function(err,results){
            if(err){return res.status(403).send({error: err.message})}
            res.send({result:'OK'});
        })
    });
}
/**
 * Created by nmu on 01/04/2015.
 */
