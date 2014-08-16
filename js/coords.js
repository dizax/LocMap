function printGeometry (coords) {
	for (var ind in coords) {
	    console.log('Координаты: ' + stringify(coords[ind]));

	    function stringify (coords) {
	        var res = '';
	        if ($.isArray(coords)) {
	            res = '[ ';
	            for (var i = 0, l = coords.length; i < l; i++) {
	               if (i > 0) {
	                    res += ', ';
	                }
	                res += stringify(coords[i]);
	            }
	            res += ' ]';
	        } else if (typeof coords == 'number') {
	            res = coords.toPrecision(6);
	        } else if (coords.toString) {
	            res = coords.toString();
	        }

	        return res;
	    }
	}
}

var mkad =  [
[55.774558, 37.842762],
[55.730482, 37.840175],
[55.604956, 37.758725],
[55.585143, 37.555732],
[55.67994, 37.418712],
[55.814629, 37.390397],
[55.910907, 37.575531]
];
