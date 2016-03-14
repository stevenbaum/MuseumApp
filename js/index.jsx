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
	render () {
		return (
			<div>
				<p>{this.props.text}</p>
			</div>
		);
	}
}

// Row within the table, lists a museum image & name
// Currently the state for each row holds metadata for that museum
// Props is a Google PLace object gathered from mapCalls.js,
// Given to React by calling getDetailArray(), API docs show object structure
class MuseumRow extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: props.museum.name,
		}
	}

	render () {
		return (
			<tr>
				<td>{this.state.name}</td>
			</tr>
		);
	}
};

// List of museums, composed of rows
class MuseumList extends React.Component {
	render () {
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

// Filterable list of museums, composed of a list and filtering search bar
// Run Maps Init here
class FilterList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//Array of Places, w/o details though
			museums: [],
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
					this.setState({museums: placeResults});
				} else {
						console.log("Error in nearbySearch - Filterlist");
				}
			});
	}

	render () {
		return (
			<div>
				<MuseumList museums={this.state.museums} />
			</div>
		);
	}
}

let helloName = "Compputer";
let txt = "textextext";
let museumObjects = getPlaceArray();

render(<Hello name={helloName} />, document.getElementById('hello'));
render(<Helloo text={txt} />, document.getElementById('helloo'));
render(<FilterList />, document.getElementById('filterlist'));
