// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
// The shell of this code was taken directly from the Maps API coding samples and then reworked/customized
// for this project


///////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES
///////////////////////////////////////////////////////////////////////////////////////////

var map;
var service;
var infowindow;
var FavtrCount = 0;

// define constructor for searchCriteria object
// startLoc = string of the starting point; should be town, state, country or some derivative thereof
// distance = should be a #5, 10, 15, 20, 25, 30
// activityArray = array of numbers corresponding to:
//      0 = amusement park
//      1 = aquarium
//      2 = art gallery
//      3 = musuem
//      4 = park
//      5 = spa
//      6 = zoo
// includeFood = boolean
// budget = should be a number (0 to 4)

function searchCriteria( startLoc, distance, activityArray, includeFood, budget ) {
    this.startLoc = startLoc,
    this.distance = distance,
    this.activityArray = activityArray,
    this.includeFood = includeFood,
    this.budget = budget
}


function Place(id, name, address, photoURL, AvgReview, openNow ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.photoURL = photoURL;
    this.AvgReview = AvgReview;
    this.openNow = openNow;
};


///////////////////////////////////////////////////////////////////////////////////////////
// Functions to support creating the map, with markers based on the user's search criteria
///////////////////////////////////////////////////////////////////////////////////////////

function search( searchCriteria ) {

    var searchAddress = searchCriteria.startLoc;
    
    if ( searchAddress.length ) {
        var geocoder = new google.maps.Geocoder();

        geocoder.geocode(   {'address': searchAddress},
                            function(results, status) {
                                if (status === 'OK') {
                                    searchStep2(results[0].geometry.location, searchCriteria);
                                } else {
                                    // need to post a message to the user that the "Geocoder was not successful for the following reason: ' + status
                                }
                            }
                        );
    } else {
        // need to post a message to the user that we could not resolve the address
    }
}

function searchStep2( geoLocation, searchCriteria ) {

    map = new google.maps.Map(document.getElementById('map'), {
                center: geoLocation,
                zoom: 15,
                styles:[
                    { "featureType": "administrative.land_parcel",
                      "elementType": "labels",
                      "stylers": [{"visibility": "off"}]
                    },
                    { "featureType": "poi",
                      "elementType": "labels.text",
                      "stylers": [{"visibility": "off"}]
                    },
                    { "featureType": "poi.business",
                      "stylers": [{"visibility": "off"}]
                    },
                    { "featureType": "transit",
                      "stylers": [{"visibility": "off"}]
                    } ] });

    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);

    // calculate radius (convert miles to meters)
    var searchRadius = searchCriteria.distance * 1609.34;

    for ( var i=0; i<searchCriteria.activityArray.length; i++ ) {
        // determine type to search on
        var searchType = "";

        switch( searchCriteria.activityArray[i] ) {
            case 0: searchType = "amusement park";
                    break;

            case 1: searchType = "aquarium";
                    break;
                    
            case 2: searchType = "art gallery";
                    break;
            
            case 3: searchType = "museum";
                    break;
            
            case 4: searchType = "park";
                    break;
            
            case 5: searchType = "spa";
                    break;
            
            case 6: searchType = "zoo";
                    break;
        }

        if ( searchCriteria.budget ) {
            service.nearbySearch( { location: geoLocation,
                                    radius: searchRadius,
                                    minPriceLevel: 0,
                                    maxPriceLevel: searchCriteria.budget,
                                    type: [ searchType ]
                                  },
                                  searchCallback);
        } else {
            service.nearbySearch( { location: geoLocation,
                                    radius: searchRadius,
                                    type: [ searchType ]
                                  },
                                  searchCallback);
        }
    }

    if ( searchCriteria.includeFood ) {
        var foodSearchTypes = ["bakery", "cafe", "restaurant"];

        for ( var i=0; i<foodSearchTypes.length; i++ ) {
            if ( searchCriteria.budget ) {
                service.nearbySearch( { location: geoLocation,
                                        radius: searchRadius,
                                        minPriceLevel: 0,
                                        maxPriceLevel: searchCriteria.budget,
                                        type: [ foodSearchTypes[i] ]
                                      },
                                      searchCallback);
            } else {
                service.nearbySearch( { location: geoLocation,
                                        radius: searchRadius,
                                        type: [ foodSearchTypes[i] ]
                                      },
                                      searchCallback);
            }
        }
    }
}

