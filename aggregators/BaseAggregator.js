var BaseAggregator = function(type) {
  this.data = this.getData()
}

BaseAggregator.prototype.getData = function() {
  var data = {}
  var that = this

  this.elements.forEach(function(element) {
    data[element.name] = element.multiple ? that.getMultipleData(element) : that.getSingleData(element)
  })

  data.is_company = this.isCompany()

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

  if (modifier)
    value = modifier(value)

  return value ? value.trim() : null
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
