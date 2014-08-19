var myMap,
    dozotory,
    allObjects = [],
    targetObjects,
    loaded = false;

ymaps.ready(init).then(fetch(true));

function init() {
    // create map ///////////////////////////////////
    myMap = new ymaps.Map('map', {
        center: [55.734046, 37.588628],
        zoom: 9,
        controls: ['zoomControl', 'typeSelector', 'geolocationControl']
    });

    // create controls /////////////////////////////////
    var mySearchControl = new ymaps.control.SearchControl({
        options: {
            provider: new CustomSearchProvider()
    }});

    myMap.controls.add(mySearchControl);


    var ButtonLayout = ymaps.templateLayoutFactory.createClass(
            "<input type='file' class='fileR' id='files' name='chosenFile' multiple=3" +
            "accept='text/txt' onchange='handleFileSelect(this.files);'/>"
        ),
            
        button = new ymaps.control.Button({
            data: { content: "Жмак-жмак" },
            options: { layout: ButtonLayout }
        });
    myMap.controls.add(button, { float: 'right', floatIndex: 100 });

    /*button2 = new ymaps.control.Button("Info");
    button2.options.set('selectOnClick', false);
    button2.events.add('click', dbInfo);
    myMap.controls.add(button2, {float: 'right'});

    button3 = new ymaps.control.Button("Save DOZ");
    button3.options.set('selectOnClick', false);
    button3.events.add('click', saveDozPoints);
    myMap.controls.add(button3, {float: 'right'});*/

    button4 = new ymaps.control.Button("Destroy");
    button4.options.set('selectOnClick', false);
    button4.events.add('click', destroyDatabase);
    myMap.controls.add(button4, {float: 'right'});

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

    print("map initialized");
}

//init END ///////////////////////////////////////////

function removeObjectsFromMap() {
    myMap.geoObjects.remove(targetObjects);
    myMap.geoObjects.remove(dozotory);
}

function loadDozotory(resp) {
    // resp -> coords
    var coords = [[]];
    for (var i in resp)
        coords[0].push( [ parseFloat(resp[i].key[1]), parseFloat(resp[i].key[2]) ] );

    // create bounds
    dozotory.geometry.setCoordinates(coords);
    dozotory.options.set('editorMaxPoints', coords[0].length+1);

    // resizable bounds
    myMap.geoObjects.add(dozotory);
    dozotory.editor.startDrawing();

    myMap.setBounds(dozotory.geometry.getBounds());
    print("dozPoints loaded");

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

        allObjects.push(new ymaps.Placemark(coords, {
            balloonContentHeader:  "<strong>locID:</strong> <span class='colortext'>" + locId + "</span> <strong>useCnt:</strong> <span class='colortext'>" 
                                   + useCnt + "</span> <strong>lastUsed:</strong> <span class='colortext'>" + lastUsed + "</span>",
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

            fetchDetInf(target.properties.get('locId', ''));
        });
    }

    updateTargetObjects();
    myMap.geoObjects.add(targetObjects);
    loaded = true;
    print("coords loaded");
}

function mapDetInf(locId, resp) {
    var ind = 1;
    loaded = false;
    for (var j in allObjects) {
        if (allObjects[j].properties.get('locId', '') == locId) {
            ind = j;
            break;
        }
    }

    console.log(allObjects[ind].properties.get('balloonContentBody', ''));

    allObjects[ind].properties.set('balloonContentBody', "<table>");

    for (var i in resp) {
        var gameStr = "<tr>";
        for (var k = 0; k < 3; k++)
            gameStr += "<td>" + resp[i].key[k] + "</td>";
        gameStr += "</tr>";

        var oldStr = allObjects[ind].properties.get('balloonContentBody', '');
        allObjects[ind].properties.set('balloonContentBody', oldStr+gameStr);
    }

    oldStr = allObjects[ind].properties.get('balloonContentBody', '');
    allObjects[ind].properties.set('balloonContentBody', oldStr+"</table>");

    console.log(allObjects[ind].properties.get('balloonContentBody', ''));

    loaded = true;
    console.log(locId + " detInf loaded");
}

function updateTargetObjects() {
    //targetObjects.options.set('visible', false);
    targetObjects.removeAll();

    for (var i in allObjects) {
        if (dozotory.geometry.contains( allObjects[i].geometry.getCoordinates() ))
            targetObjects.add(allObjects[i]);
            //targetObjects.get(i).options.set('visible', true);
    }
}

function getLocId(ind) {
    return allObjects[ind].properties.get('balloonContentHeader', '').substring(48, 51);
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
function handleFileSelect(files) {
    console.log("here");

    if (files.length > 3) {
        alert('Too much files');
        return;
    }

    var names = [];
    for (var i in files)
        names.push(files[i].name);

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
                readFile(addLoc, files[inds[0]]);
                readFile(addDetLoc, files[inds[1]]);
                readFile(addDozPoint, files[inds[2]]);

                fetch(false);
            } else {
                print("already loaded");
            }
        } else
            print(err);
    });
}
