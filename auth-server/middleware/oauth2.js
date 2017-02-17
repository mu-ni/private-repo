var oauth2orize = require('oauth2orize');
var passport = require('passport');
var findByClientId = require('./index').findByClientId;
var findByUsername = require('./index').findByUsername;
var findResourceServer = require('./index').findResourceServer;
var ResourceServer = require('../models').ResourceServer;
var saveToken = require('./index').saveToken;
var findAuthCode = require('./index').findAuthCode;
var saveAuthCode = require('./index').saveAuthCode;
var Lifetime = require('../models').Lifetime;
var fc = require('./functions');
// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
    console.log('serialize client')
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    console.log('deserialize client')
    findResourceServer(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = fc.randomString(16)
    saveAuthCode(code, client.id, redirectURI, user, function(err) {
    if (err) { return done(err); }
    done(null, code);
  });
}));

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

//no use function
server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    console.log("grant")
    var token = fc.randomString(256);
    saveToken(token, user.id, client.clientId, function(err) {
        if (err) { return done(err); }
        done(null, token);
    });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

//only use this exchange
//server._exchange(authorization_code, req, res, function(err) {
//exports.exchange = [
server.exchange(oauth2orize.exchange.authorizationCode(function(client, code, redirectURI, done) {
    console.log("exchange1")
    findAuthCode(code, function(err, authCode) {
        if (err) { return done(err); }
        if (client.id !== authCode.clientID) { return done(null, false); }
        if (redirectURI !== authCode.redirectURI) { return done(null, false); }
        findByClientId(client.clientId, function(err, server){
            var user = server._user;
            var token = fc.randomString(256);
            var refreshToken = fc.randomString(64);
            var objectId = server._id;
            var objectName = server.serverName;
            var objectType = 'ResourceServer';
            var createdDate = new Date();
            Lifetime.findOne({$and:[{_user : server._user},{type:'pat'}]},{}, function(err,tok){
                if(!tok){
                    var lifetime = new Lifetime({
                        _user : server._user,
                        type : 'pat',
                        lifetime : 100
                    }).save(function (err,doc){
                            if(err){return console.log(err)}
                            res.redirect('/token_pat')//referer
                        });
                }else{
                    var lifetime = tok.lifetime;
                    var expiredDate = new Date();
                    expiredDate.setMinutes(expiredDate.getMinutes()+lifetime);
                    var scope = server.scope;
                    var accessToken = {
                        token : token,
                        createdDate : createdDate,
                        lifetime : lifetime,
                        expiredDate : expiredDate,
                        scope : server.scope
                    }
                    saveToken(user, token, refreshToken, objectId, objectName, objectType, createdDate, lifetime, expiredDate, scope, function(err) {
                        if (err) {return done(err);}
                        else {
                            done(null, accessToken, refreshToken);
                        }
                    });
                }
            });
        });
    });
}))
//]


// Exchange user id and password for access tokens.  The callback accepts the
// `client`, which is exchanging the user's name and password from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the code.
//no use function
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    console.log("exchange2")
    //Validate the client
    findByClientId(client.clientId, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }
        //Validate the user
        findByUsername(username, function(err, user) {
            if (err) { return done(err); }
            if(user === null) {
                return done(null, false);
            }
            if(password !== user.password) {
                return done(null, false);
            }
            //Everything validated, return the token
            var token = fc.randomString(256);
            saveToken(token, user.id, client.clientId, function(err) {
                if (err) { return done(err); }
                done(null, token);
            });
        });
    });
}));

// Exchange the client id and password/secret for an access token.  The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.
//no use function
server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {
    console.log("exchange3")
    //Validate the client
    findByClientId(client.clientId, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }
        var token = fc.randomString(256);
        //Pass in a null for user id since there is no user with this grant type
        saveToken(token, null, client.clientId, function(err) {
            if (err) { return done(err); }
            done(null, token);
        });
    });
}));

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view. 


exports.authorization = server.authorization(function(clientID, redirectURI, done) {
    findByClientId(clientID, function(err, client) {
      if (err) { return done(err); }
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectURI provided by the client matches one registered with
      //          the server.  For simplicity, this example does not.  You have
      //          been warned.
      return done(null, client, redirectURI);
    });
  })

exports.authorizationCallback = function(req, res){
    var id = req.oauth2.client._id;
    /*ResourceServer.update({_id:id},{$set:{
        scope : req.oauth2.req.scope
    }},{safe:true}, function (err, doc) {
        if (err) {res.send(err);}
        else {
            res.render('ResourceServer/authorize', {
                transactionID: req.oauth2.transactionID,
                client: req.oauth2.client,
                title: 'Authorize'
            });
        }
    });*/
    res.render('ResourceServer/authorize', {
        transactionID: req.oauth2.transactionID,
        client: req.oauth2.client,
        title: 'Authorize'
    });
}


// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = server.decision()


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    //passport.authenticate(['oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]
