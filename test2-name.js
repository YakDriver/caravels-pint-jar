// namn
const MAX_ERRORS = 40;
const MAX_TRIGGERS = 5000;
const STATUS_EVERY = 20000;
const LOAD_STALLED_AFTER = 30000;
const ERROR_SLEEP = 30000;
const TRACK_TAGS = false;

const SEARCH_MODE_BASIC = 1;
const SEARCH_MODE_NAMES_ONLY = 2;
const SEARCH_MODE_EXPANDED = 3;
const SEARCH_MODE_FULL = 4;
const SEARCH_MODE_SUPER_NAMES = 5;
const SEARCH_MODE_NATURE = 6;
const SEARCH_MODE_POP_NAMES = 7;
const SEARCH_MODE = SEARCH_MODE_NATURE;
const NAME_BONUS = true;
const MAX_TAGS_TO_SHOW = 20;
const STARTING_CHANCES = 7;
const MIN_SHORT_SIDE = 1100;

const MIN_HRATING = 80;
const MIN_RATING = 70;
const MIN_VOTES = 4;
const MAX_PAGES_PER = -1;
const MAX_DAYS_AGO = 2;
const MAX_PAGES = 10;

const CHECK_NAME = false;
const HANDLE_PAUSE = 5000;
const SEARCH_TYPE = 2; // 3 turns off
const VERBOSE = true;

var count = 0;
var errorCount = 0;
var errored = false;
var quit = false;
var millis = (new Date()).getTime();

var startTime = (new Date()).getTime();
var mostCommon = [];
var commonCats = [];
var commonTags = new Map();
var commonChances = new Map();
var commonChancesClicked = new Map();
var searchType = randBetween(0, 2);

var currentDaysAgo = 0;
var moreToDo = false;
var loadingComplete = true;
var outstandingRequests = new Map();
var itemsID = -1;
var expandedKeywords = [];
var fullKeywords = [];
var superKeywords = [];
var natureKeywords = [];
var popNames = [];

var currentName = "";

const NAMES = getNames();

const CHINESE = [
    '丽',
    '丹',
    '云',
    '倩',
    '兰',
    '妮',
    '娜',
    '娟',
    '娴',
    '婷',
    '嫣',
    '彩',
    '惠',
    '淑',
    '爱',
    '珊',
    '琼',
    '碧',
    '红',
    '芳',
    '莉',
    '莲',
    '贞',
    '霞',
];

controlCentral();

async function controlCentral() {
    start();

    addToMap();
    await addingDataListener();

    while (!quit) {
        while (outstandingRequests.size > 0 && !quit) {
            await sleeping(500);
        }

        if (!quit) {
            if (!moreToDo || currentDaysAgo > MAX_DAYS_AGO) {
                moreToDo = true;
                currentDaysAgo = 0;
                loadingComplete = false;
                itemsID = null;
                showStatus();
                millis = (new Date()).getTime();
                await changingSearch();
            } else {
                loadingComplete = false;
                await scrolling(1);
            }
        }

        now = (new Date()).getTime();
        if (now > (millis + STATUS_EVERY)) {
            showStatus();
            millis = now;
        }

        if (errored && !quit) {
            errored = false;
            await sleeping(ERROR_SLEEP);
        }

        if (count >= MAX_TRIGGERS || errorCount >= MAX_ERRORS) {
            quit = true;
        }

        await sleeping(10000);
    }
    end();
}

async function changingSearch(givenPhrase = null) {
    let phrase = "";
    if (givenPhrase) {
        phrase = givenPhrase;
    } else {
        phrase = getRandomPhrase();
    }

    console.log("--------------------------------------");
    console.log("Change search: " + phrase + " (" + searchType + ")");

    await loading();

    let sb = $("div.search-bar").find("input.search");
    sb.val(phrase);

    await sleeping(500);

    let e = $("div.photos.menu-item.disableable");
    e.click();

    await sleeping(1000);

    if (SEARCH_TYPE != 3) {
        searchType = SEARCH_TYPE;
    }

    $("div.info.list").find("a:eq(" + searchType + ")").click();
    await loading();

    searchType = (searchType + 1) % 3;

    await sleeping(5000);

    loadingComplete = true;
}

async function scrolling(skrols = 3) {
    console.log("Scrolling " + skrols + "...");
    let beforeHt = $(document).height();
    for (i = 0; i < skrols && !quit; i++) {
        await loading();
        window.scrollTo(0, $(document).height() * 2);
        await loading();
        if (beforeHt == $(document).height()) {
            console.log("Unable to scroll");
            moreToDo = false;
            break;
        }
    }

    await sleeping(5000);

    loadingComplete = true;
}

