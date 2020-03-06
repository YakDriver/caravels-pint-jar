e = $("div.photo_thumbnail a.avatar");
e.each(function () {
    h = $(this).attr("href");
    console.log("'" + h.substring(1, h.indexOf("?")) + "',");
});
e = null;