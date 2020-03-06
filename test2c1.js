// kommentarer
var MAX_RELOADS = 20;
var MAX_TRIGGERS = 40;
var index = 0 + (MAX_TRIGGERS * 0); // 0 to start at top or higher to start a ways down

var DEBUG = false;

var count = 0;
var votes = 0;
var errorCount = 0;
var quit = false;
var millis = (new Date()).getTime();

kontrollcenter();

async function kontrollcenter() {
    start();

    let reloads = 0;

    document.querySelector("div[role='button'][data-id='photo-like']")

    while (count < MAX_TRIGGERS && !quit) {
        let lank = document.querySelectorAll("a[href^='/photo/']:not([href$='comments=true'])");
        while (index >= lank.length) {
            await scrolling();
            lank = document.querySelectorAll("a[href^='/photo/']:not([href$='comments=true'])");
            if (index >= lank.length) {
                console.log("Cannot find more... waiting...")
                await sleeping(1000);
                reloads++;
                if (reloads >= MAX_RELOADS) {
                    console.log("Cannot find more... quitting")
                    quit = true;
                    end();
                    return;
                }
            }
            await sleeping(1000);
        }

        lank[index].click();
        await sleeping(1000);

        index++;
        if (index % 10 == 0) {
            console.log("Currently at index ", index);
        }
        if (count % 10 == 0 && count > 0) {
            console.log("Currently at count ", count);
        }

        let descr = "None";

        let loading = true;
        reloads = 0;
        do {
            try {
                let descIndex = 17;
                if (reloads % 2 == 1) {
                    descIndex = 21;
                }
                descr = document.querySelectorAll("div[class^='StyledLayout__Box']")[descIndex].querySelector("p[class^='StyledTypography__Paragraph']").textContent.trim();
                loading = false;
            } catch (error) {
                if (reloads > 0) {
                    console.log("Error finding descr... waiting...");
                    await sleeping(1000);
                }
                reloads++;
                if (reloads >= MAX_RELOADS) {
                    console.log("Error finding descr... quitting");
                    quit = true;
                    end();
                    return;
                }
            }
        } while (loading);

        let user = document.querySelector("a > img[class^='StyledUserAvatar__UserAvatarImage']").alt.trim();
        let title = document.querySelector("div[class^='Elements__PhotoImageSafariFixWrapper']").querySelector("img").alt.trim();

        let kommentarHeading = document.querySelector("div[class^='Elements__PhotoCommentsWrapper']").querySelector("h4").textContent;
        if (kommentarHeading.split(String.fromCharCode(160))[0].trim() == "") {
            console.log("Error finding kommentar...", kommentarHeading);
            await sleeping(10000);
            kommentarHeading = document.querySelector("div[class^='Elements__PhotoCommentsWrapper']").querySelector("h4").textContent;
            if (kommentarHeading.split(String.fromCharCode(160))[0].trim() == "") {
                console.log("Error finding kommentar... quitting")
                quit = true;
                end();
                return;
            }
        }
        let kommentar = parseInt(kommentarHeading.split(String.fromCharCode(160))[0]);

        let spans = document.querySelectorAll("p[class^='StyledTypography__Paragraph'] > span");
        if (spans[spans.length - 1].textContent != "No comments yet" && kommentar == 0) {
            console.log("Appears to be issue loading... waiting...");
            await sleeping(10000);
            kommentar = parseInt(document.querySelector("div[class^='Elements__PhotoCommentsWrapper']").querySelector("h4").textContent.split(String.fromCharCode(160))[0]);
            spans = document.querySelectorAll("p[class^='StyledTypography__Paragraph'] > span");
            if (spans[spans.length - 1].textContent != "No comments yet" && kommentar == 0) {
                console.log("Appears to be issue loading... quitting");
                quit = true;
                end();
                return;
            }
        }

        let votes = '';
        let pulse = '';
        let views = '';
        let ture = '';
        try {
            votes = parseInt(document.querySelector("a[class^='StyledLink'][data-id='photo-likes-count']").textContent);
            pulse = parseFloat(document.querySelector("div[class^='Elements__PhotoStat'][label='Pulse']").querySelector("h3").textContent);
            views = parseInt(document.querySelector("div[class^='Elements__PhotoStat'][label='Views']").querySelector("h3").textContent);
            ture = document.querySelector("div[class^='Elements__PhotoStat'][data-id='photo-feature']").querySelector("p").textContent;
        } catch (error) {
            console.log("Unable to find votes, pulse, views, or feature");
        }

        if (user != "Jos Avery") {
            let heart = document.querySelector("div[role='button'][data-id='photo-like']");
            if (heart) {
                heart.click();
                votes++;
            }

            await scrolling(1000);
            await scrolling(1000);
            await scrolling(3000);
            let josKommentar = document.querySelectorAll("a > img[class^='StyledUserAvatar__UserAvatarImage'][alt='Jos Avery']").length - 1;
            if (josKommentar == 0) {
                let lang = preDetectLanguage(user, descr, title);

                await kommentera(getKommenter(lang, getFirst(user, lang)));

                count++;
            } else {
                console.log("Existing comment---");
            }
        }

        document.querySelector("a[class^='Elements__PhotoCloseButton']").click();
        await sleeping(2000);
    }

    quit = true;
    end();
}

