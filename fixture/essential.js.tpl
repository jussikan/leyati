import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import %COMPONENT_NAME% from '%COMPONENT_PATH%';

describe("%COMPONENT_NAME%", () => {
    // @leyati-retain
    it("succeeds at shallow mount without props __FAIL__", () => {
        shallow(<%COMPONENT_NAME% />);
    });

    // @leyati-retain
    it("succeeds at full mount without props __FAIL__", () => {
        mount(<%COMPONENT_NAME% />);
    });

    // @leyati-retain
    it("renders an element with class \"%COMPONENT_NAME%\" when mounted without props __FAIL__", () => {
        const wrapper = mount(<%COMPONENT_NAME% />);
        expect(wrapper.find(".%COMPONENT_NAME%").length).toEqual(1, ".%COMPONENT_NAME% not found");
    });
});
