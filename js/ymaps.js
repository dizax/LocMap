var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

var myMap,
    selectedShape,
    geoQuery,
    dozotory,
    oldPolyGeom = [],
    tmpPolyMinus = [],
    tmpPolyPlus = [],
    allObjects = [],
    filterInds = [],
    insidePolyInds = [],
    targetObjects,
    dbFileName = [],
    dbLink = "",
    loaded = false;

ymaps.ready(init)
.then(function() {
    fetch(true);
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

	// initializing variables ////////////////////////
    // create bounds
    dozotory = new ymaps.Polygon([mkad, []], {}, {
        editorDrawingCursor: "crosshair",
        fillColor: '#6699ff',
        strokeColor: '#4B0082',
        // Делаем полигон прозрачным для событий карты.
        //interactivityModel: 'default#transparent',
        strokeWidth: 2,
        opacity: 0.2
    });

    // При клике на пустое место карты, останавливаем редактирование выделенного полигона
    myMap.events.add(['click'], function(){
        if(selectedShape && selectedShape.editor && selectedShape.editor.stopEditing){
            selectedShape.editor.stopEditing();
        }
        selectedShape = null;
    });

    // при клике на плигон, включаем его редактирование
    dozotory.events.add('click', function(e){
        if(selectedShape && selectedShape.editor && selectedShape.editor.stopEditing){
            selectedShape.editor.stopEditing();
            selectedShape = null;
        } else {
            selectedShape = e.get('target');
            selectedShape.editor.startEditing();
        }
    });

    dozotory.events.add('geometrychange', function(event) {
        // wait editor to finish
        dozotory.editor.getModel().then(function() {
            updateTempPoly();
            updateTargetObjectsAfterPolyChange();
            saveDozPoints();
        });
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
    insidePolyInds = [];
    colours = [];
    sortedUse = [];
    dbFileName = "";
    selectedShape = null;
}


function loadDozotory(resp) {
    // resp -> coords
    var coords = [[]];
    for (var i in resp)
        coords[0].push(resp[i]);

    // create bounds
    dozotory.geometry.setCoordinates(coords);
    /*oldPolyGeom = [];*/ oldPolyGeom = dozotory.geometry.getCoordinates()[0];

    // resizable bounds
    myMap.geoObjects.add(dozotory);

    myMap.setBounds(dozotory.geometry.getBounds());
    console.log("dozPoints loaded");
}

function loadTargetObjects(resp) {
    for (var i =0; i < resp.length; i++) {
        var useCnt = resp[i][0],
            locId = resp[i][1],
            coords = [resp[i][2], resp[i][3]],
            address = resp[i][4],
            lastUsed = resp[i][5];

        filterInds.push(sortedUse[i][1]);

        allObjects.push(new ymaps.Placemark(coords, {
            balloonContentHeader:  "</span> <strong>useCnt:</strong> <span class='colortext'>"
                                   + useCnt + "</span> <strong>lastUsed:</strong> <span class='colortext'>" + lastUsed + "</span>",
            balloonContentBody: "Идет загрузка данных...",
            balloonContentFooter: address + "<br>" + resp[i][2] + ", " + resp[i][3],
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

    computeTargetObjectsInsidePoly();
    myMap.geoObjects.add(targetObjects);

    loaded = true;
    enableFilter();
    console.log("coords loaded");
}

function mapDetInf(locId, resp) {
    var ind = locId-1;

    allObjects[ind].properties.set('balloonContentBody', "<table>");

    for (var i in resp) {
        var gameStr = "<tr>";
        // date + league + taskNum (later change 2->3)
        for (var k = 0; k < 3; k++)
            gameStr += "<td>" + resp[i][k] + "</td>";
        // game name + link
        gameStr += "<td><a href=" + resp[i][3] + ">" + resp[i][4] + "</a></td>";
        gameStr += "</tr>";

        var oldStr = allObjects[ind].properties.get('balloonContentBody', '');
        allObjects[ind].properties.set('balloonContentBody', oldStr+gameStr);
    }

    oldStr = allObjects[ind].properties.get('balloonContentBody', '');
    allObjects[ind].properties.set('balloonContentBody', oldStr+"</table>");

    loaded = true;
    console.log(locId + " detInf loaded");
}

function filterTargetObjects(resp) {
    console.log("filtering");
    filterInds = [];

    for (var i in resp)
        filterInds.push(resp[i][0]-1);

    updateTargetObjectsAfterFilter();
    loaded = true;
    console.log("done filtering");
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

function clearFileInputs() {
    var inputs = [
        $("#locsFile")
    ];

    for (var i in inputs)
        inputs[i].replaceWith( inputs[i] = inputs[i].clone( true ) );
}
