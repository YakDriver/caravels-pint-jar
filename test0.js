// combines original approach / fresh try
const MAX_ERRORS = 10;
const MAX_TRIGGERS = 3000;
const STATUS_EVERY = 10000;
const POST_TRIGGER_MILLIS = 500;
const LOAD_STALLED_AFTER = 20000;
const MIN_SHORT_SIDE = 1400;
const ERROR_SLEEP = 10000;

var timePerTab = [2, 3, 12, 1];
var tab = randBetween(0, 3);

var count = 0;
var countPerTab = [0, 0, 0, 0];
var errorCount = 0;
var errored = false;
var quit = false;
var millis = (new Date()).getTime();
var averageShorts = [];
var justLoaded = true;
var empty = false;
var endTime = 0;
var nextMenuChange = 0;
var masterIndex = 0;
var startTime = (new Date()).getTime();

controlCentral();

async function controlCentral() {
    start();
    masterIndex = 0;
    while (!quit) {
        await switchingTab();
        endTime = (new Date()).getTime() + (timePerTab[tab] * 60 * 1000);
        menuDivisions = (tab == 0) ? 4 : ((tab == 3) ? 0.005 : 2);
        nextMenuChange = getNextMenuTime();
        while (!quit && (new Date()).getTime() < endTime) {
            await doing();

            now = (new Date()).getTime();
            if (now > (millis + STATUS_EVERY)) {
                showStatus();
                millis = now;
            }

            if (errored) {
                errored = false;
                await sleeping(ERROR_SLEEP);
            }

            if (count >= MAX_TRIGGERS || errorCount >= MAX_ERRORS) {
                quit = true;
            }

            if ((new Date()).getTime() >= nextMenuChange) {
                nextMenuChange = getNextMenuTime();
                empty = false;
                await doingMenu();
                masterIndex = 0;
            } else if (empty) {
                empty = false;
                await scrolling(2);
            }
        }
    }
    end();
}

async function doing() {
    if (quit) {
        return Promise.resolve('quitting');
    }

    var delay = 500;
    if (justLoaded) {
        justLoaded = false;
        delay = 3000 + Math.floor(($(document).height() / 150000) * 1000);
    }
    await sleeping(delay);

    e = $("div.photo_thumbnail:not(.nsfw_placeholder) a.avatar:not(" + getBlacklistSelector() + ")")
        .parents("div.photo_thumbnail")
        .find("a.button.new_fav")
        .eq(masterIndex);

    if (!success(e)) {
        e = null;
        console.log("Nothing found!");
        empty = true;
    } else {
        analyzeShort(e);

        masterIndex++;
        if (!e.hasClass("hearted") && (tab != 2 || bigEnough(e))) {
            e.trigger("click");
            count++;
            countPerTab[tab]++;
        }
        e = null;
    }
}

function getNextMenuTime() {
    return (new Date()).getTime() + Math.floor((timePerTab[tab] * 60 * 1000) / menuDivisions) + 500;
}

function bigEnough(e) {
    f = e.parents("div.photo_thumbnail");
    g = f.find("img");
    h = g.attr("height");
    w = g.attr("width");
    if (Math.min(h, w) > MIN_SHORT_SIDE) {
        return true;
    }
    return false;
}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log(
        "Status " + getCompletion() + "% (" + count + ") (tab: "
        + tab + ") (time left: " + Math.round((endTime - (new Date()).getTime()) / 1000)
        + "s) (doc ht:" + $(document).height() + ") "
        + "(mi: " + masterIndex + ")");
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    for (i = 0; i < countPerTab.length; i++) {
        console.log("Tab " + i + ": " + countPerTab[i]);
    }
    console.log("Error count: " + errorCount);
    d = new Date();
    console.log("Done at " + d + ".");
    end = (new Date()).getTime() - startTime;
    console.log("Ran for " + Math.round(end / 60000) + " minutes.");
}

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function success(e) {
    if (e && e.length != 0) {
        e = null;
        return true;
    }
    e = null;
    return false;
}

