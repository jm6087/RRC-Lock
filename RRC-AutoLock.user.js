// ==UserScript==
// @name         WME RRC AutoLock
// @namespace    https://github.com/jm6087
// @version      2020.06.07.05
// @description  AutoLocks RRCs to set level instead of rank of editor
// @author       jm6087 (with assistance from Dude495 and TheCre8r)
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var UPDATE_NOTES = `This should autolock RRCs to L4 upon selection of the RRC <br><br>
    This is my first script, hope it works and currently is very basic due to limited knoweledge.  Thanks for Dude495, TheCre8r, and SkiDooGuy for their assistance`
    var VERSION = GM_info.script.version;
    var SCRIPT_NAME = GM_info.script.name;
    function setAutoLock() {
        let SelMan = W.selectionManager;
        let SelModel = SelMan.getSelectedFeatures()[0].model;
        let lockRankplusOne = SelModel.attributes.lockRank;
        let Lock4 = "#edit-panel > div > div > div > div.tab-content > form > div > div > div > div > div.form-control.lock-level-selector.waze-radio-container > label:nth-child(12)"
        if (SelMan.hasSelectedFeatures() && SelModel.type === 'railroadCrossing' && SelModel.attributes.lockRank != 3){
            document.querySelector(Lock4).click();
            console.log(SCRIPT_NAME, "Version #", VERSION, "- Lock level changed from", lockRankplusOne);
        }else{
            console.log (SCRIPT_NAME, "Version $", VERSION, "- RRC lock not changed, already at lock level", lockRankplusOne);
        }
            }
    function bootstrap(tries = 1) {
        if (W && W.map && W.model && W.loginManager.user && $ && WazeWrap.Ready ) {
            WazeWrap.Events.register("selectionchanged", null, setAutoLock);
            WazeWrap.Interface.ShowScriptUpdate(SCRIPT_NAME, VERSION, UPDATE_NOTES);
           console.log(SCRIPT_NAME, "loaded");
        } else if (tries < 1000)
            setTimeout(function () {bootstrap(tries++);}, 200);
    }
    bootstrap();
})();