function handleResponse(response, randID = 20) {
    var obj = JSON.parse(response);
    if (obj.photos && !quit) {

        if (randID == 20 || !loadingComplete) {
            let newRandID = randBetween(40, 1000);
            while (outstandingRequests.has(newRandID)) {
                newRandID = randBetween(40, 1000); // no dupes
            }
            outstandingRequests.set(newRandID, "yo");

            if (outstandingRequests.has(randID)) {
                outstandingRequests.delete(randID); // old
            }

            setTimeout(function () {
                handleResponse(response, newRandID);
            }, HANDLE_PAUSE);
            return;
        }

        console.log("Response received, page: " + obj.current_page + "/"
            + obj.total_pages + ", items: " + obj.total_items);

        if (obj.total_items == 0 || obj.photos.length == 0 || obj.current_page >= obj.total_pages || obj.current_page >= MAX_PAGES) {
            moreToDo = false;
        }

        if (obj.photos.length > 0) {

            for (i = 0; i < obj.photos.length; i++) {

                if (obj.photos[i].tags && TRACK_TAGS) {
                    for (j = 0; j < obj.photos[i].tags.length; j++) {
                        commonTags.increment(obj.photos[i].tags[j].toLocaleLowerCase().substr(0, 20));
                    }
                }

                let actualMinHrating = MIN_HRATING;
                let actualMinRating = MIN_RATING;
                let daysAgo = (new Date() - Date.parse(obj.photos[i].created_at)) / (1000 * 60 * 60 * 24);
                if (daysAgo <= 0.5) {
                    actualMinHrating = (MIN_HRATING * (daysAgo * 2));
                    actualMinRating = (MIN_RATING * (daysAgo * 2));
                }

                if (i == 0) {
                    currentDaysAgo = daysAgo;
                }

                let tn = $("a[href*=" + obj.photos[i].id + "]").parent("div.photo_thumbnail");
                if (!success(tn)) {
                    console.log("Little problem, Houston... Thumbnail not found! Skipping...");
                    continue;
                }
                //tn.append('<div class="photo_thumbnail__pulse_container"><span class="photo_thumbnail__pulse">'
                //    + obj.photos[i].rating
                //    + '/' + obj.photos[i].highest_rating + '/' + daysAgo.toFixed(1) + 'd</span></div>');

                let namePasses = true;
                let name = "";
                if (CHECK_NAME || NAME_BONUS) {
                    if (obj.photos[i].user.firstname) {
                        name = obj.photos[i].user.firstname.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        names = name.split(' ');
                        if (names.length > 1) {
                            name = names[0];
                        }
                    }

                    let nIndex = NAMES.indexOf(name);

                    if (nIndex < 0) {
                        nIndex = CHINESE.indexOf(name.charAt(0));
                    }

                    if (nIndex < 0) {
                        namePasses = false;
                    }

                    if (!CHECK_NAME) {
                        if (!namePasses) {
                            name = "";
                        }
                        namePasses = true;
                    }
                }

                /*
               "active": 1,
               "about": "",
               "upgrade_status": 3,
               "affection": 2019,
               "followers_count": 0,
               "following": false
               */
                let chances = STARTING_CHANCES;
                let chancesVerbose = "";
                chances -= (obj.photos[i].highest_rating >= actualMinHrating) ? 1 : 0;
                chancesVerbose += (obj.photos[i].highest_rating >= actualMinHrating) ? "R" : "";
                chances -= (obj.photos[i].rating >= actualMinRating) ? 1 : 0;
                chancesVerbose += (obj.photos[i].rating >= actualMinRating) ? "H" : "";
                chances -= (obj.photos[i].votes_count == 0) ? 2 : 0;
                chancesVerbose += (obj.photos[i].votes_count == 0) ? "θ" : "";
                chances -= (name != "") ? 1 : 0;
                chancesVerbose += (name != "") ? "Ñ" : "";
                chances -= (obj.photos[i].user.about &&
                    obj.photos[i].user.about.length >= 0) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.about &&
                    obj.photos[i].user.about.length >= 0) ? "b" : "";
                chances -= (obj.photos[i].user.upgrade_status == 2) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.upgrade_status == 2) ? "ṗ" : "";
                chances -= (obj.photos[i].user.upgrade_status == 3) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.upgrade_status == 3) ? "P" : "";
                chances -= (obj.photos[i].user.affection >= 50000) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.affection >= 50000) ? "a" : "";
                chances -= (obj.photos[i].user.affection >= 500000) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.affection >= 500000) ? "A" : "";
                chances -= (obj.photos[i].user.followers_count <= 200) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.followers_count <= 200) ? "ƒ" : "";
                chances -= (obj.photos[i].user.followers_count >= 1000) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.followers_count >= 1000) ? "f" : "";
                chances -= (obj.photos[i].user.followers_count >= 10000) ? 1 : 0;
                chancesVerbose += (obj.photos[i].user.followers_count >= 10000) ? "F" : "";
                chances -= (obj.photos[i].user.following) ? 3 : 0;
                chancesVerbose += (obj.photos[i].user.following) ? "Ḟ" : "";
                chances -= (Math.min(obj.photos[i].height, obj.photos[i].width) >= MIN_SHORT_SIDE) ? 1 : 0;
                chancesVerbose += (Math.min(obj.photos[i].height, obj.photos[i].width) >= MIN_SHORT_SIDE) ? "S" : "";
                commonChances.increment(chancesVerbose);

                let randomChance = (randBetween(0, chances - 1) == 0);
                // console.log("chances: " + chances + ", yes? " + randomChance);

                if (
                    !obj.photos[i].nsfw
                    && !obj.photos[i].has_nsfw_tags
                    && goodCats.includes(obj.photos[i].category)
                    && randomChance
                    && !obj.photos[i].voted
                    && daysAgo <= MAX_DAYS_AGO
                    && namePasses
                ) {
                    let but = tn.find("a.button.new_fav");

                    if (!success(but)) {
                        but = null;
                        console.log("Little problem... Button not found! Skipping...");
                        continue;
                    }

                    but.trigger("click");
                    count++;

                    commonChancesClicked.increment(chancesVerbose);

                    if (VERBOSE) {
                        console.log(chancesVerbose + " VOTE... " + name + " ("
                            + "chances: 1:" + chances
                            + ", ct: " + count
                            + ", r: " + obj.photos[i].rating
                            + ", hr: " + obj.photos[i].highest_rating
                            + ", days: " + daysAgo.toFixed(1)
                            + ")");
                    }

                    if (commonCats[obj.photos[i].category]) {
                        commonCats[obj.photos[i].category]++;
                    } else {
                        commonCats[obj.photos[i].category] = 1;
                    }

                    if (name != "") {
                        if (mostCommon[name]) {
                            mostCommon[name]++;
                        } else {
                            mostCommon[name] = 1;
                        }
                    }

                }
            }

            // quit = true;
        }

        outstandingRequests.delete(randID);
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

