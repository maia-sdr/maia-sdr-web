+++
title = "SSL certificates"
description = "Maia SDR SSL certificates"
weight = 1
+++

**WARNING:** Before proceeding, please understand the security implications of
installing a CA certificate in your device. See the security considerations
below for more details.

# Introduction

The Maia SDR HTTPS server uses an SSL certificate that is generated when the
Pluto first boots and stored in a persistent JFFS2 partition in the Pluto
flash. This SSL certificate is signed by a CA certificate that is generated in
the same way. The CA certificate needs to be installed to the user device in
order to install Maia SDR as a Progressive Web App or to avoid the security
warnings caused by accessing an HTTPS server with an untrusted certificate
(HTTPS needs to be used to use the HTML 5 Geolocation API).

This page describes how to install the CA certificate, how the SSL certificate
generation process works, and the security considerations associated to
installing this CA certificate on a device.

# Installation of CA certificate on Android

First download the CA certificate to your device. This can either be done by
accessing the Maia SDR web UI by HTTP or HTTPS, opening the Settings dialog,
clicking on the Other tab, and clicking on the "CA certificate" link, or by
going directly to [`https://192.168.2.1/ca.crt`](https://192.168.2.1/ca.crt)
(using here the IP address assigned to the Pluto).

Then go to the Android Settings and navigate to "Passwords & security > Privacy >
More security settings > Encryption and credentials > Install a certificate >
CA certificate". Select "Install anyway" in the security warning, confirm your
PIN, and choose the downloaded `ca.crt` file. When installing the CA
certificate, its CN (common name) will be displayed. This contains the serial
number of the Pluto, which can be checked against the sticker on the back of the
Pluto for increased security (see below for details).

The CA certificate can be uninstalled at any time by navigating to "Passwords &
security > Privacy > More security settings > Encryption and credentials >
Trusted credentials", selecting the "User" tab, clicking on the Maia SDR
certificate, and choosing "Uninstall".

# SSL certificate generation process

The certificate generation is handled by the script
[`/etc/rc.d/S50maia-sdr-certificates`](https://github.com/maia-sdr/buildroot/blob/maia-sdr/board/pluto/S50maia-sdr-certificates),
which runs when the Pluto boots. This script does the following:

1. It checks if the [Pluto JFFS2 persistent
partition](https://wiki.analog.com/university/tools/pluto/users/customizing#enabling_persistent_ssh_keys)
has been successfully mounted in `/mnt/jffs2`. If not, the flash partition is
erased, formatted in JFFS2 and mounted in `/mnt/jffs2`.

2. It checks if `/mnt/jffs2/maia-sdr-ca.crt` exists. It if exists, it assumes
   that all the certificates and keys exist and the script exits. If it does not
   exist, the script continues.

3. It generates a CA root certificate and private key (self-signed). The private
   key is only saved to RAM in `/tmp/maia-sdr-ca.key`. The certificate is saved
   to persistent flash in `/mnt/jffs2/maia-sdr-ca.crt`. The key is 2048-bit
   RSA. The certificate has a validity of 36500 days. Its start time is near
   1970-01-01 because the Pluto does not have a real-time clock. The CN of the
   CA certificate contains the Pluto serial number, which can be found on a
   sticker on the back of the Pluto (this serial number is actually the unique
   ID of the NOR flash).

4. It generates a private key for the HTTPS server (`maia-httpd`) and
   certificate signing request. The private key is saved to persistent flash in
   `/mnt/jffs2/maia-httpd.key`. The certificate signing request is only saved to
   RAM in `/tmp/maia-httpd.csr`. The key is 2048-bit RSA. The CN is "maia-httpd
   plutosdr-fw serial ${serial}", where `${serial}` is the serial number of the
   Pluto.

5. The certificate signing request is signed with the private CA key. Subject
   Alternative Names (SANs) for all the IP addresses of the form `192.168.*.1`
   are added to the certificate. The certificate has a validity of 36500 days
   and a start time near 1970-01-01. The certificate is saved to persistent
   flash in `/mnt/jffs2/maia-httpd.crt`. The CA serial is only saved to RAM in
   `/tmp/maia-sdr-ca.srl`.

6. The CA private key, the certificate signing request and the CA serial are
   deleted from RAM.

Note that the CA private key is immediately destroyed after it has been used to
sign the HTTPS server certificate. Therefore, the HTTPS server certificate is
the only certificate that can possibly exist that has been signed by this CA.

When the Pluto finishes booting, `maia-httpd` uses the SSL certificate and key
stored in `/mnt/jffs2/maia-httpd.crt` and `/mnt/jffs2/maia-httpd.key` for the
HTTPS server. It serves the file `/mnt/jffs2/maia-httpd-ca.crt` over HTTP and
HTTPS at the URL `/ca.crt`. This is true regardless of whether these
certificates have been generated automatically by the process described above or
whether the user has replaced them by other certificates at some point.

# Security considerations

Installing a CA certificate on a device always represents a security risk, since
any certificate signed by that CA and such that its CN or SANs match the ones
expected will be considered valid by the device. An attacker that obtains keys
signed by this CA could use them to perform man-in-the-middle attacks or to serve malicious sites.

In the case of the Maia SDR SSL certificates, the Maia SDR Pluto firmware can be
audited to check that it indeed performs the process described above. Even if
the user suspects that the Maia SDR Pluto firmware might have been compromised,
the fact that the certificates include the Pluto serial number in their CN is an
added security measure, because this means that an attacker could not have
supplied malicious certificates created beforehand. The certificates must have
been created with knowledge of the Pluto serial number. Moreover, it is
difficult for a malicious firmware to exfiltrate the CA private key, since it is
supposed to be generated without a network connection (perhaps only a direct
connection to the device connected by USB to the Pluto) and not stored in
persistent storage. The only persistent storage that can be written by software
in the Pluto is the JFFS2 partition and the u-boot environment partition. The
user could check that a malicious firmware has not saved the CA private key
there. In summary, it is reasonable to trust that the Maia SDR Pluto firmware
generates a CA on boot, uses it to sign the HTTPS certificate, and discards the
private CA key, so that no other certificates can possibly be signed by that CA.

By default, the Pluto allows root ssh access with a well-known password. The
root password [can be
changed](https://wiki.analog.com/university/tools/pluto/users/customizing#changing_the_root_password_on_the_target). If
this is not done, the user should assume that an attacker that has network
access to the Pluto can retrieve the HTTPS server private key and
certificate. Often the Pluto is only exposed to a local network, so the attack
surface is low. The HTTPS certificate only has SANs for IP addresses of the form
`192.168.*.1`. This means that if an attacker has this certificate and private
key, it is only possible for the attacker to set up a man-in-the-middle or fake
server using one of these IP addresses. Note that the user needs to access the
malicious site using `https://192.168.*.1/` rather than a DNS name, or the SAN
will not match. Therefore, the possibilities for a feasible attack are rather
limited. Nevertheless, if this possibility is a concern, the HTTPS private key
can be kept safe from attackers, by not allowing them to access the Pluto over
the network and/or by changing the Pluto root password.

A user who does not trust the SSL certificate generation process and wants to
supply their own certificates can do so simply by overwriting the corresponding
files in `/mnt/jffs2`, for instance by copying them with scp. The same security
considerations for the HTTPS private key also apply in this case.
