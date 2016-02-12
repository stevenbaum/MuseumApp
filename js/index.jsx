import React from 'react';
import {render} from 'react-dom';
// Separate JS file holds a single function, DATA,
// that returns an array of objects holding the museum data
import {DATA} from './museumData.js';


var Hello = (props) => (
		<div>Hey, {props.name}.</div>
	);

// Row within the table, lists a museum image & name
class ListRow extends React.Component {
	render () {
		return (
			<tr>
				<td><img src={this.props.museum.imageThumbnail} /></td>
				<td>{this.props.museum.name}</td>
			</tr>
		);
	}
}

// List of museums, composed of rows
class MuseumList extends React.Component {
	render () {
		let rows = [];

		// React likes it if array elements (like those that end up in lists/tables)
		// Each have a unique 'key' prop, which here is just a number
		for (var museum of this.props.museums) {
			rows.push(<ListRow key={museum.id} museum={museum} />);
		}
		return (
			<table>
				<thead>
					<tr>
						<th>Museum Master List</th>
					</tr>
				</thead>
				<tbody>{rows}</tbody>
			</table>
		);
	}
}

// Filterable list of museums, composed of a list and filtering search bar
class FilterList extends React.Component {
	render () {
		return (
			<div>
				<MuseumList museums={this.props.museumData} />
			</div>
		);
	}
}

let helloName = "Compputer";

render(<Hello name={helloName} />, document.getElementById('hello'));
render(<MuseumList museums={DATA()} />, document.getElementById('museumlist'));