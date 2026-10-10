

#include <Adafruit_AS7343.h>
#include <SoftWire.h>
#include <Wire.h>
#include "AS7343Soft.h"

//16 = SCL_pin A1, 17 = replacement SDA_pin, A3 on board
//SoftWire(SDA, SCL)
SoftWire REF(16, 17);
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
uint8_t spectro;
float a = 0, b = 0, c = 0;


void setup() {
  
Serial.begin(115200);
pinMode(9, OUTPUT);
digitalWrite(9, HIGH);

  //give memory to softwire
  REF.setRxBuffer(rxBuffer, 32);
  REF.setTxBuffer(txBuffer, 32);

  REF.setClock(50000);        //slower = more stable, I2C standard is 100kHz
  REF.setTimeout_ms(100);     //if SoftWire is slower than I2C for more than 100mili, give up instead of freezing forever
  REF.begin();

  if (!sensor1.begin()) {
    Serial.println("Could not find AS7343 sensor1!");
       Serial.flush();
           while(1);
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
  //spectrophotomer calculation

  Serial.println("Enter 1 if you would like to run the spectrophotometer version, else press any other button");
  while(Serial.available() == 0) {

  }
  spectro = Serial.parseInt();
  if(spectro == 1)
    LoBF();

  Serial.println("Now collecting data");
  } 

void dark_od() {
  Serial.println("Now running value for dark, press a character to collect");
  while (Serial.available() == 0) { //wait for user to input 
    Serial.print(" ");
  }
  //available returns number of bytes arriving to computer
  while (Serial.available() != 0) {
    Serial.read(); // Read and throw away the data
    Serial.println(Serial.available());

  }

  uint16_t total_sensor1 = 0;
  uint16_t total_sensor2 = 0;

  //take the mean of 10 values at the start
  for(uint8_t i = 0; i < 10; i++) {
    total_sensor1 += run_sensor1();
    total_sensor2 += run_sensor2();
  }

  Serial.println("Values:"); 
  Serial.println(darkValue1);
  Serial.println(darkValue2);
    delay(1000);
}

void blank_od() {
  Serial.println("Now running for blank vial values, press a character to collect");
  Serial.println(Serial.available());
  while (Serial.available() == 0) { //wait for user to input 
      Serial.print(" ");

  }
  //available returns number of bytes arriving to computer
  while (Serial.available() != 0) {
    Serial.read(); // Read and throw away the data
  }

  uint16_t total_sensor1 = 0;
  uint16_t total_sensor2 = 0;

  //take the mean of 10 values at the start
  for(uint8_t i = 0; i < 10; i++) {
    total_sensor1 += run_sensor1();
    total_sensor2 += run_sensor2();
  }


  blankOD = ((total_sensor1/10.0) - darkValue1) / ((total_sensor2/10.0) - darkValue2);
  Serial.println(blankOD);
  delay(1000);
}

void reference_od() {
  Serial.println("Now running for initial values, press a character to collect");
  while (Serial.available() == 0) { //wait for user to input 
      Serial.print(" ");
  }
  //available returns number of bytes arriving to computer
  while (Serial.available() > 0) {
    Serial.println(Serial.read()); // Read and throw away the data
  }

  uint32_t total_sensor1 = 0;
  uint32_t total_sensor2 = 0;

  //take the mean of 10 values at the start
  for(uint8_t i = 0; i < 10; i++) {
    total_sensor1 += run_sensor1();
    total_sensor2 += run_sensor2();
  }

  referenceOD = ((total_sensor1/10.0) - darkValue1) / ((total_sensor2/10.0) - darkValue2);
  Serial.println(referenceOD);
  delay(1000);
}


void loop() {

  double s1 = (double)run_sensor1();
  double s2 = (double)run_sensor2();

  double ratio = (s1 - darkValue1) / (s2 - darkValue2);

  // Your existing linear-normalized index
  double nOD = (ratio - blankOD) / (referenceOD - blankOD);

  // Bonus: actual log-based OD600??
  double OD600 = -log10(ratio / blankOD);
   while (Serial.available() == 0) { //wait for user to input 
  }
  if(spectro == 1) {
    Serial.print("Spectrophotometer reading");
    Serial.println(a * (nOD)*(nOD) + b * nOD + c);
  }

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

void LoBF() {
  //OD true is on the y axis
  float x[3];
  float y[3];
  double s1, s2, ratio, nOD;

  for(int i = 1; i < 4; i++) {
  Serial.println("Read value from spectrophotometer and input OD600. Place solution into vial and press a character");
  while (Serial.available() == 0) { //wait for user to input 
  }

    y[i-1] = Serial.parseInt();
    double s1 = (double)run_sensor1();
    double s2 = (double)run_sensor2();

    double ratio = (s1 - darkValue1) / (s2 - darkValue2);
    x[i] = (ratio - blankOD) / (referenceOD - blankOD);
  }

  // Main Determinant calculation
  double D = x[0]*x[0] * (x[1] - x[2]) + x[1]*x[1] * (x[2] - x[0]) + x[2]*x[2] * (x[0] - x[1]);
  
  if (abs(D) < 0.000001) {
    Serial.println("Error: Cannot calculate. Ensure X values are different.");
  } else {
    // Math to solve for coefficients
    float Da = y[0] * (x[1] - x[2]) + y[1] * (x[2] - x[0]) + y[2] * (x[0] - x[1]);
    float Db = x[0]*x[0] * (y[1] - y[2]) + x[1]*x[1] * (y[2] - y[0]) + x[2]*x[2] * (y[0] - y[1]);
    float Dc = x[0]*x[0] * (x[1]*y[2] - x[2]*y[1]) + x[1]*x[1] * (x[2]*y[0] - x[0]*y[2]) + x[2]*x[2] * (x[0]*y[1] - x[1]*y[0]);

    a = Da / D;
    b = Db / D;
    c = Dc / D;

    // Print the finalized formula
    Serial.println("Your Quadratic Equation:");
    Serial.print("y = ("); Serial.print(a, 4); Serial.print(")x^2 + (");
    Serial.print(b, 4); Serial.print(")x + ("); Serial.print(c, 4); Serial.println(")");
  }
}
