// bare handler
addingDataListener();

function getDateFormat(d) {
    return d.getFullYear() + "-" + (d.getMonth() + 1).toString().padStart(2, '0') + "-" + d.getDate().toString().padStart(2, '0') + " " + d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
}

function handleResponse(response) {
    let obj = JSON.parse(response);

    if (obj.photos) {
        for (var i in obj.photos) {
            let create = new Date(obj.photos[i].created_at);
            let highDate = new Date(obj.photos[i].highest_rating_date);
            console.log(
                obj.photos[i].id + "\t" +
                obj.photos[i].name + "\t" +
                obj.photos[i].highest_rating + "\t" +
                obj.photos[i].rating + "\t" +
                //obj.photos[i].created_at + "\t" +
                getDateFormat(create) + "" + "\t" +
                getDateFormat(highDate) + "\t" +
                obj.photos[i].category + "\t" +
                obj.photos[i].times_viewed + "\t" +
                obj.photos[i].votes_count + "\t" +
                obj.photos[i].comments_count + "\t"
            );
        }
        //console.log(obj.photos);
        //obj.photos.forEach(function (element) {
        //    console.log(element.id + "\t" + element.name + "\t" + element.highest_rating + "\t" + element.rating);
        //});
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

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
