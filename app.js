const redis = require('redis');
const express = require('express');
const app = express();

// set radis client
const redisClient  = redis.createClient();

function MarkDealSet(dealId,clientId)
{
    redisClient.sadd("deal:"+dealId,clientId);
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

MarkDealSet(1,'user:1');
MarkDealSet(1,'user:2');

MarkDealSet(2,'user:1');
MarkDealSet(2,'user:2');
MarkDealSet(2,'user:3');
MarkDealSet(2,'user:4');

SendDealCheck(1,'user:1');
SendDealCheck(1,'user:2');
SendDealCheck(1,'user:3');

showUserReciveAllDeals(['deal:1','deal:2']);

app.listen(3000,function(){
    console.log('serve start at port 3000 ..');
});