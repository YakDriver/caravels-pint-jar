// färsk
const CONFIG_POP = 0;
const CONFIG_LOVANDE = 1;
const CONFIG_FARSK = 2;

const CONFIG = CONFIG_FARSK;          // ***
const SWITCH_FOLLOWERS = true;
const ONLY_FRESH = true;

const PER_SKROL_DELAY = 3000;
const LOAD_LOCK_DELAY = 2000;
const STATUS_EVERY = 15000;
const LOAD_STALLED_AFTER = 30000;
const ERROR_SLEEP = 18000;
const PRODUCER_TIMEOUT = 30000;

const MAX_ERRORS = 50;
var errorCount = 0;
var errored = false;
var loadingStalled = false;

const TRACK_TAGS = false;
const MAX_MAP_TO_SHOW = 100;

const STARTING_CHANCES_FRESH = 6; // 8 is high
const STARTING_CHANCES_UP = 7; // 8 is high
const STARTING_CHANCES_POP = 8; // 8 is high

const MIN_SHORT_SIDE = 1300;
const MIN_HRATING = 80;
const MIN_RATING = 70;

const VERBOSE = true;

var count = 0;
var skrolCount = 0;
var quit = false;
var changeTime = 0;
var startTime = (new Date()).getTime();
var commonTags = new Map();
var sleepEnd = 0;

var producers = new Map();
var producerCount = 0;
var producerLastRegistered = 0;
var loadLock = false;

//var userCounts = new Map();
//var userCountsAlready = new Map();

// producers: scroll, switch tab
// consumer: handle

//var configTab = randBetween(0, 5);
var configTab = 2;
var configPerSwitchDelay = 59000;
var configPerSkrolDelay = Math.floor(configPerSwitchDelay / 3);
configPerSwitchDelay = 30000;
configPerSkrolDelay = 30000;
var configFarskSkrols = 6;
var configOtherSkrols = 1;
var configMaxUserTrigs = 10;
var configMaxTrigs = 5000;

var menuTracker = 0;
var lastReceived = (new Date()).getTime();

var freshCount = 0;
var nonFreshCount = 0;
//var highestFresh = new Map();
//var highestFreshViews = new Map();
/*
var configTab = 2;
var configPerSwitchDelay = 120000;
var configSkrolToSwitch = 1;
var configMaxUserTrigs = 3;
var configMaxTrigs = 5000;

if (CONFIG == CONFIG_POP) {
    configTab = 0;
    configPerSwitchDelay = 10000;
    configSkrolToSwitch = 4;
    configMaxUserTrigs = 6;
    configMaxTrigs = 100;
} else if (CONFIG == CONFIG_LOVANDE) {
    configTab = 1;
    configPerSwitchDelay = 10000;
    configSkrolToSwitch = 5;
    configMaxUserTrigs = 4;
    configMaxTrigs = 200;
}
*/

showStatus();
controlCentral();

async function controlCentral() {
    start();

    addToMap();
    await addingDataListener();
    await sleeping(3000);

    while (!quit) {
        if (!quit) {
            await doChanging();
        }

        while (producers.size > 0
            && !quit
            && !loadingStalled
            && (new Date()).getTime() < (producerLastRegistered + PRODUCER_TIMEOUT)) {
            await sleeping(1000);
        }

        if (!quit &&
            (loadingStalled || (new Date()).getTime() >= (producerLastRegistered + PRODUCER_TIMEOUT))) {
            if (loadingStalled) {
                console.log("TIMEOUT (loading stalled)");
                loadingStalled = false;
            } else {
                console.log("TIMEOUT");
            }
            producers = new Map();
            producerCount = 0;
            skrolCount = 0;
            loadLock = false;
            await sleeping(5000);
            await doChanging();
        }

        if (errored && !quit) {
            errored = false;
            await sleeping(ERROR_SLEEP);
        }

        if (count >= configMaxTrigs || errorCount >= MAX_ERRORS) {
            quit = true;
        }

        await sleeping(PER_SKROL_DELAY);
    }
    end();
}

async function doChanging() {
    switch (menuTracker) {
        case 0:
            await sleeping(configPerSkrolDelay, true);
            await switchingTab(2);
            menuTracker++;
            break;
        case 1:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 2:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 3:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 4:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 5:
            await sleeping(configPerSwitchDelay, true);
            if (SWITCH_FOLLOWERS) {
                await switchingMenu("followers");
            }
            menuTracker++;
            break;
        case 6:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 7:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 8:
            await sleeping(configPerSwitchDelay, true);
            if (ONLY_FRESH) {
                await switchingTab(2);
            } else {
                await switchingTab(1);
            }
            menuTracker++;
            break;
        case 9:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 10:
            await sleeping(configPerSwitchDelay, true);
            if (SWITCH_FOLLOWERS) {
                await switchingMenu("followers");
            }
            menuTracker++;
            break;
        case 11:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 12:
            await sleeping(configPerSwitchDelay, true);
            if (ONLY_FRESH) {
                await switchingTab(2);
            } else {
                await switchingTab(0);
            }
            menuTracker++;
            break;
        case 13:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 14:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 15:
            await sleeping(configPerSwitchDelay, true);
            await switchingTab(2);
            menuTracker++;
            break;
        case 16:
            await sleeping(configPerSwitchDelay, true);
            if (SWITCH_FOLLOWERS) {
                await switchingMenu("followers");
            }
            menuTracker++;
            break;
        case 17:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 18:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 19:
            await sleeping(configPerSwitchDelay, true);
            await switchingMenu("sort");
            menuTracker++;
            break;
        case 20:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 21:
            await sleeping(configPerSwitchDelay, true);
            await switchingTab(2);
            menuTracker++;
            break;
        case 22:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;
        case 23:
            await sleeping(configPerSwitchDelay, true);
            if (SWITCH_FOLLOWERS) {
                await switchingMenu("followers");
            }
            menuTracker++;
            break;
        case 24:
            await sleeping(configPerSkrolDelay, true);
            await scrolling();
            menuTracker++;
            break;

        default:
            menuTracker = 0;
            await doChanging();
    }
}

async function switchingMenu(menu) {
    loadLock = true;
    registerProducer();

    console.log("Switching menu (" + menu + ")...");

    await loading();
    $("div.discovery_" + menu + "__target").trigger("click");
    await sleeping(1500);
    $("div." + menu + "_options ul li a:not(.selected)").trigger("click");
    await loading();

    loadLock = false;
    await sleeping(3000);
}

async function switchingTab(tab) {
    loadLock = true;
    registerProducer();
    if (tab > 2) {
        tab = 2;
    }

    console.log("Switching tabs (" + tab + ")...");

    await loading();
    $("ul.px_tabs li:eq(" + tab + ") a").trigger("click");
    await loading();
    loadLock = false;
    await sleeping(3000);
}

async function scrolling(skrols = 1) {
    loadLock = true;
    registerProducer();
    console.log("Scrolling " + skrols + "...");
    let beforeHt = $(document).height();
    for (i = 0; i < skrols && !quit; i++) {
        await loading();
        window.scrollTo(0, $(document).height() * 2);
        await loading();
        if (beforeHt == $(document).height()) {
            console.log("Unable to scroll");
            loadingStalled = true;
            break;
        }
    }
    loadLock = false;
}

function registerProducer() {
    producers.set(producerCount, "valid");
    producerCount++;
    producerLastRegistered = (new Date()).getTime();
}

function bannedShots(id) {
    return individualNos.includes(id);
}