function getRandomPhrase() {

    if (SEARCH_MODE == SEARCH_MODE_BASIC) {
        return BASIC_KEYWORDS[randBetween(0, BASIC_KEYWORDS.length - 1)];
    }

    if (SEARCH_MODE == SEARCH_MODE_NAMES_ONLY) {
        return NAMES[randBetween(0, NAMES.length - 1)];
    }

    if (SEARCH_MODE == SEARCH_MODE_EXPANDED) {
        if (expandedKeywords.length == 0) {
            expandedKeywords = BASIC_KEYWORDS.concat(NAMES, CHINESE);
        }
        return expandedKeywords[randBetween(0, expandedKeywords.length - 1)];
    }

    if (SEARCH_MODE == SEARCH_MODE_FULL) {
        if (fullKeywords.length == 0) {
            let cities = [
                'paris', 'doha', 'amsterdam', 'venice',
                'kyoto',
                'barcelona',
                'athens',
                'sydney',
                'san miguel de allende',
                'havana',
                'beirut',
                'cape town',
                'budapest',
                'buenos aires',
                'lisbon',
                'luang prabang',
                'florence',
                'istanbul',
                'hong kong',
                'copenhagen',
                'jerusalem',
                'krakow',
                'bruges',
                'busan',
                'dubrovnik',
                'cartagena',
                'edinburgh',
                'quebec',
                'hamburg',
                'jaipur',
                'queenstown',
                'muscat',
                'london',
                'chefchaouen',
                'charleston',
                'seville',
                'new york',
                'isfahan',
                'rio de janeiro',
                'rome',
                'shanghai',
                'st petersburg',
                'vancouver',
                'tallinn',
                'vienna',
                'singapore',
                'prague',
                'dublin',
                'lucerne',
                'quito',
            ];

            fullKeywords = BASIC_KEYWORDS.concat(NAMES, CHINESE, cities);
        }
        return fullKeywords[randBetween(0, fullKeywords.length - 1)];
    }

    if (SEARCH_MODE == SEARCH_MODE_SUPER_NAMES) {
        if (superKeywords.length == 0) {
            superKeywords = [
                'nature',
                'sky',
                'light',
                'water',
                'white',
                'people',
                'no people',
                'travel',
                'beautiful',
                'city',
                'sunset',
                'landscape',
                'black',
                'tree',
                'trees',
                'street',
                'sun',
                'summer',
                'america',
                'cloud',
                'clouds',
                'black and white',
                'girl',
                'beauty',
                'blue',
                'architecture',
                'flower',
                'mount',
                'sea',
                'green',
                'outdoors',
                'morning',
                'beach',
                'night',
                'wood',
                'nighttime',
                'animal',
                'urban',
                'woman',
                'lake',
                'red',
                'sunrise',
                'park',
                'mountain',
                'italy',
                'winter',
                'new',
                'old',
                'fall',
                'river',
                'day',
                'nikon',
                'forest',
                'canon',
                'life',
                'reflection',
                'ocean',
                'macro',
                'rock',
                'mountains',
                'snow',
                'young',
                'her',
                'autumn',
                'road',
                'cityscape',
                'skyline',
                'yellow',
                'grass',
                'canada',
                'close-up',
                'plant',
                'female',
                'long exposure',
                '风景',
                '自然',
                '风光',
                'time',
                'dawn',
                'japan',
                'b/w',
                'flora',
                '景观',
                'beauty in nature',
                'walk',
                'food',
                'orange',
                'cold',
                'china',
                'fog',
                'pink',
                'ice',
                'happy',
                'smile',
                'new york',
                'retro',
                'natural light',
                '旅行',
                'scenic',
                'national',
                'vintage',
                'london',
                'asia',
                'one person',
                'paris',
                'rural',
                'usa',
                'fun',
                'violet',
                '摄影',
                'tranquil',
                'tranquility',
                'good',
                'thailand',
                'baby',
                'rose',
                'brown',
                'fresh',
                '日落',
                '日本',
                '云',
                'polska',
                'abandoned',
                'purple',
                'lovely',
                '中国',
                'mist',
                '富士山',
                'grey',
                'misty',
                'crystal',
                'golden hour',
                'magical',
                'meadow',
                'maria',
                'happiness',
                'exploration',
                'gold',
                'decoration',
                'istanbul',
                'wooden',
                'ireland',
                'venice',
                'anna',
                'ornament',
                'peaceful',
                'table',
                'tranquil scene',
                'victoria',
                'canyon',
                'andrea',
                'barcelona',
                'avenue',
                'celebration',
                'frost',
                '彩',
                'sculpture',
                'angel',
                'rome',
                'standing',
                'singapore',
                'blue hour',
                'column',
                'urbex',
                'quebec',
                '丽',
                'carolina',
                '红',
                'lisbon',
                'kim',
                'british columbia',
                'prague',
                'hong kong',
                '爱',
                'amsterdam',
                'lily',
                'give',
                'georgia',
                'sydney',
                'glow',
                'li',
                'lightning',
                'eagle',
                'april',
                'elena',
                'extreme',
                'laura',
                'olga',
                'julia',
                'ana',
                'budapest',
                'buenos aires',
                'vancouver',
                'june',
                'grace',
                'daisy',
                'brittany',
                'vienna',
                'shanghai',
                'marie',
                'hamburg',
                'owl',
                'paysage',
                'rustic',
                'mary',
                'atmosphere',
                'virginia',
                'lifestyles',
                'sarah',
                'florence',
                'seat',
                'dew',
                'luz',
                'kyoto',
                'rio de janeiro',
                'emilia',
                'silver',
                'lisa',
                'rosalie',
                'anastasia',
                'sara',
                'jessica',
                'aurora',
                '霞',
                'serene',
                'девушка',
                'diana',
                'портрет',
                'anne',
                'irina',
                'kate',
                '兰',
                'alexandra',
                'dublin',
                'sofia',
                'natalia',
                'kelly',
                'sandra',
                'magical',
                'elizabeth',
                'lantern',
                'ann',
                'copenhagen',
                'lizard',
                'linda',
                'nina',
                'barbara',
                'nicola',
                'seville',
                'frankfurt',
                'forgotten',
                'alice',
                'athens',
                'jennifer',
                'isla',
                'edinburgh',
                'nicole',
                'amanda',
                'heather',
                'marta',
                'turquoise',
                'eva',
                'saga',
                'giulia',
                'cristina',
                'michele',
                'd810',
                'daria',
                'alina',
                'bark',
                'karen',
                'michelle',
                'claudia',
                'alba',
                'micro',
                'havana',
                'mara',
                'paula',
                'daniela',
                'julie',
                'olive',
                'lara',
                'bella',
                'christine',
                'emily',
                'morgan',
                'tatiana',
                'svetlana',
                'monica',
                'stephanie',
                'emma',
                'jane',
                'cape town',
                'kristina',
                'sophie',
                'lena',
                'rachel',
                'amy',
                'rebecca',
                'marilyn',
                'rene',
                'charlotte',
                'melissa',
                'angela',
                'christina',
                'susan',
                'vanessa',
                'joan',
                'patricia',
                'lost place',
                'tanya',
                'nino',
                'catherine',
                'jerusalem',
                'maya',
                'jenny',
                'helen',
                'miranda',
                'alexis',
                '丹',
                'krakow',
                'victory',
                'louise',
                'wbpa',
                'rita',
                '莲',
                'lucia',
                'valentina',
                'yan',
                'samantha',
                'monika',
                'navy',
                'petra',
                'amber',
                'mia',
                'martina',
                'lilly',
                'dominique',
                'blanca',
                'aleksandra',
                'melanie',
                'natalie',
                'lauren',
                'hannah',
                'katie',
                'caroline',
                'magdalena',
                'katerina',
                'jing',
                'natasha',
                'bologna',
                'magenta',
                'clara',
                'teresa',
                'tina',
                'megan',
                'sue',
                'elisa',
                'mari',
                'sabrina',
                'nel',
                'sienna',
                'donna',
                'peach',
                'isabel',
                'joanna',
                'magda',
                'polina',
                'shannon',
                'doha',
                'plum',
                'irene',
                'valeria',
                'nadia',
                'st petersburg',
                'streak',
                'nancy',
                'charleston',
                'sharon',
                'chiara',
                'carol',
                'nathalie',
                'veronica',
                'gabriela',
                'sophia',
                'ella',
                'tallinn',
                'dana',
                'весна',
                'anita',
                'karina',
                'jaipur',
                'mariana',
                'veronika',
                'lucy',
                'carla',
                'stella',
                'tatyana',
                'teal',
                'ruby',
                'yulia',
                'sonia',
                'erika',
                'sultan',
                'erin',
                'jana',
                'tracy',
                'helena',
                'madina',
                'katherine',
                'ann-marie',
                'tamara',
                'leslie',
                'madison',
                'danielle',
                'cindy',
                'анастасия',
                'denise',
                'anastasiya',
                'viktoria',
                'hanna',
                'chelsea',
                'wendy',
                'lina',
                'cartagena',
                'holly',
                'ro',
                'snowflake',
                'lana',
                'regina',
                'lime',
                'dubrovnik',
                'анна',
                'jade',
                'olivia',
                '惠',
                'zoe',
                'katya',
                'valerie',
                'bruges',
                'lea',
                'ellen',
                'jasmine',
                'alicia',
                'ruth',
                'bianca',
                'caroline',
                'hannah',
                'toni',
                'sophie',
                'solo',
                'dof',
                'droplets',
                'maple',
                'built structure',
                'jordan',
                'story',
                'pine',
                'cherry',
                'stairs',
                'wet',
                'perspective',
                'point',
                'landmark',
                'stone',
                'bright',
                'place',
                'bloom',
                'building',
                'color',
            ];
        }
        let ind = randBetween(0, superKeywords.length - 1);
        while (!superKeywords[ind]) {
            ind = randBetween(0, superKeywords.length - 1);
        }
        let rv = superKeywords[ind];
        delete (superKeywords[ind]);
        return rv;
    }

    if (SEARCH_MODE == SEARCH_MODE_NATURE) {
        if (natureKeywords.length == 0) {
            natureKeywords = [
                'nature',
                'sky',
                'light',
                'water',
                'no people',
                'travel',
                'beautiful',
                'sunset',
                'landscape',
                'tree',
                'trees',
                'sun',
                'summer',
                'america',
                'cloud',
                'clouds',
                'flower',
                'mount',
                'sea',
                'green',
                'outdoors',
                'morning',
                'beach',
                'wood',
                'united states',
                'animal',
                'lake',
                'color',
                'red',
                'sunrise',
                'park',
                'mountain',
                'winter',
                'fall',
                'river',
                'day',
                'nikon',
                'forest',
                'life',
                'reflection',
                'ocean',
                'macro',
                'rock',
                'mountains',
                'snow',
                'autumn',
                'horizon',
                'yellow',
                'grass',
                'canada',
                'close-up',
                'plant',
                'long exposure',
                'bloom',
                '风景',
                '自然',
                '风光',
                'dawn',
                'b/w',
                'flora',
                'place',
                '景观',
                'beauty in nature',
                'walk',
                'orange',
                'cold',
                'fog',
                'pink',
                'ice',
                'natural light',
                '旅行',
                'scenic',
                'national',
                'rural',
                'usa',
                'violet',
                '摄影',
                'tranquil',
                'tranquility',
                'stone',
                'good',
                'rose',
                'brown',
                'desert',
                'fresh',
                '日落',
                '日本',
                '云',
                'purple',
                'lovely',
                '中国',
                'mist',
                '富士山',
                'grey',
                'misty',
                'crystal',
                'golden hour',
                'magical',
                'meadow',
                'maria',
                'exploration',
                'anna',
                'peaceful',
                'colorado',
                'arizona',
                'tranquil scene',
                'victoria',
                'canyon',
                'andrea',
                'perspective',
                'frost',
                '彩',
                'wet',
                'angel',
                'blue hour',
                '丽',
                'carolina',
                '红',
                'utah',
                'kim',
                '爱',
                'lily',
                'cherry',
                'georgia',
                'pine',
                'glow',
                'li',
                'lightning',
                'eagle',
                'garcia',
                'wildflower',
                'april',
                'elena',
                'extreme',
                'laura',
                'olga',
                'julia',
                'ana',
                'vancouver',
                'june',
                'grace',
                'daisy',
                'flores',
                'brittany',
                'marie',
                'owl',
                'paysage',
                'mary',
                'atmosphere',
                'virginia',
                'sarah',
                'florence',
                'dew',
                'luz',
                'remote',
                'maple',
                'emilia',
                'lisa',
                'rosalie',
                'anastasia',
                'sara',
                'jessica',
                'droplets',
                'aurora',
                '霞',
                'serene',
                'diana',
                'anne',
                'irina',
                'kate',
                'cactus',
                'dof',
                '兰',
                'alexandra',
                'sofia',
                'natalia',
                'kelly',
                'sandra',
                'elizabeth',
                'ann',
                'lizard',
                'linda',
                'nina',
                'barbara',
                'nicola',
                'alice',
                'jennifer',
                'isla',
                'nicole',
                'amanda',
                'native',
                'heather',
                'marta',
                'eva',
                'saga',
                'giulia',
                'cristina',
                'michele',
                'd810',
                'daria',
                'alina',
                'bark',
                'karen',
                'michelle',
                'claudia',
                'alba',
                'micro',
                'mara',
                'paula',
                'daniela',
                'julie',
                'lara',
                'bella',
                'christine',
                'emily',
                'morgan',
                'tatiana',
                'svetlana',
                'monica',
                'stephanie',
                'emma',
                'jane',
                'kristina',
                'sophie',
                'lena',
                'sophie',
                'rachel',
                'amy',
                'rebecca',
                'marilyn',
                'rene',
                'charlotte',
                'melissa',
                'angela',
                'christina',
                'susan',
                'vanessa',
                'joan',
                'patricia',
                'tanya',
                'nino',
                'catherine',
                'maya',
                'mesa',
                'arid',
                'moab',
                'spikes',
            ];
        }

        return natureKeywords[randBetween(0, natureKeywords.length - 1)];
    }

    if (SEARCH_MODE == SEARCH_MODE_POP_NAMES) {
        if (popNames.length == 0) {
            popNames = [
                'aaliyah',
                'abby',
                'abigail',
                'abril',
                'ada',
                'adalyn',
                'adalynn',
                'addison',
                'adel',
                'adeline',
                'adriana',
                'adrianna',
                'adrienne',
                'agnes',
                'agnieszka',
                'aimee',
                'alaina',
                'alana',
                'alba',
                'alejandra',
                'aleksandra',
                'alessandra',
                'alessia',
                'alexa',
                'alexandra',
                'alexandria',
                'alexia',
                'alexis',
                'alice',
                'alicia',
                'alina',
                'alisa',
                'alisha',
                'alison',
                'aliyah',
                'allison',
                'alma',
                'alondra',
                'alyssa',
                'amanda',
                'amber',
                'amelia',
                'amy',
                'ana',
                'anastasia',
                'anastasiya',
                'andrea',
                'andreea',
                'angel',
                'angela',
                'angelica',
                'angelina',
                'angie',
                'ani',
                'anita',
                'anja',
                'ann',
                'ann-marie',
                'anna',
                'annabelle',
                'anne',
                'annette',
                'antonella',
                'april',
                'aria',
                'ariana',
                'arianna',
                'ariel',
                'arina',
                'ashlee',
                'ashley',
                'ashlyn',
                'athena',
                'aubree',
                'aubrey',
                'audrey',
                'aurora',
                'autumn',
                'ava',
                'avery',
                'aya',
                'bailey',
                'barbara',
                'beatrice',
                'beatriz',
                'becky',
                'belinda',
                'bella',
                'beth',
                'bethany',
                'betty',
                'beverly',
                'bianca',
                'blanca',
                'bonnie',
                'brandi',
                'brandy',
                'breanna',
                'brenda',
                'briana',
                'brianna',
                'bridget',
                'brielle',
                'brittany',
                'brittney',
                'brooke',
                'brooklyn',
                'brooklynn',
                'caitlin',
                'caitlyn',
                'camila',
                'camilla',
                'camille',
                'candace',
                'candice',
                'carla',
                'carly',
                'carmen',
                'carol',
                'carolina',
                'caroline',
                'carolyn',
                'carrie',
                'casey',
                'cassandra',
                'cassidy',
                'cassie',
                'catalina',
                'catherine',
                'cathy',
                'cecilia',
                'celine',
                'charlene',
                'charlotte',
                'chelsea',
                'chelsey',
                'cheryl',
                'cheyenne',
                'chiara',
                'chloe',
                'christie',
                'christina',
                'christine',
                'christy',
                'cindy',
                'claire',
                'clara',
                'claudia',
                'colleen',
                'concepcion',
                'connie',
                'cora',
                'courtney',
                'cristina',
                'crystal',
                'cynthia',
                'daisy',
                'dana',
                'daniela',
                'danielle',
                'daria',
                'darlene',
                'darya',
                'dawn',
                'deanna',
                'debbie',
                'deborah',
                'debra',
                'delaney',
                'delilah',
                'denise',
                'desiree',
                'destiny',
                'diamond',
                'diana',
                'diane',
                'dominique',
                'donna',
                'dora',
                'doris',
                'dorothy',
                'dulce',
                'ebony',
                'eden',
                'eileen',
                'ela',
                'elaine',
                'elena',
                'eliana',
                'elisa',
                'elisabeth',
                'elise',
                'eliza',
                'elizabeth',
                'ella',
                'ellen',
                'ellie',
                'emery',
                'emilia',
                'emilie',
                'emily',
                'emma',
                'erica',
                'erika',
                'erin',
                'esther',
                'eva',
                'evelyn',
                'everly',
                'evgeniya',
                'ewa',
                'faith',
                'fatima',
                'felicia',
                'fernanda',
                'fiona',
                'florence',
                'frances',
                'gabriela',
                'gabriella',
                'gabrielle',
                'gail',
                'genesis',
                'georgia',
                'gianna',
                'gina',
                'giselle',
                'giulia',
                'glenda',
                'gloria',
                'grace',
                'gracie',
                'hadley',
                'hailey',
                'haley',
                'hana',
                'hanna',
                'hannah',
                'harmony',
                'harper',
                'hayden',
                'hayley',
                'hazel',
                'heather',
                'heidi',
                'helen',
                'helena',
                'holly',
                'hope',
                'ida',
                'ines',
                'ingrid',
                'inna',
                'ioana',
                'irene',
                'irina',
                'isabel',
                'isabella',
                'isabelle',
                'isla',
                'islande',
                'ivana',
                'ivy',
                'izabella',
                'jackie',
                'jaclyn',
                'jacqueline',
                'jada',
                'jade',
                'jaime',
                'jamie',
                'jana',
                'jane',
                'janet',
                'janice',
                'jasmin',
                'jasmine',
                'jayla',
                'jazmin',
                'jean',
                'jeanette',
                'jeanne',
                'jelena',
                'jenna',
                'jennifer',
                'jenny',
                'jessica',
                'jill',
                'jillian',
                'jing',
                'joan',
                'joann',
                'joanna',
                'joanne',
                'jocelyn',
                'jodi',
                'jody',
                'johanna',
                'jordan',
                'jordyn',
                'josephine',
                'joy',
                'joyce',
                'judith',
                'judy',
                'julia',
                'juliana',
                'julianna',
                'julie',
                'justyna',
                'kaitlin',
                'kaitlyn',
                'kara',
                'karen',
                'kari',
                'karin',
                'karina',
                'karla',
                'karolina',
                'kasia',
                'katarzyna',
                'kate',
                'katelyn',
                'katerina',
                'katherine',
                'kathleen',
                'kathryn',
                'kathy',
                'katie',
                'katrin',
                'katrina',
                'katya',
                'kayla',
                'kaylee',
                'kelli',
                'kellie',
                'kelly',
                'kelsey',
                'kendall',
                'kendra',
                'kennedy',
                'kerri',
                'kerry',
                'khloe',
                'kiara',
                'kimberly',
                'kinsley',
                'kira',
                'kirsten',
                'krista',
                'kristen',
                'kristi',
                'kristie',
                'kristin',
                'kristina',
                'kristine',
                'kristy',
                'krystal',
                'kseniya',
                'kylee',
                'kylie',
                'lacey',
                'laila',
                'lana',
                'lara',
                'larissa',
                'latasha',
                'latoya',
                'laura',
                'lauren',
                'laurie',
                'layla',
                'lea',
                'leah',
                'leilani',
                'lena',
                'leslie',
                'lia',
                'lidia',
                'lila',
                'lili',
                'liliana',
                'lillian',
                'lilly',
                'lily',
                'lina',
                'linda',
                'lindsay',
                'lindsey',
                'lisa',
                'liz',
                'liza',
                'londyn',
                'lorena',
                'loretta',
                'lori',
                'lorraine',
                'louise',
                'lucia',
                'lucie',
                'lucy',
                'luisa',
                'luna',
                'luz',
                'lydia',
                'lyla',
                'lynn',
                'mackenzie',
                'madeline',
                'madelyn',
                'madina',
                'madison',
                'magda',
                'magdalena',
                'maja',
                'makayla',
                'makenzie',
                'mallory',
                'mandy',
                'manon',
                'mara',
                'marcia',
                'margaret',
                'margareta',
                'mari',
                'maria',
                'mariah',
                'mariana',
                'marianne',
                'marie',
                'marilyn',
                'marisa',
                'marissa',
                'mariya',
                'marta',
                'martha',
                'martina',
                'mary',
                'maureen',
                'maya',
                'mckenzie',
                'meagan',
                'megan',
                'meghan',
                'melanie',
                'melinda',
                'melissa',
                'melody',
                'meredith',
                'mia',
                'michaela',
                'michele',
                'michelle',
                'mikayla',
                'mila',
                'milena',
                'mindy',
                'mira',
                'miranda',
                'miriam',
                'misty',
                'molly',
                'mona',
                'monica',
                'monika',
                'monique',
                'morgan',
                'mya',
                'nadia',
                'nadine',
                'nancy',
                'naomi',
                'natalia',
                'natalie',
                'natasha',
                'nathalie',
                'nel',
                'nevaeh',
                'nichole',
                'nicola',
                'nicole',
                'niels',
                'nika',
                'nikola',
                'nina',
                'nino',
                'noemi',
                'noor',
                'nora',
                'norah',
                'norma',
                'olga',
                'olivia',
                'paige',
                'paisley',
                'pam',
                'pamela',
                'patricia',
                'patty',
                'paula',
                'paulina',
                'pauline',
                'payton',
                'peggy',
                'penelope',
                'petra',
                'peyton',
                'phyllis',
                'piper',
                'polina',
                'priscilla',
                'quinn',
                'rachael',
                'rachel',
                'raquel',
                'reagan',
                'rebecca',
                'rebekah',
                'reese',
                'regina',
                'rene',
                'renee',
                'rhonda',
                'riley',
                'rita',
                'roberta',
                'robin',
                'robyn',
                'rosalie',
                'ruby',
                'rut',
                'ruth',
                'rylee',
                'ryleigh',
                'sabine',
                'sabrina',
                'sadie',
                'saga',
                'sally',
                'samantha',
                'sandra',
                'sandy',
                'sara',
                'sarah',
                'savannah',
                'scarlett',
                'selena',
                'serenity',
                'shannon',
                'shari',
                'sharon',
                'shawna',
                'sheena',
                'sheila',
                'shelby',
                'shelia',
                'shelley',
                'shelly',
                'sheri',
                'sherri',
                'sherry',
                'sheryl',
                'shirley',
                'sienna',
                'simona',
                'skylar',
                'sofia',
                'sonia',
                'sonja',
                'sonya',
                'sophia',
                'sophie',
                'stacey',
                'stacie',
                'stacy',
                'stefanie',
                'stella',
                'stephanie',
                'sue',
                'summer',
                'susan',
                'susanne',
                'suzanne',
                'svetlana',
                'sydney',
                'sylvia',
                'tabitha',
                'tamara',
                'tami',
                'tammie',
                'tammy',
                'tanya',
                'tara',
                'tasha',
                'tatiana',
                'tatyana',
                'teresa',
                'terri',
                'terry',
                'theresa',
                'tiffany',
                'tina',
                'toni',
                'tonya',
                'tracey',
                'traci',
                'tracie',
                'tracy',
                'tricia',
                'trinity',
                'valentina',
                'valeria',
                'valerie',
                'vanessa',
                'veronica',
                'veronika',
                'vicki',
                'vickie',
                'victoria',
                'viktoria',
                'viola',
                'vivian',
                'wanda',
                'wendy',
                'whitney',
                'ximena',
                'xinyi',
                'yan',
                'yesenia',
                'yolanda',
                'yulia',
                'yvette',
                'yvonne',
                'zoe',
                'zoey',
                'анастасия',
                'анна',
                'весна',
                'екатерина',
                'елена',
                'ирина',
                'мария',
                'наталья',
                'ольга',
                'татьяна',
            ];
        }

        return popNames[randBetween(0, popNames.length - 1)];
    }

}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log(
        "Status " + getCompletion() + "% (ct:" + count + ") (doc ht:" + $(document).height() + ")"
        + " (days: " + currentDaysAgo.toFixed(1) + ")"
        + " (moreToDo: " + moreToDo + ")"
        + " (outstand: " + outstandingRequests.size + ")"
    );
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    console.log("Error count: " + errorCount);
    d = new Date();
    console.log("Done at " + d + ".");
    end = (new Date()).getTime() - startTime;
    console.log("Ran for " + Math.round(end / 60000) + " minutes.");
    if (TRACK_TAGS) {
        commonTags.show("Tags");
    }
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

