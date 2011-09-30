dojo.provide("findfriends.MainListView");

dojo.require("dojox.mobile.ScrollableView");

/*
 * Called when the widget has been created.  Retains functionality of Scrollable View and
 * sets the onlick event for the login button
 */
dojo.declare("findfriends.MainListView", [dojox.mobile.ScrollableView], {


	startup: function() {
	
		this.inherited(arguments);
		
		//Get the users current location
		this.initialLocation = null;
		this.getCurrentLocation();


		//set the onclick event for the login button
		var loginButton = dojo.byId("loginButton");
		dojo.connect(loginButton, "onclick", this, "login");
		
	},
		
	/*
	 * Invoked on the click of the login button.  Calls Facebook API to login and
	 * request friends_checkin persmissions.  Sets callback function.
	 */
	login: function() {
		
		FB.login(dojo.hitch(this, "loginCallback"), {scope: 'friends_checkins'});
		
	},

		
	/*
	 * Called by Facebook API when the login is complete.  If the user logged in and granted 
	 * correct permissions, then change login button to refresh and get checkin data for the
	 * user.
	 */
	loginCallback:function(){
	
		if (response.authResponse) {
				this.getFBCheckins();
				
				//Display the refresh button instead of the login button
				dojo.byId("loginButton").style.display = 'none';
				var refreshButton = dojo.byId("refreshButton");
				refreshButton.style.display = 'block';
				dojo.connect(refreshButton, "onclick", this, "getFBCheckins");
				
		} else {
				alert('User cancelled login or did not fully authorize.');
		}
		
	},

	
	/*
	 * Makes call to Facebook API to get checkin data for the user's friends and displays 
	 * data in List.
	 */
	getFBCheckins:function(){
	
		//Delete all the content currently in the ListView
		dijit.byId("checkinList").destroyDescendants(false);
			
		FB.api('/search?type=checkin', dojo.hitch(this, function(result) {
		
			var searchRadius = dojo.byId("searchRadius").value;
			
			var noData = true;
			
			if(result.data != null) {
		
				dojo.forEach(result.data, dojo.hitch(this,function(fbRow){
			   
					//If the user's current location is known, calculate the distance between the
					//user and the checkin location
					if(this.initialLocation != null) {
						var distance = this.getDistance(this.initialLocation, new google.maps.LatLng(fbRow.place.location.latitude,fbRow.place.location.longitude));		   		
						distance = Math.round(distance);
					}
					
					//Include the checkin information in the ListView if the distance is within the
					//search radius or the current location of the user is unkown
					if( distance <= searchRadius || this.initialLocation == null) {
				   
				   		//we have data to display to the user
				   		noData = false;
						
						//create a new list node and add it to the list of FB data
						var checkinList = dojo.byId("checkinList");
						var item = new dojox.mobile.ListItem({"class": "checkinListItem"}).placeAt(checkinList, "last");
						
						//update content of the list node with FB checkin data
						var people = fbRow.from.name;
						
						//Get the list of tagged individuals and add it to the people string
						if(fbRow.tags != null){
						
							dojo.forEach(fbRow.tags.data, function(person){
								people = people + ", " + person.name;
							});
						}
						
						//Format the data for the list item
						var listItemContent = '<div class="checkinContent">';
						
						//Include the distance to the location if the user's current position is known
						if(this.initialLocation != null){
							listItemContent = listItemContent + '<div class="checkinMiles">' + distance + ' miles</div>';
						}
						
						listItemContent = listItemContent + '<div class="checkinUsers">' + people + '</div>'+
						'<div class="checkinLocation">' + fbRow.place.name + ', ' + fbRow.place.location.street + ', ' +
						fbRow.place.location.city + ', ' + fbRow.place.location.state + '</div></div>';   	
						
						//Update the content of the ListItem with the formatted data
						item.containerNode.innerHTML = listItemContent;
					
					}
				}));
			}
			
			//If no search data within the radius was found, display a message to the user that we could not find there friends
			if(noData){
				
				//create a new list node and add it to the list of FB data
				var checkinList = dojo.byId("checkinList");
				var item = new dojox.mobile.ListItem({"class": "checkinListItem"}).placeAt(checkinList, "last");
				
				item.containerNode.innerHTML = '<div class="checkinContent"><div class="checkinUsers">Sorry we could not find your friends.</div>';
			}
			
		}));
		
	},
	
	/*
	 * Detects the user's current position using either W3C Geolocation or Google Gears Geolocation
	 * If the user's location is detected, the initalLocation variable is set the that location.
	 */
	getCurrentLocation:function(){
		
		var browserSupportFlag = new Boolean();

		// Try W3C Geolocation (Preferred)
	  	if(navigator.geolocation) {
			browserSupportFlag = true;
			navigator.geolocation.getCurrentPosition(dojo.hitch(this, function(position) {
		  	this.initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
		}), function() {
		  	this.initialLocation = null;
		});
	  // Try Google Gears Geolocation
	 	} else if (google.gears) {
			browserSupportFlag = true;
			var geo = google.gears.factory.create('beta.geolocation');
			geo.getCurrentPosition(dojo.hitch(this,function(position) {
		  	this.initialLocation = new google.maps.LatLng(position.latitude,position.longitude);
			}), function() {
		  		this.initialLocation = null;
			});
	  // Browser doesn't support Geolocation
	  	} else {
			this.initialLocation = null;		
	  	}
 	
	},
	
	/*
	 * Calculates the distance between two coordinates using the Haversine Formula.
	 *
	 * position1: The Google Maps LatLng object for the first set of coordinates
	 * position2: The Google Maps LatLng object for the second set of coordinates.
	 *
	 * Returns the number of miles between the two coordinates
	 */
	getDistance:function(position1, position2){
			
		var lat1 = position1.lat();
		var lon1 = position1.lng();
		
		var lat2 = position2.lat();
		var lon2 = position2.lng();
		
		var R = 3958.75587; // miles
		var dLat = (lat2-lat1) * Math.PI / 180;
		var dLon = (lon2-lon1) * Math.PI / 180;
		var lat1 = lat1 * Math.PI / 180;
		var lat2 = lat2 * Math.PI / 180;
		
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var distance = R * c;
				
		return distance;
	
	}

});