var germanWords = ['wie', 'ich', 'seine', 'dass', 'er', 'auf', 'sind', 'mit', 'sie', 'sein', 'bei', 'ein',
    'aus', 'durch', 'aber', 'einige', 'ist', 'oder', 'hatte', 'die', 'von', 'zu', 'und', 'ein', 'bei',
    'wir', 'können', 'aus', 'andere', 'waren', 'tun', 'ihre', 'Zeit', 'wenn', 'werden', 'wie', 'sagte',
    'jeder', 'sagen', 'tut', 'Satz', 'drei', 'wollen', 'Luft', 'gut', 'auch', 'spielen', 'klein', 'Ende',
    'Foto', 'Natur', 'Himmel', 'Licht', 'Wasser', 'Weiß', 'Menschen', 'Reise', 'schön', 'Stadt',
    'Sonnenuntergang', 'Landschaft', 'schwarz', 'Baum', 'Bäume', 'Straße', 'Sonne', 'Sonnenaufgang',
    'Wagen', 'Zuhause', 'Haus', 'Straße', 'Meer', 'Ozean', 'Berg', 'Fluss', 'Pflanze', 'Sommer',
    'Frühling', 'Yvonne', 'Duarte', 'Nogueira', 'Das', 'habe', 'Heidelberg', 'aufgenommen'];

var spanishWords = ['cual', 'el', 'es', 'lo', 'por', 'qué', 'una', 'te', 'los', 'se', 'con', 'para',
    'mi', 'está', 'bien', 'pero', 'yo', 'eso', 'las', 'sí', 'su', 'tu', 'aquí', 'del', 'al', 'como',
    'más', 'esto', 'ya', 'todo', 'esta', 'vamos', 'muy', 'ahora', 'algo', 'estoy', 'tengo', 'nos', 'tú',
    'nada', 'cuando', 'Rodríguez', 'este', 'sé', 'estás', 'así', 'puedo', 'cómo', 'quiero', 'sobre', 'foto',
    'naturaleza', 'cielo', 'ligero', 'agua', 'blanco', 'personas', 'viaje', 'hermosa', 'ciudad',
    'puesta de sol', 'paisaje', 'negro', 'árbol', 'arboles', 'calle', 'Dom', 'puesta de sol', 'amanecer',
    'barco', 'coche', 'casa', 'la carretera', 'mar', 'Oceano', 'montaña', 'río', 'planta', 'verano',
    'invierno', 'primavera', 'otoño', 'Jose', 'Sanchez'];

var frenchWords = ['le', 'à', 'être', 'et', 'avoir', 'dans', 'ce', 'il', 'qui', 'ne', 'sur', 'se', 'pas',
    'pouvoir', 'par', 'je', 'avec', 'tout', 'faire', 'mettre', 'autre', 'mais', 'nous', 'comme', 'mon',
    'ou', 'leur', 'dire', 'elle', 'devoir', 'avant', 'deux', 'même', 'prendre', 'aussi', 'celui', 'donner',
    'où', 'fois', 'vous', 'nouveau', 'aller', 'cela', 'vouloir', 'déjà', 'lui', 'aucun', 'très', 'voir',
    'la nature', 'ciel', 'lumière', "l'eau", 'blanc', 'gens', 'Voyage', 'beau', 'ville', 'coucher',
    'soleil', 'paysage', 'noir', 'arbre', 'arbres', 'rue', 'Soleil', 'du', 'bateau', 'voiture', 'domicile',
    'maison', 'route', 'mer', 'océan', 'Montagne', 'rivière', 'plante', 'été', 'hiver', 'printemps',
    'tomber'];

