#include <Adafruit_AS7343.h>
#include <SoftWire.h>
#include <Wire.h>
#include "AS7343Soft.h"

//15 = SCL_pin A1, 17 = replacement SDA_pin, A3 on board
//SoftWire(SDA, SCL)
SoftWire REF(17, 15);
AS7343Soft sensor2(REF);
Adafruit_AS7343 sensor1;

//areas of memory to hold I2C messages, create 32 byte storage area
//rx is from sensor, tx is to sensor
uint8_t rxBuffer[32];
uint8_t txBuffer[32];
double blankOD;
double referenceOD;
uint16_t darkValue1; // LED off
uint16_t darkValue2; // LED off

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10); // Wait for Serial on native USB boards
  }

  //give memory to softwire
  REF.setRxBuffer(rxBuffer, 32);
  REF.setTxBuffer(txBuffer, 32);

  REF.setClock(50000);        //slower = more stable, I2C standard is 100kHz
  REF.setTimeout_ms(100);     //if SoftWire is slower than I2C for more than 100mili, give up instead of freezing forever
  REF.begin();

  if (!sensor1.begin()) {
    Serial.println("Could not find AS7343 sensor1!");
    exit(0);
  } 
  if (!sensor2.begin()) {
    //bool begin(uint8_t i2c_addr = 0x39, TwoWire *wire = &Wire);, thus, NEED a twowire (hardware based), need to override
    //begin will also configure sensor2
    Serial.println("Could not find AS7343 sensor2!");
    Serial.flush();
    while(1);
  }


  sensor1.setGain(AS7343_GAIN_64X);
  sensor1.setATIME(29);  // Integration cycles
  sensor1.setASTEP(599); // Step size

  uint16_t readings[18];
  //need to read all channels to first trigger the global reading, pulls data from memory bank after read starts
  if(!sensor1.readAllChannels(readings)) {
    Serial.println("Read failed!");
    delay(500);
    //shut down after 1
    exit(0);
  } 

  //accounts for enviroenemntal factors
  dark_od();
  //accounts for media factors
  blank_od();
  //initial point reference
  reference_od();

  Serial.println("Now collecting data");
  } 

void dark_od() {
  Serial.println("Now running value for dark");
  darkValue1 = run_sensor1();
  darkValue2 = run_sensor2();
  delay(1000);
}

void blank_od() {
  Serial.println("Now running for blank vial values");
  blankOD = ((double)run_sensor1() - darkValue1) / ((double)run_sensor2() - darkValue2);
}

void reference_od() {
  Serial.println("Now running for initial values");
  uint16_t total_sensor1 = 0;
  uint16_t total_sensor2 = 0;

  //take the mean of 10 values at the start
  for(uint8_t i = 0; i < 10; i++) {
    total_sensor1 += run_sensor1();
    total_sensor2 += run_sensor2();
  }

  referenceOD = ((total_sensor1/10.0) - darkValue1) / ((total_sensor2/10.0) - darkValue2);
  delay(1000);
}


void loop() {
  double nOD = (((double)run_sensor1() - darkValue1) / ((double)run_sensor2() - darkValue2) - blankOD) / (referenceOD - blankOD);
  Serial.print("Normalized OD value:  ");
  Serial.println(nOD, 10); //small value
  Serial.println("Rerun\n");

  delay(1000);
}

uint16_t run_sensor1() {
  //Manually command fresh reading cycle
  sensor1.startMeasurement();

  // Wait until hardware is ready
  //SLIGHT PROBLEM, IF RUNNING AND SUDDENLY STOPS WORKING ITLL BE IN INFINITE FREEZE
  while (!sensor1.dataReady()) {
    delay(1);
  }

  //for violet light, 405nm
  int FXL_value = sensor1.readChannel(AS7343_CHANNEL_FXL);

  Serial.print("FXL1:   ");
  Serial.println(FXL_value);
  return FXL_value;
}


uint16_t run_sensor2() {

  if (!sensor2.startMeasurement()) {
    Serial.println("startMeasurement failed");
    delay(100000);
  }

  while (!sensor2.dataReady()) {
    delay(1);
  }

  uint16_t fxlValue;

  if (sensor2.readLightFXL(fxlValue)) {
  Serial.print("FXL2:   ");
  Serial.println(fxlValue);
  return fxlValue;
  } 
  
  else {
  Serial.println("Could not read FXL");
  }
} 
