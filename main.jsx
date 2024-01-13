import ReactDom from "./core/ReactDom.js"
import React from "./core/React.js"
const App=<div id='content'>Hello World!</div>

ReactDom.createRoot(document.querySelector('#app')).render(App)