function searchCallback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {

  var icon = {
    url: place.icon,
    scaledSize: new google.maps.Size(25, 25),
    origin: new google.maps.Point(0,0), // origin
    anchor: new google.maps.Point(0,0)  // anchor
    };

  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    icon: icon
  });

  google.maps.event.addListener(marker, 'click', function() {
            infowindow.close();    
            $("#place-name").text((place.name)?place.name:"N/A");
            $("#favorite").attr("value", place.place_id);
            $("#place-address").text((place.vicinity)?place.vicinity:"N/A");
            $("#place-pricelevel").text((place.price_level)? ("Price level: " + place.price_level):"Price Level: N/A");
            $("#place-rating").text((place.rating)?("Rating: " + place.rating) : "Rating: N/A");
        
            var contentHTML = $("#infowindow-content").html();
            infowindow.setContent(contentHTML);
            infowindow.open(map, this);
  });
}

///////////////////////////////////////////////////////////////////////////////////////////
// functions to handle creating/editting/saving the Favorites list on the page
///////////////////////////////////////////////////////////////////////////////////////////

function addToFavorites() {
    var placeID = $(this).attr("value");

    service.getDetails( { placeId: placeID },
                        function(place, status) {
                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                FavtrCount++;

                                var newFavRow = $("<tr id='trNum-" + FavtrCount + "'>");
                                var newFavName = $("<td>");
                                var newAnchorHTML = "<a href='" + place.website + "' target='_blank'>" + place.name + "</a>";
                                newFavName.append(newAnchorHTML);

                                var newFavNameDel = $("<td>");
                                var newFavDelBtn = $("<button>");
                                newFavDelBtn.attr("value", FavtrCount);
                                newFavDelBtn.addClass("checkbox");
                                newFavDelBtn.append("X");
                                newFavNameDel.append(newFavDelBtn);

                                newFavRow.append(newFavName, newFavNameDel);
                                $("#favorites-table").append(newFavRow);
                            } else {
                                // need to post a message to the user that details were not available
                            }
                        });
}

$(document.body).on("click", ".checkbox", function() {

    var FavtoDel = $(this).val();

    // Select and Remove the specific <tr> element
    $("#trNum-" + FavtoDel).remove();
  });

///////////////////////////////////////////////////////////////////////////////////////////
// helper functions
///////////////////////////////////////////////////////////////////////////////////////////

function getCurrentGeoLocation() {
    var latitude = 0;
    var longitude = 0;

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition( function(position) {
                                    latitude = position.coords.latitude;
                                    longitude = position.coords.longitude;
                                    console.log("==getCurrentGeoLocation()== lat: " + latitude + " lng: " + longitude);})
    } else {
        // New York City
        latitude = 40.712;
        longitude = -74.000;
    }
    
    return { lat: latitude, lng: longitude };
}

///////////////////////////////////////////////////////////////////////////////////////////
// WINDOW ON LOAD - CREATE BUTTON CLICK EVENT LISTENERS
///////////////////////////////////////////////////////////////////////////////////////////

window.onload = function () {
    $(document).on("click", "#favorite", addToFavorites);
    $("#SearchBtn").on("click", testSearch);
}


function testSearch() {
console.log("===testSearch()===");
    var mySearch = new searchCriteria( "Central Park, NY", 25, [3, 4], true );
    search( mySearch );
}

///////////////////////////////////////////////////////////////////////////////////////////
// JSON DUMPS OF API RETURNS
///////////////////////////////////////////////////////////////////////////////////////////

