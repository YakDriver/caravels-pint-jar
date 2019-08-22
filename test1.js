const MAX_ERRORS = 10;
const MAX_TRIGGERS = 3000;
const STATUS_EVERY = 10000;
const POST_TRIGGER_MILLIS = 500;
const LOAD_STALLED_AFTER = 20000;

var count = 0;
var errorCount = 0;
var justErrored = false;
var quit = false;
var tab = randBetween(0,2);
var millis = (new Date()).getTime();
var averageShorts = [];
var justLoaded = true;
var justBegun = true;

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

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log(
        "Status " + getCompletion() + "% (" + count + ") (tab: "
        + (tab == 2 ? 3 : tab) + ") (doc ht:" + $(document).height() + ")");
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    console.log("Error count: " + errorCount);
    d = new Date();
    console.log("Done at " + d + ".");
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
    await sleeping(1000);
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

async function doingMenu(menu) {
    console.log("Changing menu: " + menu);
    await loading();
    e = $("div.discovery_" + menu + "__target").trigger("click");
    s = success(e); e = null;
    if (s) {
        await loading();
        choice = randBetween(0, 1);
        f = $("div." + menu + "_options ul li:eq(" + choice + ") a").trigger("click");
        if (success(f)) {
            await loading();
        }
        f = null;
    }
}

async function switchingTab() {
    oldTab = tab;
    tab = (tab + 1) % 3;
    console.log("Switching tabs (" + (oldTab == 2 ? "3" : oldTab) + "->" + (tab == 2 ? "3" : tab) + ")...");
    await loading();

    e = $("ul.px_tabs li:eq(" + (tab == 2 ? "3" : tab) + ") a").trigger("click");

    await loading();
    e = null;
    justLoaded = true;
}

async function navigating() {
    option = randBetween(0, 4);
    if (tab == 2) {
        option = 0;
    }
    switch (option) {
        case 0:
            await switchingTab();
            await scrolling(randBetween(2, 4));
            break;
        default:
            console.log("Picking menu option...");
            option2 = randBetween(1, 2);
            switch (option2) {
                case 1: // menu 1 - tab 0,1
                    if (tab == 2) {
                        console.log("Cannot change menu");
                    } else {
                        await doingMenu("followers");
                    }
                    await scrolling(2);
                    break;
                case 2: // menu 2 - tab 0
                    if (tab == 0) {
                        await doingMenu("sort");
                    } else {
                        console.log("Cannot change sort menu");
                    }
                    await scrolling(2);
                    break;
            }
    }
    justLoaded = true;
}

async function forgetting() {
    if (quit) {
        end();
        return Promise.resolve('quitting');
    }

    if (justBegun) {
        justBegun = false;
        await switchingTab();
    }

    var delay = 500;
    if (justLoaded) {
        justLoaded = false;
        delay = 3000 + Math.floor(($(document).height() / 150000) * 1000);
    }
    await sleeping(delay);
    e = $("div.photo_thumbnail:not(.nsfw_placeholder) a.avatar:not(" + getBlacklistSelector() + ")")
        .parents("div.photo_thumbnail")
        .find("a.button.new_fav:not(.hearted)")
        .first();

    if (!success(e)) {
        e = null;
        console.log("Nothing found!");
        await scrolling(2);
    } else {
        count++;
        analyzeShort(e);
        f = e.parents("div.photo_thumbnail").find("a.photo_link");
        if (!e.hasClass("hearted")) {
            e.trigger("click");
        }
        await sleeping(POST_TRIGGER_MILLIS);
        e = null;
    }

    now = (new Date()).getTime();
    if (now > (millis + STATUS_EVERY)) {
        showStatus();
        millis = now;
    }

    if (justErrored) {
        justErrored = false;
        await navigating();
    } else if (count >= MAX_TRIGGERS) {
        quit = true;
    } else {
        if (randBetween(0, 500) == 0
            || (randBetween(0, 49) == 0 && $(document).height() > 200000)
            || (randBetween(0, 9) == 0 && $(document).height() > 300000)) {
            await navigating();
        } else if (randBetween(0, 99) == 0) {
            await scrolling(1);
        }
    }

    await forgetting();
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
            if (errorCount >= MAX_ERRORS) {
                quit = true;
            }
            justErrored = true;
        }
    });
});

start();
forgetting();
