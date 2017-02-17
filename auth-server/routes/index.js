//mongodb schema
var User = require('../models').User;
//middleware
var userExist = require('../middleware').userExist;
var requiredAuthentication = require('../middleware').requiredAuthentication;
var checkUser = require('../middleware').checkUser;
var passwordHash = require('password-hash');
module.exports = function(app){
    app.get('/',function (req, res){
        var user = req.session.user;
        if (req.session.user) {
            res.redirect("/profile/"+user.username);
        } else {
            res.render('index', {
                title: 'Gemalto Oauth'
            });
        }
    });

    app.get("/signup", function (req, res) {
        if (req.session.user) {
            res.redirect("/profile/"+req.session.user.username);
        } else {
            res.render("signup", {
                title: 'Signup'
            });
        }
    });

    app.post("/signup", userExist, function (req, res) {
        var password = req.body.password;
        var rePassword = req.body.rePassword;
        var hashedPassword = passwordHash.generate(password);
        //var email = req.body.email;
        //var correctEmail = regular.email.test(email);
        if(password===rePassword){
            var user = new User({
                username: req.body.username,
                hashedPassword: hashedPassword,
                name: req.body.name,
                email: req.body.email,
                country: req.body.country
            }).save(function (err,doc){
                    req.session.regenerate(function(){
                        req.session.success='Signup successful! Use your new account to login!';
                        res.redirect('/login');
                    });
                });
        }else{
            req.session.error = 'Different Password!'
            res.redirect('/signup');
        }
    });

    app.get('/login',function (req, res){
        res.render("login", {
            title: 'Gemalto Login'
        });
    });

    app.post('/login',function (req, res){
        var username = req.body.username;
        User.findOne({username:username}, function (err, user) {
            if(err){return res.status(403).send({error: err.message})}
            if(!user){
                req.session.error = 'No such user!';
                res.redirect('/login');
            }else{
                if(passwordHash.verify(req.body.password, user.hashedPassword)){
                    req.session.user = user;
                    req.session.passport.user = user;
                    var host = req.headers.host;
                    var referer= req.header('referer');
                    if (referer==="https://"+host+"/login") {res.redirect('/profile/'+username);}
                    else{res.redirect('back');}
                }else{
                    req.session.error = 'Wrong psw!';
                    res.redirect('/login');
                }
            }
        });
    });

    app.get('/logout',function (req, res){
        //req.session.user=null;
        req.session.destroy(function () {
            res.redirect('/');
        });
    });

    app.get('/profile/:username',requiredAuthentication, checkUser, function (req, res) {
        User.findOne({username:req.params.username}, function (err, user) {
            if(err){return res.status(403).send({error: err.message})}
            if(!user){return res.status(403).send('not found user!')}
            res.render('profile', {
                title: 'Profile',
                user:user
            });
        });
    });

    app.put('/profile/:username',requiredAuthentication, function (req, res) {
        var username = req.params.username;
        User.update({username:username},{$set:{
            name : req.body.name,
            email : req.body.email,
            country : req.body.country
        }}, function (err,doc) {
            if(err){return res.status(403).send({error: err.message})}
            req.session.success='Update successful!';
            res.redirect("/profile/"+username);
        });
    });

    app.get("/changePassword/:username", requiredAuthentication, function (req, res) {
        res.render("changePsw", {
            title: 'Change Password'
        });
    });

    app.put("/changePassword/:username",requiredAuthentication, function (req, res) {
        var username = req.params.username;
        var password = req.body.password;
        var newPassword = req.body.newPassword;
        var reNewPassword = req.body.reNewPassword;
        var hashedPassword = passwordHash.generate(newPassword);
        User.findOne({username:username}, function (err, user) {
            if(err){return res.status(403).send({error: err.message})}
            if(!user){return res.status(403).send('not found user!')}
            if(passwordHash.verify(password, user.hashedPassword)){
                if(newPassword===reNewPassword){
                    User.update({username:username},{$set:{
                        hashedPassword: hashedPassword
                    }}, function (err,doc) {
                        if(err){return res.status(403).send({error: err.message})}
                        req.session.success='Change password successful!';
                        res.redirect("/profile/"+username);
                    });
                }else{
                    req.session.error = 'New Password not the same!';
                    res.redirect('/changePassword/'+username);
                }
            }else{
                req.session.error = 'Wrong old psw!';
                res.redirect('/changePassword/'+username);
            }
        });
    });

}
