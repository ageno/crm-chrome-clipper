'use strict'

$.ajaxSetup({
    beforeSend: function (jqXHR) {
        jqXHR.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest')
    }
})

var MinicrmApi = function() {
  // allow only one instance of api to be created
  if (MinicrmApi.prototype._singletonInstance) {
    return MinicrmApi.prototype._singletonInstance;
  }
  MinicrmApi.prototype._singletonInstance = this;

  // config
  this.requestDomain = 'minicrm.pl'
  this.requestProtocol = 'https://'

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

MinicrmApi.prototype.decorateUserAccounts = function(user) {
  var deferred = new $.Deferred()
  var _this = this

  _this.getRequestAccount().always(function(slug) {
    if (user.accounts && user.accounts.length) {
      // helper params used in view
      user.hasMultipleAccounts = !!user.accounts.length
      var foundDefaultAccount = false
      user.accounts.forEach(function(account) {
        if (account.url == slug) {
          foundDefaultAccount = true
          account.isDefault = true
        } else {
          account.isDefault = false
        }
      })

      // when user lost permission to his default account
      // change default account to first one
      if (!foundDefaultAccount) {
        _this.changeRequestAccount(user.accounts[0].url).then(function() {
          deferred.resolve(user)
        })
      } else {
        deferred.resolve(user)
      }
    } else {
      _this.signout().always(function() {
        deferred.reject({error: 'Użytkownik ' + user.email + ' nie posiada przypisanego żadnego konta'})
      })
    }
  })

  return deferred.promise()
}

MinicrmApi.prototype.getUser = function() {
  var deferred = new $.Deferred()

  $.ajax({
    url: this.getRequestPath() + '/api/account/user',
    type: 'get',
    dataType: 'json',
    context: this
  })
    .fail(function() {
      deferred.reject()
    })
    .then(this.decorateUserAccounts)
      .done(function(user) {
        deferred.resolve(user)
      })
      .fail(function(message) {
        deferred.reject(message)
      })

  return deferred.promise()
}

MinicrmApi.prototype.signin = function(userData) {
  var deferred = new $.Deferred()

  $.ajax({
    url: this.getRequestPath() + '/api/account/signin',
    type: 'post',
    data: userData,
    dataType: 'json',
    context: this
  })
    .fail(function(jqXHR) {
      deferred.reject(jqXHR.responseJSON)
    })
    .then(this.decorateUserAccounts)
      .done(function(user) {
        deferred.resolve(user)
      })
      .fail(function(message) {
        deferred.reject(message)
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
  var _this = this

  // kill older request which hasn't been ended yet
  if (this.pendingGetContactsXhr) {
    this.pendingGetContactsXhr.abort()
  }

  return this.getRequestAccountPath().then(function(path) {
    return _this.pendingGetContactsXhr = $.ajax({
      url: path + '/api/contact',
      type: 'get',
      data: requestData,
      dataType: 'json',
      always: function() {
        _this.pendingGetContactsXhr = false
      }
    })
  })
}

MinicrmApi.prototype.saveContact = function(contact) {
  return this.getRequestAccountPath().then(function(path) {
    return $.ajax({
      url: path + '/api/contact',
      type: 'post',
      data: contact,
      dataType: 'json'
    })
  })
}
