import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import %COMPONENT_NAME% from '%COMPONENT_PATH%';

describe("%COMPONENT_NAME%", () => {
    it("succeeds at shallow mount without props __PASS__", () => {
        shallow(<%COMPONENT_NAME% />);
    });

    it("succeeds at full mount without props __PASS__", () => {
        mount(<%COMPONENT_NAME% />);
    });

    // @leyati-retain
    it("renders an element with class \"%COMPONENT_NAME%\" when mounted without props __FAIL__", () => {
        const wrapper = mount(<%COMPONENT_NAME% />);
        expect(wrapper.find(".aybabtu-%COMPONENT_NAME%").length).toEqual(1, ".%COMPONENT_NAME% not found");
    });
});
