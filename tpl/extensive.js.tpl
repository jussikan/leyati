import React from 'react';
import {shallow, mount} from 'enzyme';
import expect from 'expect';

import %COMPONENT_NAME% from '%COMPONENT_PATH%';

describe("%COMPONENT_NAME%", () => {
    // @leyati-retain
    it("succeeds at shallow mount without props", () => {
        shallow(<%COMPONENT_NAME% />);
    });

    it("fails at shallow mount without props", () => {
        expect(function() {
            shallow(<%COMPONENT_NAME% />);
        }).toThrow();
    });

    // @leyati-retain
    it("succeeds at full mount without props", () => {
        mount(<%COMPONENT_NAME% />);
    });

    it("fails at full mount without props", () => {
        expect(function() {
            mount(<%COMPONENT_NAME% />);
        }).toThrow();
    });

    // @leyati-retain
    it("renders an element with class \"%COMPONENT_NAME%\" when mounted without props", () => {
        const wrapper = mount(<%COMPONENT_NAME% />);
        expect(wrapper.find(".%COMPONENT_NAME%").length).toEqual(1, ".%COMPONENT_NAME% not found");
    });

    it("will not render an element with class '%COMPONENT_NAME%' when mounted without props", () => {
        const wrapper = mount(<%COMPONENT_NAME% />);
        expect(wrapper.find(".%COMPONENT_NAME%").length).toEqual(0, ".%COMPONENT_NAME% should not be found");
    });
});
