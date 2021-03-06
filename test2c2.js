// kommentarer
var MAX_ERRORS = 10;
var MAX_TRIGGERS = 1;
var STATUS_EVERY = 10000;
var count = 0;
var errorCount = 0;
var quit = false;
var millis = (new Date()).getTime();
/*
let descr = $("div[class^='StyledLayout__Box']:eq(8)").find("p[class^='StyledTypography__Paragraph']:eq(5)").text().trim();
let user = $("img[class^='StyledUserAvatar__UserAvatarImage']:eq(0)").attr("alt").trim();
let title = $("div[class^='Elements__PhotoImageSafariFixWrapper']").find("img").attr("alt");

let lang = detectLanguage(descr);
if (lang == "en" && (lang = detectLanguage(user)) == "en") {
    lang = detectLanguage(title);
}

console.log("Lang: " + lang);
*/

let c = getKommenter("en");

console.log("C: " + c);

kommentera(c);

function detectLanguage(s) {
    /*
    3000 - 303f: Japanese-style punctuation
    3040 - 309f: Hiragana
    30a0 - 30ff: Katakana
    ff00 - ff9f: Full-width Roman characters and half-width Katakana
    4e00 - 9faf: CJK unified ideographs - Common and uncommon Kanji
    3400 - 4dbf: CJK unified ideographs Extension A - Rare Kanji
    */

    if (!s) {
        return "en";
    }

    if (s.match(/[\uac00-\ud7a3]/)) {
        return "ko";
    }

    if (s.match(/[\u3040-\u30ff]/)) {
        return "ja";
    }

    if (s.match(/[\u4e00-\u9FFF]/)) {
        return "ch";
    }

    if (s.match(/[\u0400-\u04FF]/) || s.match(/[\u0500-\u052F]/)) {
        return "ru";
    }

    if (s.includes('Ä') || s.includes('ä') || s.includes('Ö') || s.includes('ö') || s.includes('Ü') || s.includes('ü') || s.includes('ẞ') || s.includes('ß')) {
        return "ge";
    }

    let spanishWords = [
        'que', 'de', 'la', 'el', 'es', 'y', 'en', 'lo', 'un', 'por', 'qué', 'una', 'te', 'los', 'se', 'con', 'para', 'mi', 'está', 'si', 'bien',
        'pero', 'yo', 'eso', 'las', 'sí', 'su', 'tu', 'aquí', 'del', 'al', 'como', 'más', 'esto', 'ya', 'todo', 'esta', 'vamos', 'muy', 'ahora',
        'algo', 'estoy', 'tengo', 'nos', 'tú', 'nada', 'cuando'];
    var re = new RegExp("\\b" + spanishWords.join("\\b|\\b") + "\\b", "i");
    if (re.test(s)) {
        return "es";
    }

    return "en";
}

