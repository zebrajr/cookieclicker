// ==UserScript==
// @name         Cookie Clicker Clicker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automates / Improves AFK Cookies in orteil.dashnet.org/cookieclicker
// @author       Carlos Sousa
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://orteil.dashnet.org/cookieclicker/img/favicon.ico
// @grant        none
// ==/UserScript==

"use strict";

/*
* ******
* START OF CONFIGURATION
* ******
*/

// Auto Clicker Options
const CLICK_BIGCOOKIE_INTERVAL_MS = 200;

// Bonus Cookies Options
const CLICK_BONUSCOOKIE_INTERVAL_SECS = 5;

// Auto Updater Options
const ENABLE_AUTO_SHOP_UPDATER = true;
const AUTO_UPDATE_INTERVAL_MINUTES = 10;
const FIRST_AUTO_UPDATE_LEVEL = 20;
const MAX_AUTO_UPDATE_LEVEL = 50;

// Auto Upgrade Options
const STORE_UPGRADE_INTERVAL_MINUTES = 1;

// Grimoire Options
const GRIMOIRE_DESIRED_SPELL_USAGE = 0;
const USE_MAGIC_INTERVAL_MINUTES = 5;

/*
* ******
* END OF CONFIGURATION
* ******
*/



/**
 * Clicks the Big Cookie, basically simulating as if the user would click it and manually
 * farming the click rewards
 *
 * @param {None} none - none
 * @returns {Promise}
 */
async function clickBigCookie() {
    const BIG_COOKIE_BUTTON_NAME = 'bigCookie';
    const button = document.getElementById(BIG_COOKIE_BUTTON_NAME);
    if (button) {
        button.click();
    }
}

/**
 * Clicks all elements that appear inside the div shimmers
 * This usually is Bonus Cookies but it could be others eg: sugar lumps
 *
 * @param {None} none - none
 * @returns {Promise}
 */
async function clickBonusCookie() {
    const GOLDEN_COOKIE_ALT_VALUE ='Golden cookie';
    const shimmersDiv = document.getElementById('shimmers');
    if(!shimmersDiv){
        return false;
    }

    const childElements = shimmersDiv.querySelectorAll('*');

    for (const element of childElements){
        if(element.attributes.alt.value === GOLDEN_COOKIE_ALT_VALUE){
            element.click();
            //console.info(`${displayCurrentDateTime()} - Clicked a Bonus Cookie!`);
        } else {
            console.info(element);
            console.info(element.attributes.alt.value);
        }
    }
}


/**
 * Gets the current date time
 *
 * @param {None} none - none
 * @returns {String} - YYYY/MM/DD HH:mm:ss
 */
function displayCurrentDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1; // Months are zero-based
    var day = now.getDate();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    // Adding leading zeros to months, days, hours, minutes, and seconds if they are less than 10
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}


function splitGrimoireBarTextIntoValues(grimoireBarInfo){
    let input_string = String(grimoireBarInfo);
    const regex = /(\d+)\/(\d+)/;
    const matches = input_string.match(regex);

    if (matches && matches.length >= 3) {
        const current = matches[1];
        const max = matches[2];

        return {
            current,
            max
        };
    }

    // Return null or appropriate default values if the input doesn't match the expected pattern
    return null;
}

/**
 * Uses Grimoire Magic
 *
 * @param {None} none - none
 * @returns {None} -
 */