function analyzeShort(e) {
    f = e.parents("div.photo_thumbnail");
    if (success(f)) {
        h = f.find("span.photo_thumbnail__pulse");
        pulse = Math.round(parseFloat(h.text().trim()));

        g = f.find("img");
        if (success(g)) {
            h = g.attr("height");
            w = g.attr("width");
            shortSide = Math.min(h, w);
            if (averageShorts[pulse]) {
                c = averageShorts[pulse][0];
                a = averageShorts[pulse][1];
                newA = ((c * a) + shortSide) / (c + 1);
                averageShorts[pulse] = [(c + 1), newA];
            } else {
                averageShorts[pulse] = [1, shortSide];
            }
        }
        f = null; h = null; g = null;
    }
}

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loading() {
    await sleeping(200);
    startLoad = (new Date()).getTime();
    while ($("div.infinite_scroll_loader").css("display") == "block") {
        await sleeping(500);
        if ((new Date()).getTime() > (startLoad + LOAD_STALLED_AFTER)) {
            console.log("Loading stalled");
            $("ul.px_tabs li:eq((tab + 1) % 3) a").trigger("click");
            await sleeping(3000);
            $("ul.px_tabs li:eq(tab) a").trigger("click");
            await sleeping(5000);
            break;
        }
    }
}

async function scrolling(skrols = 3) {
    console.log("Scrolling " + skrols + "...");
    for (i = 0; i < skrols && !quit; i++) {
        await loading();
        window.scrollTo(0, $(document).height() * 2);
        await loading();
    }
    justLoaded = true;
}

async function doingMenu() {
    // menus 0=2x2;1=2;2=2;3=0
    switch (tab) {
        case 0:
            if (randBetween(0, 1) == 0) {
                menu = "followers";
            } else {
                menu = "sort";
            }
            break;
        case 1:
        case 2:
            menu = "followers";
            break;
        case 3:
            menu = null;
            console.log("No menu change possible");
            break;
    }

    if (menu) {
        console.log("Changing menu: " + menu);
        await loading();
        e = $("div.discovery_" + menu + "__target").trigger("click");
        s = success(e); e = null;
        if (s) {
            await sleeping(1500);
            f = $("div." + menu + "_options ul li a:not(.selected)").trigger("click");
            if (success(f)) {
                await loading();
            }
            f = null;
        }
        justLoaded = true;
    }
}

async function switchingTab() {
    oldTab = tab;
    tab = (tab + 1) % 4;
    console.log("Switching tabs (" + oldTab + "->" + tab + ")...");

    await loading();
    e = $("ul.px_tabs li:eq(" + tab + ") a").trigger("click");
    e = null;
    await loading();

    justLoaded = true;
}

$(function () {
    //setup ajax error handling
    $.ajaxSetup({
        error: function (x, status, error) {
            errorCount++;
            if (x.status == 403) {
                console.log("--> 403 error"); //specific error
            } else {
                console.log(x.status + " error, status: " + status); //general error
            }
            errored = true;
        }
    });
});

var blacklist = [
    '451053852',
    'aboutrecht',
    'alessandrofabbriartist',
    'alincms',
    'benjaminsurinphotographe',
    'cangyan',
    'dibrein',
    'dorianodisalvo',
    'fotokrelles',
    'freedomtophotograph',
    'iso52',
    'javier_rodriguez75',
    'jeffwetltd',
    'kamilpielkaphotography',
    'lb423studio',
    'mk-pixelstorm',
    'motomotogpa',
    'nerhiv',
    'ptittomtompics',
    'r2moficial',
    'regards-libres',
    'renesch',
    'samueljacquatphotographie',
    'sletanis',
    'sophievonbuer',
    'spasnemerov',
    'sr_jasab',
    'willymalbosc',
    'zenofoto',
];

function getBlacklistSelector() {
    var arr = []
    blacklist.forEach(function (val) {
        arr.push("[href*=" + val + "]");
    });
    return arr.join(",");
}
