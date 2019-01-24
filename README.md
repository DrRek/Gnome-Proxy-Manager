Gnome Proxy Manager
===================

A Gnome shell extension to change and manage proxy from the top menu bar.

Originally forked from: https://extensions.gnome.org/extension/589/proxifier/ but since the start it was completely rewrote and nothing of that remained.

Should work with gnome shell version: ["3.16", "3.18", "3.20", "3.22", "3.24", "3.26", "3.27", "3.28"]

Intallation:
Simply drop the folder in your .local/share/gnome-shell/extensions/Proxy_Manager@DrRek and reboot your pc.

Usage:
Add new proxy writing the ip:port (ex. 127.0.0.1:8080) in the textfield and press Enter.
Manage existing proxy clicking on them in the list, you can choose to connect or to delete them.
Disable proxy or reload using the last two button.

You can manually add the proxy editing the file in the gnome extension folder (may depend on installation method, usually .local/share/gnome-shell/extension/Proxy_Manager@DrRek/proxy.list)
Each address must be the form ip:port and each address must be in a new line.

Feel free to fork/edit/modify/destoy/pull edit to this code.



Note for developers:
	alt + f2 and 'r' to reload after changes.
	alt + f2 and 'lg' section extension -> view Error to check for some error.
	debug(this) used for debug notification.
