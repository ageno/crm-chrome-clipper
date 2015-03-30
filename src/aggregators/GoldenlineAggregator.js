var GoldenlineAggregator = function() {
  this.type = this.getContactType()

  if (this.type == 'company') {
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
  } else if (this.type == 'person') {
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

GoldenlineAggregator.prototype = new BaseAggregator()
GoldenlineAggregator.prototype.constructor = BaseAggregator

GoldenlineAggregator.prototype.getContactType = function() {
  if (document.querySelector('body.employer-profile')) {
    return 'company'
  } else if (document.querySelector('body.userProfile')) {
    return 'person'
  } else {
    return false
  }
}