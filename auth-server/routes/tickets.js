var requiredAuthentication = require('../middleware').requiredAuthentication;
var Ticket = require('../models').Ticket;
module.exports = function(app){
    app.get('/ticket', requiredAuthentication,function (req, res){
        Ticket.find({ $query: {_user : req.session.user.username}, $orderby: { _id : 1 } },{},function(err,tickets){
            if(err){return res.status(403).send({error: err.message})}
            //if(tickets.length===0){return res.status(403).send('not found ticket!')}//display empty list
            res.render('Tokens/tickets', {
                title: 'Tickets',
                ticketList: tickets
            });
        });
    });

    app.delete('/ticket/:id', requiredAuthentication,function (req, res){
        Ticket.remove({_id : req.params.id}, function (err, doc) {
            if(err){return res.status(403).send({error: err.message})}
            res.redirect("/ticket");
        });
    });

}
/**
 * Created by nmu on 08/06/2015.
 */
