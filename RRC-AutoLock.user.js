// ==UserScript==
// @name         WME RRC AutoLock
// @namespace    https://github.com/jm6087
// @version      2020.06.19.02
// @description  Locks RRCs and Cameras to set level instead of autolock to rank of editor
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
    var UPDATE_NOTES = `Locks (adjustable) RRCs to L4 and Cameras to L5 upon selection.<br><br>
    2020.06.18.02 - Added check to see if RRC/camera are within editable areas<br><br>
    <br>
    This is my first script, hope it works and currently is very basic due to limited knoweledge.<br>
    Thanks for Dude495, TheCre8r, and SkiDooGuy for their assistance and encouragement`


    // PREVIOUS NOTES
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
    
    var TAB_NAME = 'RRC-AL'
    var BETA_TESTERS = ['jm6087','the_cre8r','dude495', 'skidooguy','dspille','juliansean','dfw-gis'];
    var VERSION = GM_info.script.version;
    var SCRIPT_NAME = GM_info.script.name;
    const USER = {name: null, rank:null};
    var RRCAutoLockSettings;
    var LastEditorUserName;
    const STORE_NAME = "RRCAutoLockSettings";
    var CameraType;
    var CameraTypeWW;
    const mapCenter = {lon: null, lat: null};

    function setRRCAutoLock() {
        let RRCAutolockRankplusOne;
        let SelMan = W.selectionManager;
        let RRCAutoLockRankOverLock;
        let modelRank; // -- DBSOONER
        wazedevtoastr.options.timeOut = '2500'; // Used to adjust the timing of the WW banner messages
        if (SelMan.getSelectedFeatures().length > 0){ // Determines if there is an item selected
            let SelModel = SelMan.getSelectedFeatures()[0].model;

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
                wazedevtoastr.options.timeOut = '6000'
                WazeWrap.Alerts.error(SCRIPT_NAME, [CameraTypeWW + ' does not appear to be in your edit area.', 'Please check your Editable Areas layer to ensure you have edit rights'].join('\n'));
            }else{
                //checks to see if Enabled is checked
                if (RRCAutoLockSettings.RRCAutoLockEnabled == false && CameraType == 'railroadCrossing') // Warning message is valid and MUST be there
                    return console.log(SCRIPT_NAME, CameraTypeWW + " is disabled");
                if (RRCAutoLockSettings.ECAutoLockEnabled == false && CameraType == 'camera') // Warning message is valid and MUST be there
                    return console.log(SCRIPT_NAME, CameraTypeWW + " is disabled");
                console.log(SCRIPT_NAME, "Script  is enabled");

                RRCAutoLockRankOverLock = SelModel.attributes.rank + 1; // Checks rank of selected RRC or EC
                if (SelModel.attributes.lockRank == null){ // Checks to see if selected RRC or EC is unverified
                    RRCAutolockRankplusOne = ("Auto (" + (SelModel.attributes.rank + 1)+")"); // If unverified, sets the text for WW with Auto(lock number)
                }else{
                    RRCAutolockRankplusOne = SelModel.attributes.lockRank + 1; // If already verified, sets text for WW to lock number only
                };
                let RRCAutoLock = $(`input[id^="lockRank-${modelRank}"]`); // Sets variable for which lockrank to click 
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
                    // Checks to see if User Rank is higher/equal to object lock AND if object is not equal to dropdown lock level in panel
                    if ((USER.rank >= (SelModel.attributes.rank + 1)) && (SelModel.attributes.lockRank != modelRank)){
                        RRCAutoLock[0].click();
                        // Checks to see if WazeWrap banner Enabled is checked
                        if (RRCAutoLockSettings.RRCAutoLockWazeWrapSuccessEnabled == true){
                            console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                            WazeWrap.Alerts.success(SCRIPT_NAME, [CameraTypeWW + ' lock level changed from lock level ' + RRCAutolockRankplusOne, 'Last edited by ' + LastEditorUserName].join('\n'));
                        }
                        console.log(SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW ," Lock level changed from", RRCAutolockRankplusOne);
                    }else{
                        // Checks to see if User rank is greater or equal to object lock level AND if object is already equal to dropdown lock level in panel
                        if (USER.rank >= (SelModel.attributes.rank + 1) && SelModel.attributes.lockRank == modelRank){
                            if (RRCAutoLockSettings.RRCAutoLockWazeWrapInfoEnabled == true){ // Check to see if WW banner enabled
                                console.log(SCRIPT_NAME, "WazeWrap  is enabled");
                                WazeWrap.Alerts.info(SCRIPT_NAME, [CameraTypeWW + ' lock not changed, already at lock level ' + RRCAutolockRankplusOne, 'Last edited by ' + LastEditorUserName].join('\n'));
                            }
                            console.log (SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW, " lock not changed, already at lock level", RRCAutolockRankplusOne);
                        }else{
                            // Checks to see if object is locked above User rank
                            if (USER.rank < (SelModel.attributes.rank + 1)){
                                wazedevtoastr.options.timeOut = '5000';
                                if (RRCAutoLockRankOverLock > 5){
                                    WazeWrap.Alerts.error(SCRIPT_NAME, [CameraTypeWW + ' is locked above your rank', 'You will need assistance from an Rank ' + RRCAutoLockRankOverLock + ' editor', 'Last edited by ' + LastEditorUserName].join('\n'));
                                }else{
                                    WazeWrap.Alerts.error(SCRIPT_NAME, [CameraTypeWW + ' is locked above your rank', 'You will need assistance from at least a Rank ' + RRCAutoLockRankOverLock + ' editor', 'Last edited by ' + LastEditorUserName].join('\n'));
                                    console.log (SCRIPT_NAME, "Version #", VERSION, " - ", CameraTypeWW, " is locked above editor rank");
                                }
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
            '<b><input type="checkbox" id="RRCAutoLockCheckbox"> RRC lock enabled</b></br>',
            '<b><id="RRCAutoLockLevelValue">RRC lock level: <select id="RRCAutoLockLevelOption"></b></br>',
            //          '<option value="1">1</option>',
            //          '<option value="2">2</option>',
            //          '<option value="3">3</option>',
            '<option value="4">4</option>',
            '<option value="5">5</option>',
            '<option value="6">6</option>',
            '</select></br></br>',
            '<b><input type="checkbox" id="ECAutoLockCheckbox"> Enforcement camera lock enabled</b></br>',
            '<b><id="ECAutoLockLevelValue">Enforcement camera lock level: <select id="ECAutoLockLevelOption"></b></br>',
            //          '<option value="1">1</option>',
            //          '<option value="2">2</option>',
            //          '<option value="3">3</option>',
            '<option value="4">4</option>',
            '<option value="5">5</option>',
            '<option value="6">6</option>',
            '</select></br></br>',
            '<b><input type="checkbox" id="RRCAutoLockWazeWrapSuccessCheckbox"> Alerts: Success</b></br>',
            '<b><input type="checkbox" id="RRCAutoLockWazeWrapInfoCheckbox"> Alerts: Info</b></br>',
            '<b><div id="WMETUWarning"></div></b></br>',
            '<b><h4>Your WME window was last refreshed at:</h4></b>',
            '<b><h4><div id="CurrentDate"></div></h4></b></br></br>',
            // BETA USERS FEATURE BELOW
            ////////////////////////////////////////////////////////////////////////////////////////////////
            '<div class="form-group">', // BETA USERS FEATURE
            '<b><h5><div id="BETAonly"><div></h5></b></br>', // BETA USERS FEATURE
            '<b><h5><div id="USERedits"><div></h5></b></br>', // BETA USERS FEATURE
            '<div>', // BETA USERS FEATURE
            '<input style="visibility:hidden" type="button" id="Permalink-Button-Name" title="PL" value="Clean PL" class="btn btn-danger RRC-Button">', // BETA USERS FEATURE
            '</div>', // BETA USERS FEATURE
            '</div>', // BETA USERS FEATURE
            '<b><h5><div id="CleanPLresults"></div></h5></b></br>', // BETA USERS FEATURE
            ///////////////////////////////////////////////////////////////////////////////////////////////
            // BETA USERS FEATURE ABOVE
            '<div>',
        ].join(' '));

        new WazeWrap.Interface.Tab(TAB_NAME, $RRCsection.html(), RRCAutoLockInitializeSettings);
        $("#Permalink-Button-Name").click(CleanPermaLink); // BETA USERS FEATURE
    }

    // BETA USERS FEATURE BELOW
    /////////////////////////////////////////////////////////////////////////////////////////
    function CleanPermaLink(){
        var newCleanPL;
        let PLselFeat = W.selectionManager.getSelectedFeatures();
        let LatLonCenter = W.map.getCenter();
        let center4326 = WazeWrap.Geometry.ConvertTo4326(LatLonCenter.lon, LatLonCenter.lat);
        let PLurl = "https://www.waze.com/en-US/editor/?evn=usa$usa&lon=";
        if (PLselFeat.length > 0){
            let selectedID = PLselFeat[0].model.attributes.id;
            let selectedType = PLselFeat[0].model.type + "s";
            newCleanPL = PLurl + center4326.lon + "&lat=" + center4326.lat + "&zoom=6&"+ selectedType + "=" + selectedID;
        }else{
            newCleanPL = PLurl + center4326.lon + "&lat=" + center4326.lat + "&zoom=6";
        }
        $('#CleanPLresults')[0].textContent = newCleanPL;
        console.log(SCRIPT_NAME, "Lon ", center4326.lon, " Lat ", center4326.lat, " ", newCleanPL);
    }
    ////////////////////////////////////
    // BETA USERS FEATURE ABOVE
    
    function disabledOptions() {
        $('#RRCAutoLockLevelOption')[0].disabled = !RRCAutoLockSettings.RRCAutoLockEnabled;
        $('#ECAutoLockLevelOption')[0].disabled = !RRCAutoLockSettings.ECAutoLockEnabled;
    }
    
    /*-- START SETTINGS --*/
    async function loadSettings() {
        let loadedSettings = $.parseJSON(localStorage.getItem(STORE_NAME)); // Loads settings from local storage, allows settings to persist with refresh
        const defaultSettings = { // sets default values for tab options
            RRCAutoLockLevelOption: "4",
            ECAutoLockLevelOption: "5",
            RRCAutoLockWazeWrapSuccessEnabled: true,
            RRCAutoLockWazeWrapInfoEnabled: true,
            RRCAutoLockEnabled: true,
            ECAutoLockEnabled: true,
            lastSaved: "1592493428377"
        };
        RRCAutoLockSettings = loadedSettings ? loadedSettings : defaultSettings;
        for (let prop in defaultSettings) {
            if (!RRCAutoLockSettings.hasOwnProperty(prop)) {
                RRCAutoLockSettings[prop] = defaultSettings[prop];
            }
        }
        const serverSettings = await WazeWrap.Remote.RetrieveSettings(STORE_NAME); //Settings stored to WazeWrap
        if (serverSettings && (serverSettings.lastSaved > RRCAutoLockSettings.lastSaved)) { // checks to see if WazeWrap stored settings are newer than what is stored in local storage
            $.extend(true, RRCAutoLockSettings, serverSettings);
            localStorage.setItem(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to local storage for persisting when refreshed
        }
        if (RRCAutoLockSettings.lastSaved <= "1592493428377") { // Clears local storage and resets to defaults if older version is found
            localStorage.removeItem("RRCAutoLockSettings"); // Clears local storage and resets to defaults if older version is found
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
            disabledOptions();
            localStorage.setItem(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to local storage for persisting when refreshed
            WazeWrap.Remote.SaveSettings(STORE_NAME, JSON.stringify(RRCAutoLockSettings)); // saves settings to WazeWrap
            console.log(SCRIPT_NAME, 'Settings Saved '+ JSON.stringify(RRCAutoLockSettings));
        }
    }

    async function RRCAutoLockInitializeSettings(){
        await loadSettings();
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
        disabledOptions()
        console.log(SCRIPT_NAME, "- Tab Created");
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
            console.log(SCRIPT_NAME, "RRCAutoLockLevelValue Settings changed");
            saveSettings();
        };
        $('#ECAutoLockLevelOption')[0].onchange = function() {
            let x = $('#ECAutoLockLevelOption')[0].value;
            console.log(SCRIPT_NAME, "ECAutoLockLevelValue Settings changed");
            saveSettings();
        };
        if ($('#Info_server')[0]) { $('#WMETUWarning')[0].innerHTML = 'WME Tile Update Script Detected;<br>WMETU is known to cause problems with this script.<br>Disable WMETU if you experience any issues.';
                                   wazedevtoastr.options.timeOut = '8000';
                                   WazeWrap.Alerts.warning(SCRIPT_NAME, ["WME Tile Update Script Detected;","WMETU is known to cause problems with this script.","Disable WMETU if you experience any issues."].join('\n'));
                                  } else {
                                      $('#WMETUWarning')[0].textContent = ''};
        if (BETA_TESTERS.includes(USER.name)) { $('#USERedits')[0].textContent = 'Current Edit Count for '+ USER.name + ' - ' + W.loginManager.user.totalEdits;
                                               $('#BETAonly')[0].textContent = 'The features below only show for editors listed as Beta testers';
                                               document.getElementById('Permalink-Button-Name').style.visibility = "visible";
                                              };
        $('#CurrentDate')[0].textContent = Date();
    }

    function bootstrap(tries = 1) {
        if (W && W.map && W.model && W.loginManager.user && $ && WazeWrap.Ready ) {
            RRCAutoLockTab();
            WazeWrap.Events.register("selectionchanged", null, setRRCAutoLock);
            WazeWrap.Interface.ShowScriptUpdate(SCRIPT_NAME, VERSION, UPDATE_NOTES);
            console.log(SCRIPT_NAME, "loaded");
        } else if (tries < 1000)
            setTimeout(function () {bootstrap(++tries);}, 200);
    }
    bootstrap();
})();
