// JS File to make Google Places API calls for info

var map;
var infowindow;
var placeIDs = [];
var placeDetails = [];

function changemap() {
  var greenwich = {lat: 51.5081, lng: -0.1181};

  // Initialize a map at <div id='map'></div> with Greenwich
	map = new google.maps.Map(document.getElementById('map'), {
		center: greenwich,
		zoom: 15,
	});
}

// Function called upon page load, callback for API script tag
function initMap() {
  var trafalgarSquare = {lat: 51.5081, lng: -0.1281};

  // Initialize a map centered at Trafalgar Square
  map = new google.maps.Map(document.getElementById('map'), {
    center: trafalgarSquare,
    zoom: 15,
  });

  infowindow = new google.maps.InfoWindow();

  // Call a nearby Search for Places (museums) in radius around Trafalgar Sq.
  // Order the results by prominence, then go to callback function
  // Callback function populates array with place_ids from each Place found
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: trafalgarSquare,
    radius: 3000,
    types: ['museum'],
    rankBy: google.maps.places.RankBy.PROMINENCE,
  }, initCallback);

  // Use array of place_ids to get details on each place
  // Put placeDetail objects into their own array
  makePlaceDetails(placeIDs);
}

function initCallback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      // Collect place ID's from results of nearbySearch
      placeIDs.push(results[i].place_id);
      createMarker(results[i]);
    }
  }
}

// With array of Place IDs gathered from nearbySearch Callback, 
// make requests to Places API to get Array of Place Detail objects
function makePlaceDetails(idList) {
  var detailService = new google.maps.places.PlacesService(map);
  var request;
  for (var i = 0; i < idList.length; i++) {
    request = {
      placeId: idList[i]
    };

    // Put each placeDetail in placeDetail array
    detailService.getDetails(request, detailCallback);
  };
}

// Callback for makePlaceDetails; should return a single
// PlaceResult object with all of its details
function detailCallback(place, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    placeDetails.push(place);
  } else{
    console.log("Error: Could not call details for place");
  };
}

function getDetailArray() {
  return placeDetails;
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: placeLoc
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}

initMap();