function handleIndividual(one) {
    if (one.tags && TRACK_TAGS) {
        for (j = 0; j < one.tags.length; j++) {
            commonTags.increment(one.tags[j].toLocaleLowerCase().substr(0, 20));
        }
    }

    let tn = $("a[href*=" + one.id + "]").parent("div.photo_thumbnail");
    if (!success(tn)) {
        console.log("Little problem, Houston... Thumbnail not found! Skipping...");
        return false;
    }

    if (one.voted == null) {
        console.log("Little problem, Houston... Info not found! Skipping...");
        return false;
    }

    if (bannedShots(one.id)) {
        console.log("Banned shot. Skipping...");
        return false;
    }
    //tn.append('<div class="photo_thumbnail__pulse_container"><span class="photo_thumbnail__pulse">'
    //    + one.rating
    //    + '/' + one.highest_rating + '/' + daysAgo.toFixed(1) + 'd</span></div>');

    /*
    "active": 1,
    "about": "",
    "upgrade_status": 3,
    "affection": 2019,
    "followers_count": 0,
    "following": false
    */

    // *** image
    let chancesVerbose = "℉";
    let chances = STARTING_CHANCES_FRESH;
    if (one.feature && one.feature == "upcoming") {
        chances = STARTING_CHANCES_UP;
        chancesVerbose = "Ü";
        chances -= 1;
    } else if (one.feature && one.feature == "popular") {
        chances = STARTING_CHANCES_POP;
        chancesVerbose = "þ";
        chances -= 2;
    }

    chancesVerbose += one.times_viewed;

    let daysAgo = (new Date() - Date.parse(one.created_at)) / (1000 * 60 * 60 * 24);

    if (Math.round(one.highest_rating) > 0 && one.feature) {
        switch (one.feature) {
            case "fresh":
                if (Math.round(one.highest_rating) >= 65) {
                    chances -= 3;
                    chancesVerbose += "ⓕ";
                } else if (Math.round(one.highest_rating) >= 61) {
                    chances -= 2;
                    chancesVerbose += "⒡";
                } else if (Math.round(one.highest_rating) >= 40) { // 58 is about top 25%
                    chances -= 1;
                    chancesVerbose += "ḟ";
                } else {
                    chances += 9001;
                    chancesVerbose += "∅";
                }
                break;
            case "popular":
                //chances += 9001;
                if (Math.round(one.highest_rating) >= 88) {
                    chances -= 3;
                    chancesVerbose += "ⓕ";
                } else if (Math.round(one.highest_rating) >= 85) {
                    chances -= 2;
                    chancesVerbose += "⒡";
                } else if (Math.round(one.highest_rating) >= 80) {
                    chances -= 1;
                    chancesVerbose += "ḟ";
                } else {
                    chances += 9001;
                    chancesVerbose += "∅";
                }
                break;
            case "upcoming":
                if (Math.round(one.highest_rating) >= 79) {
                    chances -= 3;
                    chancesVerbose += "ⓕ";
                } else if (Math.round(one.highest_rating) >= 78) {
                    chances -= 2;
                    chancesVerbose += "⒡";
                } else if (Math.round(one.highest_rating) >= 70) {
                    chances -= 1;
                    chancesVerbose += "ḟ";
                } else {
                    chances += 9001;
                    chancesVerbose += "∅";
                }
                break;
        }
    } else {
        chances += 9001;
        chancesVerbose += "∅";
    }

    if (one.comments_count >= 20) {
        chances -= 3;
        chancesVerbose += "ⓒ";
    } else if (one.comments_count >= 10) {
        chances -= 2;
        chancesVerbose += "⒞";
    } else if (one.comments_count >= 2) {
        chances -= 1;
        chancesVerbose += "C";
    } else {
        chancesVerbose += "₡";
    }

    chances -= (Math.min(one.height, one.width) >= MIN_SHORT_SIDE) ? 1 : 0;
    chancesVerbose += (Math.min(one.height, one.width) >= MIN_SHORT_SIDE) ? "S" : "ഗ";

    if (one.times_viewed > 100 && (one.votes_count / one.times_viewed) >= 0.2532) {
        chances -= 5;
        chancesVerbose += "优"; //excellent
        chancesVerbose += '-' + one.id + '-';
    } else if (one.times_viewed > 100 && (one.votes_count / one.times_viewed) >= 0.2174) {
        chances -= 2;
        chancesVerbose += "特"; //special
        chancesVerbose += '-' + one.id + '-';
    } else if (one.times_viewed > 100 && (one.votes_count / one.times_viewed) >= 0.1652) {
        chances -= 1;
        chancesVerbose += "好"; //good
        chancesVerbose += '-' + one.id + '-';
    } else if (one.times_viewed > 50 && (one.votes_count / one.times_viewed) >= 0.08) {
        chances -= 0;
    } else if (one.feature != "fresh") {
        chances += 9001;
    }

    // *** time
    chancesVerbose += "-";

    // 15 min
    chances -= (daysAgo <= 0.010416666666667) ? 1 : 0;
    chancesVerbose += (daysAgo <= 0.010416666666667) ? "N" : "O";

    // 1 min
    chances -= (daysAgo <= 0.000694444444444 && one.votes_count == 0) ? 1 : 0;
    chancesVerbose += (daysAgo <= 0.000694444444444 && one.votes_count == 0) ? "θ" : "";

    // *** user
    chancesVerbose += "-";

    chances -= (one.user.country && one.user.country == "China") ? 1 : 0;
    chancesVerbose += (one.user.country && one.user.country == "China") ? "中国" : "";
    chances -= (one.user.country && one.user.country == "Japan") ? 2 : 0;
    chancesVerbose += (one.user.country && one.user.country == "Japan") ? "日本" : "";
    chances -= (one.user.about &&
        one.user.about.length >= 0) ? 1 : 0;
    chancesVerbose += (one.user.about &&
        one.user.about.length >= 0) ? "b" : "";
    chances -= (one.user.upgrade_status == 2) ? 1 : 0;
    chancesVerbose += (one.user.upgrade_status == 2) ? "ṗ" : "";
    chances -= (one.user.upgrade_status == 3) ? 2 : 0;
    chancesVerbose += (one.user.upgrade_status == 3) ? "P" : "";
    chances -= (one.user.affection > 0 && one.user.affection <= 1500) ? 1 : 0;
    chancesVerbose += (one.user.affection > 0 && one.user.affection <= 1500) ? "å" : "";
    chances -= (one.user.affection >= 50000) ? 1 : 0;
    chancesVerbose += (one.user.affection >= 50000) ? "a" : "";
    chances -= (one.user.affection >= 500000) ? 1 : 0;
    chancesVerbose += (one.user.affection >= 500000) ? "A" : "";

    chances -= (one.user.followers_count > 0 && one.user.followers_count <= 200) ? 1 : 0;            //sometimes always 0
    chancesVerbose += (one.user.followers_count > 0 && one.user.followers_count <= 200) ? "ƒ" : "";
    chances -= (one.user.followers_count >= 3000) ? 1 : 0;
    chancesVerbose += (one.user.followers_count >= 3000) ? "f" : "";
    chances -= (one.user.following) ? 3 : 0;
    chancesVerbose += (one.user.following) ? "Ḟ" : "";

    let badFlag = false;

    if (!badFlag) {
        if (findOnBlackList(one.user.username)) {
            badFlag = true;
        }
    }

    if (!badFlag && (
        (daysAgo >= 0.041666666666667 && one.votes_count <= 5 || (one.times_viewed > 0 && (one.votes_count / one.times_viewed) <= 0.012121212121212)
        )
        && Math.min(one.height, one.width) < MIN_SHORT_SIDE
        && one.feature == "fresh")) {
        badFlag = true;
    }

    randBetween(0, 1000);
    let randomChance = (randBetween(0, chances - 1) == 0);

    /*
    if (one.voted === true || one.liked === true) {
        userCounts.increment(one.user.username);
        userCountsAlready.increment(one.user.username);
    }
    */

    if (
        !one.nsfw
        && !one.has_nsfw_tags
        && (one.user.affection == 0 || one.user.affection >= 500)
        && (one.voted === false || one.liked === false)
        && goodCats.includes(one.category)
        //&& (!userCounts.has(one.user.username)
        //    || one.user.following
        //    || userCounts.get(one.user.username) < configMaxUserTrigs)
        && randomChance
    ) {
        let but = tn.find("a.button.new_fav");
        if (!success(but)) {
            but = null;
            console.log("Little problem... Button not found! Skipping...");
            return false;
        }

        if (!badFlag) {
            //userCounts.increment(one.user.username);
            but.trigger("click");
            count++;
            if (one.feature == "fresh") {
                freshCount++;
            } else {
                nonFreshCount++;
            }
        } else {
            chancesVerbose = "*BL:" + one.id + ":" + chancesVerbose;
        }

        if (VERBOSE) {
            console.log(chancesVerbose + " VOTE... ("
                + "chances: 1:" + chances
                + ", ct: " + count
                + ", r: " + one.rating
                + ", hr: " + one.highest_rating
                + ")");
        }
    }

    return true;
}

function handleResponse(response) {
    let obj = JSON.parse(response);

    if (loadLock && !quit && obj.photos && !obj.current_page) {
        setTimeout(function () { handleResponse(response); }, LOAD_LOCK_DELAY);
        console.log("Loading lock delay...");
        return;
    } else if (!loadLock && !quit && obj.photos && !obj.current_page) {
        console.log("Info received. length:" + Object.keys(obj.photos).length);
        Object.keys(obj.photos).forEach(function (val) {
            handleIndividual(obj.photos[val]);
        });
        lastReceived = (new Date()).getTime();
        setTimeout(function () { handleResponse("{ \"wake\": 0 }"); }, 5000);
    } else if (obj.wake) {
        if (((new Date()).getTime() - lastReceived) > 4500 && producers.size > 0) {
            producers.delete(producerCount - 1);
        }
    }

}

async function addingDataListener() {
    while (!document.body || !document.head) {
        await sleeping(500);
    }

    interceptData();
}

