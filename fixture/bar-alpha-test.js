import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import Bar from './Bar';

describe("Bar", () => {
    it("succeeds at shallow mount without props", () => {
        shallow(<Bar />);
    });

    describe("for teh lulz", () => {
        it("renders an element with class \"Bar\" when mounted without props", () => {
            const wrapper = mount(<Bar />);
            expect(wrapper.find(".Bar").length).toEqual(1, ".Bar not found");
        });
    })
});

describe("for testing", () => {
});
