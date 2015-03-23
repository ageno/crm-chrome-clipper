var LinkedinAggregator = function() {
  if (this.isCompany()) {
    this.elements = [
      {
        name: 'name',
        selector: '[itemprop="name"]'
      },
      {
        name: 'avatar',
        selector: 'img[itemprop="logo"]',
        attribute: 'src',
        modifier: this.parseProtocol
      },
      {
        name: 'websites',
        selector: '.website a[itemprop="url"]',
        multiple: true,
        attribute: 'href',
        modifier: this.parseWebsite
      }
    ]
  } else {
    this.elements = [
      {
        name: 'first_name',
        selector: '[itemprop="name"]',
        modifier: this.parseFirstname
      },
      {
        name: 'name',
        selector: '[itemprop="name"]',
        modifier: this.parseLastname
      },
      {
        name: 'city',
        selector: '[itemprop="addressLocality"]'
      },
      {
        name: 'avatar',
        selector: 'meta[itemprop="image"]',
        attribute: 'content',
        modifier: this.parseProtocol
      },
      {
        name: 'websites',
        selector: '[itemprop="address"] .pages a',
        multiple: true,
        attribute: 'href',
        modifier: this.parseWebsite
      }
    ]
  }

  BaseAggregator.apply(this, arguments)
}

LinkedinAggregator.prototype = BaseAggregator.prototype
LinkedinAggregator.prototype.constructor = BaseAggregator

LinkedinAggregator.prototype.isCompany = function() {
  return (document.querySelector('body').className.indexOf('employer') > -1) ? true : false
}
