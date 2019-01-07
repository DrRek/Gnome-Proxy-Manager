
/*
    Icons at usr/share/icons/gnome/scalable/actions
*/

const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;
const MessageTray = imports.ui.messageTray;

let button, meta;
let proxiesListSection;

class Address{
    constructor(ip, port){this.ip=ip; this.port=port;}
};

const ProxyManager_PopupMenu = new Lang.Class({
    Name: 'ProxyManager_PopupMenu',   // Class Name
    Extends: PanelMenu.Button,  // Parent Class

    // Constructor
    _init: function() {
        /* 
        This is calling the parent constructor
        1 is the menu alignment (1 is left, 0 is right, 0.5 is centered)
        `PopupMenuExample` is the name
        true if you want to create a menu automatically, otherwise false
        */
        this.parent(1, 'PopupMenuExample', false);

        // We are creating a box layout with shell toolkit
        let box = new St.BoxLayout();

        /*
        A new icon 'system-search-symbolic'.symbolic
        All icons are found in `/usr/share/icons/theme-being-used`
        In other tutorials we will teach you how to use your own icons

        The class 'system-status-icon` is very useful, remove it and restart the shell then you will see why it is useful here
        */
        let icon =  new St.Icon({ icon_name: 'insert-link-symbolic', style_class: 'system-status-icon'});

        // A label expanded and center aligned in the y-axis
        //let toplabel = new St.Label({ text: ' Proxy Manager ',
        //    y_expand: true,
        //    y_align: Clutter.ActorAlign.CENTER });

        // We add the icon, the label and a arrow icon to the box
        box.add(icon);
        //ox.add(toplabel);
        //box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

        // We add the box to the button
        // It will be showed in the Top Panel
        this.actor.add_child(box);


        let newProxySection = new PopupMenu.PopupMenuSection();

        this.newProxyLabel = new St.Entry({
            name: "newproxy",
            hint_text: "proxy-host:port",
            track_hover: true,
            can_focus: true,
            style_class: "add-proxy-field"
        });
        let newProxyText = this.newProxyLabel.clutter_text;

        //Utilizzare una regex if(ob.get_text().test("/0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\:[0-9]{1,5}/"));
        newProxyText.connect('key-press-event', function(ob,event){
            let symbol = event.get_key_symbol();
            if (symbol == Clutter.Return){
                let tempstr = ob.get_text().split(':');
                if(tempstr[1]!=undefined && tempstr[0]!=''){
                    addProxy(ob.get_text());
                    newProxyText.set_text('proxy-host:port');
                    button._initProxiesList();
                } else {
                    newProxyText.set_text('Invalid Proxy');
                }
            }
        });
        newProxySection.actor.add_actor(this.newProxyLabel);
        this.menu.addMenuItem(newProxySection);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());


        //Update by _initProxiesList
        proxiesListSection = new PopupMenu.PopupMenuSection();
        this._initProxiesList();
        this.menu.addMenuItem(proxiesListSection);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());


        let refreshIP = new PopupMenu.PopupImageMenuItem('Refresh IP list', 'view-refresh');
        refreshIP.connect('activate', this._initProxiesList);
        this.menu.addMenuItem(refreshIP);

        let disableProxyButton = new PopupMenu.PopupImageMenuItem('Disable proxy', 'trashcan_full');
        disableProxyButton.connect('activate', Lang.bind(this, function(){
            disableProxy();
            button._initProxiesList();
        }));
        this.menu.addMenuItem(disableProxyButton);

    },

    _initProxiesList: function(){

        let currentProxy = getProxy();

        proxiesListSection.removeAll();
        let ipArray = updatedProxyList();
        for(let i=0; i<ipArray.length; i++){
            let oneIpAddressMenu = new PopupMenu.PopupSubMenuMenuItem(ipArray[i].ip+':'+ipArray[i].port);

            if(ipArray[i].ip+':'+ipArray[i].port === currentProxy){
                oneIpAddressMenu.actor.add_style_class_name("current-proxy");
            }

            // This is an example of PopupMenuItem, a menu item. We will use this to add as a submenu
            let connectItem = new PopupMenu.PopupMenuItem('Connect');
            connectItem.connect('activate', Lang.bind(this, function(){
                setProxy(ipArray[i].ip, ipArray[i].port);
                button._initProxiesList();
            }));

            let deleteItem = new PopupMenu.PopupMenuItem('Delete');
            deleteItem.connect('activate', Lang.bind(this, function(){
                removeProxy(ipArray[i].ip +":"+ ipArray[i].port);
                button._initProxiesList();
            }));

            // Add the label and submenu to the menu expander
            oneIpAddressMenu.menu.addMenuItem(connectItem);
            oneIpAddressMenu.menu.addMenuItem(deleteItem);

            // The CSS from our file is automatically imported
            // You can add custom styles like this
            // REMOVE THIS AND SEE WHAT HAPPENS
            oneIpAddressMenu.menu.box.style_class = 'PopupSubMenuMenuItemStyle';
            proxiesListSection.addMenuItem(oneIpAddressMenu);
        }
    },

    destroy: function() {
        this.parent();
    }
})

