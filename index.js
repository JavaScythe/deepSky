const express = require("express");
const cors = require('cors');
const app = express();
const fs = require("fs");
app.use(cors());
const axios = require("axios");
function generateResponse(r,d,s,p){
    return {
        d,
        s,
        r,
        p
    };
}
function saveCache(i,d,p){
    var db = fs.readFileSync(__dirname+"/db.json", "utf-8");
    db=JSON.parse(db);
    db["listings"][i]["cache"]["paths"][p] = {};
    db["listings"][i]["cache"]["paths"][p]["content"] = d;
    db["listings"][i]["cache"]["paths"][p]["last_on"] = new Date().getTime();
    db["listings"][i]["cache"]["last_on"] = new Date().getTime();
    db=JSON.stringify(db);
    fs.writeFileSync(__dirname+"/db.json", db);
    return true;
}
app.get("/",(req,res)=>{
   res.sendFile(__dirname+"/index.html");
});
app.get("/gateway",async (req,res)=>{
   if(req.query.tp_url != undefined){
        //get from db, still can be changed
       var db = fs.readFileSync(__dirname+"/db.json", "utf-8");
       db=JSON.parse(db);
       var lis = db["listings"];
       var tg = req.query.tp_url;
       var path = req.query.gpath;
       var method = req.query.method;
       for(var i in lis){
           var li = lis[i];
           if(tg == i){
               if(li["cache"]["paths"][path]!=undefined){
                   res.send(generateResponse(li["canonical_name"],li["cache"]["paths"][path]["content"],"2CC",path))
               } else {
                   var rpath = path;
                   if(li["cpaths"][path] != undefined){
                       path = li["cpaths"][path];
                   }
                   var r = await axios.get(method+li["canonical_name"]+path);
                   res.send(generateResponse(
                       li["canonical_name"],
                       r.data,
                       200,
                       path
                   ));
                   saveCache(i, r.data, rpath);
               }
           }
       }
   }
});
app.listen(8080);