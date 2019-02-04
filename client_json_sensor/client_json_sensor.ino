#define MUX_A D4
#define MUX_B D3
#define MUX_C D2
#define ANALOG_INPUT A0

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <Hash.h>
#include <ArduinoJson.h>
#include<LinkedList.h>

class ClientsDetails
{
  uint8_t num;
  IPAddress ip;

  public :

  ClientsDetails(uint8_t a, IPAddress b)
  {
    num = a;
    ip = b;
  }
  
  uint8_t getNum()
  {
    return num;
  }

  IPAddress getIp()
  {
    return ip;
  }
};

const int buffer_size = JSON_OBJECT_SIZE(4);
StaticJsonBuffer<buffer_size> jb;
JsonObject& obj = jb.createObject();
WebSocketsServer webSocket = WebSocketsServer(9000);

float temp =23 ,heart =43 ,vib=3343;
long unsigned long last = 0;
int sec_count = 0;
LinkedList<ClientsDetails* > clients;

void changeMux(int c, int b, int a) {
  digitalWrite(MUX_A, a);
  digitalWrite(MUX_B, b);
  digitalWrite(MUX_C, c);
}

float calTemp(float input)
{
  float cel = (input/1024.0) * 330; 
  return ((cel * 9)/5 + 32);
}

void execution(int val)
{
  String data = "";
  if(abs(millis() - last) >= val)
  {
      changeMux(LOW, LOW, HIGH);
      temp = calTemp(analogRead(ANALOG_INPUT));  
//      Serial.printf("temp = %f",temp);
      changeMux(LOW, HIGH, LOW);
      heart = analogRead(ANALOG_INPUT);
//      Serial.printf("temp = %f",heart); 
      changeMux(LOW, HIGH, HIGH);
      vib = analogRead(ANALOG_INPUT);
//      Serial.printf("temp = %f",vib);
      last = millis();
      obj["messageType"] = "val";
      obj["s1"] = heart;
      obj["s2"] = temp;
      obj["s3"] = vib;
      Serial.printf("message : ");
      obj.printTo(Serial);
      Serial.printf("\n");
      obj.printTo(data);
      if(val == 30000)
          webSocket.sendTXT(clients.get(0)->getNum(),data);
      else
      {
        if( sec_count == 3 )
        { 
          for (int i = 0 ; i < clients.size() ; i++)
            webSocket.sendTXT(clients.get(i)->getNum(),data);
          sec_count = 0;
        }
        else
        {
          for (int i = 1 ; i < clients.size() ; i++)
            webSocket.sendTXT(clients.get(i)->getNum(),data);
          ++sec_count;
        }
      }
        
  }
}

void removeClient(uint8_t val)
{
  for(int i = 0 ; i < clients.size() ; i++)
    if(clients.get(i)->getNum() == val )
    {
      IPAddress ip = clients.get(i)->getIp();
      Serial.printf("[%u] Client %d.%d.%d.%d has Disconnected!\n", val,ip[0],ip[1],ip[2],ip[3]);
      delete clients.get(i);
      clients.remove(i);
    }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  
  switch(type) {
    case WStype_DISCONNECTED:
            removeClient(num);
            break;
    case WStype_CONNECTED:
            IPAddress ip = webSocket.remoteIP(num);
            Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
            ClientsDetails* c = new ClientsDetails(num,ip);
            clients.add(c);
            break;
  }

}

void setup() {
  //Deifne output pins for Mux
  pinMode(MUX_A, OUTPUT);
  pinMode(MUX_B, OUTPUT);     
  pinMode(MUX_C, OUTPUT);  
  
  Serial.begin(115200);

  //Serial.setDebugOutput(true);
  Serial.setDebugOutput(true);

  Serial.println();

  for(uint8_t t = 4; t > 0; t--) {
    Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  const char* ssid     = "DHURAIRAJ";
  const char* password = "9884317582";

  WiFi.begin(ssid, password); 
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  webSocket.begin();
  
  // event handlers
  webSocket.onEvent(webSocketEvent);

}

void loop() {
  webSocket.loop();
  if(clients.size() == 1)
    execution(30000);
  else if(clients.size() > 1)
    execution(10000);
}
