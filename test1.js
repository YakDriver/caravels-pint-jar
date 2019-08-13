var MAX_ERRORS = 10;
var MAX_TRIGGERS = 1000;
var STATUS_EVERY = 10000;
var POST_TRIGGER_MILLIS = 500;
var count = 0;
var errorCount = 0;
var quit = false;
var tab = Math.floor(Math.random() * 2);
var millis = (new Date()).getTime();
var averageShorts = [];

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function doMenu(menu) {
    e = $("div.discovery_" + menu + "__target").trigger("click");
    s = success(e); e = null;
    if (s) {
        await sleep(1000);
        choice = Math.floor(Math.random() * 2);
        f = $("div." + menu + "_options ul li:eq(" + choice + ") a").trigger("click");
        f = null;
    }
}

async function navigate() {
    switch (Math.floor(Math.random() * 6)) {
        case 0:
        case 1:
        case 2:
        case 3:
            console.log("Scrolling...");
            window.scrollTo(0, $(document).height() - $(window).height());
            break;
        case 4:
            console.log("Switching tabs...");
            e = $("ul.px_tabs li:eq(" + tab + ") a").trigger("click");
            e = null;
            tab = (tab + 1) % 2;
            break;
        default:
            console.log("Picking menu option...");
            if (tab == 1 || Math.floor(Math.random() * 2) < 1) { // 50% goes here
                await doMenu("followers");
            } else {
                await doMenu("sort");
            }
    }
    await sleep(1000);

    for (i = 0; i < 20; i++) {
        e = $("div.finished");
        s = success(e); e = null;
        if (s) {
            break;
        }
        await sleep(1000);
    }

    await sleep(5000);
    console.log("done.");
}

async function forget() {
    if (quit) {
        end();
        return Promise.resolve('quitting');
    }

    e = $("a.button.new_fav:not(.hearted):first");
    if (!success(e)) {
        e = null;
        console.log("Nothing found!");
        await navigate();
    } else {
        count++;
        analyzeShort(e);
        e.trigger("click");
        await sleep(POST_TRIGGER_MILLIS);
        e = null;
    }

    now = (new Date()).getTime();
    if (now > (millis + STATUS_EVERY)) {
        showStatus();
        millis = now;
    }

    if (count >= MAX_TRIGGERS) {
        quit = true;
    } else {
        await sleep(Math.floor(Math.random() * 1001) + 500);
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
