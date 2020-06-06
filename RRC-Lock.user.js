// ==UserScript==
// @name         WME RRC Locker
// @namespace    https://github.com/jm6087
// @version      2020.06.06.00
// @description  Locks RRCs
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/
// @exclude      https://www.waze.com/user/editor*
// @author       jm6087 (with lots of help from SkiDooGuy)
// @grant        none
// ==/UserScript==

function RRCLocker () {
const SelFeat = W.selectionManager.getSelectedFeatures()[0]
const attLock = SelFeat.model.attributes.lockRank

// I can get this to work inside of WME console
// Will change the lock level to 4 if the selected feature is an RRC
if (W.selectionManager.hasSelectedFeatures() && W.selectionManager.getSelectedFeatures()[0].model.type === 'railroadCrossing'){
      document.querySelector("#edit-panel > div > div > div > div.tab-content > form > div > div > div > div > div.form-control.lock-level-selector.waze-radio-container > label:nth-child(12)").click()
  }
//
//Need to figure out how to make above function run on selection
    
  
function callbackFunc () {
  if (W.selectionManager.hasSelectedFeatures() && SelFeat.model.type === 'railroadCrossing'){

    Let RRCselected = attLock
if (RRCselected <> 3){  
document.querySelector("#edit-panel > div > div > div > div.tab-content > form > div > div > div > div > div.form-control.lock-level-selector.waze-radio-container > label:nth-child(12)").click()
}
  }
//const mAction = new MultiAction();
//let updates = {};
//mAction.setModel(W.model);
};
