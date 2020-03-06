var count = 0;
var forward = -2;
var quit = false;
var commonTags = new Map();
const TRACK_TAGS = true;
const MAX_TAGS_TO_SHOW = 30;
const MAX_LIKES = 1000;
const MIN_DELAY_AFTER_CLICK = 30000;
const MAX_DELAY_AFTER_CLICK = 35000;
const MIN_DELAY_AFTER_OPEN = 30000;
const MAX_DELAY_AFTER_OPEN = 35000;

if (TRACK_TAGS) {
    addToMap();
}
settingAndForgetting();
//changeLoc();

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searching() {
    let srchChg = new Event('input', { bubbles: true });
    let srchFcs = new FocusEvent({ bubbles: true });
    let srchKdn = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
        shiftKey: false,
        keyCode: 13
    });

    let srchMdn = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false
    });

    let srch = document.querySelector("input[type='text'][placeholder='Search']");
    srch.dispatchEvent(srchMdn);
    await sleeping(100);
    srch.dispatchEvent(srchFcs);
    await sleeping(100);
    srch.value = 'landscapephotography';
    await sleeping(100);

    srch.dispatchEvent(srchChg);
    srch.dispatchEvent(srchKdn);

    //var event = document.createEvent("HTMLEvents");
    //event.initEvent("click", true, true);
    //var target = document.querySelector("input[type='text'][placeholder='Search']");
    //target.dispatchEvent(event);

    // onChange, onFocus, onKeyDown, onMouseDown

    //document.getElementById('textfield').value = 'foo'
    //const event = new Event('input', { bubbles: true })
    //document.getElementById('textfield').dispatchEvent(event)
}

async function changeLoc() {
    if (forward == -2) {
        console.log("Tag");
        let e = document.querySelector("a[href^='/explore/tags']");
        e.click();
        forward = -1;
    } else {
        console.log("History");
        history.go(-1);
        await sleeping(5000);
        forward = -2;
    }

    await settingAndForgetting();
    await sleeping(5000);
    console.log("Wait");
}

async function settingAndForgetting() {
    let e = document.querySelectorAll("a[href^='/p/']");
    await sleeping(randBetween(750, 1500));
    console.log("Found: " + e.length);
    for (i = 0; i < e.length && !quit; i++) {
        e[i].click();
        await sleeping(randBetween(MIN_DELAY_AFTER_OPEN, MAX_DELAY_AFTER_OPEN));

        let like = false;
        let status = "lost";
        for (j = 0; j < 10; j++) {
            await sleeping(500);
            like = document.querySelector("span[class^='glyphsSpriteHeart__outline'][aria-label='Like']");
            if (like) {
                break;
            } else {
                let already = document.querySelector("span[class^='glyphsSpriteHeart__filled'][aria-label='Unlike']");
                if (already) {
                    status = "already liked";
                    break;
                }
            }
        }

        if (like) {
            // <span>114</span>likes
            let lksButtonIterator = document.evaluate("//button[contains(., 'likes')]", document, null, XPathResult.ANY_TYPE, null);
            let lksButton = lksButtonIterator.iterateNext();
            let likes = 0;
            if (lksButton) {
                likes = parseInt(lksButton.innerText.split(" ")[0].replace(/,/g, ''));
            }

            let tagIterator = document.evaluate("//a[@class = ''][starts-with(., '#')]", document, null, XPathResult.ANY_TYPE, null);
            let tagLink = false;
            let bad = "";
            while (tagLink = tagIterator.iterateNext()) {
                commonTags.increment(tagLink.innerText);
                if (bads.indexOf(tagLink.innerText) > -1) {
                    bad += tagLink.innerText + " ";
                }
            }

            if (bad == "" && likes <= MAX_LIKES) {
                like.click();
                status = "liking (" + likes + " likes)";
                count++;                
            } else {
                status = "skipping (" + likes + " likes, bad: " + bad + ")";
            }
        }

        console.log("Now (" + (i + 1) + "/" + e.length + "): " + status);
        await sleeping(randBetween(MIN_DELAY_AFTER_CLICK, MAX_DELAY_AFTER_CLICK));

        let iter = document.evaluate("//button[contains(., 'Close')]", document, null, XPathResult.ANY_TYPE, null);
        let cb = iter.iterateNext();
        if (cb) {
            cb.click();
        } else {
            break;
        }
    }
    console.log("Count: " + count);
    //await sleeping(randBetween(5000, 20000));
    //await changeLoc();
}

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
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

    Map.prototype.show = function (title = "") {
        console.log(title.padEnd(30, "-"));
        let mapSort = new Map([...this.entries()].sort((a, b) => b[1] - a[1]));
        let count = 0;
        mapSort.forEach(function (v, k) {
            count++;
            if (count <= MAX_TAGS_TO_SHOW) {
                console.log(k + ": " + v);
            }
        });
    };
}

