import React from 'react';
//import {intlShape} from 'react-intl';

export default class Foo extends React.Component {
//	static propTypes = {
//		params: React.PropTypes.object,
//		children: React.PropTypes.any
//	}

	// static contextTypes = {
//    	history: React.PropTypes.object.isRequired,
//    	location: React.PropTypes.object.isRequired,
//		intl: intlShape.isRequired,
//		flux: React.PropTypes.object
	// }

    constructor() {
        super();
    }

	render() {
		return (<div className="Foo">{`Hello World`}</div>);
	}
}

