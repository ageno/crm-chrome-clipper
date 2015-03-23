var LinkedinAggregator = function() {
  this.type = this.getContactType()

  if (this.type == 'company') {
    this.elements = [
      {
        name: 'name',
        selector: '.name [itemprop="name"]'
      },
      {
        name: 'avatar',
        selector: 'img.image',
        attribute: 'src',
        modifier: this.parseProtocol
      }
    ]
  } else if (this.type == 'person') {
    this.elements = [
      {
        name: 'first_name',
        selector: '.full-name',
        modifier: this.parseFirstname
      },
      {
        name: 'name',
        selector: '.full-name',
        modifier: this.parseLastname
      },
      {
        name: 'avatar',
        selector: '.profile-picture img',
        attribute: 'src',
        modifier: this.parseProtocol
      }
    ]
  }

  BaseAggregator.apply(this, arguments)
}

LinkedinAggregator.prototype = new BaseAggregator()
LinkedinAggregator.prototype.constructor = BaseAggregator

LinkedinAggregator.prototype.getContactType = function() {
  if (document.querySelector('#pagekey-biz-overview-internal')) {
    return 'company'
  } else if (document.querySelector('#pagekey-nprofile_view_nonself')) {
    return 'person'
  } else {
    return false
  }
}
