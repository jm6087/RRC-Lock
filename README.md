# RRC-Lock
Lock RRC

Very first functional script

Currently locks RRC to L4 upon selection.  There is no settings and no tab to turn it on/off with yet.

Still need to set up a tab with a lock variable, so editor can choose their desired lock level.

Also need to work on changing the way the locking works.
I was told that my current method could cause issues because of the way it uses the div

document.querySelector("#edit-panel > div > div > div > div.tab-content > form > div > div > div > div > div.form-control.lock-level-selector.waze-radio-container > label:nth-child(12)").click();

Not sure if I can make this a variable or not.
nth-child(12) = level 4  subtract 2 for each level below or add 2 for each level above.
