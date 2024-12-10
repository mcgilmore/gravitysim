math.config({
	number: "bignumber",
	precision: 30,
});

const G = math.bignumber("6.67384e-11");
const scale = math.bignumber("1000000"); // 1 pixel = 1,000 km

let bodies = [];
let IDcount = 0;
let paused = false;
let trajectoryLimit = 100;

function calcDistance(b1, b2) {
	const dx = math.subtract(
		math.subset(b1.position, math.index(0)),
		math.subset(b2.position, math.index(0)),
	);
	const dy = math.subtract(
		math.subset(b1.position, math.index(1)),
		math.subset(b2.position, math.index(1)),
	);
	return math.sqrt(math.add(math.pow(dx, 2), math.pow(dy, 2)));
}

function calcTotalForce(b1, b2, distance) {
	if (math.smaller(distance, math.bignumber("1e-3"))) {
		return math.bignumber("0"); // Prevent extreme values due to small distances
	}
	return math.divide(
		math.multiply(G, math.multiply(b1.mass, b2.mass)),
		math.pow(distance, 2),
	);
}

function calcXForce(force, angle) {
	return math.multiply(math.cos(angle), force);
}

function calcYForce(force, angle) {
	return math.multiply(math.sin(angle), force);
}

function calcAngle(b1, b2) {
	const dx = math.subtract(
		math.subset(b2.position, math.index(0)),
		math.subset(b1.position, math.index(0)),
	);
	const dy = math.subtract(
		math.subset(b2.position, math.index(1)),
		math.subset(b1.position, math.index(1)),
	);
	return math.atan2(dy, dx);
}

function calcAcc(force, mass) {
	return math.divide(force, mass);
}

function body(radius, mass, x, y, hv, vv, ha, va) {
	this.radius = radius;
	this.mass = mass;
	this.position = math.matrix([x, y]);
	this.hvelocity = hv;
	this.vvelocity = vv;
	this.hacceleration = ha;
	this.vacceleration = va;
	this.colour = `hsl(${Math.random() * 360}, 100%, 50%)`;
	this.ID = IDcount++;
}

function draw(c, b) {
	const context = c.getContext("2d");
	console.log("Bodies to draw:", b);
	// Clear the canvas
	context.clearRect(0, 0, c.width, c.height);

	// Loop through bodies to draw them
	for (let i = 0; i < b.length; i++) {
		//console.log(`Drawing body ${i} at ${b[i].position}`);
		context.fillStyle = b[i].colour;
		context.beginPath();
		context.arc(
			math.divide(math.subset(b[i].position, math.index(0)), scale), // X position
			math.divide(math.subset(b[i].position, math.index(1)), scale), // Y position
			math.divide(b[i].radius, scale), // Radius
			0,
			2 * Math.PI,
		);
		context.fill();
	}
}

function collision(b1, b2) {
	const distance = calcDistance(b1, b2);
	return math.smallerEq(distance, math.add(b1.radius, b2.radius));
}

function mergeBodies(b1, b2) {
	console.log(`Merging Body ${b1.ID} and Body ${b2.ID}`);
	b2.merged = true;

	// Calculate new mass
	var newMass = math.add(b1.mass, b2.mass);

	// Calculate new position using the weighted average of the two positions based on mass
	var newX = math.divide(
		math.add(
			math.multiply(b1.mass, math.subset(b1.position, math.index(0))),
			math.multiply(b2.mass, math.subset(b2.position, math.index(0))),
		),
		newMass,
	);

	var newY = math.divide(
		math.add(
			math.multiply(b1.mass, math.subset(b1.position, math.index(1))),
			math.multiply(b2.mass, math.subset(b2.position, math.index(1))),
		),
		newMass,
	);

	// Calculate new velocity based on the conservation of momentum
	var newHVelocity = math.divide(
		math.add(
			math.multiply(b1.mass, b1.hvelocity),
			math.multiply(b2.mass, b2.hvelocity),
		),
		newMass,
	);

	var newVVelocity = math.divide(
		math.add(
			math.multiply(b1.mass, b1.vvelocity),
			math.multiply(b2.mass, b2.vvelocity),
		),
		newMass,
	);

	// Set new acceleration to the average of the two bodies, or 0 if not defined
	var newHAcceleration = math.divide(
		math.add(b1.hacceleration, b2.hacceleration),
		2,
	);
	var newVAcceleration = math.divide(
		math.add(b1.vacceleration, b2.vacceleration),
		2,
	);

	// Create a new body that represents the merged result
	var mergedBody = new body(
		b1.radius + b2.radius, // Merge the radii
		newMass,
		math.matrix([newX, newY]),
		newHVelocity, // Use the new horizontal velocity
		newVVelocity, // Use the new vertical velocity
		newHAcceleration, // Use the new horizontal acceleration
		newVAcceleration, // Use the new vertical acceleration
		(colour = `hsl(${Math.random() * 360}, 100%, 50%)`),
		(this.ID = IDcount++),
		(merged = false),
	);
	return mergedBody;
}

