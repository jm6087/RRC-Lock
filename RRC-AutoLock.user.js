// ==UserScript==
// @name         WME RRC AutoLock
// @namespace    https://github.com/jm6087
// @version      2020.07.10.00
// @description  Locks RRCs and Cameras to set level instead of autolock to rank of editor
// @author       jm6087
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @require      https://greasyfork.org/scripts/27254-clipboard-js/code/clipboardjs.js
// @grant        none
// ==/UserScript==

/* global W */
/* global WazeWrap */
/* global $ */
/* global I18n */
/* global wazedevtoastr */
/* global _ */

(function() {
    'use strict';
    var UPDATE_NOTES = `Locks (adjustable) RRCs to L4 and Cameras to L5 upon selection.<br><br>
    2020.07.07.00 - Can now add countries without version update.  Added lock all on screen button.
    <br><br>
    Thanks for Dude495, TheCre8r, and SkiDooGuy for their assistance and encouragement`


    // PREVIOUS NOTES
    // with assistance and encouragment from Dude495, TheCre8r, and SkiDooGuy

    // 2020.07.07.00 - Can now add countries without version update.  Added lock all on screen button.
    // 2020.07.04.00 - Added Pakistan lock rank
    // 2020.07.02.00 - Tab color change when there are RRCs or ECs on screen that are not set to lock level
    // 2020.06.24.01 Dropped camera min to 3
    // 2020.06.23.00 Fixed banner issue
    // 2020.06.21.01 - Released to editors
    // 2020.06.18.02 - Added check to see if RRC/camera are within editable areas
    // 2020.06.18.00 - More code clean up
    // 2020.06.17.00 - Code clean up
    // 2020.06.16.01 - Added WazeWrap storage. (Thanks Daniel)
    // 2020.06.16.00 - Minor changes
    // Changed a little text in panel at recomendation of Dude495
    // Added option for changing lock level
    // BUG fix
    // Script currently conflicts with WME Tiles Update.  Not allowing unverified RRCs to autolock initially<br><br>
    // The enable script now works and persists thanks to dude495
    // I think I got the enable button to default to checked. Still working on persisting through refresh when disabled
    // Fixed items that juliansean pointed out

// Variables that designate beta version - Do no copy to other versions
    var TAB_NAME = 'RRC-AL';
    let sPanel = `#sidepanel-rrc-al`;
    const STORE_NAME = "RRCSettings";
    let LS = 1594295400884;

// Spreadsheets and variables that pull data from spreadsheet
    const CountrySS = 'https://sheets.googleapis.com/v4/spreadsheets/1wPb4tqTsES7EgAyxVqRRsRiWBDurld5NzN7IdC4pnSo/values/CountryMinimumLocks/?key='+atob('QUl6YVN5QXUxcl84ZDBNdkJUdEFwQ2VZdndDUXR6M2I0cmhWZFNn');
    const BetaSS = 'https://sheets.googleapis.com/v4/spreadsheets/1wPb4tqTsES7EgAyxVqRRsRiWBDurld5NzN7IdC4pnSo/values/Beta/?key='+atob('QUl6YVN5QXUxcl84ZDBNdkJUdEFwQ2VZdndDUXR6M2I0cmhWZFNn');
    var BETA_TESTERS = [];
    var COUNTRYID = [];
    let countQty;

// Other variables
    var VERSION = GM_info.script.version;
    var SCRIPT_NAME = GM_info.script.name;
    const USER = {name: null, rank:null};
    var RRCAutoLockSettings;
    var LastEditorUserName;
    var CameraType;
    var CameraTypeWW;
    const mapCenter = {lon: null, lat: null};
    const Lang = "en-US";
    var newCleanPL;
    var OpenBrack;
    var ClosedBrack;
    var RRCAutoLock;
    var newLockLevel;
    let UpdateObj;
    var SelModel;
    var RRCAutolockRankplusOne;
    var RRCAutoLockRankOverLock;
    var modelRank; // -- DBSOONER
    var manAuto;
    var SelMan;
    var count;
    var evalCount;
    var CountryID;
    var tabColor;
    var originalLon;
    var movedLon;
    var originalZoom;
    var movedZoom;
    var RRCscreenCount;
    var ECscreenCount;
    var RRCmin;
    var ECmin;
    var CountryName;

    function RRCscreenLock(){
        const extentGeometry = W.map.getOLMap().getExtent().toGeometry();
        count = 0;
        evalCount = 0;
        CameraTypeWW = "Railroad Crossing";
        _.each(W.model.railroadCrossings.getObjectArray(), v => {
            if (extentGeometry.intersects(v.geometry)) {
                evalCount++;
                if (count < countQty) {
                    SelModel = v;
                    manAuto = "Auto";
                    RRCsharedLock();
                }
            }
        })
        ScreenlockCompleted();
    }

    function ECscreenLock(){
        const extentGeometry = W.map.getOLMap().getExtent().toGeometry();
        count = 0;
        evalCount = 0;
        CameraTypeWW = "Enforcement Camera";
        _.each(W.model.cameras.getObjectArray(), v => {
            if (extentGeometry.intersects(v.geometry)) {
                evalCount++;
                if (count < countQty) {
                    SelModel = v;
                    manAuto = "Auto";
                    RRCsharedLock();
                }
            }
        })
        ScreenlockCompleted();
    }

    function ScreenlockCompleted() {
        wazedevtoastr.options.timeOut = 5000;
        if (count == 0) {
            WazeWrap.Alerts.info(SCRIPT_NAME, ['All ' + CameraTypeWW + ' are already at assigned lock level, above', 'your edit rank, or the ' + CameraTypeWW + ' are not in your editable area', 'No changes were made'].join('\n'));
        }else{
            originalLon = "";
            RRCscreenMove()
            WazeWrap.Alerts.success(SCRIPT_NAME, ['RRC-AL locked ' + count + " (of " + evalCount + ") " + CameraTypeWW, ' that were equal to or below ' + USER.rank, 'They are now locked at lock level ' + newLockLevel].join('\n'));
            console.log (SCRIPT_NAME, "RCC Screenlock completed");
        }
    }

    function setRRCAutoLock() {
        SelMan = W.selectionManager;
        if (SelMan.getSelectedFeatures().length > 0){ // Determines if there is an item selected
            SelModel = SelMan.getSelectedFeatures()[0].model;
            manAuto = "Manual";
            RRCsharedLock();
            originalLon = "";
            RRCscreenMove()
        }
    }

    function RRCsharedLock () {

        wazedevtoastr.options.timeOut = 2500; // Used to adjust the timing of the WW banner messages
        if ((SelModel.type !== 'camera') && (SelModel.type !== 'railroadCrossing')) return; // Suggested by DBSOONER - exits script if the object selected is not what I want

        if (SelModel.type === 'camera'){ // Determines camera type is Enforcement Camera
            CameraType = 'camera';
            CameraTypeWW = 'Enforcement Camera';
            modelRank = ($('#ECAutoLockLevelOption')[0].value - 1);
        }else{
            if (SelModel.type === 'railroadCrossing'){
                CameraType = 'railroadCrossing';
                CameraTypeWW = 'Railroad Crossing';
                modelRank = ($('#RRCAutoLockLevelOption')[0].value - 1);
            }
        }
        if (USER.rank >= SelModel.attributes.rank + 1 && SelModel.arePropertiesEditable() == false){ // Checking to see if the the editor is high enough rank and if the so, then checking to see if the camera is editable.  If not, then must not be in EA.
            if (manAuto == "Manual") {
                wazedevtoastr.options.timeOut = 6000;
                WazeWrap.Alerts.error(SCRIPT_NAME, [CameraTypeWW + ' does not appear to be in your edit area.', 'Please check your Editable Areas layer to ensure you have edit rights'].join('\n'));
            }
        }else{
            //checks to see if Enabled is checked
            if (RRCAutoLockSettings.RRCAutoLockEnabled == false && CameraType == 'railroadCrossing') // Warning message is valid and MUST be there
                return console.log(SCRIPT_NAME, CameraTypeWW + " is disabled");
            if (RRCAutoLockSettings.ECAutoLockEnabled == false && CameraType == 'camera') // Warning message is valid and MUST be there
                return console.log(SCRIPT_NAME, CameraTypeWW + " is disabled");
            console.log(SCRIPT_NAME, "Script  is enabled");

            RRCAutoLockRankOverLock = SelModel.attributes.rank + 1; // Checks rank of selected RRC or EC
            if ((SelModel.attributes.unapproved == true) || (SelModel.attributes.lockRank == null)) { // Checks to see if selected RRC or EC is unverified
                RRCAutolockRankplusOne = ("Auto (" + (SelModel.attributes.rank + 1)+")"); // If unverified, sets the text for WW with Auto(lock number)
            }else{
                RRCAutolockRankplusOne = SelModel.attributes.lockRank + 1; // If already verified, sets text for WW to lock number only
            };
            if (USER.rank < modelRank + 1){
                newLockLevel = USER.rank;
                if (manAuto == "Manual") {
                    RRCAutoLock = $(`input[id^="lockRank-${USER.rank - 1}"]`); // Sets variable for which lockrank to click if the user rank is less than the settings
                }else{
                    if (manAuto == "Auto") {
                        RRCAutoLock = USER.rank - 1;
                    }
                }
            }else{
                newLockLevel = modelRank + 1;
                if (manAuto == "Manual") {
                    RRCAutoLock = $(`input[id^="lockRank-${modelRank}"]`); // Sets variable for which lockrank to click
                }else{
                    if (manAuto == "Auto") {
                        RRCAutoLock = modelRank;
                    }
                }
            }
            if (manAuto == "Manual") {
                if (SelMan.hasSelectedFeatures() && SelModel.type === CameraType){
                    // Finds ID number of the last editor
                    let lastEditBy = SelModel.attributes.updatedBy;
                    if (lastEditBy === null) {
                        lastEditBy = SelModel.attributes.createdBy;
                    }
                    if (lastEditBy == undefined) {
                        LastEditorUserName = USER.name;
                    }else{
                        // Finds the UserName based off the ID of last editor
                        LastEditorUserName = W.model.users.objects[lastEditBy].userName;
                    }
                }
            }

            // Checks to see if User Rank is higher/equal to object lock AND if object is not equal to dropdown lock level in panel
            if ((USER.rank >= (SelModel.attributes.rank + 1)) && (SelModel.attributes.lockRank != modelRank)){
                if (manAuto == "Manual") {
                    RRCAutoLock[0].click();
                }else{
                    if (manAuto == "Auto") {
                        if (SelModel.attributes.unapproved == false || SelModel.type == "camera") {
                            count++;
                            W.model.actionManager.add(new UpdateObj(SelModel, { lockRank: RRCAutoLock }));
                        }else{
                            console.log (SCRIPT_NAME, CameraTypeWW, " ID ", SelModel.attributes.id, " skipped since it is unapproved");
                        }
                    }
                }
                // Checks to see if WazeWrap banner Enabled is checked
                if (manAuto == "Manual") {
                    if (RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled == true){
                        console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                        WazeWrap.Alerts.success(SCRIPT_NAME, [CameraTypeWW + ' changed from lock level ' + RRCAutolockRankplusOne + ' to ' + newLockLevel, 'Last edited by ' + LastEditorUserName].join('\n'));
                    }
                }
                console.log(SCRIPT_NAME, "Version #", VERSION, " - " + CameraTypeWW + " ID  " + SelModel.attributes.id + " Lock level changed from", RRCAutolockRankplusOne , " to ", newLockLevel);
            }else{
                // Checks to see if User rank is greater or equal to object lock level AND if object is already equal to dropdown lock level in panel
                if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank == modelRank){
                    if (manAuto == "Manual") {
                        if (RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled == true){ // Check to see if WW banner enabled
                            console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                            WazeWrap.Alerts.info(SCRIPT_NAME, [CameraTypeWW + ' lock not changed, already at lock level ' + RRCAutolockRankplusOne, 'Last edited by ' + LastEditorUserName].join('\n'));
                        }
                    }
                    console.log (SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW, " ID " + SelModel.attributes.id + " lock not changed, already at lock level", RRCAutolockRankplusOne);
                }else{
                    // Checks to see if object is locked above User rank
                    if (USER.rank < (SelModel.attributes.rank + 1)){
                        if (manAuto == "Manual") {
                            wazedevtoastr.options.timeOut = 5000;
                            if (RRCAutoLockRankOverLock > 5){
                                WazeWrap.Alerts.error(SCRIPT_NAME, [CameraTypeWW + ' is locked above your rank', 'You will need assistance from an Rank ' + RRCAutoLockRankOverLock + ' editor', 'Last edited by ' + LastEditorUserName].join('\n'));
                            }else{
                                WazeWrap.Alerts.error(SCRIPT_NAME, [CameraTypeWW + ' is locked above your rank', 'You will need assistance from at least a Rank ' + RRCAutoLockRankOverLock + ' editor', 'Last edited by ' + LastEditorUserName].join('\n'));
                                console.log (SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW, " ID ", SelModel.attributes.id , " is locked above editor rank");
                            }
                        }
                    }
                }
            }
        }
        manAuto = null;
    }

    function RRCAutoLockTab()
    {
        var $RRCsection = $("<div>");
        $RRCsection.html([
            '<div>',
            '<h4 style="margin-bottom:0px;"><b>'+ SCRIPT_NAME +'</b></h4>',
            VERSION +'</br>',
            '<b><input type="checkbox" id="RRCAutoLockCheckbox"> RRC lock enabled</b></br>',
            '<b><id="RRCAutoLockLevelValue">RRC lock level: <select id="RRCAutoLockLevelOption"></b></br>',
            '<option value="0">N/A</option>',
            '<option value="1">1</option>',
            '<option value="2">2</option>',
            '<option value="3">3</option>',
            '<option value="4">4</option>',
            '<option value="5">5</option>',
            '<option value="6">6</option>',
            '</select></br>',
            '<b><div id="RRCscreenCount"></div></b></br>',
            '<b><input type="checkbox" id="ECAutoLockCheckbox"> Enforcement camera lock enabled</b></br>',
            '<b><id="ECAutoLockLevelValue">Enforcement camera lock level: <select id="ECAutoLockLevelOption"></b></br>',
            '<option value="0">N/A</option>',
            '<option value="1">1</option>',
            '<option value="2">2</option>',
            '<option value="3">3</option>',
            '<option value="4">4</option>',
            '<option value="5">5</option>',
            '<option value="6">6</option>',
            '</select></br>',
            '<b><div id="ECscreenCount"></div></b></br>',
            '<b><input type="checkbox" id="RRCAutoLockWazeWrapSuccessCheckbox"> Alerts: Success</b></br>',
            '<b><input type="checkbox" id="RRCAutoLockWazeWrapInfoCheckbox"> Alerts: Info</b></br>',
            '<b><div id="WMETUWarning"></div></b></br>',
            '<b><h4>Your WME window was last refreshed at:</h4></b>',
            '<b><h4><div id="CurrentDate"></div></h4></b></br>',
            '<div class="form-group"></br>',
            '<div id="panelCountQty"></div></br>',
            '<div><input type="button" id="RRC-Screen-Lock" title="RRC Screen Lock" value="Lock all RRCs" class="btn btn-danger btn-xs RRC-Button"></div></br>',
            '<div><input type="button" id="EC-Screen-Lock" title="EC Screen Lock" value="Lock all Enforcement Cameras" class="btn btn-danger btn-xs RRC-Button"></div></div></br>',
            '<span class="fa fa-refresh" id="force-country-settings" title="Force Country Settings"> Refresh country settings</span></br>',
            '<div id="countryName"></div>',
            // BETA USER FEATURE BELOW
            ////////////////////////////////////////////////////////////////////////////////////////////////
            '<div class="form-group">', // BETA USER FEATURE
            '<b><div id="BETAonly">The features below only show for editors listed as Beta testers<div></b></br>', // BETA USER FEATURE
            '<div id="discord">', // BETA USER FEATURE
            '<b><input type="checkbox" id="DiscordPermalinkCheckbox">  Create PL with < > for Discord.</div></b></br>', // https://www.w3schools.com/bootstrap/bootstrap_buttons.asp
            '<input type="button" id="Permalink-Button-Name" title="PL" value="Copy Clean PL to your clipboard" class="btn btn-info btn-xs RRC-Button"></br></br>', // BETA USER FEATURE
            '<input type="button" id="Permalink-Button-Input" title="PL" value="Clean PL from another editor" class="btn btn-info btn-xs RRC-Button"></br></br>', // BETA USER FEATURE

            '<div class="form-group">',
            '<b><h5><div id="USERedits"><div></h5></b></br></div></div>', // BETA USER FEATURE
            '</div>', // BETA USER FEATURE
            '<p><div id="sheet"><a href="https://docs.google.com/spreadsheets/d/1wPb4tqTsES7EgAyxVqRRsRiWBDurld5NzN7IdC4pnSo/edit#gid=0" target="_blank">Sheet</a></div></p>',
            '<div>',
        ].join(' '));

        new WazeWrap.Interface.Tab(TAB_NAME, $RRCsection.html(), RRCAutoLockInitializeSettings);
        $("#Permalink-Button-Name").click(CleanPermaLink); // BETA USER FEATURE
        $("#Permalink-Button-Input").click(inputPermaLink); // BETA USER FEATURE
        $("#RRC-Screen-Lock").click(RRCscreenLock); //
        $("#EC-Screen-Lock").click(ECscreenLock); //
        $("#force-country-settings").click(forceCountrySetting); //
    }

    // BETA USER FEATURE BELOW
    /////////////////////////////////////////////////////////////////////////////////////////
    function CleanPermaLink(){
        let selectedID;
        let PLselFeat = W.selectionManager.getSelectedFeatures();
        let LatLonCenter = W.map.getCenter();
        let center4326 = WazeWrap.Geometry.ConvertTo4326(LatLonCenter.lon, LatLonCenter.lat);
        let PLurl = 'https://www.waze.com/' + I18n.currentLocale() + '/editor?env=' + W.app.getAppRegionCode() + "&lon=";
        if (RRCAutoLockSettings.DiscordPermalink == true){
            OpenBrack = "<";
            ClosedBrack = ">";
        }else{
            OpenBrack = "";
            ClosedBrack = "";
        }
        if (PLselFeat.length > 0){
            let selectedType = PLselFeat[0].model.type;
            if (selectedType == 'segment') {
                selectedID = $('#'+selectedType+'-edit-general > ul > li:contains("ID:")')[0].textContent.match(/\d.*/)[0];
            }else{
                selectedID = PLselFeat[0].model.attributes.id;
            }
            newCleanPL = OpenBrack + PLurl + center4326.lon + "&lat=" + center4326.lat + "&zoom=5&" + selectedType + "s=" + selectedID + ClosedBrack;
        }else{
            newCleanPL = OpenBrack + PLurl + center4326.lon + "&lat=" + center4326.lat + "&zoom=5" + ClosedBrack;
        }
        copyToClipboard();
    }

    function inputPermaLink(){
        // Add WazeWrap Prompt box to grab PL and then clean it up
        WazeWrap.Alerts.prompt(SCRIPT_NAME, "Paste your PL", "", OKinputPermaLink, cancelInputPermaLink); // Prompts to enter a PL
    }
    function OKinputPermaLink(){
        let inputData = $(".toast-prompt-input")[0].value;
        var regexs = {
            'wazeurl': new RegExp('(?:http(?:s):\/\/)?(?:www\.|beta\.)?waze\.com\/(?:.*?\/)?(editor|livemap)[-a-zA-Z0-9@:%_\+,.~#?&\/\/=]*', "ig")
        };
        if (inputData.match(regexs.wazeurl)){
            let PLurl = 'https://www.waze.com/' + I18n.currentLocale() + '/editor?env=' + W.app.getAppRegionCode() + "&lon=";
            var inputSegsVen;
            let params = inputData.match(/lon=(-?\d*.\d*)&lat=(-?\d*.\d*)/);
            let inputLon = params[1];
            let inputLat = params[2];
            let inputSegs = inputData.match(/&segments=(.*)(?:&|$)/);
            let inputVenue = inputData.match(/&venues=(.*)(?:&|$)/);
            let inputRRC = inputData.match(/&railroadCrossings=(.*)(?:&|$)/)
            if ((inputSegs == null) || (inputVenue == null)) (inputSegsVen = "");
            if (inputSegs != null) (inputSegsVen = "&segments=" + inputSegs[1]);
            if (inputVenue != null) (inputSegsVen = "&venues=" + inputVenue[1]);
            if (inputRRC != null) (inputSegsVen = "&railroadCrossings=" + inputRRC[1]);
            if (RRCAutoLockSettings.DiscordPermalink == true){
                OpenBrack = "<";
                ClosedBrack = ">";
            }else{
                OpenBrack = "";
                ClosedBrack = "";
            }
            newCleanPL = OpenBrack +PLurl + inputLon + "&lat=" + inputLat + "&zoom=6" + inputSegsVen + ClosedBrack;
            copyToClipboard();
            console.log (SCRIPT_NAME, 'Inputed PL now clean ' + newCleanPL);
        }else{
            wazedevtoastr.options.timeout = 2000;
            WazeWrap.Alerts.info(SCRIPT_NAME, "That did not appear to be a valid permalink");
        }
    }
    function cancelInputPermaLink(){
        console.log (SCRIPT_NAME, "cancel button");
    }

    function copyToClipboard(){
        // NEXT 4 LINES COPIES CLEAN PL TO CLIPBOARD
        var copied = $('<textarea id="PLcopy" rows="1" cols="1">').val(newCleanPL/*.replace(/\_*\n/g, '\n')*/).appendTo('body').select(); // Creates temp text box with the PL
        document.execCommand('copy'); // Copies the PL to clipboard
        var rembox = document.getElementById('PLcopy');
        document.body.removeChild(rembox); // Deletes temp text box
        wazedevtoastr.options.timeOut = 1500;
        WazeWrap.Alerts.info(SCRIPT_NAME, 'PL saved to your clipboard');
        console.log(SCRIPT_NAME, newCleanPL + ' copied to your clipboard');
    }
    ////////////////////////////////////
    // BETA USER FEATURE ABOVE

    function disabledOptions() { // Disables the drop down if the enabled option is off.
        $('#RRCAutoLockLevelOption')[0].disabled = !RRCAutoLockSettings.RRCAutoLockEnabled;
        $('#ECAutoLockLevelOption')[0].disabled = !RRCAutoLockSettings.ECAutoLockEnabled;
    }

    /*-- START SETTINGS --*/
    async function loadSettings() {
        let loadedSettings = $.parseJSON(localStorage.getItem(STORE_NAME)); // Loads settings from local storage, allows settings to persist with refresh
        const defaultSettings = { // sets default values for tab options
            RRCAutoLockLevelOption: "0",
            ECAutoLockLevelOption: "0",
            RRCAutoLockWazeWrapSuccessEnabled: true,
            RRCAutoLockWazeWrapInfoEnabled: true,
            RRCAutoLockEnabled: true,
            ECAutoLockEnabled: true,
            DiscordPermalink: true,
            lastSaved: "",
            lastVersion: ""
        };
        RRCAutoLockSettings = loadedSettings ? loadedSettings : defaultSettings;
        for (let prop in defaultSettings) {
            if (!RRCAutoLockSettings.hasOwnProperty(prop)) {
                RRCAutoLockSettings[prop] = defaultSettings[prop];
            }
        }
        if (RRCAutoLockSettings.lastSaved <= LS) { // Clears local storage and resets to defaults if older version is found
            RRCAutoLockSettings = defaultSettings;
            await WazeWrap.Remote.SaveSettings(STORE_NAME, JSON.stringify(defaultSettings));
            localStorage.removeItem(STORE_NAME); // Clears local storage and resets to defaults if older version is found
            localStorage.setItem(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to local storage for persisting when refreshed
        }
        const serverSettings = await WazeWrap.Remote.RetrieveSettings(STORE_NAME); //Settings stored to WazeWrap
        if (serverSettings && (serverSettings.lastSaved > RRCAutoLockSettings.lastSaved)) { // checks to see if WazeWrap stored settings are newer than what is stored in local storage
            $.extend(true, RRCAutoLockSettings, serverSettings);
            localStorage.setItem(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to local storage for persisting when refreshed
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
            RRCAutoLockSettings.RRCAutoLockLevelOption = $('#RRCAutoLockLevelOption')[0].value;
            RRCAutoLockSettings.ECAutoLockLevelOption = $('#ECAutoLockLevelOption')[0].value;
            RRCAutoLockSettings.lastSaved = Date.now();
            RRCAutoLockSettings.DiscordPermalink = $('#DiscordPermalinkCheckbox')[0].checked;
            disabledOptions();
            localStorage.setItem(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to local storage for persisting when refreshed
            WazeWrap.Remote.SaveSettings(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to WazeWrap
            console.log(SCRIPT_NAME, 'Settings Saved '+ JSON.stringify(RRCAutoLockSettings));
        }
    }
    async function RRCAutoLockInitializeSettings(){
        USER.rank = W.loginManager.user.rank + 1;
        USER.name = W.loginManager.user.userName;
        let dte = Date();
        UpdateObj = require('Waze/Action/UpdateObject');
        await loadSettings();
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
        $('#DiscordPermalinkCheckbox')[0].checked = RRCAutoLockSettings.DiscordPermalink;
        disabledOptions()
        setBetaFeatures(USER.name);
        setTimeout (loadCountryID, 2000);
        loadCountryID(CountryID);
        console.log(SCRIPT_NAME, "- Tab Created & User Rank is ",USER.rank);
        $('#RRCAutoLockCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockCheckbox Settings changed");
            saveSettings();
        };
        $('#ECAutoLockCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "ECAutoLockCheckbox Settings changed");
            saveSettings();
        };
        $('#RRCAutoLockWazeWrapSuccessCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockWazeWrapSuccessCheckbox Settings changed");
            saveSettings();
        };
        $('#RRCAutoLockWazeWrapInfoCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "RRCAutoLockWazeWrapInfoCheckbox Settings changed");
            saveSettings();
        };
        $('#RRCAutoLockLevelOption')[0].onchange = function() {
            let x = $('#RRCAutoLockLevelOption')[0].value;
            undoAction();
            console.log(SCRIPT_NAME, "RRCAutoLockLevelValue Settings changed to L" + x);
            saveSettings();
        };
        $('#ECAutoLockLevelOption')[0].onchange = function() {
            let x = $('#ECAutoLockLevelOption')[0].value;
            undoAction();
            console.log(SCRIPT_NAME, "ECAutoLockLevelValue Settings changed to L" + x);
            saveSettings();
        };
        $('#DiscordPermalinkCheckbox')[0].onchange = function() {
            console.log(SCRIPT_NAME, "Discord PL option changed");
            saveSettings();
        };
        if (($('#Info_server')[0]) || ($('#sidepanel-urt')[0])) { $('#WMETUWarning')[0].innerHTML = 'WME Tile Update and/or UR-MP Script Detected;<br>WMETU and UR-MP are known to cause problems with this script.<br>Disable WMETU and/or UR-MP if you experience any issues.';
                                                                 wazedevtoastr.options.timeOut = 8000;
                                                                 WazeWrap.Alerts.warning(SCRIPT_NAME, ["WME Tile Update and/or UR-MP Script Detected;","WMETU and UR-MP are known to cause problems with this script.","Disable WMETU and/or UR-MP if you experience any issues."].join('\n'));
                                                                } else {
                                                                    $('#WMETUWarning')[0].textContent = ''};
        $('#CurrentDate')[0].textContent = dte;
    }
    async function loadCountry() {
        await $.getJSON(CountrySS, function(cdata){
            COUNTRYID = cdata;
            console.log(SCRIPT_NAME, 'Country loaded....');
        });
    }
    async function loadBetaUsers() {
        await $.getJSON(BetaSS, function(ldata){
            BETA_TESTERS = ldata;
            console.log('RRC-AL Beta Users Loaded....');
        });
    }
    function getCountryFromSheet(CountryID){
        let mapped = COUNTRYID.values.slice(0).reverse().map(obj =>{
            return {ctry: obj[0].trim(), ctryID: obj[1].trim(), ctryRRC: obj[2].trim(), ctryEC: obj[3].trim()
                   }
        });
        for(let i=0; i<mapped.length; i++){
            if(mapped[i].ctryID == CountryID) {
                return mapped[i];
            }
        }
        return null;
    }

    function getFromSheetList(editorName){
        let mapped = BETA_TESTERS.values.slice(0).reverse().map(obj =>{
            return {username: obj[0].trim()
                   }
        });
        countQty = [mapped[mapped.length-3], mapped[mapped.length-2]];
        for(let i=0; i<mapped.length; i++){
            if(mapped[i].username.toLowerCase() === editorName.toLowerCase()) {
                return mapped[i];
            }
        }
        return null;
    }

    function setBetaFeatures(user) {
        let entry = getFromSheetList(user);
        if (entry == null) {
            countQty = countQty[1].username;
            $("#DiscordPermalinkCheckbox").hide();
            $('#Permalink-Button-Name').hide();
            $('#Permalink-Button-Input').hide();
            $('#discord').hide();
            $('#BETAonly').hide();
            $('#USERedits').hide();
            $('#sheet').hide();
            console.log(SCRIPT_NAME, "Not a beta user");
        }else{
            countQty = countQty[0].username;
            $('#USERedits')[0].textContent = 'Current Edit Count for '+ USER.name + ' - ' + W.loginManager.user.totalEdits;
            console.log(SCRIPT_NAME, "Beta features loaded");
        }
        $('#panelCountQty')[0].textContent = 'Lock up to ' + countQty + ' RRCs or ECs on screen';
    }

    function loadCountryID() { // comment out the hide for each lock to show

        var max = W.loginManager.user.rank + 1;
        CountryName = W.model.topCountry.name;
        if (W.model.topCountry.id == 235) CountryName = W.model.topState.name + ', USA';
        let cEntry = getCountryFromSheet(CountryID);
        if (RRCmin == null) {

            $("#RRCAutoLockLevelOption option[value='0']").show();
            $("#RRCAutoLockLevelOption option[value='1']").show();
            $("#RRCAutoLockLevelOption option[value='2']").show();
            $("#RRCAutoLockLevelOption option[value='3']").show();
            $("#RRCAutoLockLevelOption option[value='4']").show();
            $("#RRCAutoLockLevelOption option[value='5']").show();
            $("#RRCAutoLockLevelOption option[value='6']").show();
            $("#ECAutoLockLevelOption option[value='0']").show();
            $("#ECAutoLockLevelOption option[value='1']").show();
            $("#ECAutoLockLevelOption option[value='2']").show();
            $("#ECAutoLockLevelOption option[value='3']").show();
            $("#ECAutoLockLevelOption option[value='4']").show();
            $("#ECAutoLockLevelOption option[value='5']").show();
            $("#ECAutoLockLevelOption option[value='6']").show();

            // Sets country ID for RRC and EC minimum

            if (cEntry == null) {
                RRCmin = 4;
                ECmin = 4;
                var ctry = "NOT LISTED ON SHEET";
            }else{
                if (cEntry.ctryRRC == null) {
                    RRCmin = 4;
                }else{
                    RRCmin = cEntry.ctryRRC;
                    ctry = cEntry.ctry;
                }
                if (cEntry.ctryEC == null) {
                    ECmin = 4;
                }else{
                    ECmin = cEntry.ctryEC;
                }
            }

            console.log(SCRIPT_NAME, 'Country ID is', CountryID, '-', ctry, ', the minimum RRC lock level is set to', RRCmin, 'and max rank set at', max);
            console.log(SCRIPT_NAME, 'Country ID is', CountryID, '-', ctry, ', the minimum EC lock level is set to', ECmin, 'and max rank set at', max);

            if (max < RRCmin) {
                wazedevtoastr.options.timeOut = 5000;
                WazeWrap.Alerts.warning(SCRIPT_NAME, ["It appears that your user rank of R" + max,"is less than the minimum lock level of " + RRCmin + " for your country for Railroad Crossings"].join('\n'));
                RRCmin = 10;
            }
            if (max < ECmin) {
                wazedevtoastr.options.timeOut = 5000;
                WazeWrap.Alerts.warning(SCRIPT_NAME, ["It appears that your user rank of R" + max,"is less than the minimum lock level of " + ECmin + " for your country for Enforcement Cameras"].join('\n'));
                ECmin = 10;
            }

            if (RRCmin >= 2) {
                $("#RRCAutoLockLevelOption option[value='0']").hide();
                $("#RRCAutoLockLevelOption option[value='1']").hide();
                if (RRCmin >= 3) {
                    $("#RRCAutoLockLevelOption option[value='2']").hide();
                    if (RRCmin >= 4) {
                        $("#RRCAutoLockLevelOption option[value='3']").hide();
                        if (RRCmin >= 5) {
                            $("#RRCAutoLockLevelOption option[value='4']").hide();
                            if (RRCmin >= 6) {
                                $("#RRCAutoLockLevelOption option[value='5']").hide();
                                if (RRCmin == 10) {
                                    $("#RRCAutoLockLevelOption option[value='6']").hide();
                                    $("#RRCAutoLockLevelOption option[value='0']").show();
                                }
                            }
                        }
                    }
                }
            }

            if (ECmin >= 2) {
                $("#ECAutoLockLevelOption option[value='0']").hide();
                $("#ECAutoLockLevelOption option[value='1']").hide();
                if (ECmin >= 3) {
                    $("#ECAutoLockLevelOption option[value='2']").hide();
                    if (ECmin >= 4) {
                        $("#ECAutoLockLevelOption option[value='3']").hide();
                        if (ECmin >= 5) {
                            $("#ECAutoLockLevelOption option[value='4']").hide();
                            if (ECmin >= 6) {
                                $("#ECAutoLockLevelOption option[value='5']").hide();
                                if (ECmin == 10) {
                                    $("#ECAutoLockLevelOption option[value='6']").hide();
                                    $("#ECAutoLockLevelOption option[value='0']").show();
                                }
                            }
                        }
                    }
                }
            }
            if (max <= 5) {
                $("#ECAutoLockLevelOption option[value='6']").hide();
                $("#RRCAutoLockLevelOption option[value='6']").hide();
                if (max == 4) {
                    $("#ECAutoLockLevelOption option[value='5']").hide();
                    $("#RRCAutoLockLevelOption option[value='5']").hide();
                    if (max == 3) {
                        $("#ECAutoLockLevelOption option[value='4']").hide();
                        $("#RRCAutoLockLevelOption option[value='4']").hide();
                        if (max == 2) {
                            $("#ECAutoLockLevelOption option[value='3']").hide();
                            $("#RRCAutoLockLevelOption option[value='3']").hide();
                            if (max == 1) {
                                $("#ECAutoLockLevelOption option[value='2']").hide();
                                $("#RRCAutoLockLevelOption option[value='2']").hide();
                            }
                        }
                    }
                }
            }
        }
        $('#countryName')[0].textContent = 'Country setting is for ' + CountryName;
    }

    function forceCountrySetting(){
        CountryID = 'forced refresh';
        $('#RRCAutoLockLevelOption')[0].value = RRCmin;
        $('#ECAutoLockLevelOption')[0].value = ECmin;
        checkCountry();
        undoAction();
        console.log(SCRIPT_NAME, "forceCountrySetting activated, reset RRC to L" + RRCmin + " and EC to L" + ECmin)
    }
    function undoAction(){
        originalLon = 0;
        RRCscreenMove();
    }

    function RRCscreenMove(tries = 1) {
        let RRClockCount = 0;
        let EClockCount = 0;

        movedLon = W.map.getCenter().lon;
        movedZoom = W.map.getZoom();
        if ((originalLon != movedLon) || (originalZoom != movedZoom)) {
            originalLon = movedLon;
            originalZoom = movedZoom;
            const extentGeometry = W.map.getOLMap().getExtent().toGeometry();

            //Changes the background color of the tab.
            modelRank = ($('#RRCAutoLockLevelOption')[0].value);
            _.each(W.model.railroadCrossings.getObjectArray(), v => {
                if (extentGeometry.intersects(v.geometry)) {
                    var RRClockrank = v.attributes.lockRank + 1;
                    var RRCunapproved = v.attributes.unapproved;
                    if ((RRClockrank != modelRank) || (RRCunapproved == true)) {
                        RRClockCount++
                        $(`a[href$='${sPanel}']`).css('background-color', '#ffa07a');
                        $(`a[href$='${sPanel}']`).text('RRC-' + RRClockCount + '/EC-' + EClockCount);
                        tabColor = 1
                    }
                }
            })

            if (RRClockCount > 0) {
                $('#RRCscreenCount')[0].innerHTML = 'There are ' + RRClockCount + ' RRCs needing locked';
            }else{
                $('#RRCscreenCount')[0].innerHTML = '';
            }

            //Changes the background color of the tab.
            modelRank = ($('#ECAutoLockLevelOption')[0].value);
            _.each(W.model.cameras.getObjectArray(), v => {
                if (extentGeometry.intersects(v.geometry)) {
                    var EClockrank = v.attributes.lockRank + 1;
                    var ECunapproved = v.attributes.unapproved;
                    if ((EClockrank != modelRank) || (ECunapproved == true)) {
                        EClockCount++
                        $(`a[href$='${sPanel}']`).css('background-color', '#ffa07a');
                        $(`a[href$='${sPanel}']`).text('RRC-' + RRClockCount + '/EC-' + EClockCount);
                        tabColor = 1
                    }
                }
            })

            if (tabColor != 1) {
                $(`a[href$='${sPanel}']`).css('background-color', '#e9e9e9');
                $(`a[href$='${sPanel}']`).text(TAB_NAME);
            }

            if (EClockCount > 0) {
                $('#ECscreenCount')[0].innerHTML = 'There are ' + EClockCount + ' ECs needing locked';
            }else{
                $('#ECscreenCount')[0].innerHTML = '';
            }
            tabColor = 0
            checkCountry();
        }
    }

    function checkCountry(tries = 1){
        setTimeout (RRCscreenMove, 3000);
        if (W.model.topCountry) {
            let newLocationID = W.model.topCountry.id;
            if (newLocationID == 235) newLocationID = W.model.topState.id;
            if (newLocationID != CountryID) {
                console.log(SCRIPT_NAME, 'function RRCscreenMove - Country ID is', CountryID, 'newLocationID =',newLocationID);
                CountryID = newLocationID;
                loadCountry();
                RRCmin = null;
                ECmin = null;
                loadCountryID();
            }
        }else if (tries < 2000)
            setTimeout(function () {checkCountry(++tries);}, 200);
    }

    function initialCountrySetup(tries = 1) {
        if (W.model.topCountry) {
            CountryID = W.model.topCountry.id;
            CountryName = W.model.topCountry.name;
            if (CountryID == 235) {
                CountryID = W.model.topState.id;
                CountryName = W.model.topState.name;
            }
            loadCountry();
            console.log(SCRIPT_NAME, 'function: initialCountrySetup - Country ID is', CountryID);
        }else{
            if (tries < 2000)
                setTimeout(function () {initialCountrySetup(++tries);}, 1000);
        }
    }

    async function bootstrap(tries = 1) {
        if (W && W.map && W.model && W.loginManager.user && $ && WazeWrap.Ready ) {
            await initialCountrySetup();
            await loadBetaUsers();
            await RRCAutoLockTab();
            await loadCountry();
            originalLon = W.map.getCenter().lon;
            originalZoom = W.map.getZoom();
            WazeWrap.Events.register("selectionchanged", null, setRRCAutoLock);
            WazeWrap.Events.register("moveend", null, RRCscreenMove);
            WazeWrap.Events.register("afterundoaction", null, undoAction);
            WazeWrap.Interface.ShowScriptUpdate(SCRIPT_NAME, VERSION, UPDATE_NOTES);
            console.log(SCRIPT_NAME, "loaded");
        } else if (tries < 1000)
            setTimeout(function () {bootstrap(++tries);}, 200);
    }
    bootstrap();
})();
