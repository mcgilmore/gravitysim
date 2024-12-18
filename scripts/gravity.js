math.config({
	number: "BigNumber",
	precision: 64,
});

const G = math.bignumber("6.67384e-11");
var scale = math.bignumber("1000000"); // 1 pixel = 1,000 km

//Simulation values
let bodies = [];
let paused = false;

//Dragging values
let isDragging = false;
let mouseDown = false;
let dragStartX = 0;
let dragStartY = 0;
let offsetX = 0;
let offsetY = 0;
let dragThreshold = 5; // Minimum distance to count as a drag
const scaleFactor = math.bignumber("50000"); //Zooming scaling factor

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
	this.merged = false;
}

function draw(c, b) { //TODO: speed up drawing by only including those in the view window
	scale = math.bignumber(scaleInput.value);
	const context = c.getContext("2d");
	context.clearRect(0, 0, c.width, c.height);
	for (const body of b) {
		context.fillStyle = body.colour;
		context.beginPath();
		context.arc(
			Number(math.divide(math.subset(body.position, math.index(0)), scale)) -
				offsetX, // X position
			Number(math.divide(math.subset(body.position, math.index(1)), scale)) -
				offsetY, // Y position
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
		math.bignumber(math.divide(1, 3)),
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
			math.multiply(b1.vvelocity, b1.mass),
			math.multiply(b2.vvelocity, b2.mass),
		),
		newMass,
	);
	const newVVelocity = math.divide(
		math.add(
			math.multiply(b1.hvelocity, b1.mass),
			math.multiply(b2.hvelocity, b2.mass),
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

// Function to update the scale on scrolling
function adjustScale(delta, cursorX, cursorY) {
	if (delta > 0) {
		// Zoom in
		scale = math.add(scale, scaleFactor);
	} else {
		// Zoom out
		scale = math.subtract(scale, scaleFactor);
	}

	document.getElementById("scaleInput").value = scale.toString(); //Set the scaleinput text as the new scale

	/*
	// Adjust the offset to zoom around the cursor position
	offsetX = math.subtract(
		offsetX,
		math.multiply(cursorX, math.subtract(scaleFactor, 1)),
	);
	offsetY = math.subtract(
		offsetY,
		math.multiply(cursorY, math.subtract(scaleFactor, 1)),
		);*/

	// Redraw the canvas with the updated scale
	draw(canvas, bodies);
}

function setScale(newScale) {
	scale = newScale;
	document.getElementById("scaleInput").value = scale.toString();
	draw(canvas, bodies);
}

function resizeCanvas() {
	canvas.width = window.innerWidth; // Set canvas width to viewport width
	canvas.height = window.innerHeight - 40; // Set canvas height to viewport height
	draw(canvas, bodies); // Redraw the canvas after resizing
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
	const footer = document.querySelector(".content-footer");

	resizeCanvas();

	window.addEventListener("resize", resizeCanvas);

	canvas.addEventListener("mousedown", (event) => {
		const rect = canvas.getBoundingClientRect();
		dragStartX = event.clientX - rect.left; // Store the initial drag position
		dragStartY = event.clientY - rect.top;
		mouseDown = true;
	});

	canvas.addEventListener("mousemove", (event) => {
		if (mouseDown) {
			const rect = canvas.getBoundingClientRect();
			const currentX = event.clientX - rect.left;
			const currentY = event.clientY - rect.top;

			// Check if mouse movement exceeds the drag threshold
			if (
				Math.abs(currentX - dragStartX) > dragThreshold ||
				Math.abs(currentY - dragStartY) > dragThreshold
			) {
				isDragging = true; // User is dragging
				offsetX -= currentX - dragStartX; // Update offset
				offsetY -= currentY - dragStartY;
				dragStartX = currentX; // Reset drag start point
				dragStartY = currentY;

				// Redraw the canvas with the updated offsets
				draw(canvas, bodies);
			}
		}
	});

	canvas.addEventListener("mouseup", (event) => {
		if (!isDragging) {
			// If no drag occurred, treat it as a click to add a body
			const rect = canvas.getBoundingClientRect();
			const x = math.multiply(event.clientX - rect.left + offsetX, scale); // Adjust by offset
			const y = math.multiply(event.clientY - rect.top + offsetY, scale);
			const mass = math.bignumber(massInput.value);
			const radius = math.bignumber(sizeInput.value);
			// Create a new body
			const newBody = new body(
				radius, // Radius
				mass, // Mass
				x, // X position
				y, // Y position
				math.bignumber("0"), // Initial horizontal velocity
				math.bignumber("0"), // Initial vertical velocity
				math.bignumber("0"), // Initial horizontal acceleration
				math.bignumber("0"), // Initial vertical acceleration
			);

			bodies.push(newBody);
			draw(canvas, bodies);
		}

		mouseDown = false;
		isDragging = false; // Reset dragging state
	});

	// Add wheel event listener to the canvas
	canvas.addEventListener("wheel", (event) => {
		event.preventDefault(); // Prevent the default scrolling behavior

		// Get the position of the mouse relative to the canvas
		const rect = canvas.getBoundingClientRect();
		const cursorX = event.clientX - rect.left;
		const cursorY = event.clientY - rect.top;

		// Adjust the scale and offset based on the scroll direction
		adjustScale(event.deltaY, cursorX, cursorY);
	});

	//Add some default bodies
	bodies.push(
		new body(
			math.bignumber("10000000"),
			math.bignumber("1e28"),
			math.bignumber("400000000"),
			math.bignumber("150000000"),
			math.bignumber("80000"),
			math.bignumber("0"),
			math.bignumber("0"),
			math.bignumber("0"),
		),
		new body(
			math.bignumber("15000000"),
			math.bignumber("1.5e28"),
			math.bignumber("600000000"),
			math.bignumber("250000000"),
			math.bignumber("-30000"),
			math.bignumber("0"),
			math.bignumber("0"),
			math.bignumber("0"),
		),
	);

	const sim = new simulation(canvas, 2); //One step = 2 seconds. At 60 Hz, one IRL second = 120 simulated seconds
	mainloop(sim);
};
