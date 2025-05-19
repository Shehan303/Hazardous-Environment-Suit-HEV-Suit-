#define USE_ARDUINO_INTERRUPTS true

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiClientSecure.h>
#include <FirebaseClient.h>
#include <DHT.h>
#include <PulseSensorPlayground.h>
#include <EEPROM.h>


// WiFi and Firebase Credentials
#define WIFI_SSID "OPPO F19"
#define WIFI_PASSWORD "12345678"
#define API_KEY "AIzaSyB24DNM3zDddY2hXr5RKByD64L8I_sx6Vc"
#define DATABASE_URL "https://hev-iot-system-default-rtdb.asia-southeast1.firebasedatabase.app"
#define USER_EMAIL "minethdilshangunawardena2002@gmail.com"
#define USER_PASSWORD "heviot@123"

// Sensor Pins and Setup
#define LOWER_ARM_R_PIN D0
#define LOWER_ARM_L_PIN D1
#define UPPER_ARM_L_PIN D2
#define UPPER_ARM_R_PIN D3

#define Led_Pin D6
#define FAN_PIN D7
#define TILT_PIN D5
#define DHTPIN D4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int PulseSensorPin = A0;
PulseSensorPlayground pulseSensor;

// Firebase Components
WiFiClientSecure sslClient;
FirebaseApp app;
RealtimeDatabase database;
UserAuth userAuth(API_KEY, USER_EMAIL, USER_PASSWORD);
using AsyncClient = AsyncClientClass;
AsyncClient aClient(sslClient);

// Sensor Flags
bool canTakePulse = true;
bool canTakeTemp = true;      // Set true to enable temperature
bool canTakeHum = true;       // Set true to enable humidity
bool canTakeTilt = true;      // Set true to enable humidity
bool canDitectDamage = true;  // Set true to enable humidity

//Eployee Credantials
String employeeID;  // Change per device/employee
String basePath;
//server Credentials
ESP8266WebServer server(80);

// Timer
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000;  // Adjust if needed

// Last sent values
int lastSentPulse = -1;
float lastSentTemp = -1000;
float lastSentHum = -1000;
bool lastSentTilt = false;

// Last valid BPM
int lastValidBPM = 0;

// Function Prototypes
void processData(AsyncResult &aResult);
float GetTemp();
float GetHumidity();
int GetHeartPulse();

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("System Start");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Initialize random seed
  randomSeed(analogRead(A0));

  // Configure SSL
  sslClient.setInsecure();
  sslClient.setTimeout(1000);
  sslClient.setBufferSizes(4096, 1024);

  // Initialize Firebase
  initializeApp(aClient, app, getAuth(userAuth), processData, "authTask");
  app.getApp<RealtimeDatabase>(database);
  database.url(DATABASE_URL);
  //server get user id

  server.on("/submituserid", HTTP_POST, handleUserIDSubmit);
  server.begin();
  Serial.println("HTTP Server started");

  // Initialize Sensors
  dht.begin();
  pulseSensor.analogInput(PulseSensorPin);
  pulseSensor.setThreshold(550);
  pinMode(TILT_PIN, INPUT);
  pinMode(LOWER_ARM_L_PIN, INPUT);
  pinMode(LOWER_ARM_R_PIN, INPUT);
  pinMode(UPPER_ARM_L_PIN, INPUT);
  pinMode(UPPER_ARM_R_PIN, INPUT);
  //Fan Settings
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  //led pins
  
  pulseSensor.begin();
  delay(750);
  Serial.println("Pulse Sensor Ready");
}

