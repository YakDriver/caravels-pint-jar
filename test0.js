// combines original approach / fresh try
const MAX_ERRORS = 20;
const MAX_TRIGGERS = 3000;
const STATUS_EVERY = 20000;
const POST_TRIGGER_MILLIS = 750;
const LOAD_STALLED_AFTER = 20000;
const MIN_SHORT_SIDE = 1346;
const ERROR_SLEEP = 15000;
const VERBOSE = false;
const EXTRA_DELAY = 1500;

var timePerTab = [1, 2, 4, 1];
//var tab = randBetween(0, 3);
var tab = 0;

var count = 0;
var countPerTab = [0, 0, 0, 0];
var errorCount = 0;
var errored = false;
var quit = false;
var millis = (new Date()).getTime();
var averageShorts = [];
var justLoaded = true;
var empty = false;
var endTime = 0;
var masterIndex = 0;
var startTime = (new Date()).getTime();
var popMenu = randBetween(0, 1);

controlCentral();

async function controlCentral() {
    start();
    masterIndex = 0;
    while (!quit) {
        await switchingTab();
        endTime = (new Date()).getTime() + (timePerTab[tab] * 60 * 1000);
        let menuDivisions = (tab == 0) ? 4 : ((tab == 3) ? 0.005 : 2);
        let nextMenuChange = getNextMenuTime(menuDivisions);
        while (!quit && (new Date()).getTime() < endTime) {
            await doing();

            let now = (new Date()).getTime();
            if (now > (millis + STATUS_EVERY)) {
                showStatus();
                millis = now;
            }

            if (errored) {
                errored = false;
                await sleeping(ERROR_SLEEP);
            }

            if (count >= MAX_TRIGGERS || errorCount >= MAX_ERRORS) {
                quit = true;
            }

            if ((new Date()).getTime() >= nextMenuChange) {
                nextMenuChange = getNextMenuTime(menuDivisions);
                empty = false;
                await doingMenu();
                masterIndex = 0;
            } else if (empty) {
                empty = false;
                let numScrolls = tab == 3 ? randBetween(2, 5) : randBetween(1, 4);
                numScrolls = 1;
                await scrolling(numScrolls);
            }
        }
    }
    end();
}

async function doing() {
    if (quit) {
        return Promise.resolve('quitting');
    }

    let delay = 500 + EXTRA_DELAY;
    if (justLoaded) {
        justLoaded = false;
        delay = 3000 + EXTRA_DELAY + Math.floor(($(document).height() / 150000) * 1000);
    }
    await sleeping(delay);

    let e = $("div.photo_thumbnail:not(.nsfw_placeholder):eq(" + masterIndex + ")");

    let av = e.find("a.avatar:not(" + BLACKLIST_SELECTOR + ")");
    let but = e.find("a.button.new_fav");

    if (!success(e)) {
        console.log("Nothing found! (mi " + masterIndex + " not found)");
        empty = true;
    } else {
        analyzeShort(e);

        masterIndex++;
        if (but && !but.hasClass("hearted") && av && av.length > 0 && (tab != 2 || bigEnough(e))) {
            but.trigger("click");
            count++;
            countPerTab[tab]++;
        } else if (VERBOSE) {
            let notSelectedBecause = "";
            if (!but) {
                notSelectedBecause += "!but -";
            }
            if (but && but.hasClass("hearted")) {
                notSelectedBecause += "hearted -";
            }
            if (!av) {
                notSelectedBecause += "!av -";
            }
            if (av && av.length == 0) {
                notSelectedBecause += "av0 -";
            }
            if (tab == 2 && !bigEnough(e)) {
                notSelectedBecause += "!big -";
            }
            if (notSelectedBecause == "") {
                notSelectedBecause = "NO GOOD REASON";
            }
            console.log("Not selected because: " + notSelectedBecause);
        }
    }
    e = null; av = null; but = null;
}

