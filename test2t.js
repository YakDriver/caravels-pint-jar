// times
controlCentral();
var quit = false;

async function controlCentral() {
    await addingDataListener();
}

function handleIndividual(one) {
    if (!one.editors_choice) {
        let d = new Date(one.created_at);
        console.log(one.highest_rating + "\t" + one.rating + "\t" + d.getHours() + "\t" + d.getMinutes() + "\t");
    }
}

function handleResponse(response) {
    let obj = JSON.parse(response);

    if (obj.photos && obj.current_page == 1) {

        if (obj.photos.length > 0) {
            console.log("------------------------------------------------------------");
            console.log("Response received, page: " + obj.current_page + "/"
            + obj.total_pages + ", items: " + obj.total_items);

            console.log("HR\tR\tH\tM\t");
            for (i = 0; i < obj.photos.length; i++) {
                handleIndividual(obj.photos[i]);
            }
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

function sleeping(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
