var sidebar = $(".sidebar");
var setting = $(".settings-component");

sidebar.hover(
	function () {
		$(this).find(".fa-cog").addClass("fa-spin");
	},
	function () {
		$(this).find(".fa-cog").removeClass("fa-spin");
	},
);

setting.on("click", function (e) {
	var node = $(e.currentTarget),
		action = node.data("action");

	switch (
		action //TODO: Add Solar system option which creates solar system in canvas
	) {
		case "print":
			print();
			break;
		case "clear":
			clear();
			break;
		case "pause":
			pause();
			break;
		case "solar":
			solarSystem();
			break;
		default:
			break;
	}
});

function print() {
	console.log(bodies);
}

function clear() {
	bodies = [];
	draw(canvas, bodies);
}

function pause() {
	paused = !paused;
	if (paused == false) {
		document.getElementById("settings-option").innerHTML = "Pause Simulation";
	} else {
		document.getElementById("settings-option").innerHTML = "Resume Simualtion";
	}
}

function solarSystem() {
	bodies = [];
	solarsystem.forEach((planet) => bodies.push(planet));
	setScale(math.bignumber("25000000"));
	offsetX = -400;
	offsetY = -400;
	//TODO:Set appropriate scale and position etc
	//draw(canvas, bodies);
}
