var BaseAggregator = function(type) {
  this.data = this.getData()
}

BaseAggregator.prototype.getData = function() {
  var data = {}
  var that = this

  if (this.elements) {
    this.elements.forEach(function(element) {
      data[element.name] = element.multiple ? that.getMultipleData(element) : that.getSingleData(element)
    })
  }

  data.is_company = (this.type == 'company') ? true : false

  return data
}

BaseAggregator.prototype.getSingleData = function(element) {
  var domElement = document.querySelector(element.selector)
  return domElement ? this.getValueFromDOM(domElement, element.attribute, element.modifier) : null
}

BaseAggregator.prototype.getMultipleData = function(element) {
  var domElements = document.querySelectorAll(element.selector)
  var data = []
  for (var i = domElements.length - 1; i >= 0; i--) {
    data.push(this.getValueFromDOM(domElements[i], element.attribute, element.modifier))
  }
  return data.length ? data : null
}

BaseAggregator.prototype.getValueFromDOM = function(domElement, attribute, modifier) {
  var attribute = domElement.attributes ? domElement.attributes[attribute] : false
  var value = attribute ? attribute.textContent : domElement.innerText
  value = value.trim()

  if (modifier)
    value = modifier.call(this, value)

  return value || null
}

// some urls starts only with "//" also changes https for http
BaseAggregator.prototype.parseProtocol = function(value) {
  return value.replace(/.*\/\//, 'http://')
}

BaseAggregator.prototype.parseFirstname = function(value) {
  return value.split(/\s+/)[0]
}

BaseAggregator.prototype.parseLastname = function(value) {
  var parts = value.split(/\s+/)
  parts.shift() //remove name
  return parts.join(' ')
}

BaseAggregator.prototype.parseEmail = function(value) {
  return {
    address: value
  }
}

BaseAggregator.prototype.parseWebsite = function(value) {
  return {
    url: this.parseProtocol(value)
  }
}

BaseAggregator.prototype.getType = function() {
  if (document.querySelector('[itemtype="http://schema.org/Organization"]')) {
    return 'company'
  } else if (document.querySelector('[itemtype="http://schema.org/Person"]')) {
    return 'person'
  } else {
    return false
  }
}
