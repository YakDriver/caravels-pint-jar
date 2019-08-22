// fresh try
const MAX_ERRORS = 5;
const MAX_TRIGGERS = 3000;
const STATUS_EVERY = 10000;
const CANCEL_AFTER_MILLIS_WITHOUT = 300000;
const MIN_SHORT_SIDE = 1100;
const LOAD_STALLED_AFTER = 20000;
const LIMIT_SCROLLING = true;
const MAX_PER_ROUND = 20;
const LONG_SLEEP = 300000;

var count = 0;
var errorCount = 0;
var quit = false;
var choice = randBetween(0, 1);
var lastTrigger = (new Date()).getTime();
var already = new Map();
var longSleep = false;
var justLoaded = false;
var startTime = (new Date()).getTime();

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

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log(
        "Status " + getCompletion() + "% (" + count
        + ") (doc ht:" + $(document).height() + ")");
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    console.log("Errors: " + errorCount);
    d = new Date();
    console.log("Done at " + d + ".");
    end = (new Date()).getTime() - startTime;
    console.log("Ran for " + Math.round(end / 60000) + " minutes.");
}

function success(e) {
    if (e && e.length != 0) {
        e = null;
        return true;
    }
    e = null;
    return false;
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
            //await doingMenu("followers"); //doesn't seem to work
            //location.reload(true); //lose the console
            $("ul.px_tabs li:eq(1) a").trigger("click");
            await sleeping(3000);
            $("ul.px_tabs li:eq(2) a").trigger("click");
            await sleeping(3000);
            break;
        }
    }
    await sleeping(1000);
}

async function doingMenu(menu) {
    console.log("Choosing...");
    e = $("div.discovery_" + menu + "__target").trigger("click");
    s = success(e); e = null;
    if (s) {
        await loading();
        f = $("div." + menu + "_options ul li:eq(" + choice + ") a").trigger("click");
        await loading();
        choice = (choice + 1) % 2;
        f = null;
    }
    justLoaded = true;
}

async function scrolling(skrols = 3) {
    if (LIMIT_SCROLLING && skrols > 2) {
        skrols = 2;
    }
    console.log("Scrolling " + skrols + "...");
    for (i = 0; i < skrols && !quit; i++) {
        await loading();
        window.scrollTo(0, $(document).height() * 2);
        await loading();
    }
    justLoaded = true;
}

async function forget() {

    var triggers = 0;

    do {
        var delay = 500;
        if (justLoaded || triggers > 5) {
            justLoaded = false;
            delay = 5000 + Math.floor(($(document).height() / 150000) * 1000);
        }

        await sleeping(delay); // takes awhile for these to load
        arr = $("div.photo_thumbnail:not(.nsfw_placeholder) a.avatar:not(" + getBlacklistSelector() + ")")
            .parents("div.photo_thumbnail")
            .find("a.button.new_fav:not(.hearted)");

        //arr = $("a.button.new_fav.only_icon:not(.hearted)");
        if (arr && arr.length == 0) {
            arr = null;
            console.log("Nothing found!");
            await scrolling(randBetween(1, 4));
        } else {
            found = arr.length;
            console.log("Total found: " + found);

            triggers = 0;
            maxTriggers = false;
            maxTime = false;
            arr.each(function (index) {
                if (triggers < MAX_PER_ROUND && !quit && !longSleep) {
                    e = $(this);
                    f = e.parents("div.photo_thumbnail");
                    g = f.find("img");
                    h = g.attr("height");
                    w = g.attr("width");
                    s = g.attr("src").substring(g.attr("src").length - 10);
                    if (!already.has(s)) {
                        already.set(s, 1);
                        if (!e.hasClass("hearted") && Math.min(h, w) > MIN_SHORT_SIDE && !quit) {
                            e.trigger("click");
                            lastTrigger = (new Date()).getTime();
                            count++;
                            triggers++;
                        }
                    }

                    if (count >= MAX_TRIGGERS) {
                        quit = true;
                        maxTriggers = true;
                    } else if (((new Date()).getTime() - lastTrigger) > CANCEL_AFTER_MILLIS_WITHOUT) {
                        quit = true;
                        maxTime = true;
                    }

                    e = null; f = null; g = null;
                }
            });
            arr = null;

            console.log("Triggered: " + triggers);
            showStatus();

            await loading();
        }

        if (triggers == 0) {
            console.log("Nothing triggered!");
            await scrolling(randBetween(1, 4));
        }

        if (quit) {
            break;
        }

        if (longSleep) {
            await doingMenu("followers");
            console.log("Long sleep!");
            await sleeping(LONG_SLEEP);
            await doingMenu("followers");
            lastTrigger = (new Date()).getTime();
            longSleep = false;
        } else if (randBetween(0, 99) == 0
            || (randBetween(0, 69) == 0 && $(document).height() > 100000)
            || (randBetween(0, 29) == 0 && $(document).height() > 200000)
            || (randBetween(0, 4) == 0 && $(document).height() > 300000)) {
            await doingMenu("followers");
        }

    } while (!quit);

    if (maxTriggers) {
        console.log("Maximum triggers reached.");
    }
    if (maxTime) {
        console.log("Maximum time without trigger reached.");
    }
    end();
    return Promise.resolve('quitting');
}

$(function () {
    //setup ajax error handling
    $.ajaxSetup({
        error: function (x, status, error) {
            count--;
            errorCount++;
            if (x.status == 403) {
                console.log("--> 403 error"); //specific error
            } else {
                console.log(x.status + " error, status: " + status); //general error
            }
            if (errorCount >= MAX_ERRORS) {
                longSleep = true;
            }
        }
    });
});

start();
forget();
