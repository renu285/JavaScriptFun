// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/urR596FsU68

var Engine = Matter.Engine,
  World = Matter.World,
  Bodies = Matter.Bodies;

var engine;
var boxy;
var Rect;
var TestCircle;
var ground;
var platform;
var Circles = [];
var CurrentAngle = 0;
var SETPOINT_x;
var StartPID = false;
var Stopper_left;
var CurrentTime;
var PreviousTime;
var ElapsedTime;
var lastError;
var cumulativeError;
let slider;

function mouseDragged() {
  Circles.push(new Circle(mouseX, mouseY, random(10, 30)));
}

function mouseClicked() {
  //Circles.push(new Circle(mouseX, mouseY, 50));
  StartPID = true;
  console.log(mouseX, mouseY)
}

function keyPressed() {
  console.log(keyIsPressed);
  if (keyCode === LEFT_ARROW) {
    CurrentAngle = -5;
    platform.Rotate(CurrentAngle);
  }
  if (keyCode === RIGHT_ARROW) {
    if (keyIsPressed) {
      CurrentAngle = 5;
      platform.Rotate(CurrentAngle);
    }
  }
}

function CalculateError() {
  var error = SETPOINT_x - TestCircle.getXPosition();
  return error;
}


function setup() {
  createCanvas(800, 800);
  engine = Engine.create();
  world = engine.world;

  //Engine.run(engine);
  ground = new Ground(width / 2, height - 10, width, 20)
  platform = new Platform(width / 2, height / 2, 690, 30);
  TestCircle = new Circle(149, 329, 60);
  SETPOINT_x = width / 2;
  lastError = 0;
  cumulativeError = 0;
  PreviousTime = 0;
}

function draw() {
  background(200);
  ground.show();
  TestCircle.show();
  platform.show();

  if (StartPID) {
    var error = CalculateError();
    CurrentTime = millis();
    chart.data.labels.push(CurrentTime);
    chart.data.datasets[0].data.push(TestCircle.getXPosition())
    chart.data.datasets[1].data.push(SETPOINT_x)
    //chart.data.datasets.forEach((dataset) => {
    //dataset.data.push(TestCircle.getXPosition());
    //});
    chart.update();



    ElapsedTime = CurrentTime - PreviousTime;

    var rateError = (error - lastError)/ElapsedTime;
    cumulativeError += (error / ElapsedTime );
    var Offset;
    Offset = (0.019 * error) + (25 * rateError) + (0.000 * cumulativeError);
    CurrentAngle = Offset;
    console.log(cumulativeError/100000)
    textSize(32);
    var ErrorText = "Error :".concat(error.toFixed(2).toString());
    var Angle = "Angle :".concat(CurrentAngle.toFixed(2).toString());
    text(ErrorText, 10, 30);
    text(Angle, 500, 30);
    platform.Rotate(CurrentAngle);
    PreviousTime = CurrentTime;
    lastError = error;
  }

  var i = 0
  for (i = 0; i < Circles.length; i++) {
    Circles[i].show()
  }
  Engine.update(engine);
  //CurrentAngle += 0.04;
  //platform.SetAngle(CurrentAngle);
}