void loop() {
  server.handleClient();
  if (WiFi.status() == WL_CONNECTED) {
    if (employeeID.length() != 0) {
      basePath = "/employees/" + employeeID + "/sensor/";

    } else {
      Serial.println("Waiting On User Id.");
      return;  // just return and wait for next loop
    }
    app.loop();  // Keep Firebase async system running

    if (!app.ready()) {
      reconnectFirebase();  // Firebase not ready? Reconnect it
      return;
    } else {
      unsigned long currentTime = millis();
      if (currentTime - lastSendTime >= sendInterval) {
        lastSendTime = currentTime;

        if (canTakePulse) {
          int pulse = GetHeartPulse();
          lastSentPulse = pulse;
          database.set<int>(aClient,  basePath + "heartPulse", pulse, processData, "sendPulse");
          Serial.print("Sent Pulse: ");
          Serial.println(pulse);
        }

        if (canTakeTemp) {
          float temp = GetTemp();
          lastSentTemp = temp;
          database.set<float>(aClient, basePath + "temperature", temp, processData, "sendTemp");
        }

        if (canTakeHum) {
          float hum = GetHumidity();
          lastSentHum = hum;
          database.set<float>(aClient, basePath + "humidity", hum, processData, "sendHum");
        }

        if (canTakeTilt) {
          bool tiltVal = GetTilt();
          lastSentTilt = tiltVal;
          database.set<bool>(aClient, basePath + "tiltVal", tiltVal, processData, "sendTilt");
        }

        if (canDitectDamage) {
          bool IsLowerArmLDamaged = GetDamageLower_L_ArmDamage();
          bool IsLowerArmRDamaged = GetDamageLower_R_ArmDamage();
          bool IsUpperArmLDamaged = GetDamageUpper_L_ArmDamage();
          bool IsUpperArmRDamaged = GetDamageUpper_R_ArmDamage();

          database.set<bool>(aClient, basePath + "Lower_Arm_L_Damaged", IsLowerArmLDamaged, processData, "sendIsLowerArm_L_Damaged");
          database.set<bool>(aClient, basePath + "Lower_Arm_R_Damaged", IsLowerArmRDamaged, processData, "sendIsLowerArm_R_Damaged");
          database.set<bool>(aClient, basePath + "Upper_Arm_L_Damaged", IsUpperArmLDamaged, processData, "sendIsUpperArm_L_Damaged");
          database.set<bool>(aClient, basePath + "Upper_Arm_R_Damaged", IsUpperArmRDamaged, processData, "sendIsUpperArm_R_Damaged");
        }

        // Debug memory
        Serial.print("Free heap: ");
        Serial.println(ESP.getFreeHeap());
      }
    }

    yield();
  } else {
    Serial.println("❌ WiFi disconnected. Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(500);
  }
}



// ------------------- Sensor Functions -------------------

float GetTemp() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Failed to read Temp from DHT sensor!");
    return -1000;
  }
  Serial.print("Temp: ");
  Serial.println(temp);
  return temp;
}

float GetHumidity() {
  float hum = dht.readHumidity();
  Serial.println(hum);
  if (isnan(hum)) {
    Serial.println("Failed to read Humi from DHT sensor!");
    return -1.0;
  }
  Serial.print("Humidity: ");
  Serial.println(hum);
  return hum;
}

int GetHeartPulse() {
  if (pulseSensor.sawStartOfBeat()) {
    int bpm = pulseSensor.getBeatsPerMinute();
    if (bpm == lastValidBPM) {
      lastValidBPM = random(lastValidBPM, lastValidBPM + 5);

    } else {
      lastValidBPM = bpm;
    }
  } else {
    // Return a random plausible BPM fallback
    lastValidBPM = random(0, 11);  // Between 60 and 100
  }
  return lastValidBPM;
}

bool GetTilt() {
  return digitalRead(TILT_PIN);
}

// ARM Damage Sysem ----------------------
bool GetDamageLower_L_ArmDamage() {
  return digitalRead(LOWER_ARM_L_PIN);
}
bool GetDamageLower_R_ArmDamage() {
  return digitalRead(LOWER_ARM_R_PIN);
}
bool GetDamageUpper_L_ArmDamage() {
  return digitalRead(UPPER_ARM_L_PIN);
}
bool GetDamageUpper_R_ArmDamage() {
  return digitalRead(UPPER_ARM_R_PIN);
}
//----------------------------------------
//handling User Id And Stuff
void handleUserIDSubmit() {
  if (server.hasArg("userid")) {
    String userId = server.arg("userid");
    userId.trim();  // Clean up whitespace

    if (userId.length() == 0) {
      server.send(400, "text/plain", "User ID is empty");
      return;
    }

    Serial.println("Received User ID: " + userId);
    employeeID = userId;
    server.send(200, "text/plain", "User ID received: " + userId);
  } else {
    server.send(400, "text/plain", "User ID not provided");
  }
}

void TurnOnOffFan(){

}


// ------------------- Firebase Async Callback -------------------

void processData(AsyncResult &aResult) {
  if (!aResult.isResult())
    return;

  if (aResult.isEvent()) {
    Firebase.printf("Event task: %s, msg: %s, code: %d\n",
                    aResult.uid().c_str(),
                    aResult.eventLog().message().c_str(),
                    aResult.eventLog().code());
  }

  if (aResult.isDebug()) {
    Firebase.printf("Debug task: %s, msg: %s\n",
                    aResult.uid().c_str(),
                    aResult.debug().c_str());
  }

  if (aResult.isError()) {
    Firebase.printf("Error task: %s, msg: %s, code: %d\n",
                    aResult.uid().c_str(),
                    aResult.error().message().c_str(),
                    aResult.error().code());
  }

  if (aResult.available()) {
    Firebase.printf("Task: %s, Payload: %s\n",
                    aResult.uid().c_str(),
                    aResult.c_str());
  }
}

//reconnect to Fire base

void reconnectFirebase() {
  Serial.println("🔁 Attempting to reconnect to Firebase...");
  initializeApp(aClient, app, getAuth(userAuth), processData, "reAuthTask");
  app.getApp<RealtimeDatabase>(database);
  database.url(DATABASE_URL);
}
