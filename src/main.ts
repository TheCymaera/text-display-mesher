import MyApp from "./app-ui/MyApp.svelte";

import "./main.css";
import { mount } from "svelte";

// mount app
const element = document.querySelector(".SvelteOutlet")!;
mount(MyApp, { target: element });