const MAX_ERRORS = 10;
const STANDARD_SLEEP = 1000;
const STANDARD_SHORT_SLEEP = Math.floor(STANDARD_SLEEP / 2);
const MULTI_TRIES = 6;
const SELECT_OUT = false;

var errorCount = 0;
var quit = false;
var foljare = new Map();
var foljeslagare = new Map();
var outOnly = new Map();
var inOnly = new Map();
var both = new Map();
var asyncPass;

var sortByDisplayName = function (a, b) {
    var x = a[0].toLowerCase();
    var y = b[0].toLowerCase();
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
}

var sortByCount = function (a, b) {
    if (a[1] == b[1]) {
        var x = a[0].toLowerCase();
        var y = b[0].toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    }
    return b[1] - a[1];
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
}

function end() {
    console.log("Completed");
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

function except(a, b) {
    var map = new Map(); // everything in a that is not in b
    for (var [key, value] of a) {
        if (!b.has(key)) {
            map.set(key, value);
        }
    }

    return map;
}

function inBoth(a, b) {
    var map = new Map(); // everything in a that is in b
    for (var [key, value] of a) {
        if (b.has(key)) {
            map.set(key, value);
        }
    }

    return map;
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
        e = $("div.finished");
        s = success(e); e = null;
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
    multi_try = 0;
    do {
        lengthBefore = items.length;
        console.log('Items found: ' + lengthBefore);

        backOff = 200;
        do {
            await sleep(backOff);
            backOff *= 2;
        } while (skrol == null && (backOff < STANDARD_SLEEP * 10));

        skrol.scrollTop(skrol[0].scrollHeight * 2);

        await loading();

        items = $(getItemsSelector(out));
        if (items.length == lengthBefore) {
            multi_try += out ? 2 : 1;
        }
    } while (items.length > lengthBefore || multi_try < MULTI_TRIES);

    await sleep(STANDARD_SLEEP);
}

async function openModal(out) {
    if (out) {
        $("ul li.following").trigger("click");
    } else {
        $("ul li.followers").trigger("click");
    }

    await sleep(STANDARD_SLEEP * 2);

    e = $("div.follower_modal div.info.list.scroll");
    if (!success(e)) {
        console.log("Didn't find modal");
        return
    }

    arr = $(getItemsSelector(out));

    await findAll(out, e, arr);

    arr = $(getItemsSelector(out));

    console.log("Found all");

    asyncPass = arr;

}

async function getInfo(out) {
    await openModal(out);

    await asyncPass.each(function (index) {
        f = $(this).find("a.name");
        displayName = f.text().trim();

        actor = f.prop("href").substring(f.prop("href").lastIndexOf("/") + 1).trim();

        f = $(this).find("span.description");
        infoCount = parseInt(f.text().trim().split(" ")[0]);

        f = $(this).find("a.avatar");
        uri = f[0].style.backgroundImage.trim();
        avi = uri.substring(5, uri.length - 2);

        if (out) {
            foljare.set(actor, [displayName, infoCount, avi]);
        } else {
            foljeslagare.set(actor, [displayName, infoCount, avi]);
        }

        f = null;
    });

    await sleep(STANDARD_SHORT_SLEEP);

    e = $("div.follower_modal div.close");
    if (success(e)) {
        e.trigger("click");
    }

    await sleep(STANDARD_SLEEP * 2);
}

function analyze() {
    outOnly = except(foljare, foljeslagare);
    inOnly = except(foljeslagare, foljare);
    both = inBoth(foljare, foljeslagare);
}

function sortList(asc, par) {
    li = par.children("li");
    li.detach().sort(function (a, b) {
        cA = parseInt($(a).find("span.description").text().trim().split(" ")[0]);
        cB = parseInt($(b).find("span.description").text().trim().split(" ")[0]);
        if (cA < cB) {
            return asc ? -1 : 1;
        } else if (cA > cB) {
            return asc ? 1 : -1;
        }

        sA = $(a).find("a.name").text().trim();
        sB = $(b).find("a.name").text().trim();
        if (sA < sB) {
            return -1;
        } else if (cA > cB) {
            return 1;
        }
        return 0;
    });
    par.append(li);
}

async function alternativRuttOut() {
    await getInfo(true);
    console.log("Found foljare:" + foljare.size);
    await getInfo(false);
    console.log("Found foljeslagare:" + foljeslagare.size);
    outOnly = except(foljare, foljeslagare);
    console.log("outOnly:" + outOnly.size);

    await openModal(true);

    var par = $("ul.actors");

    allA = par.find("a.avatar");
    allA.each(function () {
        $(this).attr("target", "_blank");
    });

    allA = par.find("a.name");
    allA.each(function () {
        $(this).attr("target", "_blank");
    });

    allA = par.find("")

    outOnly.forEach(function (item, key) {
        l = $("li.actor a.name[href='/" + key + "']");
        if (success(l)) {
            //console.log(key + " setting color");
            l.attr("style", "color: #f00;");
        } else {
            //console.log(key + " can't set color");
        }
    });

    /*
    foljeslagare.forEach(function (item, key) {
        l = $("li.actor a.name[href='/" + key + "']");
        if (success(l)) {
            l.parent().parent().remove();
        } else {
            //console.log(key + " can't set color");
        }
    });
    */

    allF = par.find("div.actor_info span.description");
    allF.each(function () {
        infoCount = parseInt($(this).text().trim().split(" ")[0]);
        if (infoCount < 1000) {
            // 0 = 255, 128, 0
            // 1000 = 0, 0, 0
            r = Math.floor((1000 - infoCount) * (255 / 1000));
            g = Math.floor((1000 - infoCount) * (128 / 1000));
            b = 0;
            if (infoCount < 500) {
                $(this).attr("style", "font-weight: bold; color: #fff; background-color: rgb(" + r + ", " + g + ", " + b + ");");
            } else {
                $(this).attr("style", "font-weight: bold; color: rgb(" + r + ", " + g + ", " + b + ");");
            }

        }
    });

    sortList(true, par);
}

async function alternativRuttIn() {
    await openModal(false);

    var par = $("ul.actors");

    allA = par.find("a.avatar");
    allA.each(function () {
        $(this).attr("target", "_blank");
    });

    allA = par.find("a.name");
    allA.each(function () {
        $(this).attr("target", "_blank");
    });

    allF = par.find("div.actor_info span.description");
    allF.each(function () {
        infoCount = parseInt($(this).text().trim().split(" ")[0]);
        // 0 = 255, 255, 255
        // 10000 = 255, 0, 0
        maxOut = 1000;

        r = 255;
        g = (infoCount > maxOut) ? 0 : Math.floor((maxOut - infoCount) * (255 / maxOut));
        b = g;
        if (infoCount < 500) {
            $(this).attr("style", "font-weight: bold; background-color: rgb(" + r + ", " + g + ", " + b + ");");
        } else {
            $(this).attr("style", "font-weight: bold; color: #fff; background-color: rgb(" + r + ", " + g + ", " + b + ");");
        }

    });

    sortList(false, par);
}

async function forget() {

    if (SELECT_OUT) {
        await alternativRuttOut();
    } else {
        await alternativRuttIn();
    }

    //analyze();
    //createModal();
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
