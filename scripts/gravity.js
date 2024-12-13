math.config({
	number: "BigNumber",
	precision: 30,
});

const G = math.bignumber("6.67384e-11");
const scale = math.bignumber("1000000"); // 1 pixel = 1,000 km

let bodies = [];
let IDcount = 0;
let paused = false;

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
	this.merged = false;
}

function draw(c, b) {
	const context = c.getContext("2d");
	context.clearRect(0, 0, c.width, c.height);
	for (const body of b) {
		context.fillStyle = body.colour;
		context.beginPath();
		context.arc(
			Number(math.divide(math.subset(body.position, math.index(0)), scale)), // X position
			Number(math.divide(math.subset(body.position, math.index(1)), scale)), // Y position
			Number(math.divide(body.radius, scale)), // Radius
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
	const newRadius = math.pow(
		math.add(math.pow(b1.radius, 3), math.pow(b2.radius, 3)),
		math.divide(1, 3),
	);
	const newMass = math.add(b1.mass, b2.mass);
	const newX = math.divide(
		math.add(
			math.multiply(b1.mass, math.subset(b1.position, math.index(0))),
			math.multiply(b2.mass, math.subset(b2.position, math.index(0))),
		),
		newMass,
	);
	const newY = math.divide(
		math.add(
			math.multiply(b1.mass, math.subset(b1.position, math.index(1))),
			math.multiply(b2.mass, math.subset(b2.position, math.index(1))),
		),
		newMass,
	);
	const newHVelocity = math.divide(
		math.add(
			math.multiply(b1.mass, b1.hvelocity),
			math.multiply(b2.mass, b2.hvelocity),
		),
		newMass,
	);
	const newVVelocity = math.divide(
		math.add(
			math.multiply(b1.mass, b1.vvelocity),
			math.multiply(b2.mass, b2.vvelocity),
		),
		newMass,
	);

	return new body(
		newRadius,
		newMass,
		newX,
		newY,
		newHVelocity,
		newVVelocity,
		math.bignumber("0"),
		math.bignumber("0"),
	);
}

function simulation(canvas, steptime) {
	this.canvas = canvas;
	this.steptime = steptime;

	this.step = function () {
		if (!paused) {
			for (let i = 0; i < bodies.length; i++) {
				if (bodies[i].merged) continue;

				let totalXForce = math.bignumber("0");
				let totalYForce = math.bignumber("0");

				for (let j = 0; j < bodies.length; j++) {
					if (i !== j && !bodies[j].merged) {
						if (collision(bodies[i], bodies[j])) {
							bodies.push(mergeBodies(bodies[i], bodies[j]));
							bodies[j].merged = true;
							bodies[i].merged = true;
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

				if (!bodies[i].merged) {
					const totalHAcc = calcAcc(totalXForce, bodies[i].mass);
					const totalVAcc = calcAcc(totalYForce, bodies[i].mass);

					bodies[i].hvelocity = math.add(
						bodies[i].hvelocity,
						math.multiply(totalHAcc, this.steptime),
					);
					bodies[i].vvelocity = math.add(
						bodies[i].vvelocity,
						math.multiply(totalVAcc, this.steptime),
					);

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
			}
			bodies = bodies.filter((b) => !b.merged);
			draw(this.canvas, bodies);
		}
	};
}

function mainloop(sim) {
	sim.step();
	requestAnimationFrame(() => mainloop(sim));
}

window.onload = function () {
	const canvas = document.getElementById("canvas");
	canvas.width = 800;
	canvas.height = 600;

	canvas.addEventListener("mousedown", (event) => {
		const rect = canvas.getBoundingClientRect();
		const x = math.multiply(event.clientX - rect.left, scale);
		const y = math.multiply(event.clientY - rect.top, scale);

		// Create a new body
		const newBody = new body(
			math.bignumber("20000000"), // Radius
			math.bignumber("1e30"), // Mass
			x, // X position
			y, // Y position
			math.bignumber("0"), // Initial horizontal velocity
			math.bignumber("0"), // Initial vertical velocity
			math.bignumber("0"), // Initial horizontal acceleration
			math.bignumber("0"), // Initial vertical acceleration
		);

		// Add the body to the array
		bodies.push(newBody);
		draw(canvas, bodies);
	});

	bodies.push(
		new body(
			math.bignumber("15000000"),
			math.bignumber("1e30"),
			math.bignumber("200000000"),
			math.bignumber("150000000"),
			math.bignumber("0"),
			math.bignumber("0"),
			math.bignumber("0"),
			math.bignumber("0"),
		),
		new body(
			math.bignumber("15000000"),
			math.bignumber("1.5e30"),
			math.bignumber("600000000"),
			math.bignumber("250000000"),
			math.bignumber("0"),
			math.bignumber("0"),
			math.bignumber("0"),
			math.bignumber("0"),
		),
	);

	const sim = new simulation(canvas, 5);
	mainloop(sim);
};