/* searchNearby returns:

{"geometry":{"location":{"lat":40.7276164,"lng":-74.00815439999997},
             "viewport":{"south":40.7262674197085,"west":-74.0095033802915,"north":40.7289653802915,"east":-74.00680541970848}
            },
 "icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png"
 "id":"73c2d21ce9566af682355c3f5601d3897563b4ac"
 "name":"Children's Museum of the Arts"
 "opening_hours":{  "open_now":true
                    "weekday_text":[]
                 },
 "photos":[ {"height":2831,
             "html_attributions":["<a href=\"https://maps.google.com/maps/contrib/114848112453403729333/photos\">
                                   Dan Lazar</a>"],"width":3939}],
 "place_id":"ChIJWaqbDolZwokRWK8vbWSAfMk",
 "price_level":2,
 "rating":4.3,
 "reference":"CmRSAAAA-JdYVVSFsCNTA1zlpD8Ii7HSXLPn194KFFxBPYYSQvDENSxJo7cT6PrTl7YEr4IlSedw4OhS0qwxxkFRmP1-efT9qV61Q_nx13-vO-uyCy8-9ECXcdPrItSNX7cJcz-pEhDV5_1eI6_BtZWDoMKkUB9_GhQ_VxcGbQ7qLQtNn1fBzQdH0qoWZg",
 "scope":"GOOGLE",
 "types":["museum","point_of_interest","establishment"],
 "vicinity":"103 Charlton Street, New York",
 "html_attributions":[]}
 */

 /* geocoder returns: 

    {"address_components": [ {"long_name":"Morristown",
                              "short_name":"Morristown"
                              "types": [ "locality","political"]},
                             {"long_name":"Morris County",
                              "short_name":"Morris County",
                              "types":["administrative_area_level_2","political"]},
                             {"long_name":"New Jersey",
                              "short_name":"NJ",
                              "types":["administrative_area_level_1","political"]},
                             {"long_name":"United States",
                              "short_name":"US",
                              "types":["country","political"]},
                             {"long_name":"07960",
                              "short_name":"07960",
                              "types":["postal_code"]}
                          ],
     "formatted_address":"Morristown, NJ 07960, USA",
     "geometry": { "bounds": {"south":40.7802309,"west":-74.50144399999999,"north":40.81836089999999,"east":-74.45618100000002},
                   "location" : {"lat":40.79676670000001,"lng":-74.4815438},
                   "location_type":"APPROXIMATE",
                   "viewport": {"south":40.7802309,"west":-74.50144399999999,"north":40.81836089999999,"east":-74.45618100000002}
                 },
     "place_id":"ChIJLSKWIZMJw4kRoSFvsb55sEM",
     "types":["locality","political"]
    }
*/

