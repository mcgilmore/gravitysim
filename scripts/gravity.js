//Physics constants and functions
var G = 6.675e-11
var objects = [];
var scale = 1000000; //One pixel = 1000km or 1000000m

function calcForce(mass1, mass2, distance)
{
    return ((G*mass1*scale*mass2*scale)/distance^2);
}

function calcDistance(o1, o2)
{
    return(Math.sqrt((o1.x + o2.x)^2 + (o1.y + o2.y)^2));
}

function calcAcc(force, mass)
{
    return (force/(mass*scale));
}

function calcAngle(o1, o2)
{
    var dX = o1.x - o2.x;
    var dY = o1.y - o2.y;
    return Math.atan2(dX, dY) * 180 / Math.PI;
}

function calcXforce(angle, force)
{
    return(Math.sin(angle) * force);
}

function calcYforce(angle, force)
{
    return(Math.cos(angle) * force);
}

//Other global values
var IDcount = 0;

function object(r, m, x, y, hv, vv, ha, va) //r = radius, m = mass, x = x coord, y = y coord, hv = horizontal velocity, vv = vertical velocity, ha = horizontal acceleration, va = vertical acceleration
{
    this.radius = r;
    this.mass = m;
    this.x = x;
    this.y = y;
    this.hvelocity = hv;
    this.vvelocity = vv;
    this.hacceleration = ha;
    this.vacceleration = va;
    this.colour = Please.make_color()[0];
    this.ID = IDcount;
    IDcount++;
}

function simulation(c, o, t) //c = canvas, o = objects, t = time between steps
{
    this.canvas = c;
    this.steptime = t;
    console.log("pants");
    console.log(o.length);
    console.log(objects.length);
    this.step = function(){ //use S = ut + 0.5at^2
        for (var i = 0; i<o.length; i++) {
          //Gravity force calcs
          for (var j = 0; j <o.length; j++) {
                var force = calcForce(o[j].mass, o[i].mass, calcDistance(o[j], o[i]));
                var forceX = calcXforce(calcAngle(o[i], o[j]), force);
                var forceY = calcYforce(calcAngle(o[i], o[j]), force);
                o[i].hacceleration += scale*calcAcc(forceX, o[i].mass);
                o[i].vacceleration += scale*calcAcc(forceY, o[i].mass);
                console.log(o[i].ID);
          }

          console.log("ID: " + o[i].ID + " Acceleration: " + o[i].hacceleration + " " + o[i].vacceleration)

          //Speed and displacement calcs
          var hvel = o[i].hvelocity;
          var vvel = o[i].vvelocity;
          var hacc = o[i].hacceleration;
          var vacc = o[i].vacceleration;

          //console.log("o.vvelocity: " + o[i].vvelocity + "vvel: " + vvel + "o.vacceleration: " + o[i].vacceleration)
          var hdistance = hvel*this.steptime + 0.5*hacc*(this.steptime^2);
          var vdistance = vvel*this.steptime + 0.5*vacc*(this.steptime^2);

          //console.log("Vdistance: " + vdistance + " Vacc: " + vacc)
          o[i].x += hdistance / scale;
          o[i].y += vdistance / scale;
        }

        //Draw function. Needs to be last
        draw(c, o);
    }
}

function draw(c, o) //C = canvas, o = objects (array)
{
    var context = c.getContext("2d");

    //Clear old stuff:
    context.clearRect(0, 0, c.width, c.height);

    //TODO: Colour handling or random colour generator
    //Loop through objects
    //console.log(o.length);
    for (var i = 0; i<o.length; i++) {
      //console.log("captain cabinets");
      //console.log("trapped in cabinets");
      context.fillStyle=o[i].colour;
      context.strokeStyle=o[i].colour;
      context.beginPath();
      context.arc(o[i].x, o[i].y, o[i].radius, 0, 2*Math.PI);
      context.lineWidth = 1;
      context.fill();
      context.stroke();
    }
}

function mainloop(sim) //sim = a simulation
{
    try {
      sim.step();
    } catch(e) {
      console.log("yolo swaggins");
      console.log(e);
    }

    window.requestAnimationFrame(function() {
      mainloop(sim);
    })
}

window.onload = function() {
    canvas = document.getElementById("canvas");
    //r, m, x, y, hv, vv, ha, va
    var testObject = new object(3, 30, 100, 101, 100, 100, 100000, 100000);
    var testObject2 = new object(10, 100, 500, 150, -50, -50, -100000, -100000);

    var testObjects = [testObject, testObject2];
    console.log(testObjects.length);
    //TODO: find a way to get mouse x and y from canvas click
    mainsim = new simulation(canvas, testObjects, 5);
    window.requestAnimationFrame(function() {
      mainloop(mainsim);
    });

}