function sleeping(ms) {
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
            moreToDo = false;
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
                //moreToDo = false;
                //errored = true;
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
            if (count <= MAX_TAGS_TO_SHOW) {
                console.log(k + ": " + v);
            }
        });
    };
}

var goodCats = [5, 8, 9, 11, 12, 13, 18, 20, 21, 22, 26, 27, 29, 30];
if (SEARCH_MODE == SEARCH_MODE_NATURE) {
    goodCats = [5, 8, 11, 12, 13, 18, 22, 29];
}
/*
var cat = [];
cat[0] = 'Uncategorized';
cat[1] = 'Celebrities';
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
cat[2] = 'Film';
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
cat[3] = 'Journalism';
cat[30] = 'Night';
cat[5] = 'Black and White';
cat[6] = 'Still Life';
cat[7] = 'People';
cat[8] = 'Landscapes';
cat[9] = 'City &amp; Architecture';
*/

function getNames() {
    return [
        'abbie',
        'abigail',
        'abril',
        'ada',
        'adel',
        'adela',
        'adele',
        'adrianna',
        'adrienn',
        'adrienne',
        'agata',
        'agnes',
        'agneta',
        'agnieszka',
        'agustina',
        'aimee',
        'aina',
        'aino',
        'alba',
        'aleksandra',
        'alesia',
        'alessandra',
        'alessia',
        'alexa',
        'alexandra',
        'alexis',
        'alice',
        'alicia',
        'alicja',
        'alina',
        'alisa',
        'alise',
        'alisha',
        'alison',
        'aliz',
        'allison',
        'alma',
        'alva',
        'alysha',
        'alyssa',
        'amaia',
        'amanda',
        'amber',
        'amelia',
        'amelie',
        'amina',
        'amira',
        'amy',
        'ana',
        'ananya',
        'anastasia',
        'anastasija',
        'anastasiya',
        'anastazja',
        'anaya',
        'andrea',
        'andreea',
        'ane',
        'anett',
        'anette',
        'angel',
        'angela',
        'angelica',
        'angelina',
        'angeline',
        'ani',
        'ania',
        'anita',
        'anja',
        'anjelika',
        'ann',
        'ann-christin',
        'ann-marie',
        'anna',
        'annabella',
        'annalisa',
        'anne',
        'anneli',
        'anni',
        'annika',
        'antonella',
        'antonia',
        'antonina',
        'aoife',
        'april',
        'aria',
        'ariana',
        'arina',
        'asa',
        'ashlee',
        'ashleigh',
        'astrid',
        'audrey',
        'aurelia',
        'aurora',
        'autumn',
        'ava',
        'avni',
        'aya',
        'ayan',
        'aylin',
        'ayse',
        'aysel',
        'azra',
        'barb',
        'barbara',
        'barbora',
        'beatrice',
        'beatriz',
        'bella',
        'berit',
        'beth',
        'bethany',
        'betty',
        'beverly',
        'bianka',
        'biljana',
        'birgit',
        'birgitta',
        'blanca',
        'blanka',
        'boglarka',
        'brandi',
        'brandy',
        'brenda',
        'brianna',
        'bridget',
        'britt',
        'brittany',
        'brittney',
        'brooke',
        'busra',
        'caitlin',
        'camila',
        'camilla',
        'camille',
        'candace',
        'candice',
        'carina',
        'carita',
        'carla',
        'carlota',
        'carol',
        'carolin',
        'carolina',
        'caroline',
        'carolyn',
        'carrie',
        'casey',
        'cassandra',
        'cassie',
        'catalina',
        'catherine',
        'cathleen',
        'cathy',
        'cecilia',
        'celine',
        'charlotte',
        'chelsea',
        'cheryl',
        'chiara',
        'chloe',
        'christi',
        'christiane',
        'christina',
        'christine',
        'christy',
        'cindy',
        'clara',
        'claudia',
        'colleen',
        'concepcion',
        'courtney',
        'cristina',
        'crystal',
        'cynthia',
        'dagmara',
        'daisy',
        'dalma',
        'dana',
        'daniela',
        'danielle',
        'daria',
        'darina',
        'dariya',
        'darya',
        'dawn',
        'dawna',
        'deanna',
        'deborah',
        'debra',
        'denise',
        'desiree',
        'diana',
        'diane',
        'dimitra',
        'diya',
        'dominika',
        'dominique',
        'donna',
        'dora',
        'dorina',
        'doris',
        'dorka',
        'dorota',
        'dorothy',
        'dorottya',
        'dragana',
        'dulce',
        'dunja',
        'ebba',
        'ebony',
        'ecrin',
        'edel',
        'edina',
        'edith',
        'eduarda',
        'ela',
        'elen',
        'elena',
        'eleni',
        'elif',
        'elin',
        'elisa',
        'elisabeth',
        'elise',
        'eliska',
        'eliza',
        'elizabeth',
        'elizaveta',
        'ella',
        'ellen',
        'elli',
        'elsa',
        'ema',
        'emelie',
        'emely',
        'emese',
        'emilia',
        'emilie',
        'emilija',
        'emily',
        'emina',
        'emine',
        'emma',
        'eniko',
        'erica',
        'erika',
        'erin',
        'esma',
        'esra',
        'esther',
        'eszter',
        'eva',
        'evelina',
        'evelyn',
        'evgeniya',
        'evi',
        'evie',
        'ewa',
        'fabienne',
        'fanni',
        'fatemeh',
        'fatima',
        'fatma',
        'felicia',
        'fernanda',
        'fien',
        'fiona',
        'flora',
        'florence',
        'florencia',
        'frances',
        'franzi',
        'franziska',
        'freja',
        'frida',
        'gabija',
        'gabriela',
        'gabriella',
        'gabrielle',
        'gail',
        'georgia',
        'gina',
        'giorgia',
        'giulia',
        'gloria',
        'gogo',
        'gordana',
        'grace',
        'greta',
        'gun',
        'hana',
        'hanga',
        'hanna',
        'hannah',
        'hatice',
        'heather',
        'hedi',
        'heidi',
        'hekla',
        'helen',
        'helena',
        'helmi',
        'heloisa',
        'holly',
        'ida',
        'iga',
        'ilina',
        'ina',
        'ines',
        'inga',
        'ingeborg',
        'inger',
        'ingrid',
        'inna',
        'ioana',
        'ioanna',
        'irati',
        'irem',
        'irene',
        'irina',
        'isabel',
        'isabella',
        'isabelle',
        'isidora',
        'isla',
        'islande',
        'ivana',
        'iwona',
        'izabela',
        'izabella',
        'jaclyn',
        'jacqueline',
        'jada',
        'jade',
        'jagoda',
        'jana',
        'jane',
        'janet',
        'janice',
        'janina',
        'janine',
        'janis',
        'janka',
        'jasmin',
        'jasmine',
        'jazmin',
        'jeannette',
        'jelena',
        'jenna',
        'jennifer',
        'jenny',
        'jessica',
        'jie',
        'jill',
        'jillian',
        'jing',
        'joan',
        'joanna',
        'johanna',
        'josefa',
        'josefine',
        'jovana',
        'joyce',
        'judith',
        'judy',
        'jule',
        'julia',
        'juliana',
        'julianne',
        'julie',
        'julieta',
        'juliette',
        'julita',
        'june',
        'justyna',
        'kaja',
        'kalina',
        'kamila',
        'kamile',
        'kamilla',
        'kara',
        'karen',
        'kari',
        'karin',
        'karina',
        'karolina',
        'kasia',
        'kata',
        'katalin',
        'katarina',
        'katarzyna',
        'kate',
        'katelyn',
        'katerina',
        'katharina',
        'katherine',
        'kathi',
        'kathleen',
        'kathrin',
        'kathryn',
        'katia',
        'katie',
        'katja',
        'katrin',
        'katrina',
        'katya',
        'kavya',
        'kayla',
        'kelli',
        'kelsey',
        'kendra',
        'kerstin',
        'khadija',
        'khrystyna',
        'kiara',
        'kim',
        'kimber',
        'kimberly',
        'kinga',
        'kira',
        'kitti',
        'kjersti',
        'klara',
        'klaudia',
        'konstantina',
        'kornelia',
        'krista',
        'kristen',
        'kristi',
        'kristin',
        'kristina',
        'kristine',
        'kristy',
        'kristyna',
        'krisztina',
        'krystal',
        'kseniya',
        'kubra',
        '​lacey',
        'laia',
        'lana',
        'lara',
        'larissa',
        'latoya',
        'laura',
        'lauren',
        'lea',
        'leah',
        'leandra',
        'leia',
        'leila',
        'lejla',
        'lena',
        'lenna',
        'leoni',
        'leonie',
        'leonor',
        'leslie',
        'leticia',
        'leyla',
        'li',
        'lia',
        'lidia',
        'liepa',
        'liisa',
        'lili',
        'liliana',
        'lilja',
        'lilla',
        'lillian',
        'lilly',
        'lily',
        'lina',
        'linda',
        'lindsay',
        'lindsey',
        'linnea',
        'lisa',
        'lisbeth',
        'livia',
        'liz',
        'liza',
        'lizzy',
        'ljiljana',
        'lore',
        'lorena',
        'lori',
        'lotte',
        'lotti',
        'louisa',
        'louise',
        'lucia',
        'luciana',
        'lucie',
        'lucija',
        'lucy',
        'luisa',
        'luiza',
        'luz',
        'ly',
        'mabel',
        'madeleine',
        'madina',
        'madison',
        'magda',
        'magdalena',
        'maite',
        'maj',
        'maja',
        'malak',
        'malen',
        'malgorzata',
        'malin',
        'mallory',
        'malwina',
        'manon',
        'mara',
        'marcelina',
        'marcia',
        'margaret',
        'margareta',
        'margarida',
        'margret',
        'mari',
        'maria',
        'mariah',
        'mariam',
        'mariana',
        'marianna',
        'marianne',
        'marie',
        'marija',
        'marijana',
        'marika',
        'marilyn',
        'marissa',
        'mariya',
        'marlena',
        'marta',
        'martha',
        'martina',
        'martine',
        'martyna',
        'mary',
        'marya',
        'maryam',
        'masa',
        'matilda',
        'matilde',
        'maureen',
        'maya',
        'meagan',
        'megan',
        'meghan',
        'melania',
        'melanie',
        'melina',
        'melinda',
        'melisa',
        'melissa',
        'meredith',
        'merle',
        'merve',
        'meryem',
        'mia',
        'micaela',
        'michaela',
        'michalina',
        'michela',
        'michele',
        'michelle',
        'mikaela',
        'mila',
        'milagros',
        'milana',
        'milena',
        'milica',
        'mira',
        'miranda',
        'mirella',
        'miriam',
        'mirjana',
        'misty',
        'molly',
        'mona',
        'monica',
        'monika',
        'monique',
        'morgan',
        'myra',
        'nadia',
        'nadine',
        'nadja',
        'nancy',
        'natalia',
        'natalie',
        'natasa',
        'natascha',
        'natasha',
        'nathalie',
        'nehir',
        'nel',
        'nela',
        'nele',
        'nia',
        'nichole',
        'nicola',
        'nicole',
        'niels',
        'nika',
        'nikol',
        'nikola',
        'nina',
        'nino',
        'noa',
        'noemi',
        'noor',
        'nora',
        'nour',
        'nuray',
        'olga',
        'olivia',
        'oliwia',
        'pamela',
        'panna',
        'pari',
        'patricia',
        'patrycja',
        'paula',
        'paulina',
        'pauline',
        'peggy',
        'petra',
        'pia',
        'polina',
        'priscilla',
        'rachael',
        'rachel',
        'ramona',
        'raquel',
        'raya',
        'rebecca',
        'rebecka',
        'rebeka',
        'rebekah',
        'regina',
        'reka',
        'rene',
        'renee',
        'rita',
        'riya',
        'ro',
        'roghayyeh',
        'roksana',
        'ronja',
        'rosalie',
        'rose',
        'roza',
        'rozalia',
        'ruby',
        'rut',
        'ruth',
        'sabine',
        'sabrina',
        'saga',
        'salome',
        'samantha',
        'sandra',
        'sara',
        'sarah',
        'sevda',
        'shanna',
        'shannon',
        'sharon',
        'sheena',
        'sherri',
        'sherry',
        'shira',
        'shirley',
        'sienna',
        'simona',
        'sina',
        'siv',
        'sofia',
        'sofie',
        'sofija',
        'sofiya',
        'sofya',
        'sonia',
        'sonja',
        'sophia',
        'sophie',
        'stacey',
        'stacy',
        'stefanie',
        'steffi',
        'stella',
        'stephanie',
        'sue',
        'sultan',
        'susan',
        'susanne',
        'suzana',
        'svenja',
        'svetlana',
        'tabitha',
        'talia',
        'tamar',
        'tamara',
        'tammy',
        'tamy',
        'tanaka',
        'tanya',
        'tara',
        'tasha',
        'tatiana',
        'tatyana',
        'teodora',
        'teresa',
        'tereza',
        'tess',
        'tetyana',
        'theresa',
        'therese',
        'tiffany',
        'timea',
        'tina',
        'tingting',
        'tonya',
        'tracy',
        'ugne',
        'ulla',
        'ulrika',
        'urszula',
        'valentina',
        'valeria',
        'valerie',
        'vanda',
        'vanessa',
        'vasiliki',
        'vaso',
        'verena',
        'veronica',
        'veronika',
        'veronique',
        'vesna',
        'victoria',
        'victory',
        'viktoria',
        'viktorija',
        'viktoriya',
        'viola',
        'violeta',
        'virag',
        'virginia',
        'vivien',
        'wendy',
        'weronika',
        'whitney',
        'wiktoria',
        'wilma',
        'xenia',
        'xiaomei',
        'ximena',
        'xinyi',
        'yael',
        'yagmur',
        'yan',
        'yasmine',
        'yekaterina',
        'yelena',
        'ying',
        'yoana',
        'yulia',
        'yvonne',
        'zahra',
        'zala',
        'zehra',
        'zeinab',
        'zeynep',
        'zita',
        'zoe',
        'zoey',
        'zofia',
        'zsofia',
        'zuzanna',
        'александра',
        'алиса',
        'анастасия',
        'анна',
        'весна',
        'виктория',
        'дарья',
        'екатерина',
        'елена',
        'елизавета',
        'ирина',
        'мария',
        'маша',
        'наталья',
        'ольга',
        'полина',
        'снежана',
        'софия',
        'софья',
        'татьяна',
        'ульяна',
    ];

}