function getKommenter(lang) {
    switch (lang) {
        case "es":
            switch (randBetween(0, 3)) {
                case 0: return "¡excelente toma!";
                case 1: return "¡Hermosa captura!";
                case 2: return "Excelente imagen";
                case 3: return "Estupendo trabajo!";
            }
            break;
        case "en":
            switch (randBetween(0, 13)) {
                case 0: return "Great shot!";
                case 1: return "Awesome shot!";
                case 2: return "Amazing!";
                case 3: return "Great composition";
                case 4: return "Perfect capture!";
                case 5: return "Amazing composition!";
                case 6: return "Great job";
                case 7: return "Beautiful";
                case 8: return "Excellent shot";
                case 9: return "Excellent";
                case 10: return "Awesome";
                case 11: return "Excellent composition";
                case 12: return "Beautiful capture";
                case 13: return "Beautiful!";
            }
            break;
        case "ge":
            switch (randBetween(0, 3)) {
                case 0: return "Schönes Foto";
                case 1: return "Schön";
                case 2: return "Gutes Foto";
                case 3: return "Gute Arbeit";
            }
            break;
        case "ru":
            switch (randBetween(0, 3)) {
                case 0: return "Хорошая работа";
                case 1: return "Прекрасный!";
                case 2: return "Красивая фотография";
                case 3: return "Очень хорошо";
            }
            break;
        case "ch":
            switch (randBetween(0, 10)) {
                case 0: return "伟大的拍摄！";
                case 1: return "佳作";
                case 2: return "好拍摄";
                case 3: return "精彩拍摄！";
                case 4: return "漂亮的花朵！";
                case 5: return "非常漂亮！";
                case 6: return "好！";
                case 7: return "赞！";
                case 8: return "壮观，壮丽";
                case 9: return "好拍";
                case 10: return "漂亮";
            }
            break;
        case "ja":
            switch (randBetween(0, 3)) {
                case 0: return "美しい写真！";
                case 1: return "とても良い";
                case 2: return "優れた";
                case 3: return "素晴らしい写真";
            }
            break;
        case "ko":
            switch (randBetween(0, 3)) {
                case 0: return "우수한 사진";
                case 1: return "아주 좋아";
                case 2: return "아름다운";
                case 3: return "잘 했어";
            }
            break;

    }
}

async function kommentera(kommenter) {
    //what we know - from liked page, get https://500
    //               from refreshed page, get https://web.500
    //
    //maybe different versions of jquery?
    //
    //padre gives 1 length array on "500", but element on "web.500"
    //ob gives 3 length array on "500", but 1 element on "web.500"

    //var pl = $("a.photo_link");

    var padre = $("div[class^='Elements__CommentInputWrapper-sc-1e3xy9t-']");
    //-1e3xy9t-18");
    var ta = padre[0].children[0];

    if (!ta) {
        console.log("Error finding textarea...");
        return;
    }

    $('body').focus();
    ta.dispatchEvent(new MouseEvent('mousedown', { clientX: 888, clientY: 292, composed: true, view: window, which: 1, x: 888, y: 292, bubbles: true }));
    document.dispatchEvent(new FocusEvent('focus', { bubbles: false, view: window, which: 0 }));
    ta.dispatchEvent(new FocusEvent('focus', { bubbles: false, view: window, which: 0 }));
    ta.focus();
    //await sleeping(500);

    ta.dispatchEvent(new FocusEvent('focusin', { view: window, bubbles: true }));
    ta.dispatchEvent(new MouseEvent('mouseup', { view: window, which: 1, clientX: 888, clientY: 292, bubbles: true }));
    ta.dispatchEvent(new MouseEvent('click', { clientX: 888, clientY: 292, x: 888, y: 292, which: 1, view: window, bubbles: true }));
    //await sleeping(500);

    ta.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        charCode: 0,
        code: "OSLeft",
        composed: true,
        key: "Meta",
        keyCode: 224,
        layerX: 0,
        layerY: 0,
        location: 1,
        metaKey: true,
        view: window,
        which: 224,
    }));
    ta.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        charCode: 0,
        code: "KeyV",
        composed: true,
        key: "v",
        keyCode: 86,
        layerX: 0,
        layerY: 0,
        location: 0,
        metaKey: true,
        view: window,
        which: 86,
    }));
    var tn = document.createTextNode(kommenter);
    //ta._valueTracker.setValue("Awesome");
    ta.value = kommenter;
    ta.appendChild(tn);
    ta.dispatchEvent(new Event('input', { bubbles: true, composed: true, layerX: 0, layerY: 0, inputType: 'insertText', data: kommenter }));
    ta.dispatchEvent(new Event('change', { bubbles: true, composed: false }));
    await sleeping(500);

    ob = $("a[class^='Elements__OldButton-']")[2];
    ob.removeAttribute("disabled");
    await sleeping(500);
    ob.click();

    /*
    ta.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        charCode: 0,
        code: "Enter",
        composed: true,
        key: "Enter",
        keyCode: 13,
        layerX: 0,
        layerY: 0,
        location: 0,
        metaKey: false,
        view: window,
        which: 13,
    }));
    ta.dispatchEvent(new KeyboardEvent('keypress', {
        bubbles: true,
        charCode: 13,
        code: "Enter",
        composed: true,
        key: "Enter",
        keyCode: 13,
        layerX: 0,
        layerY: 0,
        location: 0,
        metaKey: false,
        view: window,
        which: 13,
    }));
    */

    return;
}

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}


