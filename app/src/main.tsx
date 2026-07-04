import React from "react";
import { createRoot } from "react-dom/client";
import { MainPanel } from "./app/MainPanel";
import { PetWindow } from "./app/PetWindow";
import "./styles.css";

const route = window.location.hash.replace(/^#/, "");
const root = createRoot(document.getElementById("root")!);

root.render(route.startsWith("/pet") ? <PetWindow /> : <MainPanel initialRoute={route} />);

