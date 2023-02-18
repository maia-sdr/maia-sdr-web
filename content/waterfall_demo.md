+++
title = "Waterfall demo"
description = "Demo of the Maia SDR waterfall"
weight = 2
+++

<script type="module">
import init, { make_waterfall } from "/waterfall_example/waterfall_example.js";

async function run() {
    await init();
    make_waterfall("waterfall");
};

run();
</script>

Below is a demo of the WebGL2 waterfall included in
[maia-wasm](https://github.com/maia-sdr/maia-sdr/tree/main/maia-wasm). The
waterfall data has been generated from the
[GRCon 2022 CTF signal identification challenge SigMF recording](https://ctf-2022.gnuradio.org/challenges#Challenge%20#1-36)
and is stored as a JPEG file in order to reduce its size. Some JPEG artifacts are visible.
This only happens with this demo, and not with Maia SDR.

<canvas id="waterfall" style="width: 100%; height: 60vh; touch-action: none;"></canvas>
