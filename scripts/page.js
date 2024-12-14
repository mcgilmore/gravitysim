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

	switch (action) {
		case "print":
			print();
			break;
		case "clear":
			clear();
			break;
		case "pause":
			pause();
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