function useGrimoireMagic(){
    const VIEW_GRIMOIRE_DIV_ID = 'productMinigameButton7';
    const VIEW_GRIMOIRE_TEXT = 'View Grimoire';
    const GRIMOIRE_BAR_IS_MAX_ID = 'grimoireBarText';
    const GRIMOIRE_SPELL_TEMPLATE = 'grimoireSpell';
    // Check if "View Grimoire" Button is available
    const viewGrimoireDiv = document.getElementById(VIEW_GRIMOIRE_DIV_ID);
    // Button Missing ;
    if (!viewGrimoireDiv){ return false; }

    // if magic menu is closed, click to show it
    if (viewGrimoireDiv.innerHTML == VIEW_GRIMOIRE_TEXT){ viewGrimoireDiv.click(); }

    // get current magic capacity and max capacity
    const grimoireBarInfo = document.getElementById(GRIMOIRE_BAR_IS_MAX_ID);
    const magicValues = splitGrimoireBarTextIntoValues(grimoireBarInfo.innerHTML);

    // get magic spells costs
    const GRIMOIRE_SPELLS_DIV_ID = GRIMOIRE_SPELL_TEMPLATE + String(GRIMOIRE_DESIRED_SPELL_USAGE);
    const magicSpell = document.getElementById(GRIMOIRE_SPELLS_DIV_ID);
    const magicSpellCost = parseInt(magicSpell.innerText);

    // couldn't read the values for the spells
    if (!magicValues){ return false; }

    if (magicValues.current >= magicSpellCost){
        console.info(`${displayCurrentDateTime()} - Casted Magic!`);
        magicSpell.click();
    }
}


function autoShopUpdate(levelLimit){
    const DIV_CLASS_PRODUCT_UNLOCKER = 'div.product.unlocked';
    const DIV_CLASS_SHOP_OWNED = '.title.owned';
    const DIV_CLASS_SHOP_NAME = '.title.productName';
    let flagUpdatesDone = false;
    const elements = document.querySelectorAll(DIV_CLASS_PRODUCT_UNLOCKER);
    // iterates over every item, except the last two, as to not unlock anything new
    for (let i = (elements.length - 2); i >= 0; i--){
        const owned = elements[i].querySelectorAll(DIV_CLASS_SHOP_OWNED)[0].innerText;
        // skip if past limit, not started or DOM isn't enabled (not enough cookies to buy upgrade)
        if (owned === ""){ continue; }
        if (owned >= levelLimit){ continue; }
        flagUpdatesDone = true;
        if (!elements[i].className.includes("enabled")){ continue; }
        if (owned <= 0){ continue; };
        const shopName = elements[i].querySelectorAll(DIV_CLASS_SHOP_NAME)[0].innerText;
        console.info(`${displayCurrentDateTime()} - Doing Store Upgrade: ${shopName} from level ${owned} to ${(parseInt(owned) + 1)}`);
        elements[i].click();
    }
    return flagUpdatesDone;
}

function checkAutoShopUpdates(){
    if(!ENABLE_AUTO_SHOP_UPDATER){ return false; }
    // check first for basic level upgrades
    const updatesDone = autoShopUpdate(FIRST_AUTO_UPDATE_LEVEL);
    // if no upgrades were done, check for possible upgrades to max allowed level
    if (updatesDone){ return false; }
    autoShopUpdate(MAX_AUTO_UPDATE_LEVEL);
}


function autoUpgradeStore(){
    const DIV_ID_UPGRADES = 'upgrades';
    const DIV_CLASS_UPGRADES_ENABLED = '.crate.upgrade.enabled';
    const divElement = document.getElementById(DIV_ID_UPGRADES);
    const elements = divElement.querySelectorAll(DIV_CLASS_UPGRADES_ENABLED);
    if(!elements){ return false; }

    for (const element of elements){
        try {
            element.click();
            console.info(`${displayCurrentDateTime()} - Upgrade was done`);
        } catch (error) {
            console.error(`${displayCurrentDateTime()} - Failed to do an upgrade:`, error);
        }
    }
}


function main(){
    setInterval(clickBigCookie, CLICK_BIGCOOKIE_INTERVAL_MS);
    setInterval(clickBonusCookie, CLICK_BONUSCOOKIE_INTERVAL_SECS * 1000);
    setInterval(useGrimoireMagic, USE_MAGIC_INTERVAL_MINUTES * 60 * 1000);
    setInterval(checkAutoShopUpdates, AUTO_UPDATE_INTERVAL_MINUTES * 60 * 1000);
    setInterval(autoUpgradeStore, STORE_UPGRADE_INTERVAL_MINUTES * 60 * 1000);
}

main();
