// enskild
const MAX_ERRORS_ENSKILD = 10;
const MAX_TRIGGERS = 15;
const STATUS_EVERY = 10000;
const LOAD_STALLED_AFTER = 30000;
//const BIGSLEEP = 900000;  // 15 minutes
const BIGSLEEP = 240000;  // 4 minutes

var count = 0;
var errorCount = 0;
var quit = false;
var millis = (new Date()).getTime();

setTimeout(function () { startAgain(); }, 5000);

async function startAgain() {
    console.log("Waking up...");
    $("ul.px_tabs li:eq(2) a").trigger("click");
    await sleeping(5000);

    count = 0;
    errorCount = 0;
    quit = false;
    millis = (new Date()).getTime();
    
    start();
    await goingForth();
    setTimeout(function () { startAgain(); }, BIGSLEEP);
    return Promise.resolve('startAgain');
}

async function goingForth() {
    while(!quit) {
        await doingOne();
    }
    end();
    return Promise.resolve('goingForth');
}

async function doingOne() {
    // count < 10 = 1:10; 10 < count < 100 = 1:20; 100 < count < 500 = 1:100
    if (randBetween(1, Math.min(10, count / 5)) == 1) {
        await scrolling();
        await sleeping(1000);
    }

    let e = $("a.button.new_fav:not(.hearted):first").trigger("click");
    let s = success(e); e = null;
    if (!s) {
        console.log("Nothing found!");
        await scrolling();
        if (!quit) {
            await sleeping(4000);
        }
    } else {
        count++;
    }

    let now = (new Date()).getTime();
    if (now > (millis + STATUS_EVERY)) {
        showStatus();
        millis = now;
    }

    if (quit || count >= MAX_TRIGGERS) {
        quit = true;
    } else {
        await sleeping(randBetween(500, 1500));
    }

    return Promise.resolve('doingOne');
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

async function loading() {
    await sleeping(200);
    let startLoad = (new Date()).getTime();
    while ($("div.infinite_scroll_loader").css("display") == "block") {
        await sleeping(500);        
        if ((new Date()).getTime() > (startLoad + LOAD_STALLED_AFTER)) {
            console.log("Loading stalled");
            break;
        }
    }
    return Promise.resolve('loading');
}

async function scrolling() {
    console.log("Scrolling...");
    let before = window.scrollY;
    await loading();
    window.scrollTo(0, $(document).height() * 2);
    await loading();
    if (before == window.scrollY) {
        console.log("Could not scroll (no movement detected)");
        quit = true;
    }
    return Promise.resolve('scrolling');
}

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
