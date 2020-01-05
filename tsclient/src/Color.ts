export function get_random_color() {

	const colors = get_named_colors_full()
	const num_colors = Object.entries(colors).length
	const rand_index = Math.floor(Math.random()*num_colors)
	return Object.entries(colors)[rand_index]
}

// tasty copy pasta stack overflow
export function get_random_color_old() {
	function c() {
		var hex = Math.floor(Math.random() * 256).toString(16);
		return ("0" + String(hex)).substr(-2); // pad with zero
	}
	return "#" + c() + c() + c();
}

//modified from crs or something
export function get_named_colors_full() {
	var colors = {
	  aqua:    '#7fdbff',
	  blue:    '#0074d9',
	  lime:    '#01ff70',
	  teal:    '#39cccc',
	  olive:   '#3d9970',
	  green:   '#2ecc40',
	  red:     '#ff4136',
	  orange:  '#ff851b',
	  purple:  '#b10dc9',
	  yellow:  '#ffdc00',
	  fuchsia: '#f012be',
	  gray:    '#aaaaaa',
	  white:   '#ffffff',
	}

	return colors
}