function simulation(canvas, bodies, steptime) {
	this.canvas = canvas;
	this.steptime = steptime;

	this.step = function () {
		if (!paused) {
			for (let i = 0; i < bodies.length; i++) {
				let totalXForce = math.bignumber("0");
				let totalYForce = math.bignumber("0");

				for (let j = 0; j < bodies.length; j++) {
					if (i !== j) {
						if (collision(bodies[i], bodies[j])) {
							console.log(`Merging Body ${i} and Body ${j}`);
							bodies[i] = mergeBodies(bodies[i], bodies[j]);
							break;
						} else {
							const distance = calcDistance(bodies[i], bodies[j]);
							const force = calcTotalForce(bodies[i], bodies[j], distance);
							const angle = calcAngle(bodies[i], bodies[j]);

							totalXForce = math.add(totalXForce, calcXForce(force, angle));
							totalYForce = math.add(totalYForce, calcYForce(force, angle));
						}
					}
				}

				const totalHAcc = calcAcc(totalXForce, bodies[i].mass);
				const totalVAcc = calcAcc(totalYForce, bodies[i].mass);

				// Update velocities
				bodies[i].hvelocity = math.add(
					bodies[i].hvelocity,
					math.multiply(totalHAcc, this.steptime),
				);
				bodies[i].vvelocity = math.add(
					bodies[i].vvelocity,
					math.multiply(totalVAcc, this.steptime),
				);

				// Update positions
				const dx = math.multiply(bodies[i].hvelocity, this.steptime);
				const dy = math.multiply(bodies[i].vvelocity, this.steptime);

				bodies[i].position.subset(
					math.index(0),
					math.add(math.subset(bodies[i].position, math.index(0)), dx),
				);
				bodies[i].position.subset(
					math.index(1),
					math.add(math.subset(bodies[i].position, math.index(1)), dy),
				);
			}

			// Remove merged bodies
			bodies = bodies.filter((body) => !body.merged);

			// Render the updated state
			draw(this.canvas, bodies);
		}
	};
}

function mainloop(sim) {
	try {
		sim.step();
	} catch (e) {
		console.error(e);
	}
	window.requestAnimationFrame(() => mainloop(sim));
}

window.onload = function () {
	const canvas = document.getElementById("canvas");
	canvas.width = 800;
	canvas.height = 800;

	canvas.addEventListener("mousedown", (event) => {
		// Get canvas position
		const rect = canvas.getBoundingClientRect();

		// Calculate the position relative to the canvas and apply scale
		const x = math.multiply(event.clientX - rect.left, scale);
		const y = math.multiply(event.clientY - rect.top, scale);

		// Add a new body
		const newBody = new body(
			math.bignumber("10000000"), // Radius
			math.bignumber("1e26"), // Mass
			x, // X position
			y, // Y position
			math.bignumber("0"), // Initial horizontal velocity
			math.bignumber("0"), // Initial vertical velocity
			math.bignumber("0"), // Initial horizontal acceleration
			math.bignumber("0"), // Initial vertical acceleration
		);

		bodies.push(newBody); // Add the body to the array
		console.log(`New body added at (${x}, ${y})`); // Debug log
		console.log(bodies);
	});

	// Add initial bodies
	const body1 = new body(
		math.bignumber("15000000"),
		math.bignumber("1e30"),
		math.bignumber("200000000"),
		math.bignumber("150000000"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	);
	const body2 = new body(
		math.bignumber("15000000"),
		math.bignumber("1.5e29"),
		math.bignumber("600000000"),
		math.bignumber("250000000"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	);

	bodies.push(body1, body2);

	// Start the simulation
	const sim = new simulation(canvas, bodies, 5);
	mainloop(sim);
};