var englishWords = ['the', 'be', 'to', 'of', 'and', 'in', 'that', 'have', 'it', 'for', 'not', 'with', 'as',
    'you', 'do', 'at', 'photo', 'nature', 'sky', 'light', 'water', 'white', 'people', 'travel', 'beautiful',
    'city', 'sunset', 'landscape', 'black', 'tree', 'trees', 'street', 'sun', 'sunset', 'sunrise', 'boat',
    'car', 'home', 'house', 'road', 'sea', 'ocean', 'mountain', 'river', 'plant', 'summer', 'winter',
    'spring', 'fall'];

function preDetectLanguage(user, descr, title) {
    switch (user) {
        case "Elisa Cascarino":
            return LANG_FRENCH;
        case "Yvonne Duarte Nogueira":
        case "Alois Hoop":
        case "Klaus Stahl":
        case "Daniel Fleischhacker":
        case "Hans-Joachim Scharpf":
        case "Sabine Puschl":
            return LANG_GERMAN;
        case "Diego":
        case "Jose Manuel Repilado":
        case "Juan Martinez Medina":
        case "Guillermo Ibáñez":
        case "Marco Díaz":
        case "Jose Miguel Sanchez":
        case "Camila Fraga":
        case "Sergio Torrijos":
            return LANG_SPANISH;
    }
    return detectLanguage(descr.concat(' ', user, ' ', title));
}

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
        return LANG_ENGLISH;
    }

    if (s.match(/[\uac00-\ud7a3]/)) {
        return LANG_KOREAN;
    }

    if (s.match(/[\u3040-\u30ff]/)) {
        return LANG_JAPANESE;
    }

    if (s.match(/[\u4e00-\u9FFF]/)) {
        return LANG_CHINESE;
    }

    if (s.match(/[\u0400-\u04FF]/) || s.match(/[\u0500-\u052F]/)) {
        return LANG_RUSSIAN;
    }

    if (s.includes('Ü') || s.includes('ü') || s.includes('ẞ') || s.includes('ß')) {
        return LANG_GERMAN;
    }

    let wordCount = countWords(s);
    if (DEBUG) console.log("count: ", wordCount);


    let germanMatches = countMatches(germanWords, s);
    if (DEBUG) console.log("de: ", germanMatches);

    if (germanMatches > 1 && (germanMatches / wordCount) > 0.1) {
        return LANG_GERMAN;
    }

    if (s.includes('ñ')) {
        return LANG_SPANISH;
    }


    let spanishMatches = countMatches(spanishWords, s);
    if (DEBUG) console.log("es: ", spanishMatches);

    if (spanishMatches > 1 && (spanishMatches / wordCount) > 0.1) {
        return LANG_SPANISH;
    }


    let frenchMatches = countMatches(frenchWords, s);
    if (DEBUG) console.log("fr: ", frenchMatches);

    if (frenchMatches > 1 && (frenchMatches / wordCount) > 0.1) {
        return LANG_FRENCH;
    }

    let englishMatches = countMatches(englishWords, s);
    if (DEBUG) console.log("en: ", englishMatches);

    if (frenchMatches > 0 && frenchMatches >= germanMatches && frenchMatches >= englishMatches && frenchMatches >= spanishMatches) {
        return LANG_FRENCH;
    }

    if (germanMatches > 0 && germanMatches >= frenchMatches && germanMatches >= englishMatches && germanMatches >= spanishMatches) {
        return LANG_GERMAN;
    }

    if (spanishMatches > 0 && spanishMatches >= frenchMatches && spanishMatches >= englishMatches && spanishMatches >= germanMatches) {
        return LANG_SPANISH;
    }

    return LANG_ENGLISH;
}

function countWords(str) {
    str = str.replace(/\s{2,}/, ' ').trim();
    let array = [...str.matchAll(/ /g)];
    return array.length + 1;
}

function countMatches(arr, str) {
    let reg = new RegExp("\\b" + arr.join("\\b|\\b") + "\\b", "ig");
    return [...str.matchAll(reg)].length;
}

