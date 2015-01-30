var colours = [],
    sortedUse = [];


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

function computeColours (response) {
    for (var i in response) {
        sortedUse.push([response[i][0], response[i][1]-1]);
        colours.push(0);
    }
    sortedUse.sort(function (a, b) {return a[0]-b[0]});

    var uniques = [sortedUse[0][0]],
        cur, cof;

    for (var i = 1; i < sortedUse.length; i++) {
        cur = sortedUse[i][0];
        if (uniques[uniques.length-1] != cur)
            uniques.push(cur);
    }
    var max = uniques.length-1;

    cur = 0;
    for (var i in sortedUse) {
        if (sortedUse[i][0] != uniques[cur])
            cur++;
        cof = (max-cur) / max;
        colours[sortedUse[i][1]] = rgbToHex(HSVtoRGB(0.5*cof, 1., 1.));
    }
}
