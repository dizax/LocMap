var myMap,
    dozotory,
    allObjects = [],
    filterInds = [],
    targetObjects,
    files = [],
    loaded = false;

ymaps.ready(init)
    .then(function() {
        fetch(true);
        populateLeagueList();
        leagueChanged()
    });

function init() {
    // create map ///////////////////////////////////
    myMap = new ymaps.Map('map', {
        center: [55.734046, 37.588628],
        zoom: 9,
        controls: ['zoomControl', 'typeSelector', 'geolocationControl', 'rulerControl']
    });

    // create controls /////////////////////////////////
    var mySearchControl = new ymaps.control.SearchControl({
        options: {
            provider: new CustomSearchProvider()
    }});

    myMap.controls.add(mySearchControl);

    /*button3 = new ymaps.control.Button("Save Polygon");
    button3.options.set('selectOnClick', false);
    button3.events.add('click', saveDozPoints);
    myMap.controls.add(button3, {float: 'right'});*/

	// initializing variables ////////////////////////
    // create bounds
    dozotory = new ymaps.Polygon([
        mkad
    ], {
    }, {
        editorDrawingCursor: "crosshair",
        editorMaxPoints: 8,
        fillColor: '#6699ff',
        // Делаем полигон прозрачным для событий карты.
        interactivityModel: 'default#transparent',
        strokeWidth: 2,
        opacity: 0.2
    });

    dozotory.events.add('geometrychange', function(event) {
        // wait editor to finish
        dozotory.editor.getModel().then(updateTargetObjects);
    });

    // create visible objects group
    targetObjects = new ymaps.GeoObjectCollection();

    console.log("map initialized");
}

//init END ///////////////////////////////////////////

function removeObjectsFromMap() {
    myMap.geoObjects.remove(targetObjects);
    myMap.geoObjects.remove(dozotory);
    allObjects = [];
    filterInds = [];
    colours = [];
    files = [];
}

function loadDozotory(resp) {
    // resp -> coords
    var coords = [[]];
    for (var i in resp)
        coords[0].push( [ parseFloat(resp[i].key[1]), parseFloat(resp[i].key[2]) ] );

    // create bounds
    dozotory.geometry.setCoordinates(coords);
    dozotory.options.set('editorMaxPoints', coords[0].length);

    // resizable bounds
    myMap.geoObjects.add(dozotory);
    dozotory.editor.startDrawing();

    myMap.setBounds(dozotory.geometry.getBounds());
    console.log("dozPoints loaded");

    // THEN fetch coordinates
    fetchCoords();
}

function loadTargetObjects(resp) {
    for (var i in resp) {
        var useCnt = resp[i].key[0],
            locId = resp[i].key[1],
            coords = [ parseFloat(resp[i].key[2]), parseFloat(resp[i].key[3]) ],
            address = resp[i].key[4],
            lastUsed = resp[i].key[5];

        filterInds.push(i);

        allObjects.push(new ymaps.Placemark(coords, {
            balloonContentHeader:  "</span> <strong>useCnt:</strong> <span class='colortext'>"
                                   + parseInt(useCnt) + "</span> <strong>lastUsed:</strong> <span class='colortext'>" + lastUsed + "</span>",
            balloonContentBody: "Идет загрузка данных...",
            balloonContentFooter: address + "<br>" + resp[i].key[2] + ", " + resp[i].key[3],
            locId: locId
        }, {
            preset: 'islands#icon',
            iconColor: colours[i]
        }));

        allObjects[i].events.add('balloonopen', function (e) {
            var target = e.originalEvent.currentTarget;
            if (target.properties.get('balloonContentBody', '') != "Идет загрузка данных...")
                return;

            loaded = false;
            fetchDetInf(target.properties.get('locId', ''));
        });
    }

    updateTargetObjects();
    myMap.geoObjects.add(targetObjects);

    loaded = true;
    enableFilter();
    console.log("coords loaded");
}

