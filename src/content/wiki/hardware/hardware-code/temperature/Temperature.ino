#include <PID_v1.h>
#include <DS18B20.h>

void TemperatureSetup();
void TemperatureUpdate();

#define TMP 10
#define HEATER 11

DS18B20 ds(TMP);
double currentTemp, heaterCommand;
double targetTemp = 45;
float Kp = 10;
float Ki = 0;
float Kd = 0;
PID tempPID(&currentTemp, &heaterCommand, &targetTemp, Kp, Ki, Kd, DIRECT);
int windowSize = 5000;
unsigned long windowStartTime;

void setup() {
  TemperatureSetup();
}

void loop() {
  TemperatureUpdate();
}

void TemperatureSetup() {
  pinMode(HEATER, OUTPUT);
  windowStartTime = millis();
  tempPID.SetOutputLimits(0, windowSize);
  tempPID.SetMode(AUTOMATIC);
}

float readTemperature() {
  return ds.getTempC();
}

void TemperatureUpdate() {
  currentTemp = (double)ds.getTempC();
  tempPID.Compute();
  unsigned long now = millis();
  if (now - windowStartTime > windowSize) {
    windowStartTime = millis();
  }
  if (heaterCommand > now - windowStartTime) digitalWrite(HEATER, HIGH);
  else digitalWrite(HEATER, LOW);
}
