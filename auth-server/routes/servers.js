//mongodb schema
var ObjectID = require('mongoose/node_modules/mongodb').ObjectID;
var ResourceServer = require('../models').ResourceServer;
//middleware
var requiredAuthentication = require('../middleware').requiredAuthentication;
var fc = require('../middleware/functions');
var checkResourceServerUnique = require('../middleware').checkResourceServerUnique;
//routes
module.exports = function(app){
    app.get('/resource-server', requiredAuthentication,function (req, res){
        var username = req.session.user.username;
        ResourceServer.find({ $query: {_user : username}, $orderby: { _id : 1 } },{},function(err,servers){
            if(err){return res.status(403).send({error: err.message})}
            //if(servers.length===0){return res.status(403).send('not found server!')}//display empty list
            res.render('ResourceServer/resourceServer',{
                title: 'Resource Server',
                serverList : servers
            });
        });
    });

    app.get('/add-resource-server', requiredAuthentication,function (req, res){
        res.render('ResourceServer/addResourceServer', {
            title: 'Add New Resource Server'
        });
    });

    app.post('/resource-server',requiredAuthentication,checkResourceServerUnique,function (req, res){
        var serverId = new ObjectID();
        /*var status = false;
        if (req.body.status === "true") {status = true}*/
        var server = new ResourceServer({
            _id : serverId,
            _user : req.session.user.username,
            serverName : req.body.serverName,
            serverUser : req.body.serverUser,
            serverUrl : req.body.serverUrl,
            scope : req.body.scope,
            createdDate : new Date(),
            status : req.body.status === "true"?true:false,
            clientId : fc.randomString(20),
            clientSecret : fc.randomString(40),
            umaCompliant : false//default is false
        }).save(function (err,doc){
                if(err){return res.status(403).send({error: err.message})}
                res.redirect("/resource-server/"+serverId);
            });
    });

    app.get('/resource-server/:id', requiredAuthentication,function (req, res){
        fc.findOneServer({_id:req.params.id},function(err,server){
            if(err){return res.status(403).send({error: err.message})}
            res.render('ResourceServer/editResourceServer', {
                title: 'Edit Resource Server',
                edit_server : server
            });
        })
    });

    app.put('/resource-server/:id',requiredAuthentication,function (req, res){
        ResourceServer.update({_id:req.params.id},{$set:{
            serverName : req.body.serverName,
            serverUser : req.body.serverUser,
            serverUrl : req.body.serverUrl,
            scope : req.body.scope,
            status : req.body.status === "true"?true:false,
            umaCompliant : req.body.umaCompliant === "true"?true:false
        }},{safe:true}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/resource-server");
        });
    });

    app.delete('/resource-server/:id', requiredAuthentication,function (req, res){
        ResourceServer.remove({_id : req.params.id}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/resource-server");
        });
    });

    app.post('/resource-server/reset', requiredAuthentication,function (req, res){
        var referer = req.headers.referer;
        var arr = referer.split("/");
        var id = referer.substring(referer.lastIndexOf(arr[4]));
        console.log(id)
        var client_id = fc.randomString(20);
        var client_secret = fc.randomString(40);
        ResourceServer.update({_id:id},{$set:{
            clientId : client_id,
            clientSecret : client_secret
        }},{safe:true}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.json({client_id : client_id, client_secret : client_secret})
        });
    });

}
/**
 * Created by nmu on 01/04/2015.
 */
