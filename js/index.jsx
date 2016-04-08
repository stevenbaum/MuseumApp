import React from 'react';
import {render} from 'react-dom';

// Self PSA - functional components just use props.whatever,
// class components use this.props.whatever OR this.state.whatever if there's state constructed

// Functional Component Structure
/*var Hello = (props) => (
	<div>
		<div>Hey, {props.name}.</div>
	</div>
);*/

// Row within the table, lists a museum image & name
// Props is a Google PLace object (fields available in API)
class MuseumRow extends React.Component {

	selectMuseum() {
		this.props.handleClick(this.props.museum);
	}

	render() {
		return (
			<div id ="card" onClick={this.selectMuseum.bind(this, this.props.museum)}>
				<img id="tablethumbnail" src={this.props.museum.googlephoto} />
				<h5>{this.props.museum.name}</h5>
			</div>
		);
	}
};

// List of museums, composed of rows
class MuseumList extends React.Component {
	render() {
		let cards = [];

		// React likes it if array elements (like those that end up in lists/tables)
		// Each have a unique 'key' prop, which here is just a number
		for (var museum of this.props.museums) {
			if (museum.category === this.props.category || (this.props.category === "Top Five" && museum['top5'])) {
				cards.push(<MuseumRow handleClick={this.props.handleClick.bind(this)} key={museum.id} museum={museum} />);
			}
		}
		return (
			<div>
				<h2 id="tablehead">{this.props.category} Museums</h2>
				<div id="cardlist">{cards}</div>
			</div>
		);
	}
}

// TODO: Add in filters once category has been established: 'open now', 'free', etc.
class MuseumFilters extends React.Component {

	render() {
		return (
			<div>

			</div>
		);
	}
}

// List of museums with toggle-able filters above, only shows those of selected category
class FilterList extends React.Component {

	render() {
		return (
			<div id="museumtable">
				<MuseumList handleClick={this.props.handleClick.bind(this)} category={this.props.category} museums={this.props.museums} />
			</div>
		);
	}
}

// Google Maps map
class ActiveMap extends React.Component {

	componentDidMount() {
		let node = this.refs.mapnode;
		var mapObj = {
			center: {
				lat: this.props.lat,
				lng: this.props.lng,
			},
			zoom: 15,
		};
		var constructedMap = new google.maps.Map(node, mapObj);
	}

	render() {
		if (typeof this.refs.mapnode !== "undefined") {
			let node = this.refs.mapnode;
			var mapObj = {
				center: {
					lat: this.props.lat,
					lng: this.props.lng,
				},
				zoom: 15,
			};
			var constructedMap = new google.maps.Map(node, mapObj);
			var mapMarker = new google.maps.Marker({
				map: constructedMap,
				position: this.props.markerLocation,
			});
		}
		return (
			<div id="mapwrapper">
				<div ref="mapnode" id="activemap"></div>
			</div>
		);
	}
}

// Primary window for displaying a museum's information
// Props is an activeMuseum, determined by clicking on a table item
// <ActiveMap coordinates={this.props.activeInfo.coordinates} />
class InfoWindow extends React.Component {

	render() {
		var lat = 51.5081;
		var lng = -0.1281;
		var picurl = ""
		var markerLocation = {lat: 0, lng: 0};
		if (typeof this.props.activeInfo.coordinates !== 'undefined') {
			lat = this.props.activeInfo.coordinates.lat;
			lng = this.props.activeInfo.coordinates.lng;
			markerLocation = this.props.activeInfo.markerLocation;
		}

		if (this.props.activeMuseum !== null) {
			picurl = this.props.activeMuseum.googlephoto;
		}

		return (
			<div id="infowindow">
				<h1>{this.props.activeInfo.name}</h1>
				<div id="imagewrapper">
					<img id="profilepic" src={picurl} />
					<ActiveMap lat={lat} lng={lng} markerLocation={markerLocation}/>
				</div>
				<a id="museumsitebutton" href={this.props.activeInfo.website} target="_blank">Go to site</a>
				<p id="blurb">{this.props.activeInfo.blurb}</p>
			</div>
		);
	}
}

// Six-icon menu to select/set museum category; 'landing page' of app
class WheelMenu extends React.Component {

	selectCategory(cat) {
		this.props.onCategoryChange(cat);
	}

