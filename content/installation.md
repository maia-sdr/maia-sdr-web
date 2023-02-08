+++
title = "Installation"
description = "Installation instructions"
weight = 1
+++

These instructions describe how to install and use Maia SDR on an
[ADALM Pluto](https://www.analog.com/en/design-center/evaluation-hardware-and-software/evaluation-boards-kits/adalm-pluto.html)
that is running the default ADI firmware image. It is also possible to follow
the same instructions with a Pluto that has the Maia SDR firmware image, in
order to update it with a newer version of Maia SDR.

# Download the firmware image

TODO

# Flash the firmware image

The firmware image can be flashed in the same way as the default ADI
firmware. See the
[upgrade instructions](https://wiki.analog.com/university/tools/pluto/users/firmware#upgrading)
in the
[ADI Pluto firmware wiki](https://wiki.analog.com/university/tools/pluto/users/firmware).
The Maia SDR firmware images include the mass storage device, in the same way as
the default ADI images, so it is possible (and recommended) to use the Mass
Storage Update method with the file `pluto.frm`.

# Set up the u-boot environment

Maia SDR requires an additional Linux kernel command line parameter in
comparison to the default ADI firmware, because it uses the
[uio_pdrv_genirq](https://www.kernel.org/doc/html/v5.0/driver-api/uio-howto.html#using-uio-pdrv-genirq-for-platform-devices)
kernel module. This kernel command line parameter is configured through the
[u-boot environment](https://wiki.analog.com/university/tools/pluto/devs/booting).

The u-boot version included in the Maia SDR `boot.frm` and `boot.dfu` already
includes the modified environment variables as defaults. However, flashing
`boot.frm` or `boot.dfu` is not recommended for inexperienced users, because an
error during the bootloader flashing could brick the device (JTAG access will be
needed to recover it).

A safer way to modify these environment variables is to use `fw_setenv`. Doing
this does not interfere with the default ADI firmware image and can be done at any time,
before or after flashing a Maia SDR firmware image. Moreover, the environment
variables are not modified when `pluto.frm` is flashed, so it is only necessary
to follow these steps once. Afterwards, newer versions of the Maia SDR
`pluto.frm` image can be flashed without the need to use `fw_setenv`.

All the following commands should be run in the Pluto via ssh or serial.

To check if the u-boot environment variables have been modified already to allow
Maia SDR to be used, we can run
```
fw_printenv | grep uio_pdrv_genirq
```
This will print a few lines of text if the variables have been modified (in
which case it is not necessary to do anything else), and
nothing if not (in which case it is necessary to follow the next steps in this
section).

The following three commands are used to modify the required u-boot environment
variables to include the `uio_pdrv_genirq.of_id=uio_pdrv_genirq` kernel command
line parameter. When copying and pasting, take note that the commands are quite
long. It is necessary to enter the commands one at a time in the Pluto shell
because there is a character count limit.

```
fw_setenv ramboot_verbose 'adi_hwref;echo Copying Linux from DFU to RAM... && run dfu_ram;if run adi_loadvals; then echo Loaded AD936x refclk frequency and model into devicetree; fi; envversion;setenv bootargs console=ttyPS0,115200 maxcpus=${maxcpus} rootfstype=ramfs root=/dev/ram0 rw earlyprintk clk_ignore_unused uio_pdrv_genirq.of_id=uio_pdrv_genirq uboot="${uboot-version}" && bootm ${fit_load_address}#${fit_config}'

fw_setenv qspiboot_verbose 'adi_hwref;echo Copying Linux from QSPI flash to RAM... && run read_sf && if run adi_loadvals; then echo Loaded AD936x refclk frequency and model into devicetree; fi; envversion;setenv bootargs console=ttyPS0,115200 maxcpus=${maxcpus} rootfstype=ramfs root=/dev/ram0 rw earlyprintk clk_ignore_unused uio_pdrv_genirq.of_id=uio_pdrv_genirq uboot="${uboot-version}" && bootm ${fit_load_address}#${fit_config} || echo BOOT failed entering DFU mode ... && run dfu_sf'

fw_setenv qspiboot 'set stdout nulldev;adi_hwref;test -n $PlutoRevA || gpio input 14 && set stdout serial@e0001000 && sf probe && sf protect lock 0 100000 && run dfu_sf;  set stdout serial@e0001000;itest *f8000258 == 480003 && run clear_reset_cause && run dfu_sf; itest *f8000258 == 480007 && run clear_reset_cause && run ramboot_verbose; itest *f8000258 == 480006 && run clear_reset_cause && run qspiboot_verbose; itest *f8000258 == 480002 && run clear_reset_cause && exit; echo Booting silently && set stdout nulldev; run read_sf && run adi_loadvals; envversion;setenv bootargs console=ttyPS0,115200 maxcpus=${maxcpus} rootfstype=ramfs root=/dev/ram0 rw quiet loglevel=4 clk_ignore_unused uio_pdrv_genirq.of_id=uio_pdrv_genirq uboot="${uboot-version}" && bootm ${fit_load_address}#${fit_config} || set stdout serial@e0001000;echo BOOT failed entering DFU mode ... && sf protect lock 0 100000 && run dfu_sf'
```

After these commands have been entered, it is possible to use `fw_printenv` as
indicated above to check that the changes have been applied correctly. It is
necessary to reboot the Pluto (for instance by using the `reboot` command) in
order for the changes to be effective.

# Set up 1R1T AD9364 mode

Maia SDR assumes that the Pluto is configured for 1R1T (one receive channel, one
transmit channel) mode and that an AD9364 device (frequency range 70 MHz - 6
GHz, 61.44 Msps maximum sampling rate) is used. These options are stored in the
u-boot environment and can be modified using `fw_setenv` as indicated in the
[updating to the AD9364](https://wiki.analog.com/university/tools/pluto/users/customizing#updating_to_the_ad9364)
instructions in the
[customizing the Pluto ADI wiki](https://wiki.analog.com/university/tools/pluto/users/customizing).

Check that `fw_printenv` returns the appropriate values:
```
# fw_printenv attr_name attr_val mode
attr_name=compatible
attr_val=ad9364
mode=1r1t
```

Update the configuration if necessary:
```
fw_setenv attr_name compatible
fw_setenv attr_val ad9364
fw_setenv mode 1r1t
```

It is necessary to reboot the Pluto for these changes to be effective. As
indicated in the previous section, the u-boot environment variables are
preserved even when a new `pluto.frm` firmware image is flashed, so these
changes need to be applied only once.

# Configure the Pluto USB Ethernet

As in the default ADI firmware image, the Ethernet compatibility mode needs to
be configured depending on the operating system that will use the Pluto USB
Ethernet. In general, CDC-ECM should be used for Android, CDC-NCM for iOS and
macOS, and RNDIS for Windows. See the
[ADI wiki instructions to change the USB Ethernet](https://wiki.analog.com/university/tools/pluto/users/customizing#changing_the_usb_ethernet_compatibility_mode).

More information about how to use the Pluto USB Ethernet from an Android device
is available in the
[Connecting the Pluto SDR to an Android phone](https://destevez.net/2022/09/connecting-the-pluto-sdr-to-an-android-phone/)
blog post. One of the key steps is to use
```
fw_setenv ipaddr 192.168.xx.1
```
to change the IP of the Pluto to one in the same subnet used by the Android
Ethernet tethering.

In some Android devices, the IP that is used for Ethernet tethering may be
chosen randomly each time that the device is rebooted. An address from the
subnet `192.168.xxx.0/24` is chosen, where `xxx` can change. To deal with this
situation, the Maia SDR firmware has an option that is used to assign multiple
IP addresses to the `usb0` interface of the Pluto: `192.168.0.1/24`,
`192.168.1.1/24`, `192.168.2.1/24`, ..., `192.168.254.1/24`. One of these
address will be on the correct subnet.

This option can be enabled with
```
fw_setenv ipaddrmulti 1
```
It can be disabled with
```
fw_setenv ipaddrmulti 0
```
or
```
fw_setenv ipaddrmulti
```
A reboot is necessary to apply these changes.

# Open Maia SDR in the web browser and install it as a web app

Maia SDR listens on TCP port 8000 using HTTP. Once the Pluto has booted up and a
USB Ethernet or other network connection to the Pluto has been established, we
can open [`http://192.168.2.1:8000`](http://192.168.2.1:8000) in a web browser
(replace the IP address by the appropriate address of the Pluto if you have
modified it).

In mobile operating systems such as Android and iOS, web applications (also
called progressive web apps, or PWAs) can be installed as an icon to the home
screen. It is recommended to do this for Maia SDR, because the web application
will not display the web browser toolbar (which occupies precious screen real
state) when accessed through the home screen icon.
[MDN](https://developer.mozilla.org/en-US/) has some instructions about how to
[install a web
app](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing)
in several web browsers.

It is not necessary to install Maia SDR as a web app again if the Maia SDR
firmware image is updated.

# Differences between the Maia SDR firmware and the default ADI firmware

The Maia SDR firmware is based on the ADI firmware. The main changes are the
following:

* The FPGA design has been replaced almost completely. Only the
  [ADI AD936x IP core interface](https://wiki.analog.com/resources/fpga/docs/axi_ad9361)
  remains, and its settings have been modified to reduce the resource usage.
* The maia-httpd Maia SDR web server has been added to the rootfs. It is run
  as a daemon.
* The maia-wasm assets have been added to the rootfs.
* A kernel module maia-sdr.ko has been added to the rootfs. It is loaded on
  boot.
* There are some changes to the Device Tree, including reserving most of the
  RAM for communications with the FPGA.

This means that a Pluto running the Maia SDR firmware cannot be used to
send/receive IQ samples to an SDR application running on a PC (using either USB
libiio or USB Ethernet libiio), because the required FPGA components (DMAs,
FIFOs...) are missing. The default ADI firmware needs to be installed again to
use the Pluto "normally".

On the other hand, from the software perspective there are little changes. The
IP address and other settings are configured in the same way, the same root
password is used, and almost the same packages are available in the
rootfs. Users can modify the rootfs to add additional packages or configurations
in the same way as for the default ADI image.