function getKommenter(lang, first = '') {
    if (first != '') {
        if (lang == LANG_ENGLISH || lang == LANG_GERMAN) {
            first = ", " + first;
        } else {
            first = " " + first;
        }
    }
    switch (lang) {
        case LANG_SPANISH:
            switch (randBetween(0, 45)) {
                case 0: return "¡Gran toma" + first + "!";
                case 1: return "¡Que gran toma" + first + "!";
                case 2: return "¡Increíble trabajo! Esta foto es muy inspiradora" + first;
                case 3: return "¡Gran composición, bien hecho" + first + "!";
                case 4: return "Perfectamente hecho" + first + ".";
                case 5: return "¡Increíble foto! Bien hecho" + first;
                case 6: return "Muy agradable. ¡Gran trabajo" + first + "!";
                case 7: return "¡Muy bien hecho" + first + "!";
                case 8: return "Excelente toma" + first;
                case 9: return "¡Excelente trabajo!";
                case 10: return "¡Impresionante! Bien hecho" + first + ".";
                case 11: return "¡Muy bien" + first + "!";
                case 12: return "Bella captura" + first;
                case 13: return "¡Foto bellamente capturada" + first + "!";
                case 14: return "¡Fantástica! Es un gran foto" + first + ".";
                case 15: return "Calidad excepcional" + first;
                case 16: return "¡Trabajo genial" + first + "!";
                case 17: return "¡Espectacular foto!" + first + "!";
                case 18: return "¡Fabuloso trabajo" + first + "!";
                case 19: return "¡Toma brillante" + first + "!";
                case 20: return "¡Toma impresionante" + first + "!";
                case 21: return "¡Trabajo destacado" + first + "!";
                case 22: return "¡Hermosa imagen" + first + "!";

                case 23: return "¡Composición impresionante" + first + "!";
                case 24: return "¡Gran toma" + first + "!";
                case 25: return "¡Hermoso trabajo" + first + "!";
                case 26: return "¡Composición hermosa" + first + "!";
                case 27: return "¡Brillante" + first + "!";
                case 28: return "¡Increíble foto" + first + "!";
                case 29: return "¡Gran trabajo" + first + "!";
                case 30: return "¡Hermosa" + first + "!";
                case 31: return "Excelente" + first;
                case 32: return "Excelente trabajo" + first;
                case 33: return "¡Foto excepcional" + first + "!";
                case 34: return "¡Buen trabajo" + first + "!";
                case 35: return "Espectacular captura" + first;
                case 36: return "¡Impresionante captura" + first + "!";
                case 37: return "Gran foto" + first + ".";
                case 38: return "¡Trabajo de alta calidad" + first + "!";
                case 39: return "¡Fantástica imagen" + first + "!";
                case 40: return "¡Bonita toma" + first + "!";
                case 41: return "¡Hermosa toma" + first + "!";
                case 42: return "¡Bien hecho" + first + "!";
                case 43: return "¡Impresionante" + first + "!";
                case 44: return "¡Estupendo trabajo" + first + "!";
                case 45: return "¡Magnificent trabajo" + first + "!";
            }
            break;
        case LANG_FRENCH:
            switch (randBetween(0, 7)) {
                case 0: return "Magnifique photo" + first;
                case 1: return "Magnifique" + first;
                case 2: return "Une photo magnifique" + first + "!";
                case 3: return "Très jolie" + first;
                case 4: return "Très bien" + first;
                case 5: return "Impressionnante" + first;
                case 6: return "Excellente" + first;
                case 7: return "Merveilleuse" + first;
                case 8: return "Magnifique prise" + first;
            }
            break;
        case LANG_ENGLISH:
            switch (randBetween(0, 45)) {
                case 0: return "Great shot my friend" + first + "!";
                case 1: return "What a great shot" + first + "!";
                case 2: return "Amazing work! Very inspiring" + first;
                case 3: return "Great composition, well done" + first + "!";
                case 4: return "Perfectly done" + first + ".";
                case 5: return "Amazing photo. Good job" + first + "!";
                case 6: return "Very nice. Great job" + first + "!";
                case 7: return "Beautifully done" + first + "!";
                case 8: return "Excellent shot" + first;
                case 9: return "Excellent work my friend!";
                case 10: return "Awesome! Well done" + first + ".";
                case 11: return "Very good" + first + "!";
                case 12: return "Beautiful capture" + first;
                case 13: return "Beautifully captured shot" + first + "!";
                case 14: return "Fantastic! This is a great photo" + first + ".";
                case 15: return "Exceptional quality" + first;
                case 16: return "Brilliant work my friend" + first + "!";
                case 17: return "Spectacular photo" + first + "!";
                case 18: return "Fabulous work" + first + "!";
                case 19: return "Brilliant shot" + first + "!";
                case 20: return "Stunning shot" + first + "!";
                case 21: return "Outstanding job" + first + "!";
                case 22: return "Magnificent" + first + "!";

                case 23: return "Impressive composition" + first + "!";
                case 24: return "Great shot" + first + "!";
                case 25: return "Beautiful work" + first + "!";
                case 26: return "Beautiful composition" + first + "!";
                case 27: return "Brilliant" + first + "!";
                case 28: return "Amazing photo" + first + "!";
                case 29: return "Great job" + first + "!";
                case 30: return "Beautiful" + first + "!";
                case 31: return "Excellent" + first;
                case 32: return "Excellent work" + first;
                case 33: return "Exceptional" + first + "!";
                case 34: return "Fine work" + first + "!";
                case 35: return "Spectacular capture" + first;
                case 36: return "Awesome capture" + first + "!";
                case 37: return "Great photo" + first + ".";
                case 38: return "Great quality work" + first + "!";
                case 39: return "Fantastic image" + first + "!";
                case 40: return "Nice shot" + first + "!";
                case 41: return "Beautiful shot" + first + "!";
                case 42: return "Well done" + first + "!";
                case 43: return "Stunning" + first + "!";
                case 44: return "Outstanding" + first + "!";
                case 45: return "Magnificent work" + first + "!";

            }
            break;
        case LANG_GERMAN:
            switch (randBetween(0, 46)) {
                case 0: return "Tolles Foto, mein Freund" + first + "!";
                case 1: return "Was für ein tolles Foto" + first + "!";
                case 2: return "Tolle Arbeit! Sehr inspirierend" + first;
                case 3: return "Tolle Komposition, gut gemacht" + first + "!";
                case 4: return "Perfekt gemacht" + first + ".";
                case 5: return "Tolles Foto. Gut gemacht" + first + "!";
                case 6: return "Sehr schön. Gut gemacht" + first + "!";
                case 7: return "Schön gemacht" + first + "!";
                case 8: return "Exzellentes Foto" + first;
                case 9: return "Hervorragende Arbeit, mein Freund!";
                case 10: return "Genial! Gut gemacht" + first + ".";
                case 11: return "Sehr gut" + first + "!";
                case 12: return "Wunderschöne Aufnahme" + first;
                case 13: return "Wunderschön aufgenommenes Foto" + first + "!";
                case 14: return "Fantastisch! Dies ist ein tolles Foto" + first + ".";
                case 15: return "Außergewöhnliche Qualität" + first;
                case 16: return "Geniale Arbeit, mein Freund" + first + "!";
                case 17: return "Spektakuläres Foto" + first + "!";
                case 18: return "Fabelhafte Arbeit" + first + "!";
                case 19: return "Geniales Foto" + first + "!";
                case 20: return "Erstaunliches Foto" + first + "!";
                case 21: return "Hervorragende Arbeit" + first + "!";
                case 22: return "Großartig" + first + "!";

                case 23: return "Beeindruckende Komposition" + first + "!";
                case 24: return "Tolles Foto" + first + "!";
                case 25: return "Schöne Arbeit" + first + "!";
                case 26: return "Wunderschöne Komposition" + first + "!";
                case 27: return "Brillant" + first + "!";
                case 28: return "Tolles Foto" + first + "!";
                case 29: return "Gut gemacht" + first + "!";
                case 30: return "Schön" + first + "!";
                case 31: return "Ausgezeichnet" + first;
                case 32: return "Ausgezeichnete Arbeit" + first;
                case 33: return "Ausnahmsweise" + first + "!";
                case 34: return "Gute Arbeit" + first + "!";
                case 35: return "Spektakuläre Aufnahme" + first;
                case 36: return "Großartige Aufnahme" + first + "!";
                case 37: return "Tolles Foto" + first + ".";
                case 38: return "Gute Arbeit" + first + "!";
                case 39: return "Fantastisches Bild" + first + "!";
                case 40: return "Schönes Foto" + first + "!";
                case 41: return "Schönes Foto" + first + "!";
                case 42: return "Gut gemacht" + first + "!";
                case 43: return "Atemberaubend" + first + "!";
                case 44: return "Hervorragend" + first + "!";
                case 45: return "Großartige Arbeit" + first + "!";
                case 46: return "Sehr gelungenes Foto" + first + "!";

            }
            break;
        case LANG_RUSSIAN:
            switch (randBetween(0, 3)) {
                case 0: return "Хорошая работа" + first;
                case 1: return "Прекрасный" + first + "!";
                case 2: return "Красивая фотография" + first;
                case 3: return "Очень хорошо" + first;
            }
            break;
        case LANG_CHINESE:
            switch (randBetween(0, 26)) {
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
                case 11: return "美丽的画面";
                case 12: return "棒极了👍";
                case 13: return "好精彩";
                case 14: return "精彩好拍";
                case 15: return "美拍！👍👍👍";
                case 16: return "极品佳作，美不胜收！";
                case 17: return "精彩的作品！";
                case 18: return "美丽的镜头！";
                case 19: return "大美之作";
                case 20: return "漂亮精彩，很棒的拍摄！";
                case 21: return "令人惊叹的画面！";
                case 22: return "意境优美👍👍👍";
                case 23: return "精湛佳作";
                case 24: return "好意境";
                case 25: return "意境优美！精湛佳作";
                case 26: return "非常美";

            }
            break;
        case LANG_JAPANESE:
            switch (randBetween(0, 3)) {
                case 0: return "美しい写真！";
                case 1: return "とても良い";
                case 2: return "優れた";
                case 3: return "素晴らしい写真";
            }
            break;
        case LANG_KOREAN:
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

    let ta = document.querySelector("textarea[placeholder='Add a comment']");

    if (!ta) {
        console.log("Error finding textarea...");
        return;
    }

    document.querySelector("body").focus();
    ta.dispatchEvent(new MouseEvent('mousedown', { clientX: 888, clientY: 292, composed: true, view: window, which: 1, x: 888, y: 292, bubbles: true }));
    document.dispatchEvent(new FocusEvent('focus', { bubbles: false, view: window, which: 0 }));
    ta.dispatchEvent(new FocusEvent('focus', { bubbles: false, view: window, which: 0 }));
    ta.focus();
    await sleeping(500);

    ta.dispatchEvent(new FocusEvent('focusin', { view: window, bubbles: true }));
    ta.dispatchEvent(new MouseEvent('mouseup', { view: window, which: 1, clientX: 888, clientY: 292, bubbles: true }));
    ta.dispatchEvent(new MouseEvent('click', { clientX: 888, clientY: 292, x: 888, y: 292, which: 1, view: window, bubbles: true }));
    await sleeping(500);

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
    ta.appendChild(tn);
    ta.dispatchEvent(new Event('input', { bubbles: true, composed: true, layerX: 0, layerY: 0, inputType: 'insertText', data: kommenter, }));
    ta.dispatchEvent(new Event('change', { bubbles: true, composed: false }));
    await sleeping(500);

    ob = document.querySelector("a[class^='Elements__OldButton-']");
    ob.removeAttribute("disabled");
    await sleeping(500);
    //ob.click();

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

    await sleeping(3000);
    return;
}

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randBetween(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function getCompletion() {
    return Math.round(count * 100.0 / MAX_TRIGGERS);
}

function showStatus() {
    console.log("Completed ", getCompletion(), "% (", votes, " votes)");
}

function start() {
    let d = new Date();
    console.log("Beginning at ", d, "...");
    console.log("Attempting to get ", MAX_TRIGGERS);
}

function end() {
    console.log("Completed ", count, " out of ", MAX_TRIGGERS, " (", getCompletion(), "%)");
    console.log("Index: ", index);
    let d = new Date();
    console.log("Done at ", d, ".");
}

function success(elementToCheck) {
    if (elementToCheck && elementToCheck.length != 0) {
        elementToCheck = null;
        return true;
    }
    elementToCheck = null;
    return false;
}

async function scrolling(postPause = 5000) {
    //console.log("Scrolling...");
    window.scrollTo(0, document.documentElement.scrollHeight - document.body.clientHeight);
    await sleeping(postPause);
}

const LANG_ENGLISH = 'en';
const LANG_FRENCH = 'fr';
const LANG_GERMAN = 'de';
const LANG_SPANISH = 'es';
const LANG_CHINESE = 'ch';
const LANG_JAPANESE = 'ja';
const LANG_KOREAN = 'ko';
const LANG_RUSSIAN = 'ru';

function getFirst(user, lang = LANG_ENGLISH) {
    switch (user) {
        case "chan3145": return "Chan";
        case "JUDY猫知道": return "Judy";
        case "suehayla1998": return "Sue";
        case "___G S___": return "G S";
        case "worldographie": return "";
        case "花好月圆 Joanna Wu": return "Joanna";
        case "靜逸celia": return "Celia";
        case "Happy .Ms.L": return "Ms. L";
        case "128elen": return "Elen";
        case "a7charlotte": return "Charlotte";
        case "Jimbos Padrós": return "Montse";
        case "AGoodeLife": return "Ms. Goode";
        case "They Call Me Willie": return "Willie";
    }
    let firstName = user.replace(/([a-z])([A-Z])/g, function (str) { return str[0] + " " + str[1]; });
    firstName = firstName.replace(/_/g, " ").trim();
    if (firstName.indexOf(' ') == -1
        && firstName.length > 0
        && !(lang == LANG_CHINESE || lang == LANG_KOREAN || lang == LANG_JAPANESE)) {

        let foundInMales = false;
        maleNames.forEach(function (item) {
            if (firstName.toLowerCase().startsWith(item.toLocaleLowerCase())) {
                firstName = item;
                foundInMales = true;
            }
        });

        if (!foundInMales) {
            femaleNames.forEach(function (item) {
                if (firstName.toLowerCase().startsWith(item.toLocaleLowerCase())) {
                    firstName = item;
                }
            });

        }
    }
    firstName = firstName.split(' ')[0];
    firstName = firstName.split('·')[0];
    firstName = firstName.split('@')[0];
    firstName = firstName.split('.')[0];

    firstName = firstName.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    if (firstName.length == 1 || firstName.toLocaleLowerCase() == "the") {
        firstName = "";
    }
    if (user == user.toUpperCase()) {
        firstName = firstName.toLocaleLowerCase();
    }

    return sentenceCase(firstName);
}

function getFirstUnitTests() {
    unitTest(getFirst, "Richard Beresford Harris", LANG_ENGLISH, "Richard");
    unitTest(getFirst, "SimonaH", LANG_ENGLISH, "Simona");
    unitTest(getFirst, "andy dauer", LANG_ENGLISH, "Andy");
    unitTest(getFirst, "Yuri Depeche", LANG_RUSSIAN, "Yuri");
    unitTest(getFirst, "FGM Photography", LANG_ENGLISH, "FGM");
    unitTest(getFirst, "基督山伯爵·沸腾", LANG_CHINESE, "基督山伯爵");
    unitTest(getFirst, "Paweł Uchorczak", LANG_ENGLISH, "Paweł");
    unitTest(getFirst, "艺风印象", LANG_JAPANESE, "艺风印象");
    unitTest(getFirst, "sakura malin", LANG_ENGLISH, "Sakura");
    unitTest(getFirst, "Willem", LANG_ENGLISH, "Willem");
    unitTest(getFirst, "巴桑禾斗🦉", LANG_ENGLISH, "巴桑禾斗");
    unitTest(getFirst, "nigelbranchett", LANG_ENGLISH, "Nigel");
    unitTest(getFirst, "ameliaameliaamelia", LANG_ENGLISH, "Amelia");
    unitTest(getFirst, "jackbrown able", LANG_ENGLISH, "Jackbrown");
    unitTest(getFirst, "L Jackson", LANG_ENGLISH, "");
    unitTest(getFirst, " ", LANG_ENGLISH, "");
    unitTest(getFirst, "", LANG_ENGLISH, "");
    unitTest(getFirst, "fred_flintstone", LANG_ENGLISH, "Fred");
    unitTest(getFirst, "The Artsy Lens", LANG_ENGLISH, "");
    unitTest(getFirst, "ANA VENESA", LANG_ENGLISH, "Ana");
    unitTest(getFirst, "chan3145", LANG_ENGLISH, "Chan");
    unitTest(getFirst, "JUDY猫知道", LANG_ENGLISH, "Judy");
    unitTest(getFirst, "suehayla1998", LANG_ENGLISH, "Sue");
    unitTest(getFirst, "___G S___", LANG_ENGLISH, "G S");
    unitTest(getFirst, "_Lillith_", LANG_ENGLISH, "Lillith");
    unitTest(getFirst, " Lillith ", LANG_ENGLISH, "Lillith");
    unitTest(getFirst, "Lillith", LANG_ENGLISH, "Lillith");
    unitTest(getFirst, "Jianhua Zhang 张建华", LANG_CHINESE, "Jianhua");
    unitTest(getFirst, "worldographie", LANG_ENGLISH, "");
    unitTest(getFirst, "花好月圆 Joanna Wu", LANG_CHINESE, "Joanna");
    unitTest(getFirst, "Kapuyo@500px", LANG_CHINESE, "Kapuyo");
    unitTest(getFirst, "Mark.C", LANG_CHINESE, "Mark");
}

function sentenceCase(str) {
    return str.replace(/[a-z]/i, function (letter) {
        return letter.toUpperCase();
    }).trim();
}

function unitTest(func, input, lang, expectedResult) {
    let testResult = "FAIL";
    let actualResult = func(input, lang);
    if (actualResult == expectedResult) {
        testResult = "SUCCESS";
    }
    console.log("For", input, "expecting", expectedResult, ", got", actualResult, ":", testResult);
}

var maleNames = ['Nigel', 'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'George', 'Kevin', 'Brian', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Stephen', 'Jonathan', 'Larry', 'Justin', 'Scott', 'Brandon', 'Frank', 'Benjamin', 'Gregory', 'Samuel', 'Raymond', 'Patrick', 'Alexander', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Henry', 'Douglas', 'Adam', 'Peter', 'Nathan', 'Zachary', 'Walter', 'Kyle', 'Harold', 'Carl', 'Jeremy', 'Keith', 'Roger', 'Gerald', 'Ethan', 'Arthur', 'Terry', 'Christian', 'Sean', 'Lawrence', 'Austin', 'Joe', 'Noah', 'Jesse', 'Albert', 'Bryan', 'Billy', 'Bruce', 'Willie', 'Jordan', 'Dylan', 'Alan', 'Ralph', 'Gabriel', 'Roy', 'Juan', 'Wayne', 'Eugene', 'Logan', 'Randy', 'Louis', 'Russell', 'Vincent', 'Philip', 'Bobby', 'Johnny', 'Bradley', 'Freddie', 'Henry', 'Leo', 'Noah', 'Teddy', 'Theodore', 'Arthur', 'Jacob', 'Muhammad', 'Oscar', 'Theo'];
var femaleNames = ['Abigail', 'Alexis', 'Alice', 'Amanda', 'Amber', 'Amelia', 'Andrea', 'Angela', 'Anna', 'Ashley', 'Barbara', 'Betty', 'Beverly', 'Brenda', 'Brittany', 'Carol', 'Carolyn', 'Catherine', 'Cheryl', 'Christina', 'Christine', 'Cynthia', 'Danielle', 'Deborah', 'Debra', 'Denise', 'Diana', 'Diane', 'Donna', 'Doris', 'Dorothy', 'Elizabeth', 'Elsie', 'Emily', 'Emma', 'Evelyn', 'Florence', 'Frances', 'Gloria', 'Grace', 'Hannah', 'Harper', 'Heather', 'Helen', 'Isla', 'Ivy', 'Jacqueline', 'Jane', 'Janet', 'Janice', 'Jean', 'Jennifer', 'Jessica', 'Joan', 'Joyce', 'Judith', 'Judy', 'Julia', 'Julie', 'Karen', 'Katherine', 'Kathleen', 'Kathryn', 'Kayla', 'Kelly', 'Kimberly', 'Laura', 'Lauren', 'Linda', 'Lisa', 'Lori', 'Madison', 'Margaret', 'Maria', 'Marie', 'Marilyn', 'Martha', 'Mary', 'Megan', 'Melissa', 'Michelle', 'Nancy', 'Natalie', 'Nicole', 'Olivia', 'Pamela', 'Patricia', 'Rachel', 'Rebecca', 'Rose', 'Ruth', 'Samantha', 'Sandra', 'Sara', 'Sarah', 'Sharon', 'Shirley', 'Sophia', 'Stephanie', 'Susan', 'Teresa', 'Theresa', 'Victoria', 'Virginia', 'Willow'];