function updatedProxyList() {
    var ipArray = [];
    let path = meta.path + "/proxy.list";
    if (GLib.file_test(path, GLib.FileTest.EXISTS)){
        let proxyFile = Shell.get_file_contents_utf8_sync(path);
        let proxyLine = proxyFile.toString().split('\n');
        for (let i=0; i<proxyLine.length; i++){
            if (proxyLine[i][0]!='#' && proxyLine[i]!='' && proxyLine[i]!='\n'){
                let p_port = proxyLine[i].toString().split(':');
                if(p_port[1]==undefined){
                    continue;
                }
                ipArray[i] = new Address(p_port[0], p_port[1]);
            }
        }
    }
    return ipArray;
}

/*TODO: Socks e ftp socket too*/
function setProxy(ip, port) {
    let modeManual = new Gio.Settings({schema: "org.gnome.system.proxy"});
    modeManual.set_string('mode', 'manual');

    let proxhttp = new Gio.Settings({schema: "org.gnome.system.proxy.http"});
    let proxhttps = new Gio.Settings({schema: "org.gnome.system.proxy.https"});
    //let proxsocks = new Gio.Settings({schema: "org.gnome.system.proxy.socks"});
    //let proxftp = new Gio.Settings({schema: "org.gnome.system.proxy.ftp"});
        
    let retValue = proxhttp.set_string('host', ip);
    retValue = retValue && proxhttp.set_int('port', port);
    retValue = retValue && proxhttps.set_string('host', ip);
    retValue = retValue && proxhttps.set_int('port', port);
    /*retValue = retValue && proxsocks.set_string('host', ip);
    retValue = retValue && proxsocks.set_int('port', port);
    retValue = retValue && proxftp.set_string('host', ip);
    retValue = retValue && proxftp.set_int('port', port);*/

    if(!retValue){
        debug("Error in updating new proxies");
    }
}

function getProxy() {
    let modeManual = new Gio.Settings({schema: "org.gnome.system.proxy"});
    let mode = modeManual.get_string('mode');
    if(mode === "none"){
        return "nessuno";
    }

    let proxhttp = new Gio.Settings({schema: "org.gnome.system.proxy.http"});
        
    let host = proxhttp.get_string('host');
    let port = proxhttp.get_int('port');

    return host+":"+port;
}

function disableProxy() {
    let modeManual = new Gio.Settings({schema: "org.gnome.system.proxy"});
    modeManual.set_string('mode', 'none');

    button._initProxiesList();
}

function addProxy(string){
    let path = meta.path + "/proxy.list";
    if (GLib.file_test(path, GLib.FileTest.EXISTS)){
        let proxyFile = Shell.get_file_contents_utf8_sync(path);
        proxyFile = string + "\n" + proxyFile;
        
        let f = Gio.file_new_for_path(path);
        let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
        Shell.write_string_to_stream (out, proxyFile);
        out.close(null);
    }
    else { 
        global.logError("Proxifier list : Error while reading file : " + path); 
    }
}

function removeProxy(string){
    let path = meta.path + "/proxy.list";
    if (GLib.file_test(path, GLib.FileTest.EXISTS)){
        let proxyFile = Shell.get_file_contents_utf8_sync(path);

        proxyFile = proxyFile.replace(string+'\n', '');
        
        let f = Gio.file_new_for_path(path);
        let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
        Shell.write_string_to_stream (out, proxyFile);
        out.close(null);
    }
    else { 
        global.logError("Proxifier list : Error while reading file : " + path); 
    }
}


// TODO: Per ora non sembrerebbe non funzionare, da testare dopo.
function debug(a){
    global.log(a);
    Util.spawn(['echo',a]);
}

let notification;

function init(metadata) {
    meta=metadata;
    this.notification = new MessageTray.SystemNotificationSource();
}

function enable() {
    button = new ProxyManager_PopupMenu;
    button.connect("button-press-event", Lang.bind(this, function(){
        debug(this);
    }))
    Main.panel.addToStatusArea('PopupMenuExample', button, 0, 'right');
}

function disable() {
    button.destroy();   
}

//USARE SOLO PER IL DEBUG PERCHé RALLENTA
function createAlert(msg) {
    var monitor = Main.layoutManager.focusMonitor;

    var text = new St.Label({
        style_class: 'alert-msg',
        text: msg    
    });
    text.opacity = 255;
    Main.uiGroup.add_actor(text);

    text.set_position(Math.floor(monitor.width / 2 - text.width / 2), Math.floor(text.height));

    Tweener.addTween(text, {
        opacity: 255,
        time: 2,
        transition: 'easeOutQuad',
        onComplete: Lang.bind(this, function() {
            Main.uiGroup.remove_actor(text);
            text = null;
        })
    });
}
