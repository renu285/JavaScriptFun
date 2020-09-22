function Circle(x, y, d) {
  this.body = Bodies.circle(x, y, d / 2)
  this.position = this.body.position;
  var options = {
    friction: 0.0,
  };
  World.add(engine.world, this.body, options);
  //Matter.Body.setMass(this.body,10);
  this.diameter = d
  this.x = x;
  this.y = y;

  this.show = function() {
    fill('#000099')
    circle(this.position.x, this.position.y, this.diameter);
  }

  this.getXPosition = function(){
    return this.position.x;
  }


}


function Platform(x, y, w, h, InitiaAngle = 0) {
  var options = {
    isStatic: true
  };
  this.body = Bodies.rectangle(x, y, w, h,options);
  this.position = this.body.position;
  World.add(engine.world, this.body);
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.angle = InitiaAngle
  this.CurrentAngle = 0
  this.show = function() {
    push();
    rectMode(CENTER);
    fill('#660033')
    translate(this.position.x, this.position.y)
    angleMode(RADIANS);
    rotate(this.body.angle);
    rect(0, 0, this.w, this.h);
    pop();
  }

  this.GetVertices = function(){
    return this.body.vertices;
  }
  this.SetAngle = function(angle) {
      //Matter.Body.translate(this.body,{x: this.position.x, y: this.position.y})
      Matter.Body.setAngle( this.body, angle * (Math.PI / 180))
      //Matter.Body.setAngle(this.body, (this.CurrentAngle) / 180 * Math.PI)
      this.angle = angle;

  }
  this.Rotate = function(angle) {
      //Matter.Body.translate(this.body,{x: this.position.x, y: this.position.y})
      var CurrentAngle = this.body.angle * (180/Math.PI);
      if((CurrentAngle + angle) >= -20 && (CurrentAngle + angle) <= 20){
        Matter.Body.rotate( this.body, angle * (Math.PI / 180))
        //Matter.Body.setAngle(this.body, (this.CurrentAngle) / 180 * Math.PI)
        this.angle = angle;
      }

  }

}


function Box(x, y, w, h) {
  this.body = Bodies.rectangle(x, y, w, h);
  this.position = this.body.position;
  var options = {
    friction: 0.3,
    restitution: 0.8
  };
  this.body.density = 0.5
  World.add(engine.world, this.body, options);
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.show = function() {
    var angle = this.body.angle;
    push();
    rectMode(CENTER);
    fill('#660033')
    rotate(angle);
    rect(this.position.x, this.position.y, this.w, this.h);
    pop();
  }
}

function Ground(x, y, w, h) {
  var options = {
    isStatic: true,
    restitution: 0
  };
  this.body = Bodies.rectangle(x, y, w, h, options);
  this.position = this.body.position;
  World.add(engine.world, this.body);
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.show = function() {
    fill('#8B4513')
    var Angle = this.body.angle;
    rectMode(CENTER);
    rect(this.position.x, this.position.y, this.w, this.h);
  }
}
