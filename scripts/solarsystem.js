let solarsystem = [];

solarsystem.push(
	new body( //Sun
		math.bignumber("696340000"), //radius
		math.bignumber("1.989e30"), //mass
		math.bignumber("0"), //x position
		math.bignumber("0"), //y position
		math.bignumber("0"), //horizontal velocity
		math.bignumber("0"), //vertical velocity
		math.bignumber("0"), //horizonal acceleration
		math.bignumber("0"), //vertical acceleration
	),
	new body( //Mercury
		math.bignumber("2439700"),
		math.bignumber("3.285e23"),
		math.bignumber("42618005045.094246"),
		math.bignumber("-23611337175.10064"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Venus
		math.bignumber("6051800"),
		math.bignumber("4.867e24"),
		math.bignumber("-94453420451.61052"),
		math.bignumber("-50415660458.79269"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Earth
		math.bignumber("6378000"),
		math.bignumber("5.972e24"),
		math.bignumber("-8846271055.247765"),
		math.bignumber("-134808364536.85081"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Mars
		math.bignumber("3389500"),
		math.bignumber("6.39e23"),
		math.bignumber("51603766530.89686"),
		math.bignumber("-211753594760.40143"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Jupiter
		math.bignumber("69911000"),
		math.bignumber("1.898e27"),
		math.bignumber("-11169392836015.922"),
		math.bignumber("1590841940824.0442"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Saturn
		math.bignumber("58232000"),
		math.bignumber("5.683e26"),
		math.bignumber("137551230393.09195"),
		math.bignumber("7659528957364.193"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Uranus
		math.bignumber("25362000"),
		math.bignumber("8.681e25"),
		math.bignumber("-1667812359573.2205"),
		math.bignumber("-2210183670308.837"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	new body( //Neptune
		math.bignumber("24622000"),
		math.bignumber("1.024e26"),
		math.bignumber("-4469888278738.693"),
		math.bignumber("52900640326.89297"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
		math.bignumber("0"),
	),
	//Pluto is not a planet
);
