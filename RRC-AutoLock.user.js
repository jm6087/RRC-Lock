// ==UserScript==
// @name         WME RRC AutoLock
// @namespace    https://github.com/jm6087
// @version      2020.06.14.06
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
    var UPDATE_NOTES = `Locks RRCs to L4 upon selection of the RRC<br><br>
    Now locks enforcement camera to lock at L5<br><br>
    Add option for changing lock level<br>
    This is my first script, hope it works and currently is very basic due to limited knoweledge.<br>
    Thanks for Dude495, TheCre8r, and SkiDooGuy for their assistance`


    // PREVIOUS NOTES
    // BUG fix
    // Script currently conflicts with WME Tiles Update.  Not allowing unverified RRCs to autolock initially<br><br>
    // The enable script now works and persists thanks to dude495
    // I think I got the enable button to default to checked. Still working on persisting through refresh when disabled
    // Fixed items that juliansean pointed out
    
    var TAB_NAME = 'RRC-AL'
    var VERSION = GM_info.script.version;
    var SCRIPT_NAME = GM_info.script.name;
    const USER = {name: null, rank:null};
    var RRCAutoLockEnabled;
    var ECAutLockEnabled;
    var RRCAutoLockSettings;
    var RRCAutoLockWazeWrapSuccessEnabled;
    var RRCAutoLockWazeWrapInfoEnabled;
    var LastEditorUserName;
    const STORE_NAME = "RRCAutoLockSettings";
    var CameraType;
    var CameraTypeWW;
    var RRCAutoLockChildNumber;
    var RRCAutoLockLevelOption;
    var RRClock;

    function setRRCAutoLock() {
        let RRCAutolockRankplusOne;
        let SelMan = W.selectionManager;
        let RRCAutoLockRankOverLock;
        wazedevtoastr.options.timeOut = '2500';
        if (SelMan.getSelectedFeatures().length > 0){
            let SelModel = SelMan.getSelectedFeatures()[0].model;
            // Need to see if this can be cleaned up

            if (SelModel.type === 'camera'){
                CameraType = 'camera';
                CameraTypeWW = 'Enforcement Camera';
                RRCAutoLockChildNumber = $('#ECAutoLockLevelOption')[0].value;
                if ($('#ECAutoLockLevelOption')[0].value == "10")RRClock = "3";
                if ($('#ECAutoLockLevelOption')[0].value == "12")RRClock = "4";
                if ($('#ECAutoLockLevelOption')[0].value == "14")RRClock = "5";
                if ($('#ECAutoLockLevelOption')[0].value == "16")RRClock = "6";
            }else{
                if (SelModel.type === 'railroadCrossing'){
                    CameraType = 'railroadCrossing';
                    CameraTypeWW = 'Railroad Crossing';
                    RRCAutoLockChildNumber = $('#RRCAutoLockLevelOption')[0].value;
                    if ($('#RRCAutoLockLevelOption')[0].value == "10")RRClock = "3";
                    if ($('#RRCAutoLockLevelOption')[0].value == "12")RRClock = "4";
                    if ($('#RRCAutoLockLevelOption')[0].value == "14")RRClock = "5";
                    if ($('#RRCAutoLockLevelOption')[0].value == "16")RRClock = "6";
                }
            }
            //checks to see if Enabled is checked (not working completely)
            if (RRCAutoLockSettings.RRCAutoLockEnabled == false && CameraType == 'railroadCrossing')
                return console.log(SCRIPT_NAME, CameraTypeWW + " is disabled");
            if (RRCAutoLockSettings.ECAutoLockEnabled == false && CameraType == 'camera')
                return console.log(SCRIPT_NAME, CameraTypeWW + " is disabled");

            console.log(SCRIPT_NAME, "Script  is enabled");
            let RRCAutoLockLabel = "label:nth-child(" + RRCAutoLockChildNumber+ ")";
            if (SelModel.attributes.lockRank == null){
                RRCAutolockRankplusOne = ("Auto (" + (SelModel.attributes.rank + 1)+")");
                RRCAutoLockRankOverLock = SelModel.attributes.rank + 1;
            }else{
                RRCAutolockRankplusOne = SelModel.attributes.lockRank + 1;
                RRCAutoLockRankOverLock = SelModel.attributes.rank + 1;
            };

            let RRCAutoLock4 = "#edit-panel > div > div > div > div.tab-content > form > div > div > div > div > div.form-control.lock-level-selector.waze-radio-container >" + RRCAutoLockLabel
            if (SelMan.hasSelectedFeatures() && SelModel.type === CameraType){
                // Finds ID number of the last editor
                let lastEditBy = SelModel.attributes.updatedBy
                if (lastEditBy === null) {
                    lastEditBy = SelModel.attributes.createdBy
                }
                if (lastEditBy == undefined) {
                    LastEditorUserName = USER.name;
                }else{
                    // Finds the UserName based off the ID of last editor
                    LastEditorUserName = W.model.users.objects[lastEditBy].userName;
                }
                if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank != RRClock - 1){
                    document.querySelector(RRCAutoLock4).click();
                    //checks to see if Enabled is checked
                    if (RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled == true){
                        console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                        WazeWrap.Alerts.success(SCRIPT_NAME, CameraTypeWW + ' lock level changed from lock level ' + RRCAutolockRankplusOne + ': Last edited by ' + LastEditorUserName);
                    }
                    console.log(SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW ," Lock level changed from", RRCAutolockRankplusOne);
                }else{
                    if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank == RRClock - 1){
                        if (RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled == true){
                            console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                            WazeWrap.Alerts.info(SCRIPT_NAME, CameraTypeWW + ' lock not changed, already at lock level ' + RRCAutolockRankplusOne + ': Last edited by ' + LastEditorUserName);
                        }
                        console.log (SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW, " lock not changed, already at lock level", RRCAutolockRankplusOne);
                    }else{
                        if (USER.rank < (SelModel.attributes.rank + 1)){
                            wazedevtoastr.options.timeOut = '5000';
                            if (RRCAutoLockRankOverLock > 5){
                                WazeWrap.Alerts.error(SCRIPT_NAME, CameraTypeWW + ' is locked above your rank, you will need assistance from an Rank ' + RRCAutoLockRankOverLock + ' editor: Last edited by ' + LastEditorUserName);
                            }else{
                                WazeWrap.Alerts.error(SCRIPT_NAME, CameraTypeWW + ' is locked above your rank, you will need assistance from at least a Rank ' + RRCAutoLockRankOverLock + ' editor: Last edited by ' + LastEditorUserName);
                                console.log (SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW, " is locked above editor rank");
                            }
                        }
                    }
                }
            }
        }
    }


    function RRCAutoLockTab()
    {
        var $RRCsection = $("<div>");
        $RRCsection.html([
            '<div>',
            '<h4 style="margin-bottom:0px;"><b>'+ SCRIPT_NAME +'</b></h4>',
            VERSION +'</br>',
            '<b><id="RRCAutoLockLevelValue">RRC lock level <select id="RRCAutoLockLevelOption"></b>',
//            '<option value="10">3</option>',
            '<option value="12">4</option>',
            '<option value="14">5</option>',
            '<option value="16">6</option>',
            '</select></br>',
            '<b><input type="checkbox" id="RRCAutoLockCheckbox"> RRC Lock Enabled</b></br></br>',
            '<b><id="ECAutoLockLevelValue">Enforcement camera lock level <select id="ECAutoLockLevelOption"></b>',
//            '<option value="10">3</option>',
            '<option value="12">4</option>',
            '<option value="14">5</option>',
            '<option value="16">6</option>',
            '</select></br>',
            '<b><input type="checkbox" id="ECAutoLockCheckbox"> Enforcement Camera Lock Enabled</b></br></br>',
            '<b><input type="checkbox" id="RRCAutoLockWazeWrapSuccessCheckbox"> WazeWrap Success Popups Enabled</b></br>',
            '<b><input type="checkbox" id="RRCAutoLockWazeWrapInfoCheckbox"> WazeWrap Info Popups Enabled</b></br></br>',
            '<b>Disable WME Tiles Update script if working unverified RRCs</b></br>',
            '<div>',
        ].join(' '));

        new WazeWrap.Interface.Tab(TAB_NAME, $RRCsection.html(), RRCAutoLockInitializeSettings);

    }

    /*-- START SETTINGS --*/
    function loadSettings() {
        let loadedSettings = $.parseJSON(localStorage.getItem(STORE_NAME));
        let defaultSettings = {
            RRCAutoLockLevelOption: "12",
            ECAutoLockLevelOption: "14",
            RRCAutoLockWazeWrapSuccessEnabled: true,
            RRCAutoLockWazeWrapInfoEnabled: true,
            RRCAutoLockEnabled: true,
            ECAutoLockEnabled: true
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
            RRCAutoLockSettings.ECAutoLockEnabled = $('#ECAutoLockCheckbox')[0].checked;
            RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled = $('#RRCAutoLockWazeWrapSuccessCheckbox')[0].checked;
            RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled = $('#RRCAutoLockWazeWrapInfoCheckbox')[0].checked;
            RRCAutoLockSettings.RRCAutoLockLevelOption = $('#RRCAutoLockLevelOption')[0].value
            RRCAutoLockSettings.ECAutoLockLevelOption = $('#ECAutoLockLevelOption')[0].value
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
        $('#ECAutoLockCheckbox')[0].checked = RRCAutoLockSettings.ECAutoLockEnabled;
        $('#RRCAutoLockWazeWrapSuccessCheckbox')[0].checked = RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled;
        $('#RRCAutoLockWazeWrapInfoCheckbox')[0].checked = RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled;
        $('#RRCAutoLockLevelOption')[0].value = RRCAutoLockSettings.RRCAutoLockLevelOption;
        $('#ECAutoLockLevelOption')[0].value = RRCAutoLockSettings.ECAutoLockLevelOption;
        console.log(SCRIPT_NAME, "- Tab Created");
        $('#RRCAutoLockCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockCheckbox Settings changed")
            saveSettings()
        };
        $('#ECAutoLockCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "ECAutoLockCheckbox Settings changed")
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
        $('#RRCAutoLockLevelOption')[0].onchange = function() {
            let x = $('#RRCAutoLockLevelOption')[0].value
            console.log(SCRIPT_NAME, "RRCAutoLockLevelValue Settings changed")
            saveSettings()
        };
        $('#ECAutoLockLevelOption')[0].onchange = function() {
            let x = $('#ECAutoLockLevelOption')[0].value
            console.log(SCRIPT_NAME, "ECAutoLockLevelValue Settings changed")
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
