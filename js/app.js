//Latitude and Longitude details for the featured neighborhood
const LATITUDE = 47.608013;
const LONGITUDE = -122.335167;

// Create a model for a Location on the map
var Location = function Location(map, name, lat, lon) {
  var marker;

  this.title = ko.observable(name);

  //Fetch parameters for calling the Yelp API
  var parameters = fetchYelpDetails(name, lat, lon);
  var content;
  var yelp_url = "https://api.yelp.com/v2/search";
  var settings = {
    url: yelp_url,
    data: parameters,
    cache: true,
    dataType: 'jsonp',
  };

  // Send AJAX query via jQuery library.
  $.ajax(settings)
  .done(function(results) {
    // Build the content string from the results returned by Yelp
    var name = results.businesses[0].name;
    var rating = results.businesses[0].rating;
    var phone = results.businesses[0].display_phone;
    var address = results.businesses[0].location.display_address;
    content = '<div><h4>' + name + '</h4>' +
      '<p>' + address + '</p>' +
      '<p>Phone: ' + phone + '</p>' +
      '<p>Yelp Rating: ' + rating + '</p>' +
      '</div>';
  })
  .fail(function() {
    alert("There was an error in loading Yelp data. Please try again.");
  });


  marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat, lon),
    title: name,
    map: map,
    animation: google.maps.Animation.DROP
  });

  var largeInfoWindow = new google.maps.InfoWindow();

  marker.addListener('click', function() {
    populateInfoWindow(this, largeInfoWindow, content);
  });

  this.isVisible = ko.observable(true);

  this.isVisible.subscribe(function(currentState) {
    if (currentState) {
      marker.setMap(map);
    } else {
      marker.setMap(null);
    }
  });

  this.isVisible(true);

  // Display Info window if any of the locations in the sidebar is clicked
  this.openInfo = function(location) {
    populateInfoWindow(marker, largeInfoWindow, content);
  }


}

// This function populates the infowindow when the marker is clicked.
function populateInfoWindow(marker, infowindow, content) {

  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {

    infowindow.marker = marker;
    infowindow.setContent(content);
    infowindow.open(map, marker);
    infowindow.
    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/purple-dot.png')

    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}

//This function is for creating a Viewmodel
function ViewModel() {
  var self = this;

  // Constructor creates a new map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: LATITUDE,
      lng: LONGITUDE
    },
    zoom: 15,
    mapTypeControl: false
  });

  // Create new locations for displaying on the map
  self.locations = ko.observableArray([
    new Location(map, "Storyville Coffee Company", 47.6088847, -122.3403957),
    new Location(map, "Moore Coffee Shop", 47.6117, -122.3413),
    new Location(map, "Seattle Coffee Works", 47.6089706271887, -122.339541614056),
    new Location(map, "Le Panier French Bakery", 47.6098933070898, -122.342474609613),
    new Location(map, "Il Corvo Pasta", 47.60244, -122.33165)

  ]);

  self.searchQuery = ko.observable('');

  self.filteredMarkers = ko.computed(function() {
    var filter = self.searchQuery().toLowerCase();
    if (!filter) {
      self.locations().forEach(function(location) {
        location.isVisible(true);
      });
      return self.locations();
    } else {
      return ko.utils.arrayFilter(self.locations(), function(item) {
        var markerTitle = item.title().toLowerCase();
        var isMatch = false;
        if (markerTitle.search(filter) >= 0) {
          isMatch = true;
        }
        item.isVisible(isMatch);
        return isMatch;
      });
    }

  }, self);


}

function initMap() {
  ko.applyBindings(new ViewModel());
}

//Display error message in case there is an error in displaying Google map
function errorMap() {
  alert("Oops! There has been an error in loading google maps. Please try again.")
}

//This function returns the parameters required to make the Yelp API call
function fetchYelpDetails(search_term, lat, lon) {
  var yelp_url = "https://api.yelp.com/v2/search";
  const YELP_KEY = "fA2KS5SXQE3xz2I9VRvp2Q";
  const YELP_TOKEN = "EW6hww1urmriR-8kvJmpastjDr2nX36w"
  const YELP_KEY_SECRET = "hMyJUJ6UdvAcMbNQ8YvsKH4c-Zo";
  const YELP_TOKEN_SECRET = "1NgUQujtvBz5rXLYemahWpiL0nk";

  var parameters = {
    oauth_consumer_key: YELP_KEY,
    oauth_token: YELP_TOKEN,
    oauth_nonce: nonce_generate(),
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
    callback: 'cb',
    term: search_term,
    ll: lat + ',' + lon
  };

  var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
  parameters.oauth_signature = encodedSignature;

  return parameters;
}

/**
 * Generates a random number and returns it as a string for OAuthentication
 * @return {string}
 */
function nonce_generate() {
  return (Math.floor(Math.random() * 1e12).toString());
}