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
    app.commentsList  = null;
    app.deal=null;
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
    const sql = require('mssql/msnodesqlv8');

    // connect with sql server .......
    var config = {
        connectionString: 'Driver=SQL Server;Server=DESKTOP-TS8N4AP\\SQLEXPRESS;Database=Blog;Trusted_Connection=true;'
      };
    var connection  = new sql.connect(config,function(err){
        if (!err)
        {
            // connection is established 
            // create request object 
            var request  = new sql.Request();
            // perform the quey now 
            request.query('select PostId,PostName from posts',function(err,data){
                    if (err)
                    {
                        console.log('Error in Query ..');
                    }
                    else
                    {
                        let v=null;
                        var key  = null;
                      data.recordset.forEach(element => {
                         console.log(element);
                          for (var p in element)
                          {   key  = "PostKey:"+element["PostId"];
                            console.log(key);
                              redisClient.hmset(key,p,element[p],function(err,reply){
                                    console.log("hmset Error"+err);
                              });
                              console.log(p);
                              console.log(element[p]);
                          }
                      });
                    }
            });

        }
        else
        {
            console.log('sql server bad connectuin ');
        }
    });
    connection.on("error", function(err) { 
        console.log('Error');
        console.error(err.stack); 
        console.log(err);
    });
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
//// Start of Helper Functions

// End node for Commenst 
app.get('/AddComments',function(req,res){
    let dealId = req.query.id;
    let key = dealId+':comments';
    let message  = null;
    console.log(dealId);
    console.log('Comments add page');
    redisClient.sdiff(key,function(err,result){
        if (err)
        {
            console.log('no comments there yet');
            message = 'no comments ...';
            res.render('comments',{message:message,deal:dealId, commentsList:result});

        }
        else
        {
            console.log(result);
            res.render('comments',{message:message,deal:dealId,commentsList:result});

        }
    });

});
app.post('/addComments',function(req,res){
    let desc = req.body.desc;
    let dealId=req.body.dealname;
    let key  = dealId+':comments';
    console.log(req.body.dealname);
    console.log('post comments '+dealId);
    
    redisClient.sadd(key,desc,function(err,reply){
        console.log(key);
        if (!err)
        {
            console.log('added successfully');
<<<<<<< HEAD
            console.log('Success');
            console.log('checking git');
            console.log('git login check');
=======
            
>>>>>>> lgin
        }
    });

    res.redirect('/AddComments?id='+dealId);

});
// End of Commnets Node 
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