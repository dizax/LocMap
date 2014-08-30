function printGeometry (coords) {
	for (var ind = 0; ind < coords.length-1; ind++) {
	    console.log(stringify(coords[ind][0]) + '\t' + stringify(coords[ind][1]));

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

function printPolygon() {
    printGeometry(dozotory.geometry.getCoordinates()[0]);
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
