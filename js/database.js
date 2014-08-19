'use strict';

var fileNames = ["locations.txt",
                 "locations_detailed.txt",
                 "dozPoints.txt"];
var db1, db2, db3;

createDatabase();

function createDatabase() {
    (function() {
        var dfd = new $.Deferred();
        db1 = new PouchDB('locs');
        return dfd.promise();
    })()
        .then((function() {
            var dfd2 = new $.Deferred();
            db2 = new PouchDB('detLocs');
            return dfd2.promise();
        })()
            .then((function() {
                var dfd3 = new $.Deferred();
                db3 = new PouchDB('dozPoints');
                return dfd3.promise();
            })())
                .then(console.log("done creating")));
}

function destroyDatabase() {
    loaded = false;

    db1.destroy(function(err, info) { })
        .then(function () {
            db2.destroy(function(err, info) { })
                .then(function () {
                    db3.destroy(function(err, info) { })
                        .then(function() {
                            removeObjectsFromMap();
                            console.log("done destroying");

                            // recreate objects
                            createDatabase();
                        })
                })
        });
}

// reading from file
function readFile(f, file) {
  var reader = new FileReader();

  //break the lines apart
  reader.onload = (function(theFile) {
    return function(e) {
    
      //call the parse function with the proper line terminator and cell terminator
      parseCSV(e.target.result, f, '\n', '\t');
    
    };
  })(file);

  // Read the file as text
  reader.readAsText(file);
}

function parseCSV(text, f, lineTerminator, cellTerminator) {
  var lines = text.split(lineTerminator);

  consequentWriter(1, lines.length, lines, f, cellTerminator);
}

function consequentWriter(cur, max, lines, f, cellTerminator) {
    if (cur >= max) {
        // if last
        if (f === addLoc)
            console.log("write locs done");
        else if (f === addDetLoc)
            console.log("write detlocs done");
        else if (f === addDozPoint)
            console.log("write dozpoints done");

        return;
    }

    if (lines[cur] != "") {
        //split the rows at the cellTerminator character
        var information = lines[cur].split(cellTerminator);
        f(cur, information).then( consequentWriter(cur+1, max, lines, f, cellTerminator) );
    } else
        consequentWriter(cur+1, max, lines, f, cellTerminator)
}


function addLoc(id, row) {
  var loc = {
    _id: id.toString(),
    locId: row[0],
    coord1: row[1],
    coord2: row[2],
    address: row[3],
    lastUsed: row[4],
    useCnt: row[5]
  };

  return db1.put(loc, function callback(err, result) {
    if (err) {
      console.log('Cant post a location' + row[0]);
      print(err);
    }
  });
}

function addDetLoc(id, row) {
  var detLoc = {
    _id: id.toString(),
    league: row[0],
    date: row[1],
    name: row[2],
    locIdd: row[3]
  };

  return db2.put(detLoc, function callback(err, result) {
    if (err) {
      console.log('Cant post a detailed location');
      print(err);
    }
  });
}

function addDozPoint(id, row) {
  var dozPoint = {
    _id: id.toString(),
    coord1: row[0],
    coord2: row[1]
  };

  return db3.put(dozPoint, function callback(err, result) {
    if (err) {
      console.log('Cant post dozotory point');
      print(err);
    }
  });
}

function updateDozPoint(id, row) {
  return db3.query(function (doc) { 
      print(parseInt(doc._id)); 
      if (parseInt(doc._id) == id+1) 
        return db3.put({
              _id: id.toString(),
              _rev: doc._rev,
              coord1: row[0],
              coord2: row[1]
            }); 
      },
      function (err, resp) {
        if (!err) {
          print(resp);
          /*return db3.put({
            _id: id.toString(),
            _rev: resp[0]._rev,
            coord1: row[0],
            coord2: row[1]
          });*/
        } else {
          console.log('Cant update dozotory point');
          print(err);
        }
    });
}

// search queries //////////////////////////////////////
function dbInfo() {
  db1.info(function(err, info) {
    if (!err)
      print(info);
    else
      print(err);
  });

  db2.info(function(err, info) {
    if (!err)
      print(info);
    else
      print(err);
  });

  db3.info(function(err, info) {
    if (!err)
      print(info);
    else
      print(err);
  });
}


function fetch(check) {
    if (check) {
        db1.info(function (err, info) {
            if (!err) {
                if (info.doc_count > 0)
                    fetchDozPoints();
            } else
                print(err);
        });
    } else
        fetchDozPoints();
}

function fetchCoords() {
  print("fetching coords");

  db1.query(function (doc, emit) { emit([doc.useCnt, doc.locId, doc.coord1, doc.coord2, doc.address, doc.lastUsed]); },
    function (err, response) { if (!err) {print("coords fetched"); computeColours(response.rows); loadTargetObjects(response.rows);} else print(err); });
}

function fetchDetInf(locId) {
  print("fetching detInf for " + locId);

  db2.query(function (doc, emit) {if (locId == doc.locIdd) emit([doc.date, doc.league, doc.name]); }, {descending: true},
    function (err, response) { if (!err) {print(locId + " detInf fetched"); mapDetInf(locId, response.rows);} else print(err); });
}

function fetchDozPoints() {
  print("fetching dozPoints");

  db3.query(function (doc, emit) { emit([doc._id, doc.coord1, doc.coord2]); },
    function (err, response) { if (!err) {print("dozPoints fetched"); loadDozotory(response.rows);} else print(err); });
}

function saveDozPoints() {
    print("saving dozPoints");

    var lines = [],
        coords = dozotory.geometry.getCoordinates()[0];

    for (var i in coords)
    lines.push(coords[i][0].toString() + "\t" + coords[i][1].toString());

    db3.destroy(function(err, info) {})
        .then((function() {
            var dfd3 = new $.Deferred();

            db3 = new PouchDB('dozPoints');

            return dfd3.promise();
        })()
            .then( function() {
                consequentWriter(0, lines.length, lines, addDozPoint, '\t');
            }
        ));
}

function print(m) {
  console.log(m);
}
