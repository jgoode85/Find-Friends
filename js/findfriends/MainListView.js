dojo.provide("findfriends.MainListView");

dojo.require("dojox.mobile.ScrollableView");

/*
 * Called when the widget has been created.  Retains functionality of Scrollable View and
 * sets the onlick event for the login button
 */
dojo.declare("findfriends.MainListView", [dojox.mobile.ScrollableView], {


	startup: function() {
	
		this.inherited(arguments);

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
			
		FB.api('/search?type=checkin', function(result) {
		

		   dojo.forEach(result.data, function(fbRow){
			   
				
				
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
				
				//Update the content of the ListItem with the formatted data
				item.containerNode.innerHTML = '<div class="checkinContent"><div class="checkinUsers">' + people + '</div>'+
				'<div class="checkinLocation">' + fbRow.place.name + ', ' + fbRow.place.location.street + ', ' +
				fbRow.place.location.city + ', ' + fbRow.place.location.state + '</div></div>';   	
			});
	
		});
	}

});