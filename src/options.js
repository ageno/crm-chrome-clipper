'use strict'

// namespace
var options = {}

options.toggleGuestUser = function(guest) {
  var element = document.querySelector('.optionspage')
  if (guest) {
    element.classList.remove('optionspage--user')
  } else {
    element.classList.add('optionspage--user')
  }
}

chrome.runtime.getBackgroundPage(function(backgroundWindow) {
  var api = new backgroundWindow.MinicrmApi()

  api.getUser().then(function(user) {
    if (user) {
      document.querySelector('.logout__name').innerText = user.email
      options.toggleGuestUser(false)
    }

    document.querySelector('[data-logout]').addEventListener('click', function() {
      api.signout()
      options.toggleGuestUser(true)
    })
  })
})
