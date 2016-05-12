# MuseumApp
A React-based web application for navigating London's many museums, with features including:
*Filtering of museums across five categories
*Embedded Google Maps display with London Underground reference points
*Access to individual museum websites to access current events and exhibitions
*Brief, informative text pulled from relevant Wikipedia pages

###Implementation
The bulk of the application derives from two client-side processes initiated upon loading the page - cross-domain AJAX calls to the Google Places and Wikipedia APIs. 

The former executes a search for `museum` entities in a static radius around Trafalgar Square (currently in a 5km radius) and will return a maximum of 60 `Place` objects, which have fields specified via the Google Places API.

The latter makes an explicit call to fetch the data for the Wikipedia page "List of Museums in London", which holds a table of museums and associated metadata for each. The crux here is that the Wikipedia table holds a `category` field for each museum, which the Google Places API lacks. Categorization occurs by pulling this `category` field, finding the Google object with the same museum name (some sanitation and edge cases are required to acquire these matches), and bundling them together as a complete, categorized object.
