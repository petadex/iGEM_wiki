#include <DS18B20.h>

DS18B20 ds(2);
unsigned long cycleStart;
int minutes = 0;

void setup() {
  Serial.begin(9600);
  cycleStart = millis();
  Serial.println("Start");
}

void loop() {
  if (millis() - cycleStart >= 600) {
    while (ds.selectNext()) {
      minutes++;
      Serial.print(minutes);
      Serial.print(": ");
      Serial.println(ds.getTempC());
      cycleStart = millis();
    }
  }
}
