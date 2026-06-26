import "./styles.css";
import { App } from "./App";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("App root #app not found");
}

const app = new App(root);
void app.start();

window.addEventListener("beforeunload", () => {
  app.dispose();
});
