// ==UserScript==
// @name         WME RRC AutoLock
// @namespace    https://github.com/jm6087
// @version      2020.06.13.07
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
    BUG fix<br><br>
    Script currently conflicts with WME Tiles Update.  Not allowing unverified RRCs to autolock initially<br><br>
    This is my first script, hope it works and currently is very basic due to limited knoweledge.  Thanks for Dude495, TheCre8r, and SkiDooGuy for their assistance`

    // PREVIOUS NOTES
    // The enable script now works and persists thanks to dude495
    // I think I got the enable button to default to checked. Still working on persisting through refresh when disabled
    // Fixed items that juliansean pointed out
    

    var VERSION = GM_info.script.version;
    var SCRIPT_NAME = GM_info.script.name;
    const USER = {name: null, rank:null};
    var RRCAutoLockEnabled;
    var RRCAutoLockSettings;
    var RRCAutoLockWazeWrapSuccessEnabled;
    var RRCAutoLockWazeWrapInfoEnabled;
    const STORE_NAME = "RRCAutoLockSettings";

    function setRRCAutoLock() {
        let RRCAutolockRankplusOne;
        let SelMan = W.selectionManager;
        let RRCAutoLockRankOverLock;
        wazedevtoastr.options.timeOut = '2500';
        if (SelMan.getSelectedFeatures().length > 0){
            let SelModel = SelMan.getSelectedFeatures()[0].model;

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
                    // Finds ID number of the last editor
                    let lastEditBy = SelModel.attributes.updatedBy
                    if (lastEditBy === null) {
                    lastEditBy = SelModel.attributes.createdBy
                }
                    // Finds the UserName based off the ID of last editor
                    let LastEditorUserName = W.model.users.objects[lastEditBy].userName
                    if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank != 3){
                        document.querySelector(RRCAutoLock4).click();
                        //checks to see if Enabled is checked
                        if (RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled == true){
                            console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                            WazeWrap.Alerts.success(SCRIPT_NAME, ' RRC Lock level changed from lock level ' + RRCAutolockRankplusOne + ': Last edited by ' + LastEditorUserName);
                        }
                        console.log(SCRIPT_NAME, "Version #", VERSION, "- Lock level changed from", RRCAutolockRankplusOne);
                    }else{
                        if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank == 3){
                            if (RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled == true){
                                console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                                WazeWrap.Alerts.info(SCRIPT_NAME, 'RRC lock not changed, already at lock level ' + RRCAutolockRankplusOne + ': Last edited by ' + LastEditorUserName);
                            }
                            console.log (SCRIPT_NAME, "Version #", VERSION, "- RRC lock not changed, already at lock level", RRCAutolockRankplusOne);
                        }else{
                            if (USER.rank < (SelModel.attributes.rank + 1)){
                                wazedevtoastr.options.timeOut = '5000';
                                if (RRCAutoLockRankOverLock > 5){
                                    WazeWrap.Alerts.error(SCRIPT_NAME, 'RRC is locked above your rank, you will need assistance from a Rank ' + RRCAutoLockRankOverLock + ' editor: Last edited by ' + LastEditorUserName);
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
            '<b>RRC AutoLock Enabled: <input type="checkbox" id="RRCAutoLockCheckbox"></b></br></br>',
            '<b>WazeWrap Success Popups Enabled: <input type="checkbox" id="RRCAutoLockWazeWrapSuccessCheckbox"></b></br>',
            '<b>WazeWrap Info Popups Enabled: <input type="checkbox" id="RRCAutoLockWazeWrapInfoCheckbox"></b></br></br>',
            '<h4>Currently the script automatically locks RRC at L4 when the RRC is selected</h4></br>',
            '</div>'
        ].join(' '));

        new WazeWrap.Interface.Tab('RRC-AL-β', $RRCsection.html(), RRCAutoLockInitializeSettings);

    }

    /*-- START SETTINGS --*/
    function loadSettings() {
        let loadedSettings = $.parseJSON(localStorage.getItem(STORE_NAME));
        let defaultSettings = {
            RRCAutoLockWazeWrapSuccessEnabled: true,
            RRCAutoLockWazeWrapInfoEnabled: true,
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
            RRCAutoLockSettings.RRCAutoLockEnabled = $('#RRCAutoLockCheckbox')[0].checked;
            RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled = $('#RRCAutoLockWazeWrapSuccessCheckbox')[0].checked;
            RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled = $('#RRCAutoLockWazeWrapInfoCheckbox')[0].checked;
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
        $('#RRCAutoLockCheckbox')[0].checked = RRCAutoLockSettings.RRCAutoLockEnabled;
        $('#RRCAutoLockWazeWrapSuccessCheckbox')[0].checked = RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled;
        $('#RRCAutoLockWazeWrapInfoCheckbox')[0].checked = RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled;
        console.log(SCRIPT_NAME, "- Tab Created");
        $('#RRCAutoLockCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockCheckbox Settings changed")
            saveSettings()
        };
        $('#RRCAutoLockWazeWrapSuccessCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockWazeWrapSuccessCheckbox Settings changed")
            saveSettings()
        };
        $('#RRCAutoLockWazeWrapInfoCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockWazeWrapInfoCheckbox Settings changed")
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

