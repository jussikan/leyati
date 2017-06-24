import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import Baz from './Baz';

describe("Baz", () => {
    it("succeeds at full mount without props", () => {
        mount(<Baz />);
    });

    describe("renders", () => {
        // @leyati-retain
        it("renders an element with class \"Baz\" when mounted without props", () => {
            const wrapper = shallow(<Baz />);
            expect(wrapper.find(".Baz").length).toEqual(1, ".Baz not found");
        });
    });
});

describe("Baz friends", () => {
    it("are rendered without props", () => {
        const wrapper = mount(<Baz />);
        expect(wrapper.find(".Bax").length).toEqual(1, ".Bax not found");
    });
});
