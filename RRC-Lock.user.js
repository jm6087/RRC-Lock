// ==UserScript==
// @name         WME RRC Locker
// @namespace    https://github.com/jm6087
// @version      2020.05.27.00
// @description  Locks RRCs
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/
// @exclude      https://www.waze.com/user/editor*
// @author       jm6087 (with lots of help from SkiDooGuy)
// @grant        none
// ==/UserScript//

function RRC-Locker () {
const SelFeat = W.selectionManager.getSelectedFeatures()[0]
const attLock = model.attributes.lock

const mAction = new MultiAction();
let updates = {};
mAction.setModel(W.model);

  
}