// ==UserScript==
// @name         WME RRC AutoLock
// @namespace    https://github.com/jm6087
// @version      2020.06.13.03
// @description  AutoLocks RRCs to set level instead of rank of editor
// @author       jm6087 (with assistance from Dude495, TheCre8r, and SkiDooGuy)
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @grant        none
// ==/UserScript==

/* global W */
/* global WazeWrap */
/* global $ */
/* global wazedevtoastr */

(function() {
    'use strict';
    var UPDATE_NOTES = `This should autolock RRCs to L4 upon selection of the RRC <br><br>
    The enable script now works and persists thanks to dude495<br><br>
    Script currently conflicts with WME Tiles Update.  Not allowing unverified RRCs to autolock initially<br><br>
    This is my first script, hope it works and currently is very basic due to limited knoweledge.  Thanks for Dude495, TheCre8r, and SkiDooGuy for their assistance`

    // PREVIOUS NOTES
    //
    // I think I got the enable button to default to checked. Still working on persisting through refresh when disabled
    // Fixed items that juliansean pointed out
    

    var VERSION = GM_info.script.version;
    var SCRIPT_NAME = GM_info.script.name;
    const USER = {name: null, rank:null};
    var RRCAutoLockEnabled;
    var RRCAutoLockSettings;
    const STORE_NAME = "RRCAutoLockSettings";
    const RRCAutoLockSettingName = "RRCAutoLockEnabled";

    function setRRCAutoLock() {
        let RRCAutolockRankplusOne;
        let SelMan = W.selectionManager;
        let RRCAutoLockRankOverLock;
        wazedevtoastr.options.timeOut = '2500';
        if (SelMan.getSelectedFeatures().length > 0){
            let SelModel = SelMan.getSelectedFeatures()[0].model;
            // Create an option variable using the following 2 let statements

            //checks to see if Enabled is checked (not working completely)
            if (RRCAutoLockSettings.RRCAutoLockEnabled == true){
                console.log(SCRIPT_NAME, "Script  is enabled");

                let RRCAutoLockChildNumber = 12
                let RRCAutoLockLabel = "label:nth-child(" + RRCAutoLockChildNumber+ ")"
                if (SelModel.attributes.lockRank == null){
                    RRCAutolockRankplusOne = ("Auto (" + (SelModel.attributes.rank + 1)+")");
                    RRCAutoLockRankOverLock = SelModel.attributes.rank + 1;
                }else{
                    RRCAutolockRankplusOne = SelModel.attributes.lockRank + 1;
                    RRCAutoLockRankOverLock = SelModel.attributes.rank + 1;
                };

                let RRCAutoLock4 = "#edit-panel > div > div > div > div.tab-content > form > div > div > div > div > div.form-control.lock-level-selector.waze-radio-container >" + RRCAutoLockLabel
                if (SelMan.hasSelectedFeatures() && SelModel.type === 'railroadCrossing'){
                    if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank != 3){
                        document.querySelector(RRCAutoLock4).click();
                        WazeWrap.Alerts.success(SCRIPT_NAME, ' RRC Lock level changed from lock level ' + RRCAutolockRankplusOne);
                        console.log(SCRIPT_NAME, "Version #", VERSION, "- Lock level changed from", RRCAutolockRankplusOne);
                    }else{
                        if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank == 3){
                            WazeWrap.Alerts.info(SCRIPT_NAME, ` RRC lock not changed, already at lock level ${RRCAutolockRankplusOne}`);
                            console.log (SCRIPT_NAME, "Version #", VERSION, "- RRC lock not changed, already at lock level", RRCAutolockRankplusOne);
                        }else{
                            if (USER.rank < (SelModel.attributes.rank + 1)){
                                wazedevtoastr.options.timeOut = '5000';
                                if (RRCAutoLockRankOverLock > 5){
                                    WazeWrap.Alerts.error(SCRIPT_NAME, ` RRC is locked above your rank, you will need assistance from a Rank ${RRCAutoLockRankOverLock} editor`);
                                }else{
                                    WazeWrap.Alerts.error(SCRIPT_NAME, ` RRC is locked above your rank, you will need assistance from at least a Rank ${RRCAutoLockRankOverLock} editor`);
                                    console.log (SCRIPT_NAME, "Version #", VERSION, "- RRC is locked above editor rank");
                                }
                            }
                        }
                    }
                }
            }else{
                console.log(SCRIPT_NAME, "Script is disabled")}
        }
    }


    function RRCAutoLockTab()
    {
        var $RRCsection = $("<div>");
        $RRCsection.html([
            '<div>',
            '<h4 style="margin-bottom:0px;"><b>'+ SCRIPT_NAME +'</b></h4>',
            VERSION +'</br>',
            '<b>RRC AutoLock Enabled: <input type="checkbox" id="RRCAutoLockCheckBox"></b></br></br>',
            // '<h3>Hope to someday add option to choose your own lock level</h3></br>',
            '<h4>Currently the script automatically locks RRC at L4 when the RRC is selected</h4></br>',
            '<div>',
            '<h3>User Info</h3></br>',
            '<p><b>Username: <span id="RRCAutoLockUsername"></span></p></b>',
            '<p><b>Rank: <span id="RRCAutoLockRank"></span></p></b>',
            '<p><b>Total edits: <span id="RRCAutoLockTotalEdits"></span></p></b>',
            //        '<h3>Please select lock level <select id="RRCAutoLockLevelOption"></h3>',
            //        '<option>3</option>',
            //        '<option>4</option>',
            //        '<option>5</option>',
            //        '<option>6</option>',
            //        '</select>',

            //           '<p>Click the button to create a SELECT and an OPTION element.</p>',
            //           '<button onclick="myFunction()">Try it</button>',

            '</div>',
            '</div>'
        ].join(' '));

        new WazeWrap.Interface.Tab('RRC-AL', $RRCsection.html(), RRCAutoLockInitializeSettings);

    }

    /*-- START SETTINGS --*/
    function loadSettings() {
        let loadedSettings = $.parseJSON(localStorage.getItem(STORE_NAME));
        let defaultSettings = {
            RRCAutoLockEnabled: true
        };

        RRCAutoLockSettings = loadedSettings ? loadedSettings : defaultSettings;
        for (let prop in defaultSettings) {
            if (!RRCAutoLockSettings.hasOwnProperty(prop)) {
                RRCAutoLockSettings[prop] = defaultSettings[prop];
            }
        }
        console.log(SCRIPT_NAME, "Settings Loaded");
    }
    function saveSettings() {
        if (localStorage) {
            RRCAutoLockSettings.lastVersion = VERSION;
            RRCAutoLockSettings.RRCAutoLockEnabled = $('#RRCAutoLockCheckBox')[0].checked
            localStorage.setItem(STORE_NAME, JSON.stringify(RRCAutoLockSettings));
            console.log(SCRIPT_NAME, 'Settings Saved '+ JSON.stringify(RRCAutoLockSettings));
        }
    }


    function RRCAutoLockInitializeSettings()
    {
        loadSettings()
        USER.rank = W.loginManager.user.rank + 1;
        USER.name = W.loginManager.user.userName;
        $('#RRCAutoLockUsername').text(USER.name);
        $('#RRCAutoLockRank').text(USER.rank);
        $('#RRCAutoLockTotalEdits').text(W.loginManager.user.totalEdits);
        $('#RRCAutoLockTotalPoints').text(W.loginManager.user.totalPoints);
        $('#RRCAutoLockCheckBox')[0].checked = RRCAutoLockSettings.RRCAutoLockEnabled;
        console.log(SCRIPT_NAME, "- Tab Created");
        $('#RRCAutoLockCheckBox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "Settings changed")
            saveSettings()
        };
    }
    function bootstrap(tries = 1) {
        if (W && W.map && W.model && W.loginManager.user && $ && WazeWrap.Ready ) {
            RRCAutoLockTab()
            WazeWrap.Events.register("selectionchanged", null, setRRCAutoLock);
            WazeWrap.Interface.ShowScriptUpdate(SCRIPT_NAME, VERSION, UPDATE_NOTES);
            console.log(SCRIPT_NAME, "loaded");
        } else if (tries < 1000)
            setTimeout(function () {bootstrap(++tries);}, 200);
    }
    bootstrap();
})();
