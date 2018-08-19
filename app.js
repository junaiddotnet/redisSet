const redis = require('redis');
const express = require('express');
const viewegine  = require('ejs');
const bodyparser  = require('body-parser')


const app = express();
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.set('view engine','ejs');
// set radis client
const redisClient  = redis.createClient();

app.get('/',function(req,res){
    res.render('index');
});
app.get('/addDeals',function(req,res){
    res.render('index');
})
app.post('/addDeals',function(req,res){
    const dealName = req.body.dname;
    const userName  = req.body.uname;
    const text  = req.body.udesc;
   // addDealWithUser(dealName,userName);
   //SendDealCheck(dealName,userName);
   dealCheck(dealName,userName,function(err,response){
    if (response)
    {
        
        res.render('index',{message:'This user name '+ userName + ' is already exist in this Deal ...'+dealName,status:'1'});
        
    }
    else
    {
        addDealWithUser(dealName,userName);
        console.log("We r going to send the deal ..");
        res.render('index',{message:'This user name '+ userName + ' is Added to this Deal ...'+dealName,status:'0'});

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