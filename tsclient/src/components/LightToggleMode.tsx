import { Switch, Stack } from "@chakra-ui/react"
import {useEffect, useState} from "react";
import * as React from "react";
import '../dark-theme.css';
import '../light-theme.css';

const LightToggleMode = () => {
    const [isLight, setIsLight] = useState(localStorage.getItem("theme") === "light");

    useEffect(() => {
        document
            .getElementsByTagName("HTML")[0]
            .setAttribute("data-theme", localStorage.getItem("theme") as string)
    }, [])

    const toggleThemeChange = () => {
        if (!isLight) {
            localStorage.setItem("theme", "light")
            document
                .getElementsByTagName("HTML")[0]
                .setAttribute("data-theme", localStorage.getItem("theme") as string)
                setIsLight(true);
        } else {
            localStorage.setItem("theme", "dark")
            document
                .getElementsByTagName("HTML")[0]
                .setAttribute("data-theme", localStorage.getItem("theme") as string)
                setIsLight(false)
        }
    }

    return (
        <Stack align="center" direction="row">
            <small>{!isLight ? `It's a little dark in here` : `This hurts my eyes.`}</small>
            <Switch size="md" defaultChecked={isLight} onChange={() => toggleThemeChange()}/>
        </Stack>
    )
}

export default LightToggleMode