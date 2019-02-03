"use-strict";
let webSocketServer = require('websocket').server;
let http = require("http");
let mysql = require('mysql');
let date = require('date-and-time');

let mysqlConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "test"
});

mysqlConnection.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

let server = http.createServer(function(req,res){

});

server.listen(9000,function(){
    console.log(new Date() + "server started");
});

let wsServer = new webSocketServer({
    httpServer : server
});

wsServer.on('request',function(req){
    let connection = req.accept(null,req.origin);
    console.log("connected from" + req.origin);

    connection.on('message',function(message){
        let sensorVal = JSON.parse(message.utf8Data);
        let now = new Date();
        if(sensorVal.messageType == "val"){
            let sql = "INSERT INTO bed1 (date,heartrate,temp,vibration) VALUES ('" + date.format(now,'YYYY-MM-DD HH:mm:ss') + "'," + sensorVal.s1 + "," + sensorVal.s2 + "," +sensorVal.s3+ ")";
            mysqlConnection.query(sql, function (err, result) {
                if (err) throw err;
                console.log("added " + sensorVal.s1 + "  " + sensorVal.s2 + "   " + sensorVal.s3 );
            });
            connection.sendUTF("ok");
        }
        else{
            console.log()
        }
    });

    connection.on('close',function(conn){
        console.log("disconneted from" + conn.remoteAddress);
    });

});

