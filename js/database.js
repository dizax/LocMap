'use strict';

var fileNames = ["locations.txt",
                 "locations_detailed.txt",
                 "dozPoints.txt"];
var db1, db2, db3;

createDatabase();

PouchDB.on('created', function (dbname) {
  if (dbname === 'locs')
    db2 = new PouchDB('detLocs');
  else if (dbname === 'detLocs')
    db3 = new PouchDB('dozPoints');
  else if (dbname === 'dozPoints') {
    console.log("done creating");
  }
});

// smth weird is happening here..
PouchDB.on('destroyed', function (dbname) {
  if (dbname === 'locs')
    db2.destroy(function(err, info) { });
    //PouchDB.destroy('detLocs', function(err, info) { });
  else if (dbname === 'detLocs')
    db3.destroy(function(err, info) { });
    //PouchDB.destroy('dozPoints', function(err, info) { });
  else if (dbname === 'dozPoints') {
    removeObjectsFromMap();
    console.log("done destroying");
  }
});

// User pressed the delete button for a todo, delete it
function createDatabase() {
  db1 = new PouchDB('locs');
}

function destroyDatabase() {
  db1.destroy(function(err, info) { });
  //PouchDB.destroy('locs', function(err, info) { });
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
    if (f === addDetLoc) {
      print("done reading files");
      fetch();
    }
    return;
  }

  if (lines[cur] != "") {
    //split the rows at the cellTerminator character
    var information = lines[cur].split(cellTerminator);
    f(cur, information).then( consequentWriter(cur+1, max, lines, f, cellTerminator) );
  } else
    consequentWriter(cur+1, max, lines, f, cellTerminator)
}


// We have to create a new todo document and enter it in the database
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


function fetch() {
  db1.info(function(err, info) {
    if (!err) {
      print(info.doc_count);
      // weird things..
      //if (info.doc_count > 0)
        fetchDozPoints();
    } else
      print(err);
  });
}

function fetchCoords() {
  print("fetching coords");

  db1.query(function (doc) { emit([doc.useCnt, doc.locId, doc.coord1, doc.coord2, doc.address, doc.lastUsed]); },
    function (err, response) { if (!err) {print("coords fetched"); computeColours(response.rows); loadTargetObjects(response.rows);} else print(err); });
}

function fetchDetInf() {
  print("fetching detInf");

  db2.query(function (doc) { emit([doc.date, doc.league, doc.name, doc.locIdd]); }, {descending: true}, 
    function (err, response) { if (!err) {print("detInf fetched"); mapDetInf(response.rows);} else print(err); });
}

function fetchDozPoints() {
  print("fetching dozPoints");

  db3.query(function (doc) { emit([doc._id, doc.coord1, doc.coord2]); },
    function (err, response) { if (!err) {print("dozPoints fetched"); loadDozotory(response.rows);} else print(err); });
}

function saveDozPoints() {
  print("saving dozPoints");

  var lines = [],
      coords = dozotory.geometry.getCoordinates()[0];

  for (var i in coords)
    lines.push(coords[i][0].toString() + "\t" + coords[i][1].toString());

  consequentWriter(0, lines.length, lines, updateDozPoint, '\t');
}

function print(m) {
  console.log(m);
}
