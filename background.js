var MinicrmApi = function() {
  if ( MinicrmApi.prototype._singletonInstance ) {
    return MinicrmApi.prototype._singletonInstance;
  }
  MinicrmApi.prototype._singletonInstance = this;

  var that = this
  this.requestDomain = 'minicrm.cc';
}

MinicrmApi.prototype.getUser = function() {
  return $.ajax({
    url: 'http://' + this.requestDomain + '/api/account/user',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.changeRequestAccount = function(slug) {
  this.requestAccount = slug
}

MinicrmApi.prototype.signin = function(data) {
  var deferred = new $.Deferred()
  var _this = this
  $.ajax({
    url: 'http://' + this.requestDomain + '/api/account/signin',
    type: 'post',
    data: data,
    dataType: 'json',
    success: function(data) {
      if (data.accounts && data.accounts.length) {
        _this.requestAccount = data.accounts[0].url
        deferred.resolve(data)
      } else {
        deferred.reject({error: 'Użytkownik nie posiada przypisanego żadnego konta'})
      }
    },
    error: function(data) {
      deferred.reject(data.responseJSON)
    }
  })
  return deferred.promise()
}

MinicrmApi.prototype.signout = function() {
  return $.ajax({
    url: 'http://' + this.requestDomain + '/api/account/signout',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.getContacts = function(data) {
  return $.ajax({
    url: 'http://' + this.requestAccount + '.' + this.requestDomain + '/api/contact',
    type: 'get',
    data: data,
    dataType: 'json'
  })
}

MinicrmApi.prototype.saveContact = function(data) {
  var that = this
  return $.ajax({
    url: 'http://' + that.requestAccount + '.' + this.requestDomain + '/api/contact',
    type: 'post',
    data: data,
    dataType: 'json'
  })
}

var supportedDomains = ['facebook.com', 'goldenline.pl', 'linkedin.com']
var updateExtensionIcon = function(tabUrl) {
  var iconPath = 'images/icon96.png'

  if (tabUrl) {
    supportedDomains.every(function(domain) {
      if (tabUrl.indexOf(domain) > -1) {
        iconPath = 'images/icon96-active.png'
        return false //break loop
      } else {
        return true
      }
    })
  }

  chrome.browserAction.setIcon({path: iconPath})
}

chrome.webNavigation.onCommitted.addListener(function(details) {
  updateExtensionIcon(details.url)
})

chrome.tabs.onActivated.addListener(function(info) {
  chrome.tabs.get(info.tabId, function(tab) {
    updateExtensionIcon(tab.url)
  });
});
