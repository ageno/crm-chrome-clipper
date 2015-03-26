var MinicrmApi = function() {
  if ( MinicrmApi.prototype._singletonInstance ) {
    return MinicrmApi.prototype._singletonInstance;
  }
  MinicrmApi.prototype._singletonInstance = this;

  this.requestDomain = 'minicrm.cc';
}

MinicrmApi.prototype.getUser = function() {
  var _this = this
  return $.ajax({
    url: 'http://' + this.requestDomain + '/api/account/user',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.changeRequestAccount = function(slug) {
  var deferred = new $.Deferred()
  var _this = this

  this.requestAccount = slug
  chrome.storage.local.set({'requestAccount': this.requestAccount}, function() {
    deferred.resolve(_this.requestAccount)
  })

  return deferred.promise()
}

MinicrmApi.prototype.getRequestAccount = function() {
  var deferred = new $.Deferred()
  var _this = this

  chrome.storage.local.get('requestAccount', function(response) {
    _this.requestAccount = response.requestAccount
    deferred.resolve(_this.requestAccount)
  })

  return deferred.promise()
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
        _this.changeRequestAccount(data.accounts[0].url).then(function() {
          deferred.resolve(data)
        })
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
  chrome.storage.local.clear()
  return $.ajax({
    url: 'http://' + this.requestDomain + '/api/account/signout',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.getContacts = function(data) {
  var deferred = new $.Deferred()
  var _this = this

  this.getRequestAccount().then(function(slug) {
    $.ajax({
      url: 'http://' + slug + '.' + _this.requestDomain + '/api/contact',
      type: 'get',
      data: data,
      dataType: 'json',
      success: function(data) {
        deferred.resolve(data)
      },
      error: function(data) {
        deferred.reject(data.responseJSON)
      }
    })
  })

  return deferred.promise()
}

MinicrmApi.prototype.saveContact = function(data) {
  var deferred = new $.Deferred()
  var _this = this

  this.getRequestAccount().then(function(slug) {
    $.ajax({
      url: 'http://' + slug + '.' + _this.requestDomain + '/api/contact',
      type: 'post',
      data: data,
      dataType: 'json',
      success: function(data) {
        deferred.resolve(data)
      },
      error: function(data) {
        deferred.reject(data.responseJSON)
      }
    })
  })

  return deferred.promise()
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