var bads = [
    '#artwork',
    '#autumnoutfit',
    '#avatar',
    '#avatars',
    '#barcrawl',
    '#bdsmcommunity',
    '#beautifulslavicboys',
    '#beer',
    '#bikini',
    '#blackonblack',
    '#blogger',
    '#bloggerstyle',
    '#bodycare',
    '#bondage',
    '#breakfast',
    '#brunette',
    '#bwstyleoftheday',
    '#capshunapp',
    '#casualstyle',
    '#cheddar',
    '#coach',
    '#coaching',
    '#cosmopolitan',
    '#couplegoals',
    '#creativeart',
    '#customart',
    '#cute',
    '#cutebaby',
    '#dinner',
    '#drinks',
    '#dynamicportraits',
    '#eat',
    '#falloutfit',
    '#fallstyle',
    '#fashion',
    '#fashionblog',
    '#fashionblogger',
    '#fashionbloggers',
    '#fashioneditorial',
    '#fashionformen',
    '#fashioninspiration',
    '#fashioninspo',
    '#fashionista',
    '#fashionphotographer',
    '#fashionshoot',
    '#fashionstyle',
    '#fblogger',
    '#fbloggers',
    '#fetish',
    '#fineartportrait',
    '#fitness',
    '#fitnessmodel',
    '#food',
    '#foodie',
    '#foodlover',
    '#foodphotography',
    '#foodpic',
    '#foodpics',
    '#forsale',
    '#freestyle',
    '#freshfood',
    '#friends',
    '#fungram',
    '#funny',
    '#funnytweets',
    '#gamingphotography',
    '#gay',
    '#gayboy',
    '#gayguy',
    '#gaylove',
    '#gayman',
    '#gaymen',
    '#girl',
    '#girlsgirlsgirls',
    '#girlspower',
    '#goawesome',
    '#groupphotography',
    '#gununkaresi',
    '#hairinspo',
    '#health',
    '#hublimodels',
    '#igfashion',
    '#igstyle',
    '#inked',
    '#inkedboy',
    '#inkedboys',
    '#inkedgirls',
    '#inspirationalquotes',
    '#instabeer',
    '#instafashion',
    '#instafood',
    '#instagay',
    '#instagirl',
    '#instastyle',
    '#instawoman',
    '#juicing',
    '#justme',
    '#kicks',
    '#kickstagram',
    '#latinmusic',
    '#laughing',
    '#lifecoach',
    '#lifelessons',
    '#lifequotes',
    '#lifestylephotography',
    '#longhair',
    '#lookbook',
    '#lookbooks',
    '#lookoftheday',
    '#lotd',
    '#lovemusic',
    '#lovequotes',
    '#lunch',
    '#makeup',
    '#makeupideas',
    '#makeuplooks',
    '#makeuptutorial',
    '#makeupvideos',
    '#me',
    '#memes',
    '#men',
    '#menfashion',
    '#mens',
    '#mensfashion',
    '#menshair',
    '#mensoutfit',
    '#mensstreetstyle',
    '#mensstyle',
    '#menstyle',
    '#menstyleguide',
    '#menstyles',
    '#menswear',
    '#modeblog',
    '#model',
    '#modeling',
    '#modelling',
    '#modelo',
    '#models',
    '#motivation',
    '#mystyle',
    '#nomakeup',
    '#ootd',
    '#ootdfashion',
    '#ootdmagazine',
    '#outfit',
    '#outfitideas',
    '#outfitinspiration',
    '#outfitinspo',
    '#outfitoftheday',
    '#outfitpost',
    '#pakistanistreetstyle',
    '#people',
    '#personalstyle',
    '#photogenic',
    '#polishgirl',
    '#polishwoman',
    '#polskadziewczyna',
    '#portrait_perfection',
    '#portrait',
    '#portraitphotography',
    '#portraits_ig',
    '#portraitsociety',
    '#portraitstream',
    '#portraiture',
    '#pose',
    '#positivequotes',
    '#potraitphotography',
    '#powershots',
    '#productphotography',
    '#propertyforsale',
    '#psicochat',
    '#pubcrawl',
    '#pune',
    '#punemodelshoot',
    '#quote',
    '#quotes',
    '#quotestagram',
    '#ragdollcat',
    '#rap',
    '#rapmonster',
    '#rdr',
    '#rdr2',
    '#realestate',
    '#realestateagent',
    '#risas',
    '#ropebondage',
    '#selebgram',
    '#selfie',
    '#selfportrait',
    '#singer',
    '#sketch',
    '#sketchbook',
    '#slavicbeauty',
    '#slovakwoman',
    '#smile',
    '#smokedmeat',
    '#sneakers',
    '#streetfashion',
    '#streetstyle',
    '#streetwear',
    '#style',
    '#styleblogger',
    '#stylegram',
    '#styleoftheday',
    '#stylish',
    '#superfoods',
    '#swim',
    '#swimming',
    '#swimsuit',
    '#swimwear',
    '#takecareofyourself',
    '#tan',
    '#tattoo',
    '#tattooboy',
    '#tattoodesign',
    '#tattoogirl',
    '#tattoos',
    '#tbt',
    '#thesims',
    '#sims',
    '#screenshot',
    '#theportraitbazaar',
    '#tiktok',
    '#toyphotography',
    '#trap',
    '#travelcouples',
    '#tweet',
    '#tweetgram',
    '#unete',
    '#videogamephotography',
    '#videogames',
    '#videos',
    '#vlog',
    '#vlogger',
    '#vscocamgram',
    '#wedding',
    '#weddingchicks',
    '#weddingday',
    '#weddingdecor',
    '#weddingdress',
    '#weddinghair',
    '#weddingphoto',
    '#weddingphotographer',
    '#weddingphotography',
    '#whatiwore',
    '#whattowear',
    '#wine',
    '#winterfashion',
    '#wiw',
    '#wiwt',
    '#woman',
    '#womanphotography',
    '#womanportrait',
    '#women',
    '#womensstyle',
    '#yum',
];

/*
async function trash() {
    let e = document.querySelector("body");
    let e = document.querySelector("span#react-root");
    let e = document.querySelector("section");
    let e = document.querySelector("main[role='main']");

    window.history.pushState("string", "#landscapephotography", "https://www.instagram.com/explore/tags/landscape_lovers/");
    window.history.pushState({page: "landscape"}, "landscape page", "/explore/tags/landscape/");
    history.pushState({}, null, "/explore/tags/landscapephotography/");

    e = document.querySelector("span.coreSpriteSearchIcon");
    f = e.parentElement;
    f.click();
    f.focus();

    g = f.childNodes[1];

    e = document.querySelector("a[href^='/explore/tags']");

    console.log("Skroll 1");
    window.scrollTo(0, window.innerHeight * 2);
    await sleeping(randBetween(750, 1500));

    console.log("Skroll 2");
    window.scrollTo(0, window.innerHeight * 2);
    await sleeping(randBetween(750, 1500));
}
*/
