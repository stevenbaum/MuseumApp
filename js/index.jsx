import React from 'react';
import {render} from 'react-dom';
// Separate JS file holds a single function, DATA,
// that returns an array of objects holding the museum data

// PSA - functional components just use props.whatever,
// class components use this.props.whatever OR this.state.whatever if there's state constructed,
// Don't get them switched or everything explodes

var Hello = (props) => (
	<div>
		<div>Hey, {props.name}.</div>
		<input type="button" onClick={changemap} value="Click mee" />
	</div>
	);

class Helloo extends React.Component {
	render() {
		return (
			<div>
				<p>{this.props.text}</p>
			</div>
		);
	}
}

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
			wikiChart: null,
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
				} else {
						console.log("Error in nearbySearch - Filterlist");
				}
			});

		// Use HTTP request for MediaWiki to pull List of London Museums for museum categorization
		var httpRequest = new XMLHttpRequest();

		httpRequest.open('GET', url);
		httpRequest.setRequestHeader( 'Api-User-Agent', 'stevenmichaelbaum/1.0' );
		httpRequest.setRequestHeader('Access-Control-Allow-Origin', '*');
		var url = "https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=List%20of%20museums%20in%20London";
		var wikiText = "empty";

		httpRequest.onreadystatechange = function () {
			if (httpRequest.readyState === XMLHttpRequest.DONE) {
				if (httpRequest.status === 200) {
					wikiText = httpRequest.responseText;
				}
			}
		};
		httpRequest.send();
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

let helloName = "Compputer";
let txt = "textextext";

render(<Hello name={helloName} />, document.getElementById('hello'));
render(<Helloo text={txt} />, document.getElementById('helloo'));
render(<MuseumApp />, document.getElementById('museumapp'));
