var leagueNames = ['лайт', 'бета', 'классика', 'альфа', 'первая', 'высшая'];

function populateLists() {
    populateSinceList();
    populateLeagueList();
    leagueChanged();
}

function populateSinceList() {
    console.log("populating since list");

    $('#sinceSelect')
        .empty();

    var res = db.exec("SELECT gameDate\
            FROM Games_list \
            GROUP BY gameDate \
            ORDER BY gameDate DESC;")[0]['values'];

    for (var i = 0; i < res.length; i++)
        $("#sinceSelect").append( $('<option>' + res[i][0] + '</option>') );

    $('#sinceSelect :nth-child('+ res.length +')').prop('selected', true);

    console.log("since list populated");
}

function populateLeagueList() {
    console.log("populating league list");

    $('#leagueSelect')
        .empty()
        .append( $('<option>All</option>') );
    for (var i in leagueNames)
        $("#leagueSelect").append( $('<option>' + leagueNames[i] + '</option>') );

    console.log("league list populated");
}

// select onchanged
function leagueChanged() {
    var sinceQ = $( "#sinceSelect option:selected" ).text(),
        leagueQ = $( "#leagueSelect option:selected" ).text();

    // change date & game lists
    console.log("populating date&game lists");

    disableSelectors();
    var sinceCond = "WHERE gameDate>='" + sinceQ + "' ",
        leagueCond = ((leagueQ == "All") ? "" : "AND league='" +leagueQ+ "' ");
        leagueCond = ((leagueQ == "классика") ? "AND (league='альфа' OR league='первая' OR league='высшая') " : leagueCond);
    var res = db.exec("SELECT gameDate, gameName \
            FROM Games_list " +
            sinceCond + leagueCond + 
            "ORDER BY gameDate DESC;");
    populateDateGameSelect(res[0]['values']);
    enableSelectors();

    console.log("date&game lists populated");
}

function dateChanged() {
    var sinceQ = $( "#sinceSelect option:selected" ).text(),
        leagueQ = $( "#leagueSelect option:selected" ).text(),
        dateQ = $( "#dateSelect option:selected" ).text();

    // change game list
    console.log("game list populated");

    disableSelectors();
    var sinceCond = "WHERE gameDate>='" + sinceQ + "' ",
        leagueCond = ((leagueQ == "All") ? "" : "AND league='" +leagueQ+ "' ");
        leagueCond = ((leagueQ == "классика") ? "AND (league='альфа' OR league='первая' OR league='высшая') " : leagueCond);
    var dateCond = ((dateQ == "All") ? "" : "AND gameDate='" +dateQ+ "' ");
    var res = db.exec("SELECT gameName \
            FROM Games_list " +
            sinceCond + leagueCond + dateCond +
            "ORDER BY gameDate DESC;");
    populateGameSelect(res[0]['values']);
    enableSelectors();

    console.log("game list populated");
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
        if ($('#dateSelect option:last-child').text() != resp[i][0])
            $('#dateSelect')
                .append( $('<option>' + resp[i][0] + '</option>') );
        if ($('#gameSelect option:last-child').text() != resp[i][1])
            $('#gameSelect')
                .append( $('<option>' + resp[i][1] + '</option>') );
    }
}

function populateGameSelect(resp) {
    $('#gameSelect')
        .empty()
        .append( $('<option>All</option>') );

    for (var i in resp) {
        if ($('#gameSelect option:last-child').text() != resp[i])
            $('#gameSelect')
                .append( $('<option>' + resp[i] + '</option>') );
    }
}

function disableSelectors() {
    $('#sinceSelect').attr("disabled", true);
    $('#leagueSelect').attr("disabled", true);
    $('#dateSelect').attr("disabled", true);
    $('#gameSelect').attr("disabled", true);
}

function enableSelectors() {
    $('#sinceSelect').attr("disabled", false);
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
    $('#sinceSelect')
        .empty()
        .append( $('All') );
    $('#leagueSelect')
        .empty()
        .append( $('All') );
    $('#dateSelect')
        .empty()
        .append( $('All') );
    $('#gameSelect')
        .empty()
        .append( $('All') );
}
