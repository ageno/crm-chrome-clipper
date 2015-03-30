'use strict'

var getLocationHost = function() {
  return window.location.host.replace(/www\./, '')
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'getData') {
      // corresponding aggregator based on host is added in manifest.json
      var aggregator = new CrmAggregator()

      sendResponse(aggregator.data || false);
    }
  }
)
