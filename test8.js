// just statistik
// const
const MAX_ERRORS = 20;
const ERROR_SLEEP = 15000;
const RECENT = 20;
const ALL = 150;
const MAX_PAGES = 10;
const VERSION = "0.1.3";

// control
var count = 0;
var errorCount = 0;
var errored = false;
var stopScrolling = false;
var atBottom = false;
var startTime = (new Date()).getTime();
var loadingComplete = true; // future use?
var lastPage = false;
var handledLast = false;
var totalItems = -1;
var userFC = -1;
var user = "";
var siguiendo = -1;
var warning = false;

// stat
var aveHighest = 0;
var aveCurrent = 0;
var aveHighestRecent = 0;
var aveCurrentRecent = 0;
var aveShort = 0;
var aveLong = 0;
var aveShortRecent = 0;
var aveLongRecent = 0;

addToMap();

var cat = new Map();
var shutter = new Map();
var iso = new Map();
var aperture = new Map();
var focal = new Map();
var lens = new Map();
var camera = new Map();
var tops = new Map();

controlCentral();

async function controlCentral() {
    start();
    await addingDataListener();
    await gettingFirst();

    while (!lastPage && !stopScrolling) {
        await scrolling();

        if (errored) {
            errored = false;
            errorCount++;

            if (errorCount >= MAX_ERRORS) {
                stopScrolling = true;
            }

            await sleeping(ERROR_SLEEP);
        }

        if (!lastPage && atBottom) {
            atBottom = false;
            console.log("ERROR: no last page and at the bottom. Continuing...");
        }

        await sleeping(randBetween(1000, 2000));
    }
    end();
}

async function gettingFirst() {
    e = $("a[data-nav='photos']");
    e.trigger('click');
    await sleeping(randBetween(3000, 8000));
}

function handleResponse(response) {
    var obj = JSON.parse(response);
    if (obj.photos && obj.photos.length > 0) {
        console.log("Response received, page: " + obj.current_page + "/"
            + obj.total_pages + ", items: " + obj.total_items);
        if (obj.total_pages == obj.current_page) {
            lastPage = true;
        }
        if (totalItems < 0) {
            totalItems = obj.total_items;
        }
        for (i = 0; i < obj.photos.length; i++) {

            if (userFC < 0) {
                userFC = obj.photos[i].user.followers_count;
            }

            if (user == "") {
                user = obj.photos[i].user.username;
            }

            if (siguiendo == -1) {
                siguiendo = obj.photos[i].user.following;
            }

            let highestEver = obj.photos[i].highest_rating;
            if (highestEver >= 98) {
                highestEver += Math.exp((highestEver - 98) * 1.5) - 1;
            }
            let current = obj.photos[i].rating;
            let short = Math.min(obj.photos[i].width, obj.photos[i].height);
            let long = Math.max(obj.photos[i].width, obj.photos[i].height);

            if (count < ALL) {
                aveHighest = ((count * aveHighest) + highestEver) / (count + 1);
                aveCurrent = ((count * aveCurrent) + current) / (count + 1);
                aveShort = ((count * aveShort) + short) / (count + 1);
                aveLong = ((count * aveLong) + long) / (count + 1);

                cat.increment(obj.photos[i].category);
                shutter.increment(obj.photos[i].shutter_speed);
                iso.increment(obj.photos[i].iso);
                aperture.increment(obj.photos[i].aperture, true);
                focal.increment(obj.photos[i].focal_length, true, 0);
                lens.increment(obj.photos[i].lens);
                camera.increment(obj.photos[i].camera);
            } else {
                lastPage = true;
            }

            if (count < RECENT) {
                aveHighestRecent = ((count * aveHighestRecent) + highestEver) / (count + 1);
                aveCurrentRecent = ((count * aveCurrentRecent) + current) / (count + 1);
                aveShortRecent = ((count * aveShortRecent) + short) / (count + 1);
                aveLongRecent = ((count * aveLongRecent) + long) / (count + 1);
            }

            if (count < RECENT || count < ALL) {
                count++; // despues de los promedios
            }

            if (obj.photos[i].nsfw) {
                warning = true;
            }

            //console.log("(" + count + ") Highest: " + obj.photos[i].highest_rating);

            //aveShort = ((countP * aveShort) + shortSide) / (countP + 1);
            if (count == obj.total_items || count == ALL) {
                handledLast = true;
            }
        }
    }
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

    Map.prototype.show = function (title) {
        console.log(title.padEnd(30, "-"));
        let mapSort = new Map([...this.entries()].sort((a, b) => b[1] - a[1]));
        let first = true;
        mapSort.forEach(function (v, k) {
            if (first && k != "None") {
                first = false;
                tops.set(title, k + ": " + v);
            }
            console.log(k + ": " + v);
        });
    };
}

