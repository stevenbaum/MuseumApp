import React from 'react';
import {render} from 'react-dom';

// PSA - functional components just use props.whatever,
// class components use this.props.whatever OR this.state.whatever if there's state constructed,
// Don't get them switched or everything explodes

// Functional Component Structure
/*var Hello = (props) => (
	<div>
		<div>Hey, {props.name}.</div>
		<input type="button" onClick={changemap} value="Click mee" />
	</div>
);*/

// Row within the table, lists a museum image & name
// Props is a Google PLace object (fields available in API)
class MuseumRow extends React.Component {

	render() {
		return (
			<tr>
				<td>{this.props.museum.name}</td>
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
			rows.push(<MuseumRow key={museum.id} museum={museum} />);
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
				<MuseumList museums={this.props.museums} />
			</div>
		);
	}
}

// Primary window for displaying a museum's information
// Props is an activeMuseum, determined by clicking on a table item
class InfoWindow extends React.Component {

	// Need state to trigger renders when callback for getDetails finally arrives
	constructor(props) {
		super(props);
		this.state = {
			name: "temp",
			website: null,
			price: null,
			rating: null,
			photos: null,
			hours: 5,
		}
	}

	render() {
		// Make API call here to get Details
		// Invariant: Render only happens when state of MuseumApp changes,
		// which always changes the activeMuseum field, so call is always appropriate
		var place_id;
		var name = "tempp";

		if (this.props.activeMuseum !== null) {
			name = this.props.activeMuseum.name;
			place_id = this.props.activeMuseum.place_id;
			var request = {
				placeId: place_id
			};

			var service = new google.maps.places.PlacesService(map);
			service.getDetails(request,
				(place, status) => {
					if (status === google.maps.places.PlacesServiceStatus.OK) {
						this.setState({
							website: place.website,
							hours: 6
						});
					};
				});
		}

		return (
			<div>
				<a href={this.state.website}>Go to site</a>
				<p>Hours = {this.state.hours}</p>
				<p>Name = {name}</p>
			</div>
		);
	}
}

// Top component for app; propagates to all others, gathers museum data
// Has 2 children: InfoWindow & FilterList
// Run Maps Init here
class MuseumApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//Array of Places, w/o details though
			museums: [],
			activeMuseum: null,
			wikiText: null,
		}
	}

	// For AJAX use componentDidMount and put request in here,
	// Will trigger render when request arrives
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
						this.assignCategories();
					}
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
					this.app.assignCategories();
				}
			}
		});
	}

	// Iterate over each museum, check its name against the Wiki table, grab category from text
	// This should only be called when both the museum array and wikiText are received from their AJAX calls
	assignCategories() {
		var categorizedMuseums = [];
		for (var museum of this.state.museums) {
			var museumReplace = museum;
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
			} else if (name === "Science Museum" || name === "Imperial War Museum") {
				name = "-\n! [[" + name;
			}
			// Wiki omits "The -----" from start of museum name, do the same with Places name
			if (name[0] === "T" &&
				name[1] === "h" &&
				name[2] === "e" &&
				name[3] === " ") 
			{
				name = name.substr(4);
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
				museumReplace['category'] = category;
				categorizedMuseums.push(museumReplace);
			}
		}
		this.setState({museums: categorizedMuseums});
	}

	render() {

		return (
			<div>
				<InfoWindow activeMuseum={this.state.activeMuseum} />
				<FilterList museums={this.state.museums} />
			</div>
		);
	}
}

render(<MuseumApp />, document.getElementById('museumapp'));

// Manual Grouping of categories by keywords from Wiki
var categories = {
	history: ['history', 'historic house', 'ethnic', 'multiple', 'living', 'biographical', 'archaeology', 'numismatic', 'library', 'multiple', 'prison', 'gardening'],
	art: ['art', 'contemporary art', 'design', 'fashion'],
	media: ['media', 'film', 'cinema', 'theatre', 'theater', 'comedy', 'magic', 'music', 'sports', 'wax'],
	military: ['war', 'military', 'maritime', 'aviation', ],
	science: ['science', 'technology', 'transportation', 'natural history', 'medical']
};