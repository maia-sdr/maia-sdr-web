+++
title = "About"
description = "About Maia SDR"
weight = 3
+++

Maia SDR is an open-source project started by [Daniel
Estévez](https://destevez.net) in 2022 with the goal of developing radio
applications whose signal processing runs mainly on an FPGA. In this sense, Maia
SDR is an FPGA-based SDR (see the [FAQ](@/faq.md#misnomer) if you find this term
strange).

There are several motivations that led to this project:
1. There is a thriving open-source SDR community, which develops great pieces of
software. However, not many people are doing FPGA development (though there are
some notable exceptions).
2. There is an open-source FPGA community doing amazing work and projects. Most
of these projects are not related to radio or signal processing, and the
interaction between the FGPA and SDR communities is minimal (with a few
exceptions).
3. Affordable handheld and portable radios are not very flexible and do not
offer much variety in terms of how to explore the RF spectrum and have fun with
it. A PC running SDR software is vastly superior in capabilities to a compact
solution.
4. Portable solutions should use FPGA processing as much as possible in order to
save power and offer capabilities which are not possible with embedded CPUs.

With these ideas in mind, Maia SDR starts as a project with the long term goal
of building an open-source compact/portable radio that offers high flexibility
in the same sense that SDR software does, and that uses an FPGA for most of its
signal processing. The work-in-progress project will hopefully serve as a
stepping stone that people can extend or use as a base for their projects, and
will bring more FPGA development to the SDR community and more collaboration
between the FPGA and SDR communities.

The ideal hardware for this project would be an affordable board (or stack of
boards) with a relatively capable FPGA that supports an open-source toolchain,
an RFIC of some sort, some kind of RISC-V SoC or microcontroller, and UI
hardware (touchscreen, etc.). Unfortunately, something like this does not
currently exist. This is a chicken and egg problem, in the sense that there are
not enough open-source FPGA designs yet to make this hardware interesting, so
the hardware does not get developed, and so there is no hardware to develop the
FPGA designs for. If I started by developing the hardware, I would probably
never finish. Instead of dreaming about this hardware, a good way to kickstart
these activities is to focus on an existing, affordable, and widely available
hardware that can serve as a "good enough replacement".

I have decided to focus on the [ADALM
Pluto](https://www.analog.com/en/design-center/evaluation-hardware-and-software/evaluation-boards-kits/adalm-pluto.html)
because it is a very popular and common SDR, and it has a fairly capable Zynq
FPGA + ARM SoC. Together with a smartphone for the UI, this pair of devices give
a portable solution for which already many hobbyists have the required
hardware. This platform serves to develop a "product" that can have useful
features right from the start, rather than having something in a
work-in-progress state that people cannot use until (and if) it is finished.

Maia SDR attempts to bring more interest in FPGA delopment for radio
applications, and to serve as a starting point for other projects, by dealing
with things which are usually entry barriers (such as how to move data around
with DMAs or how to compute an FFT). It also serves as a playground to explore
novel technologies and ideas.

The HDL code of Maia SDR is written in
[Amaranth](https://github.com/amaranth-lang/amaranth), which is a Python-based
HDL and toolchain. This is one of the flagship projects of the open-source FPGA
community, and there have already been some small projects using Amaranth for
radio applications (see an [SDR transmitter tutorial at EU GNU Radio
days](https://www.youtube.com/watch?v=A5LOyRVED3c) and a [post about how to use
Amaranth for radio
astronomy](https://blog.kiranshila.com/blog/casper_amaranth.md)).

The software of Maia SDR runs on the Zynq ARM CPU and serves to control the FPGA
and to provide an interface to a smartphone (or other device) connected to the
Pluto. It does so by spawning an HTTP server that has a web application as UI, a
RESTful API for control, and uses WebSockets to stream data. The software is
written in [Rust](https://www.rust-lang.org/) using asynchronous programming. I
think that Rust is a very good language for systems development, and has a
wonderful open-source community behind. Perhaps this choice of technology will
give at some point a link between Maia SDR and
[FutureSDR](https://www.futuresdr.org/), which is a very interesting SDR runtime
project that is also implemented in asynchronous Rust.

The UI of Maia SDR is a web application that uses WebGL2 to render the waterfall
display. It is implemented in Rust using WebAssembly.
