class Pump {
  private:
    int pin;
  public:
    Pump(int p) : pin(p) { pinMode(pin, OUTPUT); }
    void setSpeed(int pwmValue) { analogWrite(pin, constrain(pwmValue, 0, 255)); }
    void setSpeedPercent(int percent) { setSpeed(map(constrain(percent, 0, 100), 0, 100, 0, 255)); }
    void stop() { analogWrite(pin, 0); }
};

Pump myPump(3);


void setup() {
  myPump.setSpeedPercent(100);  // run pump at _% speed
  delay(90000);                  // run for _ seconds

  myPump.stop();                // turn pump off
}

void loop() {

}
