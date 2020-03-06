// enskild
var MAX_ERRORS_ENSKILD = 10;
var MAX_TRIGGERS = randBetween(30, 50)
var STATUS_EVERY = 10000;
var LOAD_STALLED_AFTER = 20000;

var count = 0;
var errorCount = 0;
var quit = false;
var millis = (new Date()).getTime();

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log("Completed " + getCompletion() + "%");
}

async function loading() {
    await sleeping(200);
    let startLoad = (new Date()).getTime();
    while ($("div.infinite_scroll_loader").css("display") == "block") {
        await sleeping(500);
        if ((new Date()).getTime() > (startLoad + LOAD_STALLED_AFTER)) {
            console.log("Loading stalled");
            quit = true;
            break;
        }
    }
}

function start() {
    let d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    let d = new Date();
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

async function scrolling() {
    console.log("Scrolling...");
    let before = window.scrollY;
    await loading();
    window.scrollTo(0, $(document).height() - $(window).height());
    await loading();
    if (before == window.scrollY) {
        console.log("Scroll failed");
        quit = true;
    }
    await sleeping(1000);
}

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function forget() {
    while (!quit && count < MAX_TRIGGERS) {
        let e = $("a.button.new_fav:not(.hearted):first").trigger("click");
        let s = success(e); e = null;
        if (!s) {
            console.log("Nothing found!");
            await scrolling();
        } else {
            count++;
        }

        let now = (new Date()).getTime();
        if (now > (millis + STATUS_EVERY)) {
            showStatus();
            millis = now;
        }

        if (!quit) {
            await sleeping(randBetween(500, 1500));
        }
    }

    end();
    return Promise.resolve('quitting');
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

async function go() {
    count = 0;
    errorCount = 0;
    quit = false;
    millis = (new Date()).getTime();
    start();
    forget();
}

go();