var DOMEvents = {
    UIEvent: "abort DOMActivate error load resize scroll select unload",
    ProgressEvent: "abort error load loadend loadstart progress progress timeout",
    Event: "abort afterprint beforeprint cached canplay canplaythrough change chargingchange chargingtimechange checking close dischargingtimechange DOMContentLoaded downloading durationchange emptied ended ended error error error error fullscreenchange fullscreenerror input invalid languagechange levelchange loadeddata loadedmetadata noupdate obsolete offline online open open orientationchange pause pointerlockchange pointerlockerror play playing ratechange readystatechange reset seeked seeking stalled submit success suspend timeupdate updateready visibilitychange volumechange waiting",
    //AnimationEvent: "animationend animationiteration animationstart",
    AudioProcessingEvent: "audioprocess",
    BeforeUnloadEvent: "beforeunload",
    TimeEvent: "beginEvent endEvent repeatEvent",
    OtherEvent: "blocked complete upgradeneeded versionchange",
    FocusEvent: "blur DOMFocusIn  Unimplemented DOMFocusOut  Unimplemented focus focusin focusout",
    //MouseEvent: "click contextmenu dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup show",
    MouseEvent: "click contextmenu dblclick mousedown mouseup show",
    //SensorEvent: "compassneedscalibration Unimplemented userproximity",
    //OfflineAudioCompletionEvent: "complete",
    CompositionEvent: "compositionend compositionstart compositionupdate",
    //ClipboardEvent: "copy cut paste",
    //DeviceLightEvent: "devicelight",
    //DeviceMotionEvent: "devicemotion",
    //DeviceOrientationEvent: "deviceorientation",
    //DeviceProximityEvent: "deviceproximity",
    MutationNameEvent: "DOMAttributeNameChanged DOMElementNameChanged",
    MutationEvent: "DOMAttrModified DOMCharacterDataModified DOMNodeInserted DOMNodeInsertedIntoDocument DOMNodeRemoved DOMNodeRemovedFromDocument DOMSubtreeModified",
    //DragEvent: "drag dragend dragenter dragleave dragover dragstart drop",
    //GamepadEvent: "gamepadconnected gamepaddisconnected",
    HashChangeEvent: "hashchange",
    KeyboardEvent: "keydown keypress keyup",
    MessageEvent: "message message message message",
    PageTransitionEvent: "pagehide pageshow",
    PopStateEvent: "popstate",
    StorageEvent: "storage",
    SVGEvent: "SVGAbort SVGError SVGLoad SVGResize SVGScroll SVGUnload",
    SVGZoomEvent: "SVGZoom",
    //TouchEvent: "touchcancel touchend touchenter touchleave touchmove touchstart",
    TransitionEvent: "transitionend",
    //WheelEvent: "wheel"
}

var quit = true;
var i = 0;

for (DOMEvent in DOMEvents) {

    var DOMEventTypes = DOMEvents[DOMEvent].split(' ');

    DOMEventTypes.filter(function (DOMEventType) {
        var DOMEventCategory = DOMEvent + ' ' + DOMEventType;
        document.addEventListener(DOMEventType, function (e) {
            if (!quit) {
                let indirect = e.target == document.activeElement ? 'DIR' : 'IND';
                i++;
                console.log(i, '. ', indirect, DOMEventCategory,
                    '\n\ttarget=', e.target,
                    '\n\tactive=', document.activeElement);
            }

        }, true);
    });

}