async function addingDataListener() {
    while (!document.body || !document.head) {
        await sleeping(500);
    }

    interceptData();
}

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function start() {
    let d = new Date();
    console.log("Beginning at " + d + "...");
}

function end() {
    if (!handledLast) {
        console.log("End isn't ready (" + count + "/" + totalItems + "). Requesting idle callback...")
        window.requestIdleCallback(end);
    } else {
        let d = new Date();
        console.log("Done at " + d + ".");
        let runTime = (new Date()).getTime() - startTime;
        console.log("Ran for " + Math.round(runTime / 60000) + " minutes.");

        console.log("Highest rating average: " + aveHighest.toFixed(1));
        console.log("Current rating average: " + aveCurrent.toFixed(1));

        console.log("Highest rating average (most recent "
            + RECENT + "): " + aveHighestRecent.toFixed(1));
        console.log("Current rating average (most recent "
            + RECENT + "): " + aveCurrentRecent.toFixed(1));

        console.log("Short average: " + aveShort.toFixed(1));
        console.log("Long average: " + aveLong.toFixed(1));

        console.log("Short average (most recent "
            + RECENT + "): " + aveShortRecent.toFixed(1));
        console.log("Long average (most recent "
            + RECENT + "): " + aveLongRecent.toFixed(1));

        cat.show("Categories");
        shutter.show("Shutter");
        iso.show("ISO");
        aperture.show("Aperture");
        focal.show("Focal");
        lens.show("Lens");
        camera.show("Camera");

        fcFactor = 1;
        if (userFC < 100) {
            fcFactor = 1.1;
        } else if (userFC < 200) {
            fcFactor = 1.08;
        } else if (userFC < 500) {
            fcFactor = 1.05;
        } else if (userFC < 1000) {
            fcFactor = 1.03;
        }

        console.log("-".padEnd(30, "-"));
        console.log(user);
        if (warning) {
            console.log("********** WARNING **".padEnd(30, "*"));
        }
        console.log(VERSION.padEnd(30, "-"));
        tops.forEach(function (v, k) {
            console.log(k + " - " + v);
        });

        // sum up
        console.log("FC: " + userFC
            + "; Items: " + totalItems
            + "; Short: " + aveShort.toFixed(0)
            + "; All (" + count + "): " + aveHighest.toFixed(1)
            + "; Recent (" + (RECENT > count ? count : RECENT) + "): " + aveHighestRecent.toFixed(1)
            + "; ACR: " + aveCurrentRecent.toFixed(1)
            + "; Sig: " + siguiendo);

        let aHFactor = 6;
        let aHRFactor = 4;
        let aCRFactor = 1;
        rating =
            (
                (
                    (aveHighest * aHFactor)
                    + (aveHighestRecent * aHRFactor)
                    + (aveCurrentRecent * aCRFactor)
                )
                / (aHFactor + aHRFactor + aCRFactor)
            ) * fcFactor;
        rating /= 5;
        console.log("Rating: " + rating.toFixed(2));
    }
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
    loadingComplete = false;
    await sleeping(200);
    startLoad = (new Date()).getTime();
    while ($("div.infinite_scroll_loader").css("display") == "block") {
        await sleeping(500);
    }
    loadingComplete = true;
}

async function scrolling() {
    console.log("Scrolling...");
    before = window.scrollY;
    await loading();
    window.scrollTo(0, $(document).height() * 2);
    await loading();

    if (before == window.scrollY) {
        atBottom = true;
    }
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
            errored = true;
        }
    });
});
