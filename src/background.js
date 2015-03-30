'use strict'

// namespace
var background = {}

background.supportedDomains = ['facebook.com', 'goldenline.pl', 'linkedin.com']
background.updateExtensionIcon = function(tabUrl) {
  var iconPath = 'images/icon96.png'

  if (tabUrl) {
    background.supportedDomains.every(function(domain) {
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

// set active icon when browsing supported domains
chrome.webNavigation.onCompleted.addListener(function(details) {
  background.updateExtensionIcon(details.url)
})
chrome.tabs.onCreated.addListener(function(tabId) {
  background.updateExtensionIcon()
})
chrome.tabs.onActivated.addListener(function(details) {
  chrome.tabs.get(details.tabId, function(tab) {
    background.updateExtensionIcon(tab.url)
  })
})
