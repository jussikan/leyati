import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import Foo from './Foo';

describe("Foo", () => {
    it("succeeds at shallow mount without props __PASS__", () => {
        shallow(<Foo />);
    });

    it("succeeds at deep mount without props __FAIL__", () => {
        mount(<Foo />);
    });
});

describe("Foo contents", () => {
    it("are rendered without props __FAIL__", () => {
        const wrapper = mount(<Foo />);
        expect(wrapper.find(".Foo").length).toEqual(1, ".Foo not found");
    });
});
