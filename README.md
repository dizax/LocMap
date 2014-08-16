WARNING
Alpha version, sort of, bugs are present.

USAGE
At first launch, choose 3 text files, representing tables, formatted like:

"locations_detailed.txt" (id can repeat)
  string  date  string  id

"locations.txt" (each id is unique)
  id  coord1  coord2  address  max_date(for specified id)  number_of_rows_in_loc_detailed(for specified id)

"dozPoints.txt" (bounding polygon points)
  coord1  coord1

Then it is stored in local DB. To remove it, click 'Destroy' button.
After DB destroying, new files can be loaded after page reloading (either way db crashes - TODO).