const BASIC_KEYWORDS = [
    'abandoned',
    'animal',
    'apricot',
    'architecture',
    'azure',
    'b/w',
    'baby',
    'bark',
    'beach',
    'beautiful',
    'beauty',
    'beauty in nature',
    'beige',
    'black',
    'black and white',
    'blue',
    'blue hour',
    'bologna',
    'brown',
    'close-up',
    'clouds',
    'column',
    'd810',
    'day',
    'decoration',
    'dew',
    'eagle',
    'exploration',
    'fall',
    'flower',
    'food',
    'forest',
    'forgotten',
    'fresh',
    'frost',
    'gold',
    'golden hour',
    'góry',
    'green',
    'grey',
    'indigo',
    'italy',
    'ivory',
    'krajobraz',
    'lake',
    'landscape',
    'landskap',
    'lantern',
    'lichtgespiele',
    'lifestyles',
    'light',
    'lightning',
    'lime',
    'lizard',
    'lost place',
    'macro',
    'magenta',
    'maroon',
    'meadow',
    'micro',
    'mountain',
    'natural light',
    'nature',
    'navy',
    'no people',
    'ocean',
    'ochre',
    'old',
    'olive',
    'one person',
    'orange',
    'ornament',
    'outdoors',
    'owl',
    'paysage',
    'peaceful',
    'peach',
    'people',
    'pink',
    'plum',
    'polska',
    'purple',
    'red',
    'reflection',
    'retro',
    'river',
    'rustic',
    'scenic',
    'sculpture',
    'sea',
    'seat',
    'serene',
    'silver',
    'sky',
    'snowflake',
    'summer',
    'sun',
    'sunrise',
    'sunset',
    'table',
    'teal',
    'tranquil',
    'tranquil scene',
    'tranquility',
    'travel',
    'turquoise',
    'urban',
    'urbex',
    'vintage',
    'violet',
    'water',
    'wbpa',
    'white',
    'winter',
    'wood',
    'wooden',
    'wrinkles',
    'yellow',
    'девушка',
    'портрет',
    '中国',
    '富士山',
    '摄影',
    '旅行',
    '日本',
    '日落',
    '景观',
    '自然',
    '风光',
    '风景',
];
