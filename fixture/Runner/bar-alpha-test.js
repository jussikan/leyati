import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import Bar from './Bar';

describe("Bar", () => {
    it("succeeds at shallow mount without props __PASS__", () => {
        shallow(<Bar />);
    });

    describe("for teh lulz", () => {
        it("renders an element with class \"Bar\" when mounted without props __FAIL__", () => {
            const wrapper = mount(<Bar />);
            expect(wrapper.find(".Bar").length).toEqual(1, ".Bar not found");
        });
    })
});

describe("more Bar", () => {
    it("succeeds at deep mount without props __PASS__", () => {
        mount(<Bar />);
    });
});
