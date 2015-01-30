var mkad =  [
	[55.774558, 37.842762],
	[55.730482, 37.840175],
	[55.604956, 37.758725],
	[55.585143, 37.555732],
	[55.67994, 37.418712],
	[55.814629, 37.390397],
	[55.910907, 37.575531]
];


function computeTargetObjectsInsidePoly() {
    targetObjects.removeAll();

    for (var i = 0; i < sortedUse.length; i++) {
        targetObjects.add(allObjects[sortedUse[i][1]]);
        if (dozotory.geometry.contains( allObjects[sortedUse[i][1]].geometry.getCoordinates() )) {
            allObjects[sortedUse[i][1]].options.set('visible', true);
            insidePolyInds.push([sortedUse[i][1], sortedUse[i][0]]);
        } else
            allObjects[sortedUse[i][1]].options.set('visible', false);
    }
}

function updateTempPoly() {
    var newPolyGeom = dozotory.geometry.getCoordinates()[0];
    var o_l = oldPolyGeom.length-1,
        n_l = newPolyGeom.length-1;

    tmpPolyPlus = []; tmpPolyMinus = [];
    if (oldPolyGeom.length > newPolyGeom.length) {
        console.log("minus");
        for (var i =0; i < n_l; i++) {
            if (!equals(oldPolyGeom[i], newPolyGeom[i])) {
                tmpPolyMinus = [toDec(oldPolyGeom[(i-1+o_l)%o_l]), toDec(oldPolyGeom[i%o_l]), toDec(oldPolyGeom[(i+1)%o_l])];
                tmpPolyPlus = [toDec(oldPolyGeom[(i)%o_l]), toDec(oldPolyGeom[(i)%o_l]), toDec(oldPolyGeom[(i)%o_l])];
                break;
            }
        }
    } else if (oldPolyGeom.length < newPolyGeom.length) {
        console.log("plus");
        for (var i =0; i < o_l; i++) {
            if (!equals(oldPolyGeom[i], newPolyGeom[i])) {
                tmpPolyMinus = [toDec(oldPolyGeom[(i)%o_l]), toDec(oldPolyGeom[(i)%o_l]), toDec(oldPolyGeom[(i)%o_l])];
                tmpPolyPlus = [toDec(newPolyGeom[(i-1+n_l)%n_l]), toDec(newPolyGeom[i%n_l]), toDec(newPolyGeom[(i+1)%n_l])];
                break;
            }
        }
    } else {
        console.log("move");
        for (var i =0; i < o_l; i++) {
            if (!equals(oldPolyGeom[i], newPolyGeom[i])) {
                tmpPolyMinus = [toDec(oldPolyGeom[(i-1+o_l)%o_l]), toDec(oldPolyGeom[i%o_l]), toDec(oldPolyGeom[(i+1)%o_l])];
                tmpPolyPlus = [toDec(newPolyGeom[(i-1+n_l)%n_l]), toDec(newPolyGeom[i%n_l]), toDec(newPolyGeom[(i+1)%n_l])];
                break;
            }
        }
    }

    /*oldPolyGeom = [];*/ oldPolyGeom = newPolyGeom;
}

function updateTargetObjectsAfterPolyChange() {
    // filteredpoints inside tmPolys
    var insideTmpPolyInds = [], tmpDec;
    for (var i = 0; i < sortedUse.length; i++) {
        tmpDec = toDec(allObjects[sortedUse[i][1]].geometry.getCoordinates());
        if (polyContains( tmpPolyMinus, tmpDec ) || polyContains( tmpPolyPlus, tmpDec ))
            insideTmpPolyInds.push([sortedUse[i][1], sortedUse[i][0]]);
    }

    // remove filteredpoints out of tmpPoly&poly intersection
    for (var i = 0; i < insideTmpPolyInds.length; i++) {
        if (dozotory.geometry.contains( allObjects[insideTmpPolyInds[i][0]].geometry.getCoordinates() )) {
            insertInd(insidePolyInds, insideTmpPolyInds[i]);

            if (filterInds.indexOf(insideTmpPolyInds[i][0]) > -1)
                allObjects[insideTmpPolyInds[i][0]].options.set('visible', true);
        } else {
            removeInd(insidePolyInds, insideTmpPolyInds[i]);

            if (filterInds.indexOf(insideTmpPolyInds[i][0]) > -1)
                allObjects[insideTmpPolyInds[i][0]].options.set('visible', false);
        }
    }
}

function updateTargetObjectsAfterFilter() {
    for (var i = 0; i < insidePolyInds.length; i++) {
    	allObjects[insidePolyInds[i][0]].options.set('visible', false);
        if (filterInds.indexOf( insidePolyInds[i][0] ) > -1)  {
            allObjects[insidePolyInds[i][0]].options.set('visible', true);
        }
    }
}


///////////////// check if point is in triangle////
function polyContains(poly, point) {
	var norm, vals = 0;

	for (var i = 0; i < 3; i++) {
		norm = surfaceNorm(poly[i], poly[(i+1)%3]);
		vals += surfaceVal(norm, point);
	}

	return ((vals == 3 || vals == -3) ? true : false);
}

function surfaceNorm(p1, p2) {
	return [p1[1]*p2[2]-p1[2]*p2[1],
			-p1[0]*p2[2]+p1[2]*p2[0],
			p1[0]*p2[1]-p1[1]*p2[0]];
}

function surfaceVal(norm, p) {
	var val = norm[0]*p[0] + norm[1]*p[1] + norm[2]*p[2];
	if (val > 0)
		return 1;
	else if (val < 0)
		return -1;
	else 
		return 0;
}

function toDec(p) {
	var cos2 = Math.cos(p[1]/180.*Math.PI);
	return [ cos2*Math.cos(p[0]/180.*Math.PI), cos2*Math.sin(p[0]/180.*Math.PI), Math.sin(p[1]/180.*Math.PI) ];
}
///////////////////////////////////////////////////


function equals(arr1, arr2) {
    for (var i = 0; i < 2; i++) {
        if (arr1[i] != arr2[i]) { 
            return false;   
        }           
    }       
    return true;
}

function removeInd(arr, el) {
	for (var i = 0; i < arr.length; i++) {
        if (arr[i][0] === el[0]) {
            arr.splice(i, 1);
            return;
        }
    }
}

function insertInd(arr, el) {
	for (var i = 0; i < arr.length; i++) {
        if (arr[i][1] > el[1]) {
            arr.splice(i, 0, el);
            return;
        }
    }
}

////////////////////////////////////////////////


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
