import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import Foo from './Foo';

describe("Foo", () => {
    it("succeeds at shallow mount without props", () => {
        shallow(<Foo />);
    });

    it("succeeds at deep mount without props", () => {
        mount(<Foo />);
    });
});

describe("Foo contents", () => {
    it("are rendered without props", () => {
        const wrapper = mount(<Foo />);
        expect(wrapper.find(".Foo").length).toEqual(1, ".Foo not found");
    });
});
