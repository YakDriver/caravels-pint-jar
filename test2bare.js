// bare handler
addingDataListener();

function handleResponse(response) {
    console.log(response);
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
