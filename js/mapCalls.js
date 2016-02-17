// JS File to make Google Places API calls for info

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map;
var infowindow;

function changemap() {
	var greenwich = {lat: 51.5081, lng: -0.1181};

	map = new google.maps.Map(document.getElementById('map'), {
		center: greenwich,
		zoom: 15
	});
}

function initMap() {
  var trafalgarSquare = {lat: 51.5081, lng: -0.1281};

  map = new google.maps.Map(document.getElementById('map'), {
    center: trafalgarSquare,
    zoom: 15
  });

  infowindow = new google.maps.InfoWindow();

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: trafalgarSquare,
    radius: 500,
    types: ['store']
  }, callback);
}

function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}