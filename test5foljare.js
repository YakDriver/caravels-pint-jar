const MAX_ERRORS = 10;
const STANDARD_SLEEP = 1000;
const STANDARD_SHORT_SLEEP = Math.floor(STANDARD_SLEEP / 2);
const MULTI_TRIES = 6;
const SELECT_OUT = true;

var errorCount = 0;
var quit = false;
var foljare = new Map();
var foljeslagare = new Map();
var outOnly = new Map();
var inOnly = new Map();
var both = new Map();
var asyncPass;

function start() {
    let d = new Date();
    console.log("Beginning at " + d + "...");
}

function end() {
    console.log("Completed");
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loading() {
    await sleep(100);
    while ($("li.infinite_scroll_loader").css("display") == "block") {
        await sleep(500);
    }
    await sleep(1000);
}

async function waitForFinished() {
    for (i = 0; i < 20; i++) {
        let e = $("div.finished");
        let s = success(e); e = null;
        if (s) {
            break;
        }
        await sleep(STANDARD_SHORT_SLEEP);
    }
    await sleep(STANDARD_SLEEP);
}

function getItemsSelector(out) {
    //return "li.actor" + (out ? ".following" : "");
    return "li.actor";
}

async function findAll(out, skrol, items) {
    let multiTry = 0;
    let lengthBefore = 0;
    do {
        lengthBefore = items.length;
        console.log('Items found: ' + lengthBefore);

        let backOff = 200;
        do {
            await sleep(backOff);
            backOff *= 2;
        } while (skrol == null && (backOff < STANDARD_SLEEP * 10));

        skrol.scrollTop(skrol[0].scrollHeight * 2);

        await loading();

        items = $(getItemsSelector(out));
        if (items.length == lengthBefore) {
            multiTry += out ? 2 : 1;
        }
    } while (items.length > lengthBefore || multiTry < MULTI_TRIES);

    await sleep(STANDARD_SLEEP);
}

async function openModal(out) {
    if (out) {
        $("ul li.following").trigger("click");
    } else {
        $("ul li.followers").trigger("click");
    }

    await sleep(STANDARD_SLEEP * 2);

    let e = $("div.follower_modal div.info.list.scroll");
    while (!success(e)) {
        console.log("Didn't find modal. Trying again...");
        await sleep(STANDARD_SLEEP * 2);
        e = $("div.follower_modal div.info.list.scroll");
    }

    let arr = $(getItemsSelector(out));

    await findAll(out, e, arr);

    arr = $(getItemsSelector(out));

    console.log("Found all");

    asyncPass = arr;

}

async function getInfo(out) {
    await openModal(out);

    await asyncPass.each(function (index) {
        let f = $(this).find("a.name");
        let displayName = f.text().trim();

        let actor = f.prop("href").substring(f.prop("href").lastIndexOf("/") + 1).trim();

        f = $(this).find("span.description");
        let infoCount = parseInt(f.text().trim().split(" ")[0]);

        f = $(this).find("a.avatar");
        let uri = f[0].style.backgroundImage.trim();
        let avi = uri.substring(5, uri.length - 2);

        foljeslagare.set(actor, [displayName, infoCount, avi]);

        f = null;
    });

    await sleep(STANDARD_SHORT_SLEEP);

    e = $("div.follower_modal div.close");
    if (success(e)) {
        e.trigger("click");
    }

    await sleep(STANDARD_SLEEP * 2);
}

async function forget() {
    await getInfo(false);
    console.log("Found foljeslagare:" + foljeslagare.size);

    let buffer = [];
    foljeslagare.forEach(function (item, key) {
        buffer.push("'" + key + "'");
        if (buffer.join(", ").length > 400) {
            console.log(buffer.join(", "), ",");
            buffer = [];
        }
    });
    if (buffer.length > 0) {
        console.log(buffer.join(", "), ",");
    }
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
