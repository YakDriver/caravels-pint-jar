// fresh try
var MAX_ERRORS = 10;
var MAX_TRIGGERS = 1000;
var STATUS_EVERY = 10000;
var count = 0;
var errorCount = 0;
var quit = false;
var choice = Math.floor(Math.random() * 2);
var CANCEL_AFTER_MILLIS_WITHOUT = 75000;
var lastTrigger = (new Date()).getTime();
var MIN_SHORT_SIDE = 1999;

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log("Status " + getCompletion() + "%");
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    d = new Date();
    console.log("Done at " + d + ".");
}

function success(e) {
    if (e && e.length != 0) {
        e = null;
        return true;
    }
    e = null;
    return false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function doMenu(menu) {
    console.log("Choosing...");
    e = $("div.discovery_" + menu + "__target").trigger("click");
    s = success(e); e = null;
    if (s) {
        await sleep(1000);
        f = $("div." + menu + "_options ul li:eq(" + choice + ") a").trigger("click");
        choice = (choice + 1) % 2;
        f = null;
    }
    await sleep(2000);
}

async function scroll() {
    console.log("Scrolling...");
    window.scrollTo(0, $(document).height() - $(window).height());
    for (i = 0; i < 20; i++) {
        e = $("div.finished");
        s = success(e); e = null;
        if (s) {
            break;
        }
        await sleep(1000);
    }
    await sleep(4000);
}

async function scrollFew(max, min) {
    scrolls = Math.floor(Math.random() * (max - (min - 1))) + min;
    console.log("Scrolling " + scrolls + "...");
    for (j = 0; j < scrolls; j++) {
        //console.log("[DEBUG] Scroll " + j + "...");
        await scroll();
    }
    await sleep(5000);
    console.log("done.");
}

async function forget() {
    await doMenu("followers");

    do {
        await scrollFew(3, 1);
        arr = $("a.button.new_fav:not(.hearted)");
        if (arr.length == 0) {
            arr = null;
            console.log("Nothing found!");
        } else {
            console.log("Total found: " + arr.length);

            triggers = 0;
            maxTriggers = false;
            maxTime = false;
            arr.each(function (index) {
                e = $(this);
                f = e.parents("div.photo_thumbnail");
                g = f.find("img");
                h = g.attr("height");
                w = g.attr("width");
                if (Math.min(h, w) > MIN_SHORT_SIDE && !quit) {
                    e.trigger("click");
                    lastTrigger = (new Date()).getTime();
                    count++;
                    triggers++;
                }

                if (count >= MAX_TRIGGERS) {
                    quit = true;
                    maxTriggers = true;
                } else if (((new Date()).getTime() - lastTrigger) > CANCEL_AFTER_MILLIS_WITHOUT) {
                    quit = true;
                    maxTime = true;
                }
                e = null; f = null; g = null;
            });
            arr = null;
            console.log("Triggered: " + triggers);
            showStatus();
        }
        if (triggers > 0) {
            await sleep(Math.max(Math.round((triggers/5) * 1000),1000));
        }
    } while (!quit && triggers < (Math.floor(Math.random() * 20) + 5));

    if (quit) {
        if (maxTriggers) {
            console.log("Maximum triggers reached.");
        }
        if (maxTime) {
            console.log("Maximum time without trigger reached.");
        }
        end();
        return Promise.resolve('quitting');
    }

    await forget();
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
        }
    });
});

start();
forget();
