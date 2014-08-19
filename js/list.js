// select onchanged
function leagueChanged() {
    var leagueQ = $( "#leagueSelect option:selected" ).text();

    // change date & game lists
    console.log("populating date&game lists");
    disableSelectors();
    db2.query(function (doc, emit) {
            if ( acceptQuery(leagueQ, doc.league) )
                emit([doc.date, doc.name]);
        },
        {descending: true},
        function (err, response) {
            if (!err) {
                populateDateGameSelect(response.rows);
                enableSelectors();
                console.log("date&game lists populated");
            } else
                console.log(err);
        }
    );
}

function dateChanged() {
    var leagueQ = $( "#leagueSelect option:selected" ).text(),
        dateQ = $( "#dateSelect option:selected" ).text();

    // change game list
    console.log("game list populated");
    disableSelectors();
    db2.query(function (doc, emit) {
            if ( acceptQuery(leagueQ, doc.league) )
                if ( acceptQuery(dateQ, doc.date) )
                    emit(doc.name);
        },
        function (err, response) {
            if (!err) {
                populateGameSelect(response.rows);
                enableSelectors();

                console.log("game list populated");
            } else
                console.log(err);
        }
    );
}

function gameChanged() {
    // nothing to do
}

function populateDateGameSelect(resp) {
    $('#dateSelect')
        .empty()
        .append( $('<option>All</option>') );
    $('#gameSelect')
        .empty()
        .append( $('<option>All</option>') );

    for (var i in resp) {
        if ($('#dateSelect option:last-child').text() != resp[i].key[0])
            $('#dateSelect')
                .append( $('<option>' + resp[i].key[0] + '</option>') );
        if ($('#gameSelect option:last-child').text() != resp[i].key[1])
            $('#gameSelect')
                .append( $('<option>' + resp[i].key[1] + '</option>') );
    }
}

function populateGameSelect(resp) {
    $('#gameSelect')
        .empty()
        .append( $('<option>All</option>') );

    for (var i in resp) {
        if ($('#gameSelect option:last-child').text() != resp[i].key)
            $('#gameSelect')
                .append( $('<option>' + resp[i].key + '</option>') );
    }
}

function disableSelectors() {
    $('#leagueSelect').attr("disabled", true);
    $('#dateSelect').attr("disabled", true);
    $('#gameSelect').attr("disabled", true);
}

function enableSelectors() {
    $('#leagueSelect').attr("disabled", false);
    $('#dateSelect').attr("disabled", false);
    $('#gameSelect').attr("disabled", false);
}

function disableFilter() {
    disableSelectors();
    $('#filter').attr("disabled", true);
}

function enableFilter() {
    enableSelectors();
    $('#filter').attr("disabled", false);
}

function clearSelectors() {
    $('#leagueSelect')
        .empty()
        .append( $('<option>All</option>') );
    $('#dateSelect')
        .empty()
        .append( $('<option>All</option>') );
    $('#gameSelect')
        .empty()
        .append( $('<option>All</option>') );
}

// button onclicked
function filterLocs() {
    if (!loaded)
        return;

    loaded = false;

    var leagueQ = $( "#leagueSelect option:selected" ).text(),
        dateQ = $( "#dateSelect option:selected" ).text(),
        nameQ = $( "#gameSelect option:selected" ).text();

    console.log("fetching filter locs");

    db2.query(function (doc, emit) {
            if ( acceptQuery(leagueQ, doc.league) )
                if ( acceptQuery(dateQ, doc.date) )
                    if ( acceptQuery(nameQ, doc.name) ) {
                        emit(doc.locIdd);
                    }
        },
        function (err, response) { if (!err) { console.log("filter locs fetched"); filterTargetObjects(response.rows); } else console.log(err); }
    );
}

function acceptQuery(query, league) {
    if (query == "All")
        return true;

    return query == league;
}
