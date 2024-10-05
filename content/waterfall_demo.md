+++
title = "Waterfall demo"
description = "Demo of the Maia SDR waterfall"
weight = 2
+++

<style>
/* Override some of the Zola stylesheet parameters */
main .toc {
    min-width: 0px;
    max-width: 0px;
}

.content {
    max-width: 100%;
}

:root {
    --background-color: white;
    --text-color: black;
    --line-color: black;

    --focus-outline-color: rgba(208, 208, 255, 0.5);

    --input-bg-color: #f8f8f8;
    --input-highlight-color: #e8e8ff;
    --input-bg-invalid-color: #ffb0b0;

    --button-color: #ddd;
    --button-highlight-color: #bbb;

    /* Record button */
    --record-color: #9d9;
    --record-highlight-color: #7b7;
    --stop-color: #d99;
    --stop-highlight-color: #b77;
    --stopping-color: #dd9;
}

@media (prefers-color-scheme: dark) {
    /* Dark mode */
    :root {
        --background-color: black;
        --text-color: white;
        --line-color: white;

        --focus-outline-color: rgba(208, 208, 255, 0.5);

        --input-bg-color: #222;
        --input-highlight-color: #227;
        --input-bg-invalid-color: #ffb0b0;

        --button-color: #444;
        --button-highlight-color: #777;

        /* Record button */
        --record-color: #7b7;
        --record-highlight-color: #9d9;
        --stop-color: #b77;
        --stop-highlight-color: #d99;
        --stopping-color: #bb7;
    }
}

#waterfall {
    touch-action: none;
    width: 100%;
    height: 80vh;
}

#maiasdr {
    font-family: Helvetica, Arial, sans-serif;
}

button,
input,
select,
textarea {
    font-family: inherit;
    font-size: 100%;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    outline: none;
}

textarea {
    overflow: auto;
}

button,
input,
select,
textarea {
    color: var(--text-color);
    border: 1px solid var(--line-color);
    padding: 2px;
}

input,
textarea {
    background-color: var(--input-bg-color);
}

button,
select {
    background-color: var(--button-color);
}

a:focus,
button:focus,
select:focus {
    outline: var(--focus-outline);
}

input:focus {
    background-color: var(--input-highlight-color);
}

button:hover,
select:hover {
    background-color: var(--button-highlight-color);
}

input:invalid {
    background-color: var(--input-bg-invalid-color);
}

.link_button {
    color: var(--text-color);
    text-decoration: none;
    text-align: center;
    border: 1px solid var(--line-color);
    padding: 2px;
    background-color: var(--button-color);
}

.link_button:hover {
    background-color: var(--button-highlight-color);
}

.ui {
    font-size: 0.875rem;
}

form.ui {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-around;
    column-gap: 20px;
    row-gap: 10px;
    padding: 10px;
}

.ui fieldset {
    border: none;
    padding: 0;
    margin: 0;
}

.waterfall_levels input {
    width: 4em;
}
</style>

<script type="module">
import init, { make_waterfall_with_ui } from "/waterfall_example/waterfall_example.js";

async function run() {
    await init();
    make_waterfall_with_ui("waterfall");
};

run();
</script>

Below is a demo of the WebGL2 waterfall included in
[maia-wasm](https://github.com/maia-sdr/maia-sdr/tree/main/maia-wasm). The
waterfall data has been generated from the
[GRCon 2022 CTF signal identification challenge SigMF recording](https://ctf-2022.gnuradio.org/challenges#Challenge%20#1-36)
and is stored as a JPEG file in order to reduce its size. Some JPEG artifacts are visible.
This only happens with this demo, and not with Maia SDR.

<div id="maiasdr">
<canvas id="waterfall"></canvas>
<form class="ui">
  <fieldset class="waterfall_levels">
    <label for="waterfall_min">Waterfall min</label>/<label for="waterfall_max">max</label>
    <input type="number" id="waterfall_min" value="25" step="1" min="0">
    <input type="number" id="waterfall_max" value="95" step="1" min="0">
  </fieldset>
  <label>Colormap
    <select id="colormap_select">
      <option>Turbo</option>
      <option>Viridis</option>
      <option>Inferno</option>
    </select>
  </label>
  <label>Show waterfall
    <input type="checkbox" id="waterfall_show_waterfall" checked>
  </label>
  <label>Show spectrum
    <input type="checkbox" id="waterfall_show_spectrum">
  </label>
</form>
</div>
