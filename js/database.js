'use strict';

var db = new SQL.Database();

window.onbeforeunload = freeDb;
function freeDb(){
    if (db != null) db.close();
    return;
};


function destroyDatabase() {
    if (!loaded)
      return;

    loaded = false;
    disableFilter();
    clearFileInputs();

    if (!isDbEmpty()) {
        console.log("clearing database");

        clearTable("Locations_list");
        clearTable("Tasks_list");
        clearTable("Games_list");
        db.close();
        if (is_chrome) $.localStorage.remove("boundPoints"); else $.cookies.remove("boundPoints");
        $.localStorage.remove("locDb");

        removeObjectsFromMap();
        clearSelectors();

        console.log("database cleared");
    }
}

function clearTable(tablename) {
    var query2 = "DROP TABLE IF EXISTS " + tablename + ";";
    db.exec(query2);
    return;

    db.transaction(function (tx) {
      tx.executeSql(query2);
    });
}

// reading from file
function readFile(files) {
    // check file name
    if (files.length == 0) {
        console.log("no file");
        return;
    }
    if (files[0].name != "dozordb.sqlite") {
        console.log("bad file");
        return;
    }

    // if db is not empty -> stop
    if (!isDbEmpty()) {
        console.log("already loaded");
        return;
    }

    var reader = new FileReader();
    reader.onload = function(event) {
        var arrayBuffer = event.target.result,
            eightBitArray = new Uint8Array(arrayBuffer);

        $.localStorage.set("locDb", Uint8ToString(eightBitArray));

        db = new SQL.Database(eightBitArray);
        fetch(false);
    }
    reader.readAsArrayBuffer(files[0]);
}

function loadFromUrl(url) {
    // TODO not yet done
    return;

    // if db is not empty -> stop
    if (!loaded)
      return;
    if (!isDbEmpty()) {
        console.log("already loaded");
        return;
    }

    console.log("loading " + url);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      console.log("loaded " + url);
      var eightBitArray = new Uint8Array(this.response);

      $.localStorage.set("locDb", Uint8ToString(eightBitArray));

      db = new SQL.Database(eightBitArray);
      fetch(false);
    };
    xhr.send();
}

function loadDbFromLS() {
    // TODO maybe async
    db = new SQL.Database( StringToUint8($.localStorage.get("locDb")) );
}

// search queries //////////////////////////////////////
function isDbEmpty() {
    return !$.localStorage.isSet("locDb");
}

function fetch(check) {
    var dfd = $.Deferred();

    if (check) {
        if (!isDbEmpty()) {
            loaded = false;
            loadDbFromLS();
            fetchDozPoints();
            fetchCoords();
            populateLists();
        }
    } else {
        loaded = false;
        disableFilter();

        if (!isDbEmpty()) {
            fetchDozPoints();
            fetchCoords();
            populateLists();
        }
    }

    return dfd.promise();
}

function fetchDozPoints() {
  console.log("fetching dozPoints");
  var coords = loadDozPoints();
  console.log("dozPoints fetched");

  loadDozotory(coords);
}

function fetchCoords() {
  console.log("fetching coords");

  var res = db.exec("SELECT COUNT(t.locId) as useCnt, l.locId as locId, coord1, coord2, address, MAX(g.gameDate) as lastUsed \
      FROM  Locations_list l \
      LEFT JOIN \
            Tasks_list t \
      ON l.locId = t.locId \
      LEFT JOIN \
            Games_list g \
      ON t.gameId = g.gameId \
      GROUP BY \
            l.locId \
      ORDER BY locId");
  console.log("coords fetched");

  computeColours(res[0]['values']);
  loadTargetObjects(res[0]['values']);
}

function fetchDetInf(locId) {
  console.log("fetching detInf for " + locId);

  var res = db.exec("SELECT \
      Games_list.gameDate AS gameDate, \
      Games_list.league, \
      locs.taskNum AS taskNum, \
      Games_list.gameLink AS gameLink, \
      Games_list.gameName AS gameName \
    FROM \
     (SELECT gameId, taskNum FROM Tasks_list WHERE locId=" + locId + ") locs \
     LEFT JOIN Games_list ON locs.gameId = Games_list.gameId \
    ORDER BY gameDate DESC;");
  
  mapDetInf(locId, res[0]['values']);
}

function filterLocs() {
    if (!loaded)
        return;

    loaded = false;

    var sinceQ = $( "#sinceSelect option:selected" ).text(),
        leagueQ = $( "#leagueSelect option:selected" ).text(),
        dateQ = $( "#dateSelect option:selected" ).text(),
        nameQ = $( "#gameSelect option:selected" ).text();

    console.log("fetching filter locs");

    var sinceCond = "WHERE gameDate>='" + sinceQ + "' ",
        leagueCond = ((leagueQ == "All") ? "" : "AND Games_list.league='" +leagueQ+ "' "),
        dateCond = ((dateQ == "All") ? "" : "AND Games_list.gameDate='" +dateQ+ "' "),
        nameCond = ((nameQ == "All") ? "" : "AND Games_list.gameName='" +nameQ+ "' ");
    leagueCond = ((leagueQ == "классика") ? "AND (Games_list.league='альфа' OR Games_list.league='первая' OR Games_list.league='высшая') " : leagueCond);
    var res = db.exec("SELECT Tasks_list.locId as locId, COUNT(Tasks_list.locId) as useCnt \
            FROM Tasks_list \
            LEFT JOIN Games_list ON Tasks_list.gameId = Games_list.gameId " +
            sinceCond + leagueCond + dateCond + nameCond + 
            "GROUP BY \
            Tasks_list.locId \
            ORDER BY useCnt");

    console.log("filter locs fetched");

    filterTargetObjects(res[0]['values']);
}


function loadDozPoints() {
  if (is_chrome) {
      var coords = $.localStorage.get("boundPoints");
      return ((coords == null) ? mkad : coords);
  } else {
      var json_str = $.cookies.get("boundPoints");
      return ((json_str == null) ? mkad : JSON.parse(json_str));
  }
}

function saveDozPoints() {
  //console.log("saving bounds");
    var coords = dozotory.geometry.getCoordinates()[0],
        json_str = JSON.stringify(coords);
    if (is_chrome) $.localStorage.set("boundPoints", json_str); else $.cookies.set("boundPoints", json_str);
  //console.log("saved bounds");
}

// convert string<->blob
function Uint8ToString(u8a){
  var CHUNK_SZ = 0x8000;
  var c = [];
  for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
  }
  return btoa(c.join(""));
}

function StringToUint8(u8a){
  return new Uint8Array(atob(u8a).split("").map(function(c) {
    return c.charCodeAt(0); }));
}
