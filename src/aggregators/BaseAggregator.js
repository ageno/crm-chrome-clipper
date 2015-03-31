'use strict'

var CrmBaseAggregator = function(type) {
  this.data = this.getData()
}

CrmBaseAggregator.prototype.getData = function() {
  var _this = this

  if (this.elements) {
    var data = {}
    this.elements.forEach(function(element) {
      if (typeof(element.value) == 'function') {
        data[element.name] = element.value.call(_this)
      } else if (element.value) {
        data[element.name] = element.value
      } else {
        data[element.name] = element.multiple ? _this.getMultipleData(element) : _this.getSingleData(element)
      }
    })
    data.is_company = (this.type == 'company') ? true : false

    if (!data.websites) {
      data.websites = []
    }

    var currentUrl = location.href.replace(/\?.*/, '') // remove GET params from url
    data.websites.push(this.parseWebsite(currentUrl))
  }

  return data || false
}

CrmBaseAggregator.prototype.getSingleData = function(element) {
  var domElement = document.querySelector(element.selector)
  return domElement ? this.getValueFromDOM(domElement, element.attribute, element.modifier) : null
}

CrmBaseAggregator.prototype.getMultipleData = function(element) {
  var domElements = document.querySelectorAll(element.selector)
  var data = []
  for (var i = domElements.length - 1; i >= 0; i--) {
    data.push(this.getValueFromDOM(domElements[i], element.attribute, element.modifier))
  }
  return data.length ? data : null
}

CrmBaseAggregator.prototype.getValueFromDOM = function(domElement, attribute, modifier) {
  var attribute = domElement.attributes ? domElement.attributes[attribute] : false
  var value = attribute ? attribute.textContent : domElement.innerText
  value = value.trim()

  if (modifier) {
    value = modifier.call(this, value)
  }

  return value || null
}

// some urls starts only with "//" also changes https for http
CrmBaseAggregator.prototype.parseProtocol = function(value) {
  return value.replace(/.*\/\//, 'http://')
}

CrmBaseAggregator.prototype.parseFirstname = function(value) {
  return value.split(/\s+/)[0]
}

CrmBaseAggregator.prototype.parseLastname = function(value) {
  var parts = value.split(/\s+/)
  parts.shift() //remove name
  return parts.join(' ')
}

CrmBaseAggregator.prototype.parseEmail = function(value) {
  return {
    address: value
  }
}

CrmBaseAggregator.prototype.parsePhone = function(value) {
  return {
    number: value
  }
}

CrmBaseAggregator.prototype.parseWebsite = function(value) {
  return {
    url: this.parseProtocol(value).replace(/\/+$/, '') // escape trailing slash
  }
}
