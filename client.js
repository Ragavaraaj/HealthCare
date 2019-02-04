var WebSocketClient = require('websocket').client;
let mysql = require('mysql');
let date = require('date-and-time');


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
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
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
                console.log(message);
            }
        }
    });
});


//client.connect('ws://192.168.28.104:9000');

 

setTimeout(function(){
                client.connect('ws:// ip address of nodemcu :9000')
            }
            ,5000);