	render() {
		// Sublime sees a syntax highlighting error on the <h1> because of the apostrophe, but it compiles correctly
		return (
			<div id="menu">
				<h1 id="menutitle">Explore <span id="the">the</span> Capital's Museums</h1>
				
				<img id="menuhistory" onClick={this.selectCategory.bind(this, 'History')} src="../images/menuhistory.png" />

				<img id="menuart" onClick={this.selectCategory.bind(this, 'Art')} src="../images/menuart.png" />

				<img id="menumedia" onClick={this.selectCategory.bind(this, 'Media')} src="../images/menumedia.png" />

				<img id="menutop" onClick={this.selectCategory.bind(this, 'Top Five')} src="../images/menutop.png" />

				<img id="menumilitary" onClick={this.selectCategory.bind(this, 'Military')} src="../images/menumilitary.png" />

				<img id="menuscience" onClick={this.selectCategory.bind(this, 'Science')} src="../images/menuscience.png" />
			</div>
		);
	}
}

// Top component for app; propagates to all others, gathers museum data from Google & Wikipedia
// Has 3 children: WheelMenu, InfoWindow, & FilterList
class MuseumApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//Array of Places, w/o details though
			museums: [],
			currentCategory: null,
			activeMuseum: null,
			wikiText: null,
			activeInfo: {},
		}
	}

	// Triggers initial AJAX requests; gets museum Places and Wikipedia list of museums
	componentDidMount() {
		console.log("mount");
		// Call a nearby Search for Places (museums) in radius around Trafalgar Sq.
		// Order the results by prominence, then go to callback function
		// Callback function populates array with place_ids from each Place found
		// (places, status, pagination) => is the callback function; uses arrow to bind this.state
		// to the 'this' of the class, rather than the 'this' of the callback function
		var trafalgarSquare = {lat: 51.5081, lng: -0.1281};
		var service = new google.maps.places.PlacesService(map);
		var placeResults = [];
		service.nearbySearch({
			location: trafalgarSquare,
			radius: 5000,
			type: ['museum'],
			rankBy: google.maps.places.RankBy.PROMINENCE,
			},
			(places, status, pagination) => {
				if (status === google.maps.places.PlacesServiceStatus.OK) {
					for (var place of places) {
						if (place.photos) {
							place['googlephoto'] = place.photos[0].getUrl({'maxHeight': 500, 'maxWidth': 500});
						}
						placeResults.push(place);
					}
					// Get next 20 places, must be gathered as separate call to .nextPage() per api specs
					var nextResults;

					if (pagination.hasNextPage) {
						nextResults = pagination.nextPage();
						for (var place of nextResults) {
							if (place.photos) {
								place['googlephoto'] = place.photos[0].getUrl({'maxHeight': 500, 'maxWidth': 500});
							}
							placeResults.push(place);
						}
					}
					var currentMuseum = placeResults[0];
					// If user has selected a category by the time museums load, set active museum
					// to first museum in master list that is of that category
					if (this.state.currentCategory !== null) {
						for (var museum of placeResults) {
							if ((museum.name === "The British Museum" && (this.state.currentCategory === "History" 
																		|| this.state.currentCategory === "Top Five")) ||
								(museum.name === "The National Gallery" && this.state.currentCategory === "Art") ||
								(museum.name === "Churchill War Rooms" && this.state.currentCategory === "Military") ||
								(museum.name === "Science Museum" && this.state.currentCategory === "Science")) 
							{
								currentMuseum = museum;
							}
						}
					}

					// setState tells React state has changed, updates UI accordingly
					this.setState({museums: placeResults, activeMuseum: currentMuseum});
					// If Wiki AJAX has already completed, use museum list & wiki data to assign categories
					if (this.state.wikiText !== null) {
						this.assignSubCategories();
					}
					this.getActive();
				} else {
						console.log("Error in nearbySearch - Filterlist");
				}
			});

		// Use HTTP request via jQuery $.ajax for MediaWiki to pull List of London Museums for museum categorization
		$.ajax({
			type: "GET",
			url: "https://en.wikipedia.org/w/api.php?action=query&prop=revisions&callback=?&rvprop=content&format=json&titles=List%20of%20museums%20in%20London",
			dataType: 'jsonp',
			jsonp: 'callback',
			headers: { 'Api-User-Agent': 'stevenMuseumApp' },
			xhrFields: { withCredentials: true },
			app: this,
			success: function(data) {
				var page = data.query.pages;
				var pageKey = Object.keys(page)[0];
				var text = page[pageKey].revisions[0]["*"];
				this.app.setState({wikiText: text});

				// If Google Places has already populated museums, assign categories
				if (this.app.state.museums.length > 0) {
					this.app.assignSubCategories();
				}
			}
		});
	}

	// Selecting a category from menu, update category and refresh museum list with new active museum (1st item)
	setCurrentCategory(category) {
		var newActiveMuseum = null;
		for (var museum of this.state.museums) {
			if (museum.category === category || (category === "Top Five" && museum['top5'])) {
				newActiveMuseum = museum;
				break;
			}
		}
		this.setState({currentCategory: category, activeMuseum: newActiveMuseum});
		this.getActive();
	}

	// Sets activeMuseum state; passed to each MuseumRow
	setActiveMuseum(museum) {
		this.setState({activeMuseum: museum});
	}

	// Get the information for info window
	getActive() {
		this.getActiveDetails();
		this.getActiveWiki();
	}

	// Assuming there is an active museum, grab details via getDetails
	getActiveDetails() {
		if (this.state.activeMuseum !== null) {
			var place_id = this.state.activeMuseum.place_id;
			var request = {
				placeId: place_id
			};

			var service = new google.maps.places.PlacesService(map);
			service.getDetails(request,
				(place, status) => {
					if (status === google.maps.places.PlacesServiceStatus.OK) {
						var info = this.state.activeInfo;
						info.coordinates = {
							lat: place.geometry.location.lat(),
						    lng: place.geometry.location.lng(),
						};
						info.markerLocation = place.geometry.location;
						info.name = place.name;
						info.website = place.website;
						info.rating = place.rating;
						this.setState({activeInfo: info});
					}
				}
			);
		}
	}

	// Assuming there is an active museum, get wiki intro via mediawiki AJAX call
	getActiveWiki () {
		if (this.state.activeMuseum !== null) {
			if (this.state.activeMuseum.wikiName !== undefined) {
				if (this.state.activeMuseum.name === 'Hunterian Museum') {
					this.state.activeMuseum.wikiName = 'Royal College of Surgeons of England';
				// Edge cases for generic museums without 'London' specifier, append ', London' to end
				} else if (
					(this.state.activeMuseum.name === "Natural History Museum" ||
					this.state.activeMuseum.name === "Science Museum" ||
					this.state.activeMuseum.name === "Spencer House Ltd" ||
					this.state.activeMuseum.name === "National Portrait Gallery")
					&&	this.state.activeMuseum.wikiName.indexOf(", London") === -1) 
				{
					this.state.activeMuseum.wikiName += ", London";
				}

				// Ajax to get Wikipedia introduction paragraph ('blurb')
				$.ajax ({
					type: "GET",
					url: "https://en.wikipedia.org/w/api.php?format=json&action=query&exsentences=4&prop=extracts&exintro=&explaintext=&titles=" + this.state.activeMuseum.wikiName,
					dataType: 'jsonp',
					jsonp: 'callback',
					headers: { 'Api-User-Agent': 'stevenMuseumApp' },
					xhrFields: { withCredentials: true },
					app: this,
					success: function(data) {
						var page = data.query.pages;
						var pageKey = Object.keys(page)[0];
						var description = page[pageKey].extract;
						// If description is empty, you have to find the correct wiki title via the redirect
						if (description === "") {
							this.app.getRedirectWiki();
						} else {
							if (description.indexOf("^") !== -1) {
								description = description.substr(0, description.indexOf("^"));
							}
							var info = this.app.state.activeInfo;
							info.blurb= description;
							this.app.setState({activeInfo: info});
						}
					}
				});
			}
		}
	}

	//
	getRedirectWiki() {
		$.ajax ({
				type: "GET",
				url: "https://en.wikipedia.org/w/api.php?action=query&prop=revisions&callback=?&rvprop=content&format=json&titles=" + this.state.activeMuseum.wikiName,
				dataType: 'jsonp',
				jsonp: 'callback',
				headers: { 'Api-User-Agent': 'stevenMuseumApp' },
				xhrFields: { withCredentials: true },
				app: this,
				success: function(data) {
					var page = data.query.pages;
					var pageKey = Object.keys(page)[0];
					var redirectText = page[pageKey].revisions[0]["*"];
					var redirectName = "";
					for (var i = 0; i < redirectText.length; i++) {
						if (redirectText[i] === "[" && redirectText[i+1] === "[") {
							i += 2;
							while (redirectText[i] !== "]") {
								redirectName += redirectText[i];
								i += 1;
							}
							break;
						}
					}
					this.app.state.activeMuseum.wikiName = redirectName;
					this.app.getActiveWiki();
				}
			});
	}

	// Once sub-categories have been gathered, iterate through museums
	// and compare their subcategory against the category list
	// Adds 'category' property to each museum obj, as well as whether it's a Top 5 Museum or not
	assignCategories() {
		var categorizedMuseums = [];
		for (var museum of this.state.museums) {
			var subcategory = museum.subcategory;
			if (museum.name === "The British Museum" || museum.name === "Victoria and Albert Museum"
			|| museum.name === "The National Gallery" || museum.name === "Tate Modern" || museum.name === "Museum of London") {
				museum['top5'] = true;
			} else {
				museum['top5'] = false;
			}
			if (museum.name === "Victoria and Albert Museum") { // Niche case; more art than history
				museum['category'] = "Art";
				categorizedMuseums.push(museum);
				continue;
			}
			if (museum.name === "The Sherlock Holmes Museum" || museum.name === "Charles Dickens Museum") { // Niche cases; not history museums
				museum['category'] = "Media";
				categorizedMuseums.push(museum);
				continue;
			}
			if (museum.name === "Churchill War Rooms") { // Other niche case; War Rooms is military, not 'multiple'
				museum['category'] = "Military";
				categorizedMuseums.push(museum);
				continue;
			}
			for (var category of Object.keys(this.props.categories)) {
				for (var keyword of this.props.categories[category]) {
					if (subcategory.indexOf(keyword) !== -1) {
						museum['category'] = category;
						categorizedMuseums.push(museum);
					}
				}
			}
		}
		this.setState({museums: categorizedMuseums});
	}

	// Iterate over each museum, check its name against the Wiki table, grab category from text
	// This should only be called when both the museum array and wikiText are received from their AJAX calls
	// Adds 'subcategory' property to each museum obj
	assignSubCategories() {
		var categorizedMuseums = [];
		for (var museum of this.state.museums) {
			var name = museum.name
			// Edge cases; Google Places that don't match with wiki Table
			if (name === "Golden Hinde II") {
				name = "Golden Hinde";
			} else if (name === "Shakespeare's Globe"){
				name = "Shakespeare\u2019s Globe Exhibition";
			} else if (name === "Handel and Hendrix in London") {
				name = "Handel House Museum";
			} else if (name === "Spencer House Ltd") {
				name = "Spencer House";
			} else if (name === "Museum of the Order of Saint John") {
				name = "Museum of the Order of St John";
			}
			// Wiki omits "The -----" from start of museum name, do the same with Places name EXCEPT The Magic Circle
			if (name !== "The Magic Circle" &&
				name[0] === "T" &&
				name[1] === "h" &&
				name[2] === "e" &&
				name[3] === " ") 
			{
				name = name.substr(4);
			}
			museum['wikiName'] = name;

			// Science & IWM need additional info to find
			if (name === "Science Museum" || name === "Imperial War Museum") {
				name = "-\n! [[" + name;
			}
			// Find museum within doc; search for name, and the category is 4 slots ('||') after
			var index = this.state.wikiText.indexOf(name);
			var count = 0;
			var letter = '';
			if (index !== -1) {
				while (count < 4) {
					if (this.state.wikiText[index] === '|' && this.state.wikiText[index+1] === '|') {
						count += 1;
						index += 1;
					}
					index += 1;
				}
				var hitNextBar = false;
				var category = '';
				// Collect string until next '||', this should be the || (category) ||
				while (hitNextBar === false) {
					if (this.state.wikiText[index] === '|' && this.state.wikiText[index+1] === '|') {
						hitNextBar = true;
					} else {
						category += this.state.wikiText[index];
						index += 1;
					}
				}
				category = category.trim();
				museum['subcategory'] = category;
				categorizedMuseums.push(museum);
			}
		}
		this.setState({museums: categorizedMuseums});
		this.assignCategories();
	}

	render() {
		if (this.state.activeMuseum !== null) {
			if (this.state.activeInfo === {} || (this.state.activeMuseum.name !== this.state.activeInfo.name)) {
				this.getActive();
			}
		}

		return (
			<div id="appwrapper">
				<WheelMenu onCategoryChange={this.setCurrentCategory.bind(this)} />
				<div id="maindisplay">
					<FilterList handleClick={this.setActiveMuseum.bind(this)} category={this.state.currentCategory} museums={this.state.museums} />
					<InfoWindow activeInfo={this.state.activeInfo} activeMuseum={this.state.activeMuseum} />
				</div>
			</div>
		);
	}
}

// Manual Grouping of categories by keywords from Wiki
var categories = {
	History: ['History', 'Historic house', 'Local', 'Ethnic', 'Living', 'Biographical', 'Archaeology', 'Numismatic', 'Library', 'Multiple', 'Prison', 'Gardening'],
	Art: ['Art', 'Contemporary art', 'Design', 'Fashion'],
	Media: ['Media', 'Film', 'Cinema', 'Theatre', 'Theater', 'Comedy', 'Magic', 'Music', 'Sports', 'Wax'],
	Military: ['War', 'Military', 'Maritime', 'Aviation'],
	Science: ['Science', 'Technology', 'Transportation', 'Natural history', 'Medical'],
};

// And-a-one, and-a-two, and away we go~
render(<MuseumApp categories={categories}/>, document.getElementById('museumapp'));