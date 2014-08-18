<b>WARNING</b> <br>
Alpha version, sort of, bugs are present.

<b>USAGE</b> <br>
At first launch, choose 3 text files, representing tables, formatted like:

"locations_detailed.txt" (id can repeat) <br>
<table><tr><td>string</td>  <td>date</td>  <td>string</td>  <td>id</td></tr></table>

"locations.txt" (each id is unique) <br>
<table><tr><td>id</td>  <td>coord1</td>  <td>coord2</td>  <td>address</td>  <td>max_date(for specified id) </td> <td>number_of_rows_in_loc_detailed(for specified id)</td></tr></table>

"dozPoints.txt" (bounding polygon points) <br>
<table><tr><td>coord1</td>  <td>coord1</td></tr></table>

Then it is stored in local DB. To remove it, click 'Destroy' button.
After DB destroying, new files can be loaded after page reloading (either way db crashes - TODO).
