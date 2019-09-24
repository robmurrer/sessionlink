// tasty copy pasta stack overflow
export function get_random_color() {
	function c() {
		var hex = Math.floor(Math.random() * 256).toString(16);
		return ("0" + String(hex)).substr(-2); // pad with zero
	}
	return "#" + c() + c() + c();
}



