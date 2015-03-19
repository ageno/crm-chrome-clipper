$.ajaxSetup({ cache: false })

var MinicrmApi = function() {
  if ( MinicrmApi.prototype._singletonInstance ) {
    return MinicrmApi.prototype._singletonInstance;
  }
  MinicrmApi.prototype._singletonInstance = this;
  
  var that = this
  this.getUser().then(function(user) {
    if (user.accounts) {
      that.changeRequestAccount(user.accounts[0].url)
    }
  })
}

MinicrmApi.prototype.getUser = function() {
  var deferred = new $.Deferred()
  var that = this

  chrome.storage.local.get('MinicrmUser', function(data) {
    that.user = data.MinicrmUser
    deferred.resolve(data.MinicrmUser)
  })

  return deferred.promise()
}

MinicrmApi.prototype.changeRequestAccount = function(slug) {
  this.user.requestAccount = slug

  this.user.accounts.forEach(function(account) {
    if (account.url == slug)
      account.isDefault = true
    else
      account.isDefault = false
  })

  this.updateUser(this.user)
}

MinicrmApi.prototype.updateUser = function(userObject) {
  this.user = userObject
  chrome.storage.local.set({'MinicrmUser': userObject})
}

MinicrmApi.prototype.getLoggedStatus = function() {
  return $.ajax({
    url: 'http://minicrm.cc/api/is_logged',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.signin = function(data) {
  var that = this
  return $.ajax({
    url: 'http://minicrm.cc/api/account/signin',
    type: 'post',
    data: data,
    dataType: 'json',
    success: function(data) {
      that.updateUser({
        email: data.email,
        accounts: data.accounts,
        hasMultipleAccounts: (data.accounts.length > 1),
        requestAccount: data.accounts[0] ? data.accounts[0].url : false
      })
    }
  })
}

MinicrmApi.prototype.signout = function() {
  this.updateUser(false)
  chrome.storage.local.clear()

  return $.ajax({
    url: 'http://minicrm.cc/api/account/signout',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.getContacts = function(data) {
  var that = this
  return $.ajax({
    url: 'http://' + that.user.requestAccount + '.minicrm.cc/api/contact',
    type: 'get',
    data: data,
    dataType: 'json'
  })
}

MinicrmApi.prototype.saveContact = function(data) {
  var that = this
  return $.ajax({
    url: 'http://' + that.user.requestAccount + '.minicrm.cc/api/contact',
    type: 'post',
    data: data,
    dataType: 'json'
  })
}

var supportedDomains = ['facebook.com', 'goldenline.pl', 'linkedin.com']
var updateExtensionIcon = function(tabUrl) {
  var iconPath = 'images/icon.png'

  if (tabUrl) {
    supportedDomains.every(function(domain) {
      if (tabUrl.indexOf(domain) > -1) {
        iconPath = 'images/icon_active.png'
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