function interceptData() {
    var xhrOverrideScript = document.createElement('script');
    xhrOverrideScript.type = 'text/javascript';
    xhrOverrideScript.innerHTML = `
    (function() {
      var XHR = XMLHttpRequest.prototype;
      var send = XHR.send;
      var open = XHR.open;
      XHR.open = function(method, url) {
          this.url = url; // the request url
          return open.apply(this, arguments);
      }
      XHR.send = function() {
        this.addEventListener('load', function() {
              if (this.url.includes('api.500px')) {
                  handleResponse(this.response);
              }
          });
          return send.apply(this, arguments);
      };
    })();
    `
    document.head.prepend(xhrOverrideScript);
}

function getCompletion() {
    return Math.round(count * 100.0 / configMaxTrigs);
}

function showStatus() {

    let untilTime = ((sleepEnd - (new Date()).getTime()) / 1000).toFixed(1);

    console.log(
        "Status " + getCompletion() + "% "
        + " (tab: " + configTab + ")"
        + " (" + (count / (((new Date()).getTime() - startTime) / 1000)).toFixed(1) + "cps)"
        + " (next change: " + untilTime + "s)"
        + " (ct:" + count + ") (doc ht:" + $(document).height() + ")"
        + " (producers: " + producers.size + ")"
        + " (producer count: " + producerCount + ")"
        //+ " (user count: " + userCounts.size + ")"
    );
    if (!quit) {
        setTimeout(function () { showStatus(); }, STATUS_EVERY);
    }
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + configMaxTrigs);
}

function end() {
    console.log("Completed " + count + " out of " + configMaxTrigs + " (" + getCompletion() + "%)");
    console.log("Error count: " + errorCount);
    d = new Date();
    console.log("Done at " + d + ".");
    end = (new Date()).getTime() - startTime;
    console.log("Ran for " + Math.round(end / 60000) + " minutes.");
}

function randBetween(low, high) {
    if (high < 1) {
        return 0;
    }
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

function sleeping(ms, track = false) {
    if (track) {
        sleepEnd = (new Date()).getTime() + ms;
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loading() {
    await sleeping(200);
    startLoad = (new Date()).getTime();
    while ($("div.infinite_scroll_loader").css("display") == "block") {
        await sleeping(500);
        if ((new Date()).getTime() > (startLoad + LOAD_STALLED_AFTER)) {
            console.log("Loading stalled");
            await sleeping(30000);
            loadingStalled = true;
            break;
        }
    }
}

$(function () {
    //setup ajax error handling
    $.ajaxSetup({
        error: function (x, status, error) {
            if (x.status == 403) {
                console.log("--> 403 error"); //specific error
                errorCount++;
                errored = true;
            } else if (x.status == 0) {
                console.log("Zero error?? " + x.message);
            } else {
                console.log(x.status + " error, status: " + status); //general error
                errorCount++;
                errored = true;
            }
        }
    });
});

function addToMap() {
    Map.prototype.increment = function (k, forceFixed = false, decimals = 1) {
        if (typeof k == 'string') {
            k = k.trim();
        }
        if (k == null || k == "null" || k == "" || k == 0 || k == "0" || k == "----") {
            k = "None";
        }
        if (forceFixed && k != "None") {
            k = parseFloat(k).toFixed(decimals);
        }
        if (k == "" || k == 0 || k == "0" || k == "NaN") {
            k = "None";
        }
        this.set(k, this.has(k) ? (this.get(k) + 1) : 1);
    };

    Map.prototype.show = function (title = "") {
        console.log(title.padEnd(30, "-"));
        let mapSort = new Map([...this.entries()].sort((a, b) => b[1] - a[1]));
        let count = 0;
        mapSort.forEach(function (v, k) {
            count++;
            if (count <= MAX_MAP_TO_SHOW) {
                console.log(k + ": " + v);
            }
        });
    };
}

// add new to the end, only keep 10-15
var individualNos = [
    "1009058249",
    "1009071511",
    "1009071618",
    "1009071716",
    "1009072104",
    "1008608106",
    "1009070483",
    "1009075499",
    "1009080330",
    "1009080527",
    "1009088252",
    "1009136040",
    "1009129521",
    "1009100509",
    "1009177973",
    "1009179267",
    "1009178827",
    "1009179735",
    "1009179927",
    "1009180004",
    "1009180047",
    "1009186075",
    "1009184460",
    "1009190478",
    "1009202251",
    "1009016372",
    "1009203368",
    "1009201511",
    "1005846927",
    "1009165068",
    "1009164751",
    "1009215878",
    "1009213987",
    "1009222046",
    "1009224489",
    "1009224345",
    "1009224344",
    "1009224932",
    "1009226721",
    "1009223416",
    "1009225284",
    "1009231198",
    "1009229669",
    "1009238093",
    "1009249108",
    "1009241600",
];

var blacklists = {};

// same as index or after is okay (as long as not after the _next_ key)
blacklists['!!'] = ['_geneoryx', '_keane_', '_marvellous_77', '1060photography', '1102', '12twomodeling', '1306', '19081969', '2008sever', '2448541543', '2urikov_art', '309966388', '3doorsofsun', '451053852', '4ecea5d184d6f984e17e08a4211858371', '4eleven', '500px1929', '5500_kelvin', '635139268', '652018fc84760898be087ed8efc754638', '666nurbex', '770112380', '79112663320', '843029175', '87762246988', '883photos', '89205537525', '9a56fd72441bfb8585ab733060c868064'];
blacklists['a!'] = ['amoltuhegle', 'aitkenpearson', 'aleksandartomovski1', 'albertocama', 'adrian79goe', 'adamwhite31', 'aafotografiabcn', 'amcite', 'a4nx0d983k', 'abcdvt19', 'abmphoto', 'aboutrecht', 'acondequ', 'adaggio', 'adam_j_white', 'adamsphotography1', 'adelmaghsoudi', 'adenry', 'adidas77', 'adolfogosalvez', 'adrianvanleeuwen', 'adyphotography', 'aedawn', 'af_digiarts', 'af_fotodesign', 'afa-shots', 'afgnbg', 'afps3021', 'agnesdylanv', 'agnieszkapretki1', 'agurylev75', 'agusphotographer', 'ahmadmondphoto', 'ahmed-m-91', 'ahowc', 'air_cover_lax', 'aivisveide', 'akanistudio', 'albanoduarte', 'albertlesnoy', 'albertogalan', 'albertoortizfotografo', 'alcot', 'aledimages', 'aleksandermargolin', 'aleksandrsfjodorovs', 'alekseyburcev13', 'alessandro_lorenzoni', 'alessandrodalex', 'alessandrofabbriartist', 'alessandroguidifotografo', 'alex_borisov', 'alexanderbessheynov', 'alexanderkirkov', 'alexanderkphotography', 'alexandrivanov12', 'alexandruzdrobau', 'alexbasov', 'alexbrune', 'alexclara96', 'alexdarash', 'alexeibazdarev', 'alexey54', 'alexfetter', 'alexk', 'alexkan', 'alfie_rugtveit', 'alfredocampos', 'alincms', 'alipazani', 'allakorg', 'allden', 'allor59', 'alonso91', 'alpcem', 'alplata', 'altuscalceus', 'amandabambu', 'amandadiaz', 'amirmohammadjafari', 'amnonbarnea', 'amphotoil', 'amusial'];
blacklists['an'] = ['art_of_moment_photography', 'anvybui613', 'ariophotowork', 'annatarga', 'avg_foto', 'andreevskoeznamia1995', 'archerphoto', 'an_gi', 'anaklisuric', 'analuar', 'anatolybolkov', 'anda-calin', 'andcar', 'andix_photography', 'andrea_and_more', 'andreaaccordino', 'andreaberengan', 'andreabltr', 'andreamanfredini2', 'andreamassarenti', 'andreapasson', 'andreasfriedl', 'andreduartecamilo', 'andrew_chemerys', 'andrewcmphotography', 'andrewess', 'andrewgnezdilov', 'andreybrandis', 'andreyguryanov1', 'andreykaluga85', 'andriusstanknas', 'andrreuter', 'andyf_photo', 'anka_zhuravleva', 'annakurzawska', 'annalogue', 'annamariahalldors', 'annashuv', 'annehoffmann', 'annetochkadolg', 'anthonybyron', 'antoinelewisgraphix', 'antolozazd', 'antoniodelgado246', 'antoniogirlando', 'antoniosaponaro', 'antonioserini', 'antonmakarov81', 'antonrothmund', 'antonzhilin74', 'antoshina_t', 'antvap', 'aphonie', 'apolloreyes', 'aqualine', 'aragorn1278', 'archispbreg', 'archstratic', 'arekwozniak', 'arielgrabowsky', 'art_urs', 'art-gvozdkov', 'artem_stisovyak', 'artemmostovoy', 'artigianodellaluce00', 'artmadi', 'artyushin', 'asifoto7', 'asimovphoto', 'astrapopwally', 'atapin', 'atypiique', 'aubry_lionel', 'avedemidov', 'averyanovkirill', 'avlight', 'aykutsevinc', 'aysunpeker06'];
blacklists['b!'] = ['brijwork', 'b3ast', 'babiow', 'bahaamonzer', 'bajofo', 'balenkod', 'balonny', 'baly', 'banzaroli', 'barbera', 'baron_barbaron', 'barriespence', 'bastiboehmertcom', 'bauer_pics', 'bazarov_photography', 'bc_photo', 'be_photography', 'bear801116', 'beautyfong', 'bebesa', 'belapho', 'belovodchenko', 'benjaminsurinphotographe', 'berlinimages', 'bernardez', 'bernardpitet', 'berthelotlouis', 'biancakoennecke', 'bigcityfotografie', 'biocity_monte', 'black-box-pictures', 'blackacephotography', 'blackflashphoto', 'blascocaballero', 'blaskojan', 'blessedeto', 'blgdsgn', 'bloxsphoto', 'bo-agency', 'bobby_chi', 'bodyscape2', 'bolfova', 'borislavgeorgiev', 'bou_takanashi', 'boudoir-photographer', 'boudoirbyjason', 'boudoirpassion', 'boyan_kostov', 'bpdq69', 'bradleyclprice', 'brandonwitzel', 'bree-lynnmistol', 'brenczyk', 'bruno-birkhofer', 'bruslan', 'bulinkov', 'bunskiphotography', 'burdov', 'burgeroto', 'buzdorphotography', 'byfab', 'bymarcelomartins'];
blacklists['c!'] = ['chundruapparao', 'clarencegood', 'chrisaraferr', 'chelioss73', 'cenon', 'calvinsmith', 'camattree', 'campisimarco', 'cangyan', 'canon550dmark0', 'caperrine99', 'capturedgram', 'carasionut', 'carlalbro', 'carloscervantes1', 'carloslarretxitapias', 'carlospinoso', 'carrielou', 'casey_harris', 'cassandrajulliaoff', 'catapumblamblam', 'cbarnesphotos', 'cedg76', 'cedricchevalier', 'celinerusso', 'centvingt', 'cerbii', 'cerfpatrick', 'cesarcruciani1', 'cescglow', 'cezarykotarski', 'chadjweed', 'charlesnevols', 'che_rry', 'cheffe123', 'chinilov', 'chiow', 'chris_bos_photographer', 'chrisbudke', 'chrisdrv', 'christinspooner', 'christophebillonphotographe', 'christoskyriazis', 'christossewell', 'chruse-photography', 'chuckarelei', 'cichos', 'cisumynnek', 'claudechaubo', 'claudio_fotografia', 'claudiobinnellafotografie', 'claudioulrich', 'clvvssypro', 'cmanchisi', 'cobaltbluephoto', 'cobeadwkr', 'colbyfiles', 'cole_m88', 'collinx', 'contatofotografiaparameninas', 'corrichella', 'corwinpixel', 'coyotakpictures', 'cpmc_elle', 'crazyshoot', 'crg0107', 'cristian83', 'crying3man', 'ctanser', 'cyrilkazian', 'cyrilmax'];
blacklists['d!'] = ['dbolanios', 'darkroomf', 'da_trem', 'defrennemarc', 'darrenlangloisphotography', 'dagotakru', 'dainty555', 'daisy_van_heyden', 'dakicmladen', 'damianoeffe', 'damienmohn', 'danailyadharma', 'dancemovements', 'dani_diamond', 'danial333', 'danielcichy', 'daniele_d-adamo', 'danieledalcastagne', 'danielrosse', 'danilofacci', 'danishmalik181991', 'danivrial', 'dannydouglas64', 'dantelespagnol', 'danydaniel39', 'danyelweideman', 'danylomykhailenko', 'darianesanche', 'dariella', 'dariobertozzi1', 'darius_wallenstein', 'darkelfphoto', 'daryakomarova', 'dasakatja2', 'dashamari', 'datenreiter', 'davekelleyphotography', 'davew_500px', 'david_engel_oficial', 'david_labasque', 'david_palmer_photography', 'david-foto', 'davidefraserii', 'davidepaltrinieri', 'davidfperezart', 'davidmorgan5', 'davidnemesszeghy', 'davidos00', 'davisacuff', 'dbater1', 'dbelyaev', 'dbond_photography', 'dcphotografer', 'ddbphotographer', 'ddev1', 'ddroke', 'deanirvine_ue', 'deanprestonphotography', 'dearie_works', 'dechatel', 'deimons685', 'dembelnavsegda', 'demiralaymetin', 'denggeorge', 'denis_fustachenko', 'denis009', 'denises3', 'denisgoncharov', 'deniskin', 'deniskovalenko', 'denispictures', 'denisvaljean', 'denysganba', 'designpictures', 'devik666', 'devite', 'dextereal', 'deyvian', 'dhadfield1995'];
blacklists['di'] = ['dms93md', 'drpocholo', 'diananemes98', 'dibrein', 'diegosteffe', 'dieteremil', 'dimasfrolov', 'dimipan1', 'dimos1983', 'dinhnhatvu', 'diptychstudio', 'dirkadolphs', 'dirkchristiaens', 'dirkrohra', 'dirtyartsphotography', 'djohnbest', 'djuansala', 'dkphotosparis', 'dlehmussaari', 'dmitry_4d', 'dmitry_tsvetkov', 'dmitryarhar', 'dmitrykalashnikov', 'dmitrysn', 'dominiqueseefeldt1', 'donatomerante', 'doreenschttker', 'dorfberg', 'dorianodisalvo', 'dougross', 'downloadlagubau', 'drazentiric', 'drsage', 'dutkair', 'dxfoto'];
blacklists['e!'] = ['edupacheco', 'enotova', 'eakpokdeng', 'ericsanchez', 'ebalin', 'edelmanjay', 'edgardel', 'edgarosmanbeyli125', 'editole', 'ednikityuk', 'edroncal', 'eexit', 'efremovs', 'efrenw', 'efreyer', 'egorovstudio', 'eigor', 'eilonfulman', 'eisengel78', 'ejik174', 'ejsmartphotography', 'ejyphoto', 'ekiwi', 'elarola', 'elcian', 'eliara', 'elisamarcotulli', 'eloza', 'elrumenz', 'emadmymbd', 'emanuelcorso', 'emanueledibattista1', 'emh1917', 'emkhabibullin', 'emmanuel_esguerra', 'emmanuelgarcia2', 'emmasensual', 'emy_scintilladisole17', 'encorebenoit', 'enriquesantamariacortes', 'enzo_65', 'enzo_bellina', 'epicshoots', 'erajkasadi', 'eremius', 'eric212grapher', 'ericadamgray', 'ericrobeir', 'ericsnyderphoto', 'erikrozman', 'erinapap', 'erinoeventi', 'ernestshapiro', 'erosreflections', 'esguerraster', 'eugene_reno', 'eugenue_chufarov', 'eusebioc34', 'evansemuta', 'evgeny82', 'evgenypix', 'evgogrigorev1991', 'evorberg', 'evrispap', 'exdrummer'];
blacklists['f!'] = ['foto_500px', 'ffyr1', 'finelinesjamie', 'fabiencphotographie', 'fabiob2968', 'fabiocrimaldi1', 'fabricemeuwissen', 'fabriciogarciaphotography', 'fabrizioliva89', 'falk-fotografie', 'fanciart', 'fanisphotography', 'fankovin', 'farcrystudios', 'farisphotos', 'fatholahi', 'fdumas94', 'feastingeyes', 'fedorenkoanton', 'fedorovsergeica', 'feelgoodphotography_nc', 'felixrachor', 'ferdolinsky', 'fernancr', 'fetish', 'feuillet', 'fidaadaw', 'fidelcomas', 'filatoff', 'filippodemaio', 'filippovphoto', 'finbar_mad', 'fineartnude', 'fionafoto1', 'fixfocus', 'fl-photostudio', 'flashnmodels', 'flickr5', 'florentbellurot', 'florentbilen', 'fmarjanephotography', 'fndorod', 'focaleemotions', 'focuus', 'fondwell', 'forlorntreasures', 'foto-schlender', 'foto-schlouck', 'foto-werkstatt', 'foto318', 'fotodet', 'fotogill', 'fotografie-mr', 'fotokrelles', 'fotomik_129', 'fotomod1953', 'fotoshi', 'foxybat', 'fr17aranda', 'francescotiburno', 'francocannistra', 'frank_verbreyt', 'frankb61', 'frankdecker', 'frankdemulder', 'frankenberger', 'frankjordan1', 'fred_photo_insta', 'fred44kreation', 'freddymangelschotsphotography', 'fredhacheve', 'fredlanger', 'fredtey', 'fredyfotografo', 'freedomtophotograph', 'fremersalex', 'friberg', 'frscote', 'fs-photographie', 'fstopguam'];
blacklists['g!'] = ['graphicpg', 'gabedavid2', 'genelewisvirtuimagery', 'genussfotograf', 'gun_terr', 'gaelthill', 'gaetan-habrand', 'galich_m', 'galinatcivina', 'garciaphotographyberlin', 'gaston1', 'gav_rus', 'ge100', 'gegenlicht13', 'geneoryxnude', 'genot', 'georgeandmildred', 'georgepoison', 'georgostsamakdas', 'georig', 'georigo', 'gerd-hannemann', 'germainconstantin', 'germancanonphotographer', 'getesmart86', 'gflindner', 'ghisadavid', 'giacomopazzo', 'gianfrancogiachettiph', 'gianpietrofavaron', 'gibbsoliver81', 'gilsonmagno', 'ginebratorres007', 'ginoangeliniph', 'gioacchino', 'giorgiocastis', 'giosimo81', 'giozac', 'girls_shooter', 'girolamomaurophoto', 'giselabagnoli', 'giulem', 'giulianobedin', 'giuseppecondorelli', 'glamouralaska', 'glauciogomes', 'glauco_meneghelli', 'gmontalbano62', 'gomesjuniorphoto', 'gonzalovillar', 'goraphotography', 'gorokhov', 'gosdschanfotografie', 'gpbrazzini', 'grahamburke1', 'graziellaphotographie', 'grdpatrice', 'greene0723', 'gregorbusch', 'greyhorse', 'grichardson', 'grom86', 'groovyseby', 'grozdan', 'grpozo1', 'gshooter', 'gsiriati', 'guenterstoehr', 'guillermohdz', 'gulich_79', 'gunma81', 'gurulee888', 'gw3n'];
blacklists['h!'] = ['haiscorentin', 'helmerpeter', 'h1inger', 'hakanerenler', 'handogin', 'hansmann', 'haralddessl', 'hardkore', 'hayatbambi0', 'haydein', 'hecho', 'heckmannoleg', 'hellmood', 'helsingphoto', 'hembertphoto1', 'hendrikeckhardt', 'henkenius', 'henriette-mielke', 'henriquecesar', 'henry-fineart', 'henry510', 'henryzaidan', 'hichembraiek', 'hillhart06', 'hjfotograf', 'hlnehuet', 'hlportrait', 'hmrodriguez', 'hombredelamancha', 'hors_champ', 'horstzieger', 'hot_lightening', 'hrxcompany', 'huannfernandogomes', 'hubertgiszczyski', 'hubertszamiteit', 'humblejim', 'hvnguyen8901'];
blacklists['i!'] = ['illiaantonets', 'itisnotme', 'ionovaanna', 'iliaaniszewska', 'info11513', 'iamalbertmartinez', 'iamcarla_m', 'iammarciomiranda', 'ianneill', 'ibarraphoto', 'ibericophoto', 'ibry', 'igcimages3', 'igor-souza', 'igordubbphotos', 'igorgoodkov', 'igorkondukov', 'igorsmirnoff3', 'igovoronco', 'igraf1958', 'ilya_filimoshin', 'imipour', 'imnalavi', 'imwarrior1001', 'inconsistencias', 'inesinabundance', 'info2951', 'info512', 'info5863', 'info872', 'ingenieriaaipro', 'inyoureye', 'ioannismazis', 'ipistoletov', 'irezumiworldwide', 'iridijussvelnys', 'irishrabbit', 'isbstudios', 'iso52', 'istantifotograficidinophprincipato', 'ivan_platonov', 'ivancillik', 'ivanobusa', 'ivansheremet969', 'ivanwarhammer', 'ivm888', 'ixpert'];
blacklists['j!'] = ['jennyballjb', 'jacquelinesavaccini', 'jhagenphotography', 'jeffriverzoom23', 'jesuscarapetobarquero', 'jadismaze26', 'jacarrasco', 'jacekklucznik', 'jacint', 'jacintguiteras', 'jackfrederic', 'jaclegal', 'jaimerecarte', 'jaja-photographie', 'jakesaxman', 'jakontilphotophobia', 'jakubno', 'jal2014', 'jalineh', 'jameelhady89', 'jameslawrencedavis_photo', 'jamside', 'jan-leicaportrait', 'janhammerstad', 'janis71', 'janisbphotography', 'janmayeroficial', 'janpersson1', 'januszratajek', 'januszv', 'jara1962', 'jark-photo', 'jasab830208', 'javi_mirada', 'javier_rodriguez75', 'javieralmenares088', 'jayma', 'jaypsedan', 'jbowphoto', 'jdreess', 'jean-louismilliat', 'jean-pierre-shots', 'jeannoir', 'jeanreb', 'jeffthomasphoto', 'jeffwetltd', 'jehannedechampvallon', 'jens_schubert', 'jenskloeppel', 'jensneubauer', 'jensomerfield', 'jepsen', 'jeremyrobertphoto', 'jessicadrossin', 'jesusdsimal', 'jfal', 'jfkk', 'jhonvargas', 'jiibee', 'jim23', 'jimmypsunshade', 'jiripetrik', 'jiritulach', 'jirkaares', 'jisteiger', 'jjnapoleon', 'jjspicturefactory', 'jlphoto2013', 'jmphotography2323', 'jn-photo', 'jnaldal'];
blacklists['jo'] = ['juliusradovan', 'juliegerman', 'jtemplin', 'john232', 'joachimalt', 'joeach', 'joachimbergauer', 'joakim_karlsson_photography', 'joamuz', 'jochendressen', 'jockeoscarsson', 'joelgros', 'jogafoto', 'johanamarchandphotographies', 'john-log', 'john-noe', 'johnamm', 'johnny_hendrikx', 'jonathanfrings', 'jop-berlin', 'jordiehennigar', 'jose_rodrigar', 'josecallejon', 'joseferreiraramos', 'josefhansson', 'josefienhoekstra', 'josesote', 'josevazquez', 'josezvargas', 'josh73pine', 'joski', 'joterofotografo04', 'jozefkadela', 'jozefkiss', 'jp-cph', 'jpmaissin', 'jquereda', 'jrgenpetersen', 'jsdulosa', 'juanagomez', 'juancarlosmora', 'juandelros', 'juanmsanchezphotography', 'juanpyfernandez', 'juanrenart', 'jubelia', 'judy_93', 'juliaamshei', 'juliazu', 'juliuspocius', 'jullastres', 'june2010', 'justinroux', 'jvchop'];
blacklists['k!'] = ['kmishiikoriita', 'kipling', 'katrinweiss1', 'koenbroeren', 'kontakt293', 'kingjohnsnow117', 'kaanaltindal', 'kaftanska', 'kaieason', 'kaiheidel', 'kajli_istvan', 'kali06photography', 'kalmanart', 'kamilpielkaphotography', 'kamilsvorc', 'karaca', 'karenabramyan', 'kari_fotodesign', 'karlyamashita', 'karstenmueller', 'karstennivaa', 'kasko', 'katarzyna_piela', 'kateamullen', 'katerynagorbanov', 'kawitaboonyasit', 'kazarina', 'kazoncphotographie', 'kcelestine', 'kcinay', 'keepu', 'keithfox', 'kellykooper', 'kenbackius1', 'kennethadelsten', 'kennethnoisewater', 'kent_photo', 'kerrymoore', 'keurpaul', 'khedron', 'khoanguyenvan09', 'kildall', 'kim8', 'kimfj', 'kimrjohnson', 'kingkhan5555kk', 'kirill_look', 'kirillphogart', 'kitsuyume', 'kittugoswami', 'kjhgfds76543', 'klaus-der-baer', 'klecksphotography', 'klepikovadaria', 'knipser62', 'kornienko', 'kovbasyukphoto', 'kr_portrait_', 'krivitskiy', 'kromauro', 'kronsteinernadine', 'krystiantokar', 'krzysztofbudych', 'ksmedia', 'kubagrafie', 'kubamichalski', 'kunddahl01', 'kurtj', 'kuzinph'];
blacklists['l!'] = ['lindnerfoto', 'lilyrosemodelecreation', 'lightbymike', 'liviermiroslava', 'lemar-photo', 'leccy1969', 'lokotko', 'lifelinespublishing2015', 'ljubomarosa', 'lionel-le-biollay', 'luigialgarotti', 'lindamodel', 'l_bibok', 'l_n_v', 'laavi17', 'lab8', 'ladie', 'laika_arts', 'lanadphotography', 'lari19911', 'larszahner', 'laureenburton1', 'laurenthamon2', 'laurentpayet', 'laurentphoto768', 'layarkacatv', 'lb423studio', 'leandromaxi', 'leannevorster', 'leden1408', 'leestardragon', 'lefu', 'leif4', 'lelyak', 'lelyamartian', 'leneya', 'lenikoh', 'lennylw', 'lethhansjoerg', 'letographe', 'letoroom', 'levinsg', 'levyavner', 'levykin', 'lewitan', 'libertinagestudio', 'libor', 'lichtreize', 'lichtweisend', 'lifingrigoriy', 'ligayolga', 'light_expression_photography', 'lightroomfoto', 'lightsketchstudio', 'lilaanie', 'lilibondarenko', 'linz550', 'liorkestner', 'lisdefleur', 'livingloud', 'lizzynessietaylor', 'lll06', 'lmw420', 'lookashow', 'lorddryp', 'lorentzenphoto', 'lorenzobassanelli', 'lorenzoviola', 'lorinov', 'lornakijurko', 'louisloizidesmitsu', 'lowestdp', 'lu7lu809', 'lucafoscili', 'lucasantorophotography', 'lucasmontifoto', 'luciananca79la90', 'lucianodarochacavalcanti', 'lucyivanova', 'luigivitali1', 'luisgasconphotography', 'luispante', 'lukgorka', 'lukhrubo', 'lulimontielll', 'luposolitario', 'lusa2', 'luwi'];
blacklists['m!'] = ['magdalena2406', 'mahummedkia09', 'maksimtoome', 'mastermickenzii', 'mattia_uchica', 'maxschmidt', 'mariofernandooportus', 'm_m', 'm-hajjar-photography', 'maandel_photography', 'mackowiakart', 'mackray', 'madmoisellejess', 'maestroua', 'mageko', 'magnuswidenstl', 'makz_pro', 'maleclisl1991', 'malgorzataannawiktoria', 'malkija', 'manbos', 'mandityizabella', 'manfredbaumannofficial', 'manuel19precog', 'manuelkern', 'manujelprlic', 'marc-photography', 'marcdufour1', 'marcelgallaun', 'marceloperezlopez', 'marceltesch', 'marcin_k', 'marcinalbrichtwiniewski', 'marcinczornyjkauza', 'marcinhouse', 'marckospauloluiz', 'marckusmilo', 'marco_pesce', 'marco-hamacher-photography', 'marcodewaal', 'marconwc', 'marcopetroiphotographer', 'marcosgarzo', 'marcosquassina', 'marcotonetti', 'marek_newton', 'marek_zawadzki', 'marekbodzioch', 'marekulpa', 'marianophoto1', 'marielaudet1', 'marinatomasi1', 'marine-boy', 'mario823009', 'mariopasko', 'mariotofino', 'mariposa-fa', 'markdenney1', 'markgirnus', 'markounger', 'markprinzphotography', 'markriedy1', 'markus-hertzsch', 'markushuber14', 'marossi', 'marquesvaldirene076', 'marseillea71', 'martakucharska', 'marticocelli', 'martinfjovtek', 'martinneuhof', 'martinwieland', 'martyphotographer_cz', 'marvalphoto', 'mascarad', 'massimilianodistante1', 'massimilianouccelletti', 'massimoleone68', 'massimomaxcapannelli', 'massimozanella', 'mastermedia567', 'matrobinsonphoto', 'mattbarnet', 'matteoconti', 'matteosergo', 'matthiasnechi', 'mauriciobenitez', 'mauriziopretto', 'mauriziotrevisan', 'maurosaranga', 'maurostrazio', 'mauryzioscaglia', 'mawebph', 'max_makarov', 'max0965', 'maxiboehmphotos', 'maxim-antonov', 'maxpugovkin', 'maxwell61', 'mazurekphotography'];
blacklists['mb'] = ['milagroskrey', 'mojicausignolo', 'mettwoosch', 'michaelmiller9', 'mugutdinov90', 'mcavka', 'mdphotographer', 'megamegalex', 'megonza31', 'mektor1k', 'melanie_g', 'melefara', 'melfio', 'mercante007', 'mercedescs', 'meshphotography', 'metey22', 'metthey', 'mgdrawin', 'mgfoxfireimages', 'mhjreiter1968', 'mhpmodels19', 'mi-artem', 'micak-nude', 'michael_thagaard', 'michael_waller_photography', 'michaelarzt', 'michaelbaganz', 'michaelfalkner', 'michaelfaust', 'michaelgilg', 'michaelmahy', 'michaelsuhl', 'michal_j', 'michalmach', 'michel-e', 'micheldes', 'michelemassafra', 'michelkeppens', 'michelpierson', 'midboudoir', 'miguelcalatayud', 'mihaelakajtazovic', 'mihailshestakov', 'mikestonephotography2019', 'miketoptygin', 'mikewahrlich', 'mikeywu', 'mikhailmishanson', 'miki_macovei', 'miklostassi', 'mikymike133', 'mil4nek', 'milenamantis', 'millnyahoa', 'mindelio', 'minkiq', 'mirohofmann1', 'miroslavbelev', 'missruby993', 'missterrogers', 'mizgirov', 'mjaphotouk', 'mk-pixelstorm', 'mkloetzer', 'mmagdziak', 'mobileeyesphotography', 'moglipic', 'mohammedabuhayeh', 'monica822', 'morozsnimaet', 'morris35', 'mortenthoms', 'mosheelias', 'motomotogpa', 'mralexiv77', 'mriden', 'mspaul', 'mtbankhardt', 'mtdt', 'musharafiqbal', 'musumeci25giuseppe', 'muujiza02', 'mwphotos_de', 'mycoolsfoto', 'myolpatx'];
blacklists['n!'] = ['nathanruane', 'netanelalmasi', 'nikonga', 'noelfrith', 'nikondark', 'n01grig', 'nacho_perez', 'nadear', 'nasicomy', 'natali_gaidysh', 'natalia_m_photography', 'nataliaarantseva', 'natalianikitinskaya', 'nataliaturczyk', 'nataliyashugailo', 'nathaliecastonguay', 'nathanelson', 'nathanjohn', 'naughtynikki2501', 'neatwork', 'nebesskiy', 'nelzinvitalik', 'nepronfoto', 'nerhiv', 'nesmelov86yv', 'nevthedev1', 'newseeland', 'newwoman', 'niccharlesphotography', 'nicholasspectrum', 'nick_curly', 'nickhalling', 'nico-photographies', 'nicoladavidefurnari', 'nicolapaoloemilio', 'nicolasgorrens', 'nicoruffato', 'niemandwer', 'nigelboulton', 'nigeldaniel', 'nikolaspapado', 'nikolasverano', 'nikolaynovikov', 'nikondirty', 'nikonpeter', 'nildornelas', 'ninosanfilippo', 'ninoveron', 'njmerik', 'no_90125', 'noblecatph', 'nobraclub', 'noelmacphoto', 'noirartph', 'nonsolomodanewsitalia', 'nora-leseberg', 'normantacchi', 'notename', 'novaitalianphotographer', 'novemberlight', 'nsonnet', 'nspdstudio', 'ntikhomirov', 'nw-photographer', 'nyamarkova'];
blacklists['o!'] = ['operuitumbrosa', 'oleksandrkhashchevskyi', 'ob1rnmjt3t', 'ochmi', 'ofn', 'ok64', 'olga_sweet', 'oliverdias', 'oliverroeder', 'olivierbugueti', 'oliviererhard', 'onewebrank', 'oo55mod', 'opletaeff', 'optimus-photography', 'opuntiaf', 'orain', 'orlovskiim', 'ornaghitiziano', 'orryginal', 'oscar661', 'osohormiguero', 'ossimoroblues', 'osv', 'overthephoto', 'owimodfourty', 'ozgur-media'];
blacklists['p!'] = ['pgprando', 'patrickmaimai', 'page7photo', 'p-tashka', 'pablocaas', 'pabloroblesnavarro', 'pallo007', 'pamano', 'panetone', 'pannadult', 'paolo73', 'paolocarlolunni', 'paolopizzi', 'paolopuopolo', 'papillon197022-henri', 'parasitolog', 'parshunas', 'pascal_dejay', 'pascal-x-t2', 'pascalthomas1', 'passonitis', 'pastreinz', 'pat_h', 'patrikvalasek', 'patriziamorettiphoto', 'patrycjusz', 'paulinaprzybyszewska', 'paulpigasph', 'paulpour', 'paulseds', 'pavelberan1', 'pavelprokop', 'pavelteterevkov', 'pavoguba', 'pawel_paoro_witkowski', 'paweldawid', 'pawelludwikowski', 'pc_digital', 'pedro_kysss', 'pedrolema', 'peppevj', 'perelluisserracanta', 'perry_x', 'petea584', 'peterboll', 'peterhall', 'petermuller', 'peterpaszternak', 'petr_h', 'petrchernysh', 'petrhuu', 'petrinaukkarinen', 'petrsojka'];
blacklists['ph'] = ['philip_coetzee', 'pplina', 'phototibor', 'polonic2', 'phtrunov', 'ph_oko', 'phcarretta', 'phfrank', 'philhoward', 'philipchang', 'philipverhoeven', 'phillipbaird', 'phjrossato', 'phlucalaurenti', 'phmaxxtiger', 'phoenixflowerphotography', 'phoscarbueno', 'photo_zheludkova', 'photobitxo', 'photobus', 'photograperray', 'photolehner', 'photosomnia', 'photostorm98065', 'phototroya', 'phsb60', 'piar-fotografie', 'pibefou', 'picreatr', 'pictureart_by_steven_schiller', 'piemmeproduction', 'pierangelogabrielli1', 'pierrekroupensky', 'pierremagnecom', 'piersparello', 'pietbruystens', 'pietro_stilli', 'pietrocastigliolaphotographer', 'pietroperone', 'pikeyart', 'pilot224', 'pim', 'piotrkoakowski', 'piotrlipski', 'piotrstach', 'piphotography', 'pitsfotos', 'pivanet', 'pixboard', 'pixelbutze', 'pixeltrashart', 'piyush2003', 'polly', 'polobear1616', 'poltorykhina', 'popalam', 'portraitretoucher', 'posemakeupart', 'potatoe', 'powerfulwomen', 'pranaskarpavicius', 'privalov', 'prosephotography', 'prozvitsky', 'psbkr11', 'psi-photography', 'psydo83', 'ptittomtompics', 'puffchocola', 'pulcherrima', 'purdymorgan12', 'purtastudios'];
blacklists['q!'] = ['qtoan182', 'quitomza'];
blacklists['r!'] = ['rikardrodin', 'rich40', 'ricguillon', 'roxana_imp', 'ricchy', 'russellcardwell', 'rogershavo', 'rb-fotografie', 'r2moficial', 'rafaelmorerabaas', 'rafalwegiel', 'rafougiletyoland', 'raidycv', 'rakso_design', 'ralflache', 'ralph_wietek', 'ranskafrede', 'raphaelphoto', 'raulegusquiza', 'rchmrtn', 'rebelrevealphotography', 'redaska', 'rednaxelaikslawok', 'reekolynch', 'regards-libres', 'reinbold-frank', 'reineckejay', 'renesch', 'retoheiz', 'reyvand89', 'rf-swiss-videos', 'rgurbuz', 'rhhphotography', 'richardbene', 'richardmills', 'richardplumb', 'richardsrandy', 'rickytong3', 'rideyourbike', 'ridwan_ng', 'rikimage', 'rinnasol63', 'rlugibihl', 'rmsurany', 'roamingphotostudio', 'rob-neal', 'rob19971', 'robekwen', 'robert_roberto', 'robertchrenka', 'robertfarnham', 'robertfotografia', 'robertobernocchi', 'robertorinaldi', 'robertwypir', 'robphotographer', 'rocketqueenimaging', 'rockymalhotra', 'rodolphebnc', 'rodolphehuignard', 'rodrigomonteirophotos', 'rodvindavis', 'rogerocker', 'rojsmith', 'rolandkunz', 'rolandogomez', 'rolandurech', 'roluart', 'roma_chernotitckiy', 'romanov177', 'romanpunenko', 'romanrudenko', 'romanshaon', 'ronlevi5', 'rossanacarpentieri', 'rossmannmcgree', 'rosyk', 'roxannahall236', 'roycephotoshoot', 'royfroma', 'rt_lichtbild', 'rubyvizcarra', 'ruslandukefoto', 'rvsingh1', 'rw222327'];
blacklists['s!'] = ['sabrina38', 'sensualfactory', 'sa_g', 'sacha-leyendecker', 'safargalieva', 'saifuldw', 'sakalsakalic', 'salihgokduman', 'sallenph', 'salofee', 'samarcuk', 'samletac', 'samueljacquatphotographie', 'sand_flower22', 'sandeepz', 'sandorheitler', 'sandrosebastiani', 'santi_alonso', 'santiagopescado', 'santrade2', 'sarinaselvaggia', 'sashamedvedeva', 'saulekha', 'sauliuske', 'sauronwhite', 'savenkovd', 'saveriobortolamei', 'savgreg', 'sawasdee997', 'sazhrahgutierrez', 'sbastphotographies', 'schnellmann83', 'schp3n', 'schratchen', 'scottbiker', 'scottchandlerproductions', 'sdk64741', 'seanarcher', 'seanmalley', 'searchgr', 'sebastian_koehler', 'sebastiankliemann', 'sebastienrenaud', 'secretphotographerforyou', 'sekurit', 'semkaaa64', 'seo2webcrs', 'sergeberrard', 'sergeimelnikov', 'sergey_baturin', 'sergeybidun', 'sergeychmykhov', 'sergeynaybich1', 'serginovitskiy', 'sergioschiesari', 'serzhsz39', 'seves', 'seweryncieslikpl', 'sewerynkiedrowicz1', 'sfd85', 'sfpictures', 'sgfat', 'shaktitanwar1234', 'shalimovv', 'shannonabritto', 'sharbonora', 'shehan-fernando', 'shihari', 'shrek-gokk', 'shutterimaging'];
blacklists['si'] = ['sofiso', 'smichaux', 'steindfr', 'stevemcfarland', 'stillphototheater', 'simon-hallermann-photographie', 'sirfranzisphotography', 'susana_cano_martinez', 'sibiraev', 'sibyllebasel', 'silenteyesphotography', 'simoneangarano', 'simonespinal', 'simplelich', 'simplypics_photography', 'sirbio75', 'sireed1sr2', 'skippercool6', 'skydivebob', 'sletanis', 'slinky_advphoto', 'smalllche', 'snarts', 'snedigity', 'sokolovkirill', 'solonin', 'somaygupta52', 'sophievonbuer', 'soppotea', 'sorokinofoto', 'soulberenson', 'spasnemerov', 'spawl', 'spencertan', 'spiler999', 'springfield-photography', 'spyrozarifopoulos', 'sr_jasab', 'srhphotography2012', 'srjulioinzunza', 'sseexxyyccooffee', 'starajedalen', 'stavriannatr', 'stawnikov2015', 'stefan_schwarz', 'stefanhaeusler', 'stefankoester', 'stefanobosso', 'steffenkarl', 'stein', 'stephane_battesti', 'stephane_degrutere', 'stephaneseguraii', 'stephanhainzl', 'stephanopolis', 'stephpromotor', 'stevelin', 'stevevuoso1', 'stijnb0hrer', 'stina_petersen', 'stop_focus_studios', 'stoyankatinov', 'stphanerouxel1', 'strausdusan', 'strisch1', 'studio2sete2', 'subbotina_1998', 'subiyama', 'subratagharami8', 'suiciderock', 'suissecoachphotos', 'sultanph', 'supercarpi2', 'svartepx', 'svenfiedlerart', 'svenhildebrandt', 'swarovsky', 'sweetdaisy22'];
blacklists['t!'] = ['terrencelloydbeaudoin', 'telleyrisphotographies', 'txglam', 'tomsrima', 'travnikovstudio', 'tfpgo', 'thinktunk', 'tanthony500', 'tarakanov', 'tvoynik', 'the_bear_cp', 't777', 'tabakov-nn', 'tadpolewm300', 'takashifuro', 'tamarakubatov', 'tanaga_chen', 'tancredimaurizio', 'tango63', 'tanjabrunner', 'tanya7krystal', 'tasiphotography', 'terese0815', 'terryost', 'tglawe', 'th_eff', 'the-maksimov', 'theartographer', 'thebchandyguy', 'thebeautifulones', 'thebest500px', 'thecrewdubai', 'theonlyblacksnowleopard', 'theopeeters', 'theportraithunter', 'theurbanphotographer', 'thevisionphotos', 'thierrycalmettes1', 'thierrycayau972', 'thomas_ruppel', 'thomas-oh', 'thomaskern3', 'thongnoel', 'thorsten_n', 'thorstenbriese1', 'thorstenschnorrbusch', 'tikerophoto', 'timankov', 'timaval', 'timothyfairley', 'tinman2000', 'tissandier', 'tjphoto40', 'tk-fotodesign', 'tk11', 'tkachuk_ruslan', 'tnxdinosaurs', 'tobiashajek', 'tobylewis', 'tom-nash', 'tomaks', 'tomashmasojc', 'tomasjungvirt', 'tomdoyle_de', 'tommipxls', 'tomromy', 'tonnyjrgensen', 'torresphoto1', 'torstenbusch', 'torstensons', 'tosnic2002', 'tradieconnect', 'trendkom', 'trihieuart989', 'triscele2', 'tropiano', 'troyoda', 'true2life_fotography', 'ts26photo', 'tserkasevich', 'tsukiyomifactory', 'tsvetkovphotography', 'tsyganov', 'tsymlyakov_al', 'tuhrukuvat1', 'tuvandoanhnghieponghean', 'tvisionportraits', 'tvoih_shagov', 'tvoyephotography', 'txophotographer', 'tynkoff', 'typfoto'];
blacklists['u!'] = ['ultimatephotostar', 'uardarexha', 'udontknowme', 'ulfbrockmann', 'urbansoul', 'urilina33', 'ursusfoto', 'urtonic', 'ururuty', 'usman161rus', 'uvpro'];
blacklists['v!'] = ['vcg-iimmpp', 'vcg-lanyezi', 'vulgoqueiroz', 'vcg-9cd6eaa4c4944b690e262d91cb6968126', 'vitorccastro', 'vcg-af3902b344240b65bf4972553c58e8813', 'vcg-ac34cbb874602a6d9e876f1f546f68592', 'vcg-boneandfat', 'vcg-zqhuanzhi', 'vcg-sunxiaoqi', 'volkanpb', 'vcg-chengo', 'vinsaid9', 'v-asid13', 'vacancier', 'vaclav64', 'vadim_tuning_zhuravlev', 'valery_1', 'valerytaylor', 'valevsky', 'valiraicea', 'vanemdp2017', 'vankou', 'vanyatufkova', 'vardanank666', 'vartexxx', 'vavaca', 'vcg-13c5b7cbf4915a43c7216bf3a14cb7227', 'vcg-2b91118cd430bbe6cb0607f0ddc441106', 'vcg-2e50c641c49a6b86841ea6ad1b4027404', 'vcg-3e9e525f6402ab569e8c32561a3903703', 'vcg-46790285445b3ad0acdd8097e83fb9888', 'vcg-565ed0a9c4134a22fbd0623c76b821722', 'vcg-652018fc84760898be087ed8efc754638', 'vcg-a6d98e4ca489192f5cf6d7fe7242c9431', 'vcg-allen0755', 'vcg-arctic', 'vcg-bw23', 'vcg-c704eb9654b2cbdae122e31d60acd1370', 'vcg-d22094609469e957d06c813d0eb948336', 'vcg-dreamofnight', 'vcg-e303beb21426c9513c63483c4f0675850', 'vcg-e433c31634cac9ee9d282d58263d37380', 'vcg-e5b4332a0453fa5b119ec898c51444029', 'vcg-gurulee888', 'vcg-jennybao18', 'vcg-jiayiphoto', 'vcg-lanyue3026', 'vcg-photogenicreaction', 'vcg-samizu', 'vcg-tofu', 'vcg-yanni91', 'vct_sdk', 'vel_volkov', 'vellu60', 'velmar', 'vencafialka', 'vendigo', 'verdigrisphoto', 'vfranko', 'viash', 'victi1974', 'victoriabee', 'videoshooter', 'vikakamberg', 'viktoriuson', 'viktorpara', 'viktory1', 'vingenphoto', 'violainevivi', 'violette__photography', 'vipingoje1', 'vitomammana', 'vitomotiv', 'vk3photographix', 'vlad-shutov', 'vladimirov', 'vlarionov', 'volavolko', 'voldemarpts', 'voreos_studios', 'vostrikov42', 'votresecret', 'vpotemkin', 'vscd', 'vsr_photography'];
blacklists['w!'] = ['west58', 'wojciechpieniowski', 'waynedenny', 'wayneduchain', 'webtrekhoe', 'weissenegger', 'west-kis', 'whitehorsse', 'wiktor150rus', 'wiktorbernatowicz', 'williamallen3', 'williamaponno', 'willymalbosc', 'winderwind', 'wiviwi', 'wls_seeadler', 'wohl_photography', 'wolfgang10', 'worldtraveleralinn', 'wpan1rkkbj', 'wsebbag', 'wstock', 'wuestenfuchs-wuestenfuchs', 'wwwpafa', 'wylllemere'];
blacklists['x!'] = ['xar3d', 'xecbagur', 'xo-miko-photo', 'xposure', 'xubeo9141', 'xxbufraxx', 'xxicuriosityixx', 'xxlwd'];
blacklists['y!'] = ['yssa_abc', 'yaroslawd', 'yezabelml', 'ya-ivanof-7', 'yamel', 'yanaphotographyzp', 'yanisourabah', 'yanivc', 'yarko-photo', 'yatoyato', 'yiduanwlj', 'yoannastancheva', 'yosbelvamor', 'youknowwhatjimsays', 'yourownroom', 'yuanyelang', 'yuliavasilyvna', 'yulyamyf', 'yuribrut', 'yuriykovalchuk'];
blacklists['z!'] = ['zif1989', 'zachar', 'zairakhan1112', 'zancanmatteophotography', 'zeephoto_uk', 'zenofoto', 'zurmuehle', 'zvandrei'];

var blacklistKeys = Object.keys(blacklists);

function findOnBlackList(usernameRaw, debug = false) {
    // idea is to have two short lists to check and a guarantee that the list you're checking is correct
    let username = usernameRaw.toLocaleLowerCase();
    let pre = username.substring(0, 2);
    if (debug) console.log('username:', username, ' pre:', pre);
    let forI = 0;
    let foundList = false;
    for (forI = 0; forI < blacklistKeys.length; forI++) {
        if (debug) console.log('comparing', blacklistKeys[forI], ' to ', pre);
        if (blacklistKeys[forI] == pre) {
            if (debug) console.log('equal', blacklistKeys[forI], ' to ', pre);
            foundList = true;
            break;
        }
        if (blacklistKeys[forI] > pre) {
            if (debug) console.log('greater than', blacklistKeys[forI], ' to ', pre);
            foundList = true;
            forI = forI == 0 ? 0 : forI - 1;
            break;
        }
    }
    if (!foundList) {
        if (debug) console.log('backing off one');
        forI = blacklistKeys.length - 1;
    }
    if (debug) console.log('search list:(', forI, ') ', blacklistKeys[forI]);

    return blacklists[blacklistKeys[forI]].includes(username);
}

function blackListUnitTests() {
    blackListUnitTestRun('mackray', true);
    blackListUnitTestRun('MacKray', true);
    blackListUnitTestRun('nacho_perez1', false);
    blackListUnitTestRun('NACHO_PEREZ', true);
    blackListUnitTestRun('nerhiv', true);
    blackListUnitTestRun('__nerhiv', false);
    blackListUnitTestRun('zzzzz', false);
    blackListUnitTestRun('!!fred', false);
    blackListUnitTestRun('zvandrei', true);
    blackListUnitTestRun('弗雷德', false);
    blackListUnitTestRun('_geneoryx', true);
    blackListUnitTestRun('jozefkiss', true);
    blackListUnitTestRun('1102', true);
    blackListUnitTestRun('m_m', true);
    blackListUnitTestRun('       ', false);
    blackListUnitTestRun('', false);
    blackListUnitTestRun('b3ast', true);
    blackListUnitTestRun('beast', false);
}

function blackListUnitTestRun(username, expected) {
    let result = "PASS";
    if (findOnBlackList(username, false) != expected) {
        result = "FAIL";
    }
    console.log(username, ' should be ', expected, ' : ', result);
}



var goodCats = [0, 3, 5, 7, 8, 9, 11, 12, 13, 18, 20, 21, 22, 26, 27, 28, 29, 30];

/*
var cat = [];
cat[0] = 'Uncategorized';
cat[1] = 'Celebrities';
cat[2] = 'Film';
cat[3] = 'Journalism';
cat[5] = 'Black and White';
cat[6] = 'Still Life';
cat[7] = 'People';
cat[8] = 'Landscapes';
cat[9] = 'City &amp; Architecture';
cat[10] = 'Abstract';
cat[11] = 'Animals';
cat[12] = 'Macro';
cat[13] = 'Travel';
cat[14] = 'Fashion';
cat[15] = 'Commercial';
cat[16] = 'Concert';
cat[17] = 'Sport';
cat[18] = 'Nature';
cat[19] = 'Performing Arts';
cat[20] = 'Family';
cat[21] = 'Street';
cat[22] = 'Underwater';
cat[23] = 'Food';
cat[24] = 'Fine Art';
cat[25] = 'Wedding';
cat[26] = 'Transportation';
cat[27] = 'Urban Exploration';
cat[28] = 'Light Field';
cat[29] = 'Aerial';
cat[30] = 'Night';
*/
