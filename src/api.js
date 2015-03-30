'use strict'

var MinicrmApi = function() {
  // allow only one instance of api to be created
  if (MinicrmApi.prototype._singletonInstance) {
    return MinicrmApi.prototype._singletonInstance;
  }
  MinicrmApi.prototype._singletonInstance = this;

  // config
  this.requestDomain = 'devcrm.ageno.pl'
  this.requestProtocol = 'http://'

  // limits get similar contact requests to 1
  this.pendingGetContactsXhr = false
}

MinicrmApi.prototype.getRequestPath = function(account) {
  var domain = account ? account + '.' + this.requestDomain : this.requestDomain
  return this.requestProtocol + domain
}

MinicrmApi.prototype.getRequestAccount = function() {
  var deferred = new $.Deferred()
  var _this = this

  chrome.storage.local.get('requestAccount', function(response) {
    deferred.resolve(response.requestAccount)
  })

  return deferred.promise()
}

MinicrmApi.prototype.getRequestAccountPath = function() {
  var deferred = new $.Deferred()
  var _this = this

  this.getRequestAccount().then(function(slug) {
    deferred.resolve(_this.getRequestPath(slug))
  })

  return deferred.promise()
}

MinicrmApi.prototype.changeRequestAccount = function(accountName) {
  var deferred = new $.Deferred()
  var _this = this

  chrome.storage.local.set({requestAccount: accountName}, function() {
    deferred.resolve(accountName)
  })

  return deferred.promise()
}

MinicrmApi.prototype.getUser = function() {
  var deferred = new $.Deferred()
  var _this = this

  $.ajax({
    url: this.getRequestPath() + '/api/account/user',
    type: 'get',
    dataType: 'json',
    success: function(user) {
      if (user.accounts && user.accounts.length) {
        deferred.resolve(user)
      } else {
        _this.signout().then(function() {
          deferred.reject({error: 'Użytkownik nie posiada przypisanego żadnego konta'})
        })
      }
    },
    error: function(jqXHR) {
      deferred.reject(jqXHR.responseJSON)
    },
  })

  return deferred.promise()
}

MinicrmApi.prototype.signin = function(userData) {
  var deferred = new $.Deferred()
  var _this = this

  $.ajax({
    url: this.getRequestPath() + '/api/account/signin',
    type: 'post',
    data: userData,
    dataType: 'json',
    success: function(data) {
      if (data.accounts && data.accounts.length) {
        // set first account as default
        _this.changeRequestAccount(data.accounts[0].url).then(function() {
          deferred.resolve(data)
        })
      } else {
        _this.signout().always(function() {
          deferred.reject({error: 'Użytkownik nie posiada przypisanego żadnego konta'})
        })
      }
    },
    error: function(jqXHR) {
      deferred.reject(jqXHR.responseJSON)
    }
  })
  return deferred.promise()
}

MinicrmApi.prototype.signout = function() {
  chrome.storage.local.clear()
  return $.ajax({
    url: this.getRequestPath() + '/api/account/signout',
    type: 'get',
    dataType: 'json'
  })
}

MinicrmApi.prototype.getContacts = function(requestData) {
  var deferred = new $.Deferred()
  var _this = this

  // kill older request which hasn't been ended yet
  if (this.pendingGetContactsXhr) {
    this.pendingGetContactsXhr.abort()
  }

  this.getRequestAccountPath().then(function(path) {
    _this.pendingGetContactsXhr = $.ajax({
      url: path + '/api/contact',
      type: 'get',
      data: requestData,
      dataType: 'json',
      success: function(data) {
        deferred.resolve(data)
      },
      error: function(jqXHR) {
        deferred.reject(jqXHR.responseJSON)
      },
      always: function() {
        _this.pendingGetContactsXhr = false
      }
    })
  })

  return deferred.promise()
}

MinicrmApi.prototype.saveContact = function(contact) {
  var deferred = new $.Deferred()
  var _this = this

  this.getRequestAccountPath().then(function(path) {
    $.ajax({
      url: path + '/api/contact',
      type: 'post',
      data: contact,
      dataType: 'json',
      success: function(data) {
        deferred.resolve(data)
      },
      error: function(jqXHR) {
        deferred.reject(jqXHR.responseJSON)
      }
    })
  })

  return deferred.promise()
}