function mapDetInf(locId, resp) {
    var ind = 1;
    for (var j in allObjects) {
        if (allObjects[j].properties.get('locId', '') == locId) {
            ind = j;
            break;
        }
    }

    allObjects[ind].properties.set('balloonContentBody', "<table>");

    for (var i in resp) {
        var gameStr = "<tr>";
        // date + league + taskNum (later change 2->3)
        for (var k = 0; k < 3; k++)
            gameStr += "<td>" + resp[i].key[k] + "</td>";
        // game name + link
        gameStr += "<td><a href=" + resp[i].key[3] + ">" + resp[i].key[4] + "</a></td>";
        gameStr += "</tr>";

        var oldStr = allObjects[ind].properties.get('balloonContentBody', '');
        allObjects[ind].properties.set('balloonContentBody', oldStr+gameStr);
    }

    oldStr = allObjects[ind].properties.get('balloonContentBody', '');
    allObjects[ind].properties.set('balloonContentBody', oldStr+"</table>");

    loaded = true;
    console.log(locId + " detInf loaded");
}

function updateTargetObjects() {
    //targetObjects.options.set('visible', false);
    targetObjects.removeAll();

    for (var i in filterInds)
        if (dozotory.geometry.contains( allObjects[filterInds[i]].geometry.getCoordinates() ))
            targetObjects.add(allObjects[filterInds[i]]);
}

function filterTargetObjects(resp) {
    console.log("filtering");
    filterInds = [];

    for (var i in allObjects)
        if (responseContain( allObjects[i].properties.get('locId', ''), resp ))
            filterInds.push(i);

    updateTargetObjects();
    loaded = true;
}

// for response.rows
function responseContain(val, resp) {
    for (var i in resp)
        if (val == resp[i].key)
            return true;

    return false;
}


function CustomSearchProvider() {
}

CustomSearchProvider.prototype.geocode = function (request, options) {
    var deferred = new ymaps.vow.defer(),
        m_geoObjects = new ymaps.GeoObjectCollection();

    ymaps.geocode(request, {
        boundedBy: myMap.getBounds(),
        //strictBounds: true,
        results: 10
    })
    .then(function (res) {
        res.geoObjects.each(function (el, i) {
            var coords = el.geometry.getCoordinates();
            if (dozotory.geometry.contains(coords))
                m_geoObjects.add(el);
        });

        deferred.resolve({
            // Геообъекты поисковой выдачи.
            geoObjects: m_geoObjects,
            // Метаинформация ответа.
            metaData: {
                geocoder: {
                    // Строка обработанного запроса.
                    request: request,
                    // Количество найденных результатов.
                    found: m_geoObjects.getLength(),
                    // Количество возвращенных результатов.
                    results: m_geoObjects.getLength(),
                    // Количество пропущенных результатов.
                    skip: 0
                }
            }
        });
    });

    // Возвращаем объект-обещание.
    return deferred.promise();
};


// file reader
function handleFilesSelect(m_files) {
    console.log("here");

    if (m_files.length < 3) {
        alert('Too few files');
        return;
    }

    if (m_files.length > 3) {
        alert('Too many files');
        return;
    }

    var names = [];
    for (var i in m_files)
        names.push(m_files[i].name);

    var inds = [];
    for (var i in fileNames)
        inds.push(names.indexOf(fileNames[i]));
    
    if (inds.indexOf(-1) > -1) {
        alert('Some files missing');
        return;
    }

    // if db is not empty -> stop
    db1.info(function(err, info) {
        if (!err) {
            console.log("db_locs_cnt", info.doc_count);
            if (info.doc_count == 0) {
                console.log("reading");
                readFile(addLoc, m_files[inds[0]]);
                readFile(addDetLoc, m_files[inds[1]]);
                readFile(addDozPoint, m_files[inds[2]]);

                fetch(false);
                populateLeagueList();
                leagueChanged();
            } else {
                console.log("already loaded");
            }
        } else
            console.log(err);
    });
}

function handleFileSelect(m_files) {
    var valid = false;
    for (var i in fileNames) {
        if (fileNames[i] == m_files[0].name) {
            valid = true;
            break;
        }
    }

    if (!valid) {
        alert('Invalid filename');
        return;
    }

    // check repeats
    for (var i in files) {
        if (files[i].name == m_files[0].name) {
            alert(m_files[0].name + 'is already added');
            return;
        }
    }

    files.push(m_files[0]);
}

function readDatabase() {
    handleFilesSelect(files);
}

function clearFileInputs() {
    var inputs = [
        $("#locsFile"),
        $("#detLocsFile"),
        $("#dozPointFile")
    ];

    for (var i in inputs)
        inputs[i].replaceWith( inputs[i] = inputs[i].clone( true ) );
}
