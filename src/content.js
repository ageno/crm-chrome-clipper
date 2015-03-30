var getLocationHost = function() {
  return window.location.host.replace(/www\./, '')
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'getData') {
      var host = getLocationHost()
      var aggregator = {}

      switch (host) {
        case 'goldenline.pl':
          aggregator = new GoldenlineAggregator()
          break;
        case 'facebook.com':
          aggregator = new FacebookAggregator()
          break;
        case 'linkedin.com':
          aggregator = new LinkedinAggregator()
          break;
      }

      sendResponse(aggregator.data || false);
    }
  }
)
