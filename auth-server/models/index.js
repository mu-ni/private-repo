//for index
//module.exports.oauth = require('./oauth');
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/oauthdb");
var Schema = mongoose.Schema;
//user
var UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    hashedPassword: { type: String, required: true },
    name:{ type: String, required: true },
    email:{ type: String, required: true },
    country:{ type: String, required: true }
});
var User = mongoose.model('accounts', UserSchema);
module.exports.User = User;
//resource
var ResourceSchema = new Schema({
    server_id: { type: String },//id in resource server
    _user: { type: String, required: true },
    resourceName: { type: String },
    resourceType: { type: String },
    resourceUrl:{ type: String },
    serverId:{ type: String },//id in resource server collection
    //actionId:{ type: String },
    //attributesId:{ type: String },
    //actionName:{ type: String },
    actions:{ type: Array},
    //attributeName:{ type: Array },
    attributes:{ type: Array },
    /////
    description:{ type: String },
    options:{ type: String }
});
var Resource = mongoose.model('resources', ResourceSchema);
module.exports.Resource = Resource;
//client
var ClientSchema = new Schema({
    _user: { type: String },
    clientName: { type: String },
    clientType: { type: String },
    clientUrl:{ type: String },
    tokenType:{ type: String },
    pinCode:{ type: String },//not required
    resourceServer:{ type: Array},//{id:body.id, serverId:server._id, username:body.username}
    clientId:{ type: String, required: true },
    clientSecret:{ type: String, required: true }
});
var Client = mongoose.model('clients', ClientSchema);
module.exports.Client = Client;
//permission
var PermissionSchema = new Schema({
    //server_id: { type: String },
    _user: { type: String, required: true },
    resourceId: { type: String },
    clientId: { type: String },
    actions:{ type: Array },
    //serverId:{ type: String },==resource.server_id
    createdDate:{ type: Date }
}/*,{ versionKey: false }*/);
var Permission = mongoose.model('permissions', PermissionSchema);
module.exports.Permission = Permission;
//resource server
var ResourceServerSchema = new Schema({
    _user: { type: String, required: true },
    serverName: { type: String },
    serverUser: { type: String },
    serverUrl:{ type: String },
    discoveryUrl:{ type: String },
    scope:{ type: Array },
    createdDate:{ type: Date },
    status:{ type: Boolean },
    clientId:{ type: String },
    clientSecret:{ type: String },
    /////////////
    description:{ type: String },
    timeSelfManagement:{ type: String },
    tokenDescriptors:{ type: Array },
    umaCompliant :{ type: Boolean }
});
var ResourceServer = mongoose.model('resourceServers', ResourceServerSchema);
module.exports.ResourceServer = ResourceServer;
//token pat
var Token_patSchema = new Schema({
    _user: { type: String, required: true },
    token: { type: String },
    refreshToken: { type: String },
    object_id: { type: String },
    object_type: { type: String },
    createdDate: { type: Date },
    lifetime: { type: String },
    expiredDate: { type: Date },
    scope: { type: Array }
});
var Token_pat = mongoose.model('tokens_pat', Token_patSchema);
module.exports.Token_pat = Token_pat;
//token rpt
var Token_rptSchema = new Schema({
    _user: { type: String, required: true },
    token: { type: String },
    refreshToken: { type: String },
    object_id: { type: String },
    //object_name: { type: String },
    object_type: { type: String },//resource or client
    createdDate: { type: Date },
    lifetime: { type: String },
    expiredDate: { type: Date },
    scope: { type: Array }
});
var Token_rpt = mongoose.model('tokens_rpt', Token_rptSchema);
module.exports.Token_rpt = Token_rpt;
//token aat
var Token_aatSchema = new Schema({
    _user: { type: String, required: true },
    token: { type: String },
    object_id: { type: String },
    //object_name: { type: String },
    object_type: { type: String },//resource or client
    createdDate: { type: Date },
    lifetime: { type: String },
    expiredDate: { type: Date },
    scope: { type: Array }
});
var Token_aat = mongoose.model('tokens_aat', Token_aatSchema);
module.exports.Token_aat = Token_aat;
//ticket
var TicketSchema = new Schema({
    _user: { type: String, required: true },
    ticket: { type: String },
    object_id: { type: String },
    //object_name: { type: String },
    object_type: { type: String },//resource or server
    createdDate: { type: Date },
    lifetime: { type: String },
    expiredDate: { type: Date },
    scope: { type: Array },
    relatedToken: { type: String }
});
var Ticket = mongoose.model('tickets', TicketSchema);
module.exports.Ticket = Ticket;
//token lifetime
var LifetimeSchema = new Schema({
    _user: { type: String, required: true },
    type: { type: String },
    lifetime: { type: Number }
});
var Lifetime = mongoose.model('lifetime', LifetimeSchema);
module.exports.Lifetime = Lifetime;
//////////////////////////
//module.exports.findResource = require('./resource');
//module.exports.findClient = require('./client');
//module.exports.findPermission = require('./permission');
/////////////////////////////

/**
 * Created by nmu on 23/04/2015.
 */