/*  getDetails returns:
 {  address_components: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
    adr_address: "<span class="street-address">1600 21st St NW</span>, <span class="locality">Washington</span>, <span class="region">DC</span> <span class="postal-code">20009</span>, <span class="country-name">USA</span>"
    formatted_address: "1600 21st St NW, Washington, DC 20009, USA"
    formatted_phone_number: "(202) 387-2151"
    geometry: {location: _.K, viewport: _.rc}
    location: _.Klat: ƒ ()arguments: nullcaller: nulllength: 0name: ""prototype: {constructor: ƒ}__proto__: ƒ ()[[FunctionLocation]]: js?key=AIzaSyAHT_EfAgH7JnaMsp39cas4DItIdi7aYqs&libraries=places:46[[Scopes]]: Scopes[3]lng: ƒ ()__proto__: Objectviewport: _.rc {f: qc, b: lc}__proto__: Objecthtml_attributions: []length: 0__proto__: Array(0)
    icon: "https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png"
    id: "449d981268d83349789ba87e8be642fcd6a8151d"
    international_phone_number: "+1 202-387-2151"
    name: "The Phillips Collection"
    opening_hours: {open_now: false, periods: Array(6), weekday_text: Array(7)}
    photos: (10) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
       0: {height: 3024, html_attributions: Array(1), width: 4032, getUrl: ƒ}
       1: {height: 1836, html_attributions: Array(1), width: 3264, getUrl: ƒ}
       2: {height: 3024, html_attributions: Array(1), width: 4032, getUrl: ƒ}
       3: {height: 3024, html_attributions: Array(1), width: 4032, getUrl: ƒ}
       4: {height: 2988, html_attributions: Array(1), width: 5312, getUrl: ƒ}
       5: {height: 3024, html_attributions: Array(1), width: 4032, getUrl: ƒ}
       6: {height: 2322, html_attributions: Array(1), width: 4128, getUrl: ƒ}
       7: {height: 4048, html_attributions: Array(1), width: 3036, getUrl: ƒ}
       8: {height: 2560, html_attributions: Array(1), width: 1920, getUrl: ƒ}
       9: {height: 1440, html_attributions: Array(1), width: 2560, getUrl: ƒ}
    length: 10__proto__: Array(0)
    place_id: "ChIJERCNwci3t4kR92ClBSxkv14"
    rating: 4.7
    reference: "CmRRAAAAUSlWLe2Q59HC5F5xOTssz0Y6TglQgYyMdBL-b6DGDi9T5XXroR_fp8su8t8u6MZvDJh0jDR6HpxJHo2Noy_YW_mjmURLl5n5WJv0_7z-RA7lKfgOFzTx7sHQYbY9AArQEhBvqWlQZf9TnKg01ZXVbxnZGhQCgdrCanWnN74upBw3Wi6KbMGjNQ"
    reviews: (5) [{…}, {…}, {…}, {…}, {…}]
     0: {author_name: "Nikhil Nachappa", author_url: "https://www.google.com/maps/contrib/105839142199519512141/reviews", language: "en", profile_photo_url: "https://lh6.googleusercontent.com/-B0BB1NHi5ys/AAA…KhLNCUUj4/s128-c0x00000000-cc-rp-mo-ba4/photo.jpg", rating: 5, …}author_name: "Nikhil Nachappa"author_url: "https://www.google.com/maps/contrib/105839142199519512141/reviews"language: "en"profile_photo_url: "https://lh6.googleusercontent.com/-B0BB1NHi5ys/AAAAAAAAAAI/AAAAAAAAW3g/ukKhLNCUUj4/s128-c0x00000000-cc-rp-mo-ba4/photo.jpg"rating: 5relative_time_description: "2 months ago"text: "One of my favorite museums in the Washington DC area. The cafe serves excellent coffee and food. The museum itself is worth the ~$10 entry fee. Renoir's 'Luncheon of the Boating Party' is obviously the highlight but there are other interesting works as well. A highly recommended place for sure. ↵↵The location is very close to Dupont Circle. The museum is very easy to navigate, it has a nice gift shop and cafe for snacking. The staff were friendly and helpful."time: 1522954232__proto__: Object
     1: {author_name: "M. B.", author_url: "https://www.google.com/maps/contrib/108675554668122129275/reviews", language: "en", profile_photo_url: "https://lh6.googleusercontent.com/-tC1GNDTfRQE/AAA…LjOwVktd0/s128-c0x00000000-cc-rp-mo-ba3/photo.jpg", rating: 5, …}
     2: {author_name: "Kathryn Arrildt", author_url: "https://www.google.com/maps/contrib/102408239738413916939/reviews", language: "en", profile_photo_url: "https://lh4.googleusercontent.com/-8NYT_OfBRf0/AAA…U/bPftaufCmuw/s128-c0x00000000-cc-rp-mo/photo.jpg", rating: 4, …}
     3: {author_name: "Nicholas Harrigan", author_url: "https://www.google.com/maps/contrib/114482876327285895407/reviews", language: "en", profile_photo_url: "https://lh6.googleusercontent.com/-WK5N6EPRk2g/AAA…3WhxgPitY/s128-c0x00000000-cc-rp-mo-ba3/photo.jpg", rating: 5, …}
     4: {author_name: "Grace Martin", author_url: "https://www.google.com/maps/contrib/116754466331141094915/reviews", language: "en", profile_photo_url: "https://lh4.googleusercontent.com/-OjBv2QglLk4/AAA…Q/ilMBJVVs9PQ/s128-c0x00000000-cc-rp-mo/photo.jpg", rating: 4, …}
    scope: "GOOGLE"
    types: (5) ["art_gallery", "museum", "store", "point_of_interest", "establishment"]
    url: "https://maps.google.com/?cid=6827285700353024247"
    utc_offset: -240
    vicinity: "1600 21st Street Northwest, Washington"
    website: "http://www.phillipscollection.org/index.aspx"
*/