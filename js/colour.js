function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}

function rgbToHex(rgb) {
	var r = rgb.r, g = rgb.g, b = rgb.b;
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function computeColours (resp) {
	for (var i in resp) {
    	//-(x-max)/(max-min)
    	var len = resp.length,
    		min = parseInt(resp[0].key[0]),
    		max = parseInt(resp[len-1].key[0])
        cof = -(parseInt(resp[i].key[0]) - max) /
        	  (max - min);
        colours.push(rgbToHex(HSVtoRGB(0.5*cof, 1., 1.)));
    }
}


var colours = [];
