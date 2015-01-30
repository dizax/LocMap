<b>DESCRIPTION</b> <br>
Displays on map loaded locations, bounded by given polygon.

<b>USAGE</b> <br>
App is working with local sqlite db to be loaded by user at first launch either from a local machine, or from a specified by user url. To unload db from local machine click Destroy.<br>
The warmer color of baloon, the more often location was used. To load detailed information about loation, click on its baloon. Filter bar is used to filter location by various parameters. <br> <br>

Db file should contain 3 tables, formatted like:

<i>Locations_list</i> <br>
<table><tr><td>locId</td>  <td>coord1</td>  <td>coord2</td>  <td>address</td></tr>
       <tr><td>INT</td>  <td>DOUBLE</td>  <td>DOUBLE</td>  <td>STRING</td></tr></table>

<i>Tasks_list</i> <br>
<table><tr><td>locId</td>  <td>gameId</td>  <td>taskNum</td>  <td>taskName</td></tr>
       <tr><td>INT</td>  <td>INT</td>  <td>INT</td>  <td>STRING</td></tr></table>

<i>Games_list</i> <br>
<table><tr><td>gameId</td>  <td>league</td>  <td>gameName</td>  <td>gameDate</td> <td>gameLink</td></tr>
       <tr><td>INT</td>  <td>STRING</td>  <td>STRING</td>  <td>DATE</td> <td>STRING</td></tr></table>