async function comment(e) {
    // not working
    lnk = e.find("a.photo_link");
    lnk.trigger("click");

    await sleeping(2000);
    window.scrollTo(0, 2283);

    t = $("div.react_photos_index_container");
    ta = t.find("textarea.ant-input");

    ev = jQuery.Event("keypress");
    ev.which = 66; // # Some key code value

    ta.click();

    // 1. focus
    ta.focus();

    ta.val("Beautiful");

    // 2. keydown
    ta.keydown(ev);

    // 3. keypress
    ta.keypress(ev);

    // 4. change
    ta.change();

    // 5. blur
    ta.blur();

    await sleeping(300);

    butter = $("a[class^=StyledButton__Button]");
    butter.removeAttr("disabled");
    //butter.unbind("click");
    //butter.removeProp("disabled");
    //butter.prop('disabled', false);
    //butter.attr("data-id", "photo-comment");

    butter.trigger("click");


    ////////////

    lnk = e.find("a.photo_link");
    lnk.trigger("click");

    t = $("div.react_photos_index_container");
    ta = t.find("textarea");

    ta
        .trigger("click")
        .trigger("focus");

    ta.trigger("mouseenter");
    ta.trigger("mouseover");
    ta.trigger("mousedown");
    ta.trigger("keydown");
    ta.trigger("keypress");
    ta.trigger("keyup");
    ta.val("Beautiful");
    butter = $("a[class^=StyledButton__Button]");
    butter.removeAttr("disabled");
    //butter.unbind("click");
    //butter.removeProp("disabled");
    //butter.prop('disabled', false);
    //butter.attr("data-id", "photo-comment");

    butter.trigger("click");

    ta.trigger("mousedown");
    ta.trigger("mouseenter");
    ta.trigger("mouseover");
    ta.trigger("click");
    ta.trigger("focus");
    ta.trigger("focusin");
    ta.trigger("keydown");
    ta.trigger("keypress");




    ev = jQuery.Event("keydown");
    ev.which = 50; // # Some key code value
    ta.trigger(e);

    $(".Elements__CommentInputWrapper-sc-1e3xy9t-18").click(function () {
        $('*').each(function () {
            if ($(this).text() && $(this).text() == "Comment") {
                console.log($(this));
            }
        });
    });

    $("form").each(function () {
        $(this).find('textarea') //<-- Should return all input elements in that specific form.
    });
}


function getNextMenuTime(menuDivisions) {
    return (new Date()).getTime() + Math.floor((timePerTab[tab] * 60 * 1000) / menuDivisions) + 500;
}

function bigEnough(e) {
    g = e.find("img");
    h = g.attr("height");
    w = g.attr("width");
    if (Math.min(h, w) > MIN_SHORT_SIDE) {
        return true;
    }
    return false;
}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log(
        "Status " + getCompletion() + "% (" + count + ") (tab: "
        + tab + ") (time left: " + Math.round((endTime - (new Date()).getTime()) / 1000)
        + "s) (doc ht:" + $(document).height() + ") "
        + "(mi: " + masterIndex + ")");
}

function start() {
    var d = new Date();
    console.log("Beginning at " + d + "...");
    console.log("Attempting to get " + MAX_TRIGGERS);
}

function end() {
    console.log("Completed " + count + " out of " + MAX_TRIGGERS + " (" + getCompletion() + "%)");
    for (i = 0; i < countPerTab.length; i++) {
        console.log("Tab " + i + ": " + countPerTab[i]);
    }
    console.log("Error count: " + errorCount);
    d = new Date();
    console.log("Done at " + d + ".");
    end = (new Date()).getTime() - startTime;
    console.log("Ran for " + Math.round(end / 60000) + " minutes.");
}

function randBetween(low, high) {
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
            $("ul.px_tabs li:eq((tab + 1) % 3) a").trigger("click");
            await sleeping(3000);
            $("ul.px_tabs li:eq(tab) a").trigger("click");
            await sleeping(5000);
            break;
        }
    }
}

async function scrolling(skrols = 3) {
    console.log("Scrolling " + skrols + "...");
    for (i = 0; i < skrols && !quit; i++) {
        await loading();
        window.scrollTo(0, $(document).height() * 2);
        await loading();
    }
    justLoaded = true;
}

async function doingMenu() {
    // menus 0=2x2;1=2;2=2;3=0
    switch (tab) {
        case 0:
            if (popMenu == 0) {
                menu = "followers";
            } else {
                menu = "sort";
            }
            popMenu = (popMenu + 1) % 2;
            break;
        case 1:
        case 2:
            menu = "followers";
            break;
        case 3:
            menu = null;
            console.log("No menu change possible");
            break;
    }

    if (menu) {
        console.log("Changing menu: " + menu);
        await loading();
        e = $("div.discovery_" + menu + "__target").trigger("click");
        s = success(e); e = null;
        if (s) {
            await sleeping(1500);
            f = $("div." + menu + "_options ul li a:not(.selected)").trigger("click");
            if (success(f)) {
                await loading();
            }
            f = null;
        }
        justLoaded = true;
    }
}

async function switchingTab() {
    oldTab = tab;
    tab = (tab + 1) % 4;
    console.log("Switching tabs (" + oldTab + "->" + tab + ")...");

    await loading();
    e = $("ul.px_tabs li:eq(" + tab + ") a").trigger("click");
    e = null;
    await loading();

    justLoaded = true;
}

$(function () {
    //setup ajax error handling
    $.ajaxSetup({
        error: function (x, status, error) {
            errorCount++;
            if (x.status == 403) {
                console.log("--> 403 error"); //specific error
                errored = true;
            } else if (x.status == 0) {
                console.log("Zero error??");
            } else {
                console.log(x.status + " error, status: " + status); //general error
                errored = true;
            }
        }
    });
});

