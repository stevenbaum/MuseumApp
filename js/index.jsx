import React from 'react';
import {render} from 'react-dom';

// PSA - functional components just use props.whatever,
// class components use this.props.whatever OR this.state.whatever if there's state constructed,
// Don't get them switched or everything explodes

// Functional Component Structure
/*var Hello = (props) => (
	<div>
		<div>Hey, {props.name}.</div>
		<input type="button" onclick={changemap} value="Click mee" />
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
			<tr>
				<td onClick={this.selectMuseum.bind(this, this.props.museum)}>{this.props.museum.name}</td>
			</tr>
		);
	}
};

// List of museums, composed of rows
class MuseumList extends React.Component {
	render() {
		let rows = [];

		// React likes it if array elements (like those that end up in lists/tables)
		// Each have a unique 'key' prop, which here is just a number
		for (var museum of this.props.museums) {
			if (museum.category === this.props.category || (this.props.category === "Top5" && museum['top5'])) {
				rows.push(<MuseumRow handleClick={this.props.handleClick.bind(this)} key={museum.id} museum={museum} />);
			}
		}
		return (
			<table id="museumtable">
				<thead>
					<tr>
						<th id="tablehead">Museum Master List</th>
					</tr>
				</thead>
				<tbody>{rows}</tbody>
			</table>
		);
	}
}

class MuseumFilters extends React.Component {

	render() {
		return (
			<div>

			</div>
		);
	}
}

class FilterList extends React.Component {

	render() {
		return (
			<div>
				<MuseumList handleClick={this.props.handleClick.bind(this)} category={this.props.category} museums={this.props.museums} />
			</div>
		);
	}
}

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
			<div ref="mapnode" id="activemap"></div>
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
		var markerLocation = {lat: 0, lng: 0};
		if (typeof this.props.activeInfo.coordinates !== 'undefined') {
			lat = this.props.activeInfo.coordinates.lat;
			lng = this.props.activeInfo.coordinates.lng;
			markerLocation = this.props.activeInfo.markerLocation;
		}

		return (
			<div id="infoBox">
				<ActiveMap lat={lat} lng={lng} markerLocation={markerLocation}/>
				<a href={this.props.activeInfo.website} target="_blank">Go to site</a>
				<p>Name = {this.props.activeInfo.name}</p>
				<p>{this.props.activeInfo.blurb}</p>
			</div>
		);
	}
}

class WheelMenu extends React.Component {

	selectCategory(cat) {
		this.props.onCategoryChange(cat);
	}

	render() {

		return (
			<div id="menu">
				<p>Explore The Capital's Museums</p>
				<div id="menuHistory" onClick={this.selectCategory.bind(this, 'History')}>
					History
				</div>
				<div id="menuArt" onClick={this.selectCategory.bind(this, 'Art')}>
					Art
				</div>
				<div id="menuMedia" onClick={this.selectCategory.bind(this, 'Media')}>
					Media
				</div>
				<div id="menuTop" onClick={this.selectCategory.bind(this, 'Top5')}>
					Top 5
				</div>
				<div id="menuMilitary" onClick={this.selectCategory.bind(this, 'Military')}>
					Military
				</div>
				<div id="menuScience" onClick={this.selectCategory.bind(this, 'Science')}>
					Science
				</div>
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
			radius: 4000,
			type: ['museum'],
			rankBy: google.maps.places.RankBy.PROMINENCE,
			},
			(places, status, pagination) => {
				if (status === google.maps.places.PlacesServiceStatus.OK) {
					for (var place of places) {
						placeResults.push(place);
					}
					// Get next 20 places, must be gathered as separate call to .nextPage() per api specs
					var nextResults;

					if (pagination.hasNextPage) {
						nextResults = pagination.nextPage();
						for (var place of nextResults) {
							placeResults.push(place);
						}
					}

					// setState tells React state has changed, updates UI accordingly
					this.setState({museums: placeResults, activeMuseum: placeResults[0]});
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
			if (museum.category === category || (category === "Top5" && museum['top5'])) {
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

			$.ajax ({
				type: "GET",
				url: "https://en.wikipedia.org/w/api.php?format=json&action=query&exsentences=8&prop=extracts&exintro=&explaintext=&titles=" + this.state.activeMuseum.wikiName,
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
						var info = this.app.state.activeInfo;
						info.blurb= description;
						this.app.setState({activeInfo: info});
					}
				}
			});
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
			<div>
				<WheelMenu onCategoryChange={this.setCurrentCategory.bind(this)} />
				<InfoWindow activeInfo={this.state.activeInfo} />
				<FilterList handleClick={this.setActiveMuseum.bind(this)} category={this.state.currentCategory} museums={this.state.museums} />
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