import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import Baz from './Baz';

describe("Baz", () => {
    it("succeeds at full mount without props __PASS__", () => {
        mount(<Baz />);
    });

    describe("renders", () => {
        // @leyati-retain
        it("renders an element with class \"Baz\" when mounted without props __PASS__", () => {
            const wrapper = shallow(<Baz />);
            expect(wrapper.find(".Baz").length).toEqual(1, ".Baz not found");
        });
    });
});

describe("Baz friends", () => {
    it("are rendered without props __FAIL__", () => {
        const wrapper = mount(<Baz />);
        expect(wrapper.find(".Bax").length).toEqual(1, ".Bax not found");
    });
});
