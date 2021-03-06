// enskild
var MAX_ERRORS_ENSKILD = 10;
//var MAX_TRIGGERS = getMaxTriggers(18.48);
var MAX_TRIGGERS = 200;
var STATUS_EVERY = 10000;
var count = 0;
var errorCount = 0;
var quit = false;
var millis = (new Date()).getTime();

function getMaxTriggers(d) {
    let lo = 1;
    let hi = 5;
    if (d > 16) {
        lo = Math.round((d - 16) * 10);
        hi = lo + Math.round((d - 16) * 3);

    }
    return randBetween(lo, hi);
}

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log("Completed " + getCompletion() + "%");
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

function scroll() {
    console.log("Scrolling...");
    before = window.scrollY;
    window.scrollTo(0, $(document).height() - $(window).height());
    if (before == window.scrollY) {
        return false;
    }
    return true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function forget() {
    // count < 10 = 1:10; 10 < count < 100 = 1:20; 100 < count < 500 = 1:100
    if (randBetween(1, Math.min(10, count / 5)) == 1) {
        await scroll();
        await sleep(1000);
    }

    if (quit) {
        end();
        return Promise.resolve('quitting');
    }

    e = $("a.button.new_fav:not(.hearted):first").trigger("click");
    s = success(e); e = null;
    if (!s) {
        console.log("Nothing found!");
        if (!scroll()) {
            quit = true;
        } else {
            await sleep(4000);
        }
    } else {
        count++;
    }

    now = (new Date()).getTime();
    if (now > (millis + STATUS_EVERY)) {
        showStatus();
        millis = now;
    }

    if (quit || count >= MAX_TRIGGERS) {
        quit = true;
    } else {
        await sleep(randBetween(500, 1500));
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
            if (errorCount >= MAX_ERRORS_ENSKILD) {
                quit = true;
            }
        }
    });
});

start();
forget();