function getBlacklistSelector() {
    var blacklist = ['_geneoryx', '_keane_', '_marvellous_77', '1102', '12twomodeling', '1306', '19081969', '2008sever', '2448541543', '309966388', '3doorsofsun', '451053852', '4ecea5d184d6f984e17e08a4211858371', '4eleven', '500px1929', '5500_kelvin', '635139268', '652018fc84760898be087ed8efc754638', '770112380', '79112663320', '843029175', '883photos', '89205537525', '9a56fd72441bfb8585ab733060c868064', 'aboutrecht', 'acondequ', 'adaggio', 'adelmaghsoudi', 'adidas77', 'adolfogosalvez', 'adyphotography', 'aedawn', 'af_digiarts', 'afa-shots', 'afgnbg', 'afps3021', 'agnieszkapretki1', 'ahmadmondphoto', 'ahmed-m-91', 'ahowc', 'air_cover_lax', 'akanistudio', 'albanoduarte', 'albertlesnoy', 'albertoortizfotografo', 'alcot', 'aleksandermargolin', 'aleksandrsfjodorovs', 'alekseyburcev13', 'alessandrodalex', 'alessandrofabbriartist', 'alessandroguidifotografo', 'alex_borisov', 'alexanderbessheynov', 'alexanderkirkov', 'alexanderkphotography', 'alexandrivanov12', 'alexandruzdrobau', 'alexbasov', 'alexdarash', 'alexeibazdarev', 'alexey54', 'alexfetter', 'alexk', 'alincms', 'alipazani', 'allakorg', 'allden', 'alonso91', 'alpcem', 'alplata', 'amandadiaz', 'amirmohammadjafari', 'amusial', 'an_gi', 'analuar', 'anatolybolkov', 'andcar', 'andix_photography', 'andrea_and_more', 'andreaaccordino', 'andreaberengan', 'andreabltr', 'andreamassarenti', 'andreduartecamilo', 'andrew_chemerys', 'andrewcmphotography', 'andrewess', 'andreybrandis', 'andreyguryanov1', 'andreykaluga85', 'andriusstanknas', 'andyf_photo', 'anka_zhuravleva', 'annakurzawska', 'annalogue', 'annamariahalldors', 'annashuv', 'annehoffmann', 'anthonybyron', 'antoinelewisgraphix', 'antolozazd', 'antoniodelgado246', 'antoniogirlando', 'antonioserini', 'antonmakarov81', 'antonrothmund', 'antoshina_t', 'antvap', 'aphonie', 'apolloreyes', 'aragorn1278', 'archstratic', 'arielgrabowsky', 'art_urs', 'art-gvozdkov', 'artem_stisovyak', 'artemmostovoy', 'artigianodellaluce00', 'artmadi', 'artyushin', 'asifoto7', 'astrapopwally', 'atapin', 'atypiique', 'aubry_lionel', 'averyanovkirill', 'avlight', 'aykutsevinc', 'aysunpeker06', 'bahaamonzer', 'bajofo', 'balenkod', 'balonny', 'banzaroli', 'barbera', 'baron_barbaron', 'barriespence', 'bauer_pics', 'bazarov_photography', 'bc_photo', 'be_photography', 'bebesa', 'belapho', 'belovodchenko', 'benjaminsurinphotographe', 'berlinimages', 'bernardez', 'bernardpitet', 'berthelotlouis', 'biancakoennecke', 'bigcityfotografie', 'biocity_monte', 'black-box-pictures', 'blackacephotography', 'blackflashphoto', 'blaskojan', 'blessedeto', 'blgdsgn', 'bloxsphoto', 'bo-agency', 'bobby_chi', 'bolfova', 'borislavgeorgiev', 'boudoir-photographer', 'boudoirpassion', 'boyan_kostov', 'bpdq69', 'brandonwitzel', 'bree-lynnmistol', 'brenczyk', 'bruno-birkhofer', 'bruslan', 'bulinkov', 'bunskiphotography', 'burgeroto', 'buzdorphotography', 'byfab', 'bymarcelomartins', 'calvinsmith', 'camattree', 'campisimarco', 'cangyan', 'carasionut', 'carloscervantes1', 'carloslarretxitapias', 'carlospinoso', 'carrielou', 'casey_harris', 'catapumblamblam', 'cbarnesphotos', 'cedg76', 'cedricchevalier', 'celinerusso', 'cerbii', 'cerfpatrick', 'cesarcruciani1', 'cescglow', 'cezarykotarski', 'chadjweed', 'charlesnevols', 'che_rry', 'cheffe123', 'chinilov', 'chiow', 'chris_bos_photographer', 'chrisbudke', 'christophebillonphotographe', 'christossewell', 'chruse-photography', 'claudechaubo', 'claudio_fotografia', 'claudiobinnellafotografie', 'claudioulrich', 'clvvssypro', 'cmanchisi', 'cobaltbluephoto', 'colbyfiles', 'collinx', 'contatofotografiaparameninas', 'corrichella', 'coyotakpictures', 'crazyshoot', 'crg0107', 'cristian83', 'ctanser', 'cyrilkazian', 'cyrilmax', 'dagotakru', 'dainty555', 'daisy_van_heyden', 'dakicmladen', 'damianoeffe', 'damienmohn', 'danailyadharma', 'dancemovements', 'dani_diamond', 'danial333', 'danieledalcastagne', 'danielrosse', 'danilofacci', 'danishmalik181991', 'dannydouglas64', 'dantelespagnol', 'danydaniel39', 'danyelweideman', 'danylomykhailenko', 'darianesanche', 'dariella', 'darkelfphoto', 'daryakomarova', 'dashamari', 'davekelleyphotography', 'davew_500px', 'david_engel_oficial', 'david_palmer_photography', 'david-foto', 'davidefraserii', 'davidepaltrinieri', 'davidfperezart', 'davidmorgan5', 'davidos00', 'dbater1', 'dbelyaev', 'dbond_photography', 'dcphotografer', 'ddev1', 'deanprestonphotography', 'dearie_works', 'deimons685', 'demiralaymetin', 'denis_fustachenko', 'denis009', 'denisgoncharov', 'deniskin', 'deniskovalenko', 'denispictures', 'designpictures', 'devik666', 'devite', 'dextereal', 'deyvian', 'diananemes98', 'dibrein', 'diegosteffe', 'dieteremil', 'dimasfrolov', 'dimipan1', 'diptychstudio', 'dirkadolphs', 'dirkchristiaens', 'dirkrohra', 'dirtyartsphotography', 'dkphotosparis', 'dmitry_4d', 'dmitry_tsvetkov', 'dmitryarhar', 'dmitrykalashnikov', 'dmitrysn', 'dominiqueseefeldt1', 'donatomerante', 'doreenschttker', 'dorianodisalvo', 'drazentiric', 'drsage', 'dutkair', 'dxfoto', 'ebalin', 'edgardel', 'edgarosmanbeyli125', 'editole', 'ednikityuk', 'edroncal', 'efremovs', 'efreyer', 'egorovstudio', 'eilonfulman', 'ekiwi', 'elcian', 'eliara', 'elisamarcotulli', 'eloza', 'emadmymbd', 'emanuelcorso', 'emanueledibattista1', 'emh1917', 'emkhabibullin', 'emmanuel_esguerra', 'emmanuelgarcia2', 'emmasensual', 'emy_scintilladisole17', 'encorebenoit', 'enriquesantamariacortes', 'epicshoots', 'erajkasadi', 'eremius', 'eric212grapher', 'ericadamgray', 'ericsnyderphoto', 'erikrozman', 'erinapap', 'erinoeventi', 'ernestshapiro', 'erosreflections', 'esguerraster', 'eugene_reno', 'eugenue_chufarov', 'eusebioc34', 'evgeny82', 'evgenypix', 'evgogrigorev1991', 'evorberg', 'evrispap', 'exdrummer', 'fabiencphotographie', 'fabricemeuwissen', 'fabriciogarciaphotography', 'fabrizioliva89', 'falk-fotografie', 'fanciart', 'fankovin', 'farcrystudios', 'fatholahi', 'fdumas94', 'fedorenkoanton', 'fedorovsergeica', 'feelgoodphotography_nc', 'felixrachor', 'ferdolinsky', 'fernancr', 'fetish', 'feuillet', 'fidelcomas', 'filatoff', 'filippodemaio', 'filippovphoto', 'finbar_mad', 'fineartnude', 'fionafoto1', 'fixfocus', 'fl-photostudio', 'flashnmodels', 'flickr5', 'florentbellurot', 'florentbilen', 'fmarjanephotography', 'focaleemotions', 'focuus', 'fondwell', 'foto-schlender', 'foto-werkstatt', 'fotodet', 'fotokrelles', 'fotomik_129', 'fotomod1953', 'fotoshi', 'foxybat', 'fr17aranda', 'francescotiburno', 'francocannistra', 'frankdecker', 'frankdemulder', 'frankenberger', 'fred_photo_insta', 'fred44kreation', 'freddymangelschotsphotography', 'fredhacheve', 'fredyfotografo', 'freedomtophotograph', 'fremersalex', 'fstopguam', 'gaelthill', 'galich_m', 'galinatcivina', 'garciaphotographyberlin', 'gaston1', 'gav_rus', 'ge100', 'gegenlicht13', 'georgepoison', 'georgostsamakdas', 'gerd-hannemann', 'germainconstantin', 'germancanonphotographer', 'getesmart86', 'ghisadavid', 'giacomopazzo', 'gianfrancogiachettiph', 'gianpietrofavaron', 'gibbsoliver81', 'ginebratorres007', 'ginoangeliniph', 'gioacchino', 'giorgiocastis', 'giozac', 'girolamomaurophoto', 'giselabagnoli', 'giulianobedin', 'giuseppecondorelli', 'glamouralaska', 'glauco_meneghelli', 'gomesjuniorphoto', 'goraphotography', 'gorokhov', 'gosdschanfotografie', 'gpbrazzini', 'grahamburke1', 'graziellaphotographie', 'greene0723', 'gregorbusch', 'greyhorse', 'grichardson', 'grom86', 'groovyseby', 'grpozo1', 'guenterstoehr', 'guillermohdz', 'gulich_79', 'gurulee888', 'hakanerenler', 'handogin', 'hansmann', 'haralddessl', 'hardkore', 'hayatbambi0', 'haydein', 'hecho', 'heckmannoleg', 'hellmood', 'helsingphoto', 'hembertphoto1', 'hendrikeckhardt', 'henriette-mielke', 'henriquecesar', 'henry-fineart', 'henryzaidan', 'hichembraiek', 'hillhart06', 'hjfotograf', 'hlnehuet', 'hlportrait', 'hmrodriguez', 'hors_champ', 'horstzieger', 'hubertszamiteit', 'humblejim', 'iamalbertmartinez', 'iamcarla_m', 'iammarciomiranda', 'ianneill', 'ibarraphoto', 'ibericophoto', 'ibry', 'igcimages3', 'igorkondukov', 'igorsmirnoff3', 'igovoronco', 'imipour', 'imwarrior1001', 'inesinabundance', 'info2951', 'info512', 'inconsistencias', 'inyoureye', 'ioannismazis', 'ipistoletov', 'irezumiworldwide', 'iridijussvelnys', 'irishrabbit', 'isbstudios', 'iso52', 'istantifotograficidinophprincipato', 'ivan_platonov', 'ivanobusa', 'ivansheremet969', 'ivanwarhammer', 'ivm888', 'ixpert', 'jacarrasco', 'jacekklucznik', 'jacint', 'jacintguiteras', 'jackfrederic', 'jaclegal', 'jaimerecarte', 'jaja-photographie', 'jakesaxman', 'jakontilphotophobia', 'jakubno', 'jal2014', 'jalineh', 'jamside', 'jan-leicaportrait', 'janhammerstad', 'janis71', 'janisbphotography', 'janmayeroficial', 'janpersson1', 'januszratajek', 'januszv', 'jara1962', 'javi_mirada', 'javier_rodriguez75', 'jayma', 'jbowphoto', 'jdreess', 'jean-louismilliat', 'jean-pierre-shots', 'jeannoir', 'jeffthomasphoto', 'jeffwetltd', 'jehannedechampvallon', 'jensneubauer', 'jensomerfield', 'jeremyrobertphoto', 'jessicadrossin', 'jesusdsimal', 'jfal', 'jfkk', 'jhonvargas', 'jim23', 'jimmypsunshade', 'jisteiger', 'jjnapoleon', 'jlphoto2013', 'jmphotography2323', 'jn-photo', 'jnaldal', 'joachimbergauer', 'joakim_karlsson_photography', 'joamuz', 'jochendressen', 'jockeoscarsson', 'joelgros', 'jogafoto', 'johanamarchandphotographies', 'john-noe', 'johnamm', 'johnny_hendrikx', 'jonathanfrings', 'jop-berlin', 'jordiehennigar', 'jose_rodrigar', 'josecallejon', 'josefhansson', 'josefienhoekstra', 'josesote', 'josevazquez', 'joski', 'joterofotografo04', 'jozefkadela', 'jozefkiss', 'jp-cph', 'jpmaissin', 'jrgenpetersen', 'jsdulosa', 'juancarlosmora', 'juandelros', 'juanmsanchezphotography', 'juanpyfernandez', 'juanrenart', 'jubelia', 'judy_93', 'juliaamshei', 'juliazu', 'juliuspocius', 'jullastres', 'justinroux', 'jvchop', 'kaanaltindal', 'kaieason', 'kajli_istvan', 'kali06photography', 'kalmanart', 'kamilpielkaphotography', 'kamilsvorc', 'karenabramyan', 'kari_fotodesign', 'karlyamashita', 'karstenmueller', 'karstennivaa', 'kasko', 'katarzyna_piela', 'kateamullen', 'katerynagorbanov', 'kazarina', 'kazoncphotographie', 'kcelestine', 'keepu', 'keithfox', 'kenbackius1', 'kennethadelsten', 'kent_photo', 'kerrymoore', 'keurpaul', 'khedron', 'khoanguyenvan09', 'kim8', 'kimfj', 'kimrjohnson', 'kirill_look', 'kitsuyume', 'kjhgfds76543', 'klecksphotography', 'klepikovadaria', 'knipser62', 'kornienko', 'krivitskiy', 'kromauro', 'krystiantokar', 'krzysztofbudych', 'kubagrafie', 'kubamichalski', 'kunddahl01', 'kurtj', 'kuzinph', 'l_n_v', 'lab8', 'ladie', 'laika_arts', 'lanadphotography', 'laureenburton1', 'laurentpayet', 'laurentphoto768', 'lb423studio', 'leannevorster', 'leden1408', 'lefu', 'leif4', 'lelyak', 'lelyamartian', 'leneya', 'lenikoh', 'lennylw', 'lethhansjoerg', 'letographe', 'levinsg', 'levyavner', 'levykin', 'lewitan', 'libertinagestudio', 'libor', 'lichtreize', 'lichtweisend', 'lifingrigoriy', 'ligayolga', 'light_expression_photography', 'lightroomfoto', 'lightsketchstudio', 'lilibondarenko', 'linz550', 'liorkestner', 'lisdefleur', 'livingloud', 'lizzynessietaylor', 'lll06', 'lmw420', 'lookashow', 'lorddryp', 'lorentzenphoto', 'lorenzoviola', 'lorinov', 'lornakijurko', 'louisloizidesmitsu', 'lowestdp', 'lucafoscili', 'lucasantorophotography', 'lucasmontifoto', 'luciananca79la90', 'lucianodarochacavalcanti', 'lucyivanova', 'luisgasconphotography', 'luispante', 'lukgorka', 'lukhrubo', 'm_m', 'm-hajjar-photography', 'mackowiakart', 'mackray', 'mageko', 'malkija', 'manbos', 'mandityizabella', 'manfredbaumannofficial', 'manuel19precog', 'manuelkern', 'marcdufour1', 'marcelgallaun', 'marceloperezlopez', 'marceltesch', 'marcin_k', 'marcinczornyjkauza', 'marcinhouse', 'marckospauloluiz', 'marckusmilo', 'marco_pesce', 'marco-hamacher-photography', 'marcopetroiphotographer', 'marcosgarzo', 'marcosquassina', 'marcotonetti', 'marek_newton', 'marekbodzioch', 'marinatomasi1', 'mariopasko', 'mariotofino', 'mariposa-fa', 'markprinzphotography', 'markriedy1', 'markus-hertzsch', 'markushuber14', 'marossi', 'marseillea71', 'martakucharska', 'marticocelli', 'martinfjovtek', 'martinwieland', 'marvalphoto', 'mascarad', 'massimilianodistante1', 'massimilianouccelletti', 'massimoleone68', 'massimomaxcapannelli', 'massimozanella', 'mastermedia567', 'matrobinsonphoto', 'matteoconti', 'matteosergo', 'mauriciobenitez', 'mauriziopretto', 'maurosaranga', 'mawebph', 'max_makarov', 'max0965', 'maxiboehmphotos', 'maxpugovkin', 'maxwell61', 'mazurekphotography', 'mcavka', 'mdphotographer', 'megamegalex', 'megonza31', 'mektor1k', 'melanie_g', 'melefara', 'melfio', 'mercedescs', 'meshphotography', 'metthey', 'mgdrawin', 'mgfoxfireimages', 'mhjreiter1968', 'mhpmodels19', 'micak-nude', 'michael_thagaard', 'michaelbaganz', 'michaelfalkner', 'michaelfaust', 'michaelgilg', 'michaelmahy', 'michal_j', 'michalmach', 'michel-e', 'micheldes', 'michelemassafra', 'michelkeppens', 'michelpierson', 'midboudoir', 'mihailshestakov', 'mikestonephotography2019', 'miketoptygin', 'mikeywu', 'mikhailmishanson', 'miki_macovei', 'miklostassi', 'mil4nek', 'millnyahoa', 'minkiq', 'mirohofmann1', 'miroslavbelev', 'mizgirov', 'mk-pixelstorm', 'mkloetzer', 'mmagdziak', 'moglipic', 'mohammedabuhayeh', 'monica822', 'morozsnimaet', 'morris35', 'mortenthoms', 'motomotogpa', 'mriden', 'mspaul', 'mtbankhardt', 'mtdt', 'musharafiqbal', 'musumeci25giuseppe', 'muujiza02', 'mycoolsfoto', 'n01grig', 'nacho_perez', 'nasicomy', 'natali_gaidysh', 'natalia_m_photography', 'nataliaarantseva', 'nataliaturczyk', 'nataliyashugailo', 'nathaliecastonguay', 'nathanelson', 'naughtynikki2501', 'neatwork', 'nebesskiy', 'nelzinvitalik', 'nepronfoto', 'nerhiv', 'nesmelov86yv', 'nick_curly', 'nickhalling', 'nico-photographies', 'nicoladavidefurnari', 'nicolapaoloemilio', 'nicolasgorrens', 'nicoruffato', 'niemandwer', 'nikolasverano', 'nikonpeter', 'nildornelas', 'ninosanfilippo', 'ninoveron', 'no_90125', 'noblecatph', 'nobraclub', 'noelmacphoto', 'noirartph', 'nonsolomodanewsitalia', 'nora-leseberg', 'normantacchi', 'notename', 'novaitalianphotographer', 'novemberlight', 'nsonnet', 'nspdstudio', 'ntikhomirov', 'nw-photographer', 'nyamarkova', 'ob1rnmjt3t', 'ofn', 'ok64', 'olga_sweet', 'oliverdias', 'olivierbugueti', 'oo55mod', 'opletaeff', 'orain', 'orlovskiim', 'ornaghitiziano', 'orryginal', 'ossimoroblues', 'osv', 'overthephoto', 'ozgur-media', 'p-tashka', 'pablocaas', 'pabloroblesnavarro', 'pallo007', 'pamano', 'panetone', 'paolo73', 'paolocarlolunni', 'paolopizzi', 'paolopuopolo', 'pascal_dejay', 'pascal-x-t2', 'pascalthomas1', 'passonitis', 'pastreinz', 'pat_h', 'patrikvalasek', 'patriziamorettiphoto', 'patrycjusz', 'paulpigasph', 'paulpour', 'paulseds', 'pavelteterevkov', 'pavoguba', 'pawel_paoro_witkowski', 'paweldawid', 'pawelludwikowski', 'pc_digital', 'pedro_kysss', 'pedrolema', 'peppevj', 'petea584', 'peterboll', 'peterhall', 'petermuller', 'peterpaszternak', 'petr_h', 'petrchernysh', 'petrhuu', 'petrsojka', 'phcarretta', 'philhoward', 'philipchang', 'philipverhoeven', 'phmaxxtiger', 'phoscarbueno', 'photo_zheludkova', 'photobus', 'photograperray', 'photolehner', 'photosomnia', 'photostorm98065', 'phototroya', 'phsb60', 'piar-fotografie', 'pibefou', 'pictureart_by_steven_schiller', 'piemmeproduction', 'pierangelogabrielli1', 'pierremagnecom', 'piersparello', 'pietbruystens', 'pietro_stilli', 'pietrocastigliolaphotographer', 'pikeyart', 'pilot224', 'pim', 'piotrkoakowski', 'piotrlipski', 'piotrstach', 'pitsfotos', 'pivanet', 'pixboard', 'pixelbutze', 'piyush2003', 'polly', 'portraitretoucher', 'posemakeupart', 'potatoe', 'privalov', 'prosephotography', 'prozvitsky', 'psi-photography', 'psydo83', 'ptittomtompics', 'pulcherrima', 'purtastudios', 'qtoan182', 'quitomza', 'r2moficial', 'rafalwegiel', 'rafougiletyoland', 'raidycv', 'rakso_design', 'ralph_wietek', 'ranskafrede', 'raphaelphoto', 'raulegusquiza', 'rchmrtn', 'rebelrevealphotography', 'redaska', 'rednaxelaikslawok', 'reekolynch', 'regards-libres', 'renesch', 'retoheiz', 'rgurbuz', 'rhhphotography', 'richardbene', 'richardmills', 'ridwan_ng', 'rikimage', 'roamingphotostudio', 'rob-neal', 'rob19971', 'robekwen', 'robert_roberto', 'robertchrenka', 'robertfarnham', 'robertfotografia', 'robertobernocchi', 'robertwypir', 'rocketqueenimaging', 'rockymalhotra', 'rodolphehuignard', 'rodrigomonteirophotos', 'rodvindavis', 'rojsmith', 'rolandkunz', 'rolandurech', 'roluart', 'roma_chernotitckiy', 'romanov177', 'romanpunenko', 'romanrudenko', 'ronlevi5', 'rossanacarpentieri', 'rossmannmcgree', 'roycephotoshoot', 'royfroma', 'rt_lichtbild', 'rubyvizcarra', 'ruslandukefoto', 'sa_g', 'sacha-leyendecker', 'safargalieva', 'saifuldw', 'sakalsakalic', 'salihgokduman', 'sallenph', 'salofee', 'samarcuk', 'samueljacquatphotographie', 'sandeepz', 'santi_alonso', 'santiagopescado', 'santrade2', 'sarinaselvaggia', 'sashamedvedeva', 'saulekha', 'sauliuske', 'savenkovd', 'savgreg', 'sazhrahgutierrez', 'sbastphotographies', 'schratchen', 'scottbiker', 'sdk64741', 'seanarcher', 'seanmalley', 'searchgr', 'sebastian_koehler', 'sebastiankliemann', 'sebastienrenaud', 'secretphotographerforyou', 'sekurit', 'semkaaa64', 'sergeberrard', 'sergeybidun', 'sergeychmykhov', 'sergeynaybich1', 'serginovitskiy', 'sergioschiesari', 'serzhsz39', 'seves', 'seweryncieslikpl', 'sfd85', 'sgfat', 'shalimovv', 'shaktitanwar1234', 'shannonabritto', 'shehan-fernando', 'shihari', 'shrek-gokk', 'shutterimaging', 'sibiraev', 'silenteyesphotography', 'simoneangarano', 'simonespinal', 'simplelich', 'simplypics_photography', 'sirbio75', 'skippercool6', 'skydivebob', 'sletanis', 'slinky_advphoto', 'smalllche', 'snarts', 'sokolovkirill', 'solonin', 'sophievonbuer', 'soppotea', 'sorokinofoto', 'soulberenson', 'spasnemerov', 'spawl', 'spencertan', 'sr_jasab', 'srhphotography2012', 'srjulioinzunza', 'stawnikov2015', 'stefanhaeusler', 'stefankoester', 'stefanobosso', 'steffenkarl', 'stein', 'stephane_battesti', 'stephane_degrutere', 'stephaneseguraii', 'stephanhainzl', 'stephanopolis', 'stephpromotor', 'stevelin', 'stevevuoso1', 'stop_focus_studios', 'stoyankatinov', 'stphanerouxel1', 'strausdusan', 'subiyama', 'subratagharami8', 'suiciderock', 'supercarpi2', 'svartepx', 'svenfiedlerart', 'svenhildebrandt', 'swarovsky', 'takashifuro', 'tamarakubatov', 'tanaga_chen', 'tancredimaurizio', 'tango63', 'tanjabrunner', 'tanya7krystal', 'tasiphotography', 'terese0815', 'tglawe', 'th_eff', 'the-maksimov', 'theartographer', 'thebeautifulones', 'thebest500px', 'thecrewdubai', 'theonlyblacksnowleopard', 'theportraithunter', 'theurbanphotographer', 'thevisionphotos', 'thomas_ruppel', 'thomas-oh', 'thongnoel', 'thorstenbriese1', 'thorstenschnorrbusch', 'tikerophoto', 'timankov', 'timaval', 'timothyfairley', 'tinman2000', 'tissandier', 'tjphoto40', 'tk-fotodesign', 'tkachuk_ruslan', 'tnxdinosaurs', 'tobiashajek', 'tobylewis', 'tom-nash', 'tomaks', 'tomashmasojc', 'tomasjungvirt', 'tommipxls', 'tonnyjrgensen', 'torresphoto1', 'torstensons', 'trendkom', 'triscele2', 'troyoda', 'ts26photo', 'tserkasevich', 'tsvetkovphotography', 'tsyganov', 'tsymlyakov_al', 'tvisionportraits', 'tvoih_shagov', 'tvoyephotography', 'txophotographer', 'tynkoff', 'typfoto', 'uardarexha', 'udontknowme', 'ulfbrockmann', 'urbansoul', 'urilina33', 'ursusfoto', 'urtonic', 'ururuty', 'usman161rus', 'uvpro', 'vacancier', 'vaclav64', 'valery_1', 'valerytaylor', 'valevsky', 'vankou', 'vanyatufkova', 'vardanank666', 'vavaca', 'vcg-allen0755', 'vcg-arctic', 'vcg-bw23', 'vcg-gurulee888', 'vcg-jiayiphoto', 'vcg-tofu', 'vel_volkov', 'vellu60', 'velmar', 'vendigo', 'verdigrisphoto', 'victi1974', 'victoriabee', 'videoshooter', 'viktoriuson', 'viktory1', 'violainevivi', 'violette__photography', 'vipingoje1', 'vitomammana', 'vitomotiv', 'vlad-shutov', 'vladimirov', 'vlarionov', 'volavolko', 'voldemarpts', 'voreos_studios', 'vostrikov42', 'votresecret', 'vpotemkin', 'vscd', 'vsr_photography', 'webtrekhoe', 'tuvandoanhnghieponghean', 'stina_petersen', 'asimovphoto', 'abcdvt19', 'weissenegger', 'west-kis', 'whitehorsse', 'wiktor150rus', 'wiktorbernatowicz', 'williamallen3', 'williamaponno', 'willymalbosc', 'winderwind', 'wls_seeadler', 'wohl_photography', 'wolfgang10', 'wsebbag', 'wuestenfuchs-wuestenfuchs', 'wwwpafa', 'wylllemere', 'xecbagur', 'xposure', 'xxlwd', 'yamel', 'yanaphotographyzp', 'yanisourabah', 'yanivc', 'yatoyato', 'yiduanwlj', 'yoannastancheva', 'yosbelvamor', 'youknowwhatjimsays', 'yuliavasilyvna', 'yuribrut', 'yuriykovalchuk', 'zachar', 'zancanmatteophotography', 'zeephoto_uk', 'zenofoto', 'zurmuehle', 'zvandrei',];

    var arr = []
    blacklist.forEach(function (val) {
        arr.push("[href*=" + val + "]");
    });
    return arr.join(",");
}

const BLACKLIST_SELECTOR = getBlacklistSelector();
