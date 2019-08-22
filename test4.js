e = $("a.button.new_fav:not(.hearted):first");
f = e.parents("div.photo_thumbnail");
g = f.find("img");
i = g[0]; // convert to dom element

var img = new Image;
img.crossOrigin = "Anonymous";
img.addEventListener("load", imageReceived, false);

function imageReceived() {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");

    canvas.width = i.width;
    canvas.height = i.height;

    context.drawImage(i, 0, 0);
}





var script = document.createElement('script');
script.onload = function () {
    console.log("hello");
    const colorThief = new ColorThief();
    const color = colorThief.getColor(g);
};
script.src = "https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js";

document.head.appendChild(script); //or something of the like
