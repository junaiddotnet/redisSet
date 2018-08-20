const redis = require('redis');
const express = require('express');
const viewegine  = require('ejs');
const bodyparser  = require('body-parser')
const path  = require('path');
const { check, validationResult } = require('express-validator/check');


const app = express();
var dataValue=null;
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
// set the global variable

app.use(function(req,res,next){
    app.locals.message=null;
    app.locals.status=null;
    app.locals.deals = null;
    app.locals.dealName=null;
    next();
});
// set radis client
const redisClient  = redis.createClient();

app.get('/index',function(req,res){

    const deal = req.query.id;
    console.log(deal);
    if (deal)
    {
        redisClient.sdiff(deal,function(err,reply){
            console.log(reply);
        res.render('index',{dealName:deal,dataValue:reply});
           
        });
    }
   
   // res.render('Index');
    
});

app.get('/',function(req,res){
    // get the toal deals in the readis 

    redisClient.keys('deals:*',function(err,reply){
        res.render('main',{deals:reply});
    });
});

app.get('/addDeals',function(req,res){
    res.render('index');
});
app.get('/undeal',function(req,res){
    const uid  = req.query.uid;
    const did=req.query.did;
    if (did!='undefined')
    {
        redisClient.srem('deals:'+did,uid,function(err,reply){
            console.log('deleted .');
        });
    }
    res.redirect('/');
});
app.post('/addDeals',[check('dname').isString()],function(req,res){
    const dealName = req.body.dname;
    const userName  = req.body.uname;
    const text  = req.body.udesc;
    
   // Check the validation
   
    
    const error  = validationResult(req);
    
    console.log('validtion ..'+error);

    if (!error.isEmpty())
    {
        res.status(422).json({errors:error.array()});
    }
    
   // addDealWithUser(dealName,userName);
   //SendDealCheck(dealName,userName);
   // get the user list from chosen deal name
   redisClient.sdiff('deals:'+dealName,function(err,reply){
       if (reply!=null)
       {
            dataValue=reply;
       }
   });
   dealCheck(dealName,userName,function(err,response){
    console.log(dataValue);
    if (response)
    {
        
        res.render('index',{message:'This user name '+ userName + ' is already exist in this Deal ...'+dealName,status:'1',dealName:dealName,dataValue:dataValue});
        
    }
    else
    {
        addDealWithUser(dealName,userName);
        console.log("We r going to send the deal ..");
        res.render('index',{message:'This user name '+ userName + ' is Added to this Deal ...'+dealName,status:'0',dealName:dealName,dataValue:dataValue});

    }  

   });
   // res.redirect('/');
});
function MarkDealSet(dealId,clientId)
{
    redisClient.sadd("deal:"+dealId,clientId);

}
function addDealWithUser (deal,name)
{
    redisClient.sadd('deals:'+deal,name);
}
function dealCheck (dealId,clientId,callback)
{
    redisClient.sismember("deal:"+dealId,clientId,callback);

}

function SendDealCheck (dealId,clientId)
{
    redisClient.sismember("deal:"+dealId,clientId,function(err,response){
        if (response)
        {
            console.log("Deal",dealId,"already send to user :",clientId);
            
        }
        else
        {
            console.log("We r going to send the deal ..");
            MarkDealSet(dealId,clientId);
        }  
    });
}
// show user who receive al the deals..
function showUserReciveAllDeals (dealIds)
{
    redisClient.sinter(dealIds,function(err,response){
        console.log(response);
    });
}

/* MarkDealSet(1,'user:1');
MarkDealSet(1,'user:2');

MarkDealSet(2,'user:1');
MarkDealSet(2,'user:2');
MarkDealSet(2,'user:3');
MarkDealSet(2,'user:4');

SendDealCheck(1,'user:1');
SendDealCheck(1,'user:2');
SendDealCheck(1,'user:3'); */

showUserReciveAllDeals(['deal:1','deal:2']);

app.listen(3000,function(){
    console.log('serve start at port 3000 ..');
});