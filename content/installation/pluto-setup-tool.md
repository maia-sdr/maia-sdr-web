+++
title = "Pluto setup tool (experimental)"
description = "Browser-based tool that checks and updates the u-boot environment variables required by Maia SDR over USB serial"
weight = 2
+++

Prototype browser-based helper that runs `fw_printenv` / `fw_setenv` and
related configuration over USB serial, using the
[Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API).
The manual instructions in the [main installation
page](@/installation.md) remain the authoritative reference.

{{ pluto_setup_tool() }}
