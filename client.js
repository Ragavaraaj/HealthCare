var WebSocketClient = require('websocket').client;
let mysql = require('mysql');
var moment = require('moment');

var client = new WebSocketClient();

let mysqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "test"
  });
  
  mysqlConnection.connect(function(err) {
    if (err) throw err;
    console.log("Connected to MySQL!");
  });

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    let last = moment(new Date(),'YYYY-MM-DD HH:mm:ss');
    console.log('WebSocket Client Connected at ' + last.toString());
    let bpm = 0;
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            let sensorVal = JSON.parse(message.utf8Data);
            let now = moment(new Date(),'YYYY-MM-DD HH:mm:ss');
            if(sensorVal.messageType == "val"){
                if(now.minute() - last.minute() == 1 && now.second() - last.second() == 0){
                    last = now;
                    let sql = "INSERT INTO bed1 (date,heartrate,temp,vibration) VALUES ('" + now.toString() + "'," + bpm + "," + sensorVal.s2 + "," +sensorVal.s3+ ")";
                    mysqlConnection.query(sql, function (err, result) {
                        if (err) throw err;
                        console.log("added " + bpm + "  " + sensorVal.s2 + "   " + sensorVal.s3 );
                        bpm = 0;
                    });
                    connection.sendUTF("ok");
                }
                else
                {
                    if(sensorVal.s1>550){
                        console.log(sensorVal.s1);
                        bpm+=1;
                        console.log(bpm);
                    }
                }
            }
        }
        else{
            console.log(message);
        }
    });
});


setTimeout(function(){
                client.connect('ws://192.168.28.104:9000')
            },1000);