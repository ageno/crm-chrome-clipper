var FacebookAggregator = function() {
  this.type = this.getType()

  if (this.type == 'company') {
    this.elements = [
      {
        name: 'name',
        selector: '._58gi'
      },
      {
        name: 'avatar',
        selector: '.profilePic.img',
        attribute: 'src',
        modifier: this.parseProtocol
      },
      {
        name: 'websites',
        selector: '._2kcr._42ef',
        attribute: 'href',
        modifier: this.parseProtocol
      }
    ]
  } else if (this.type == 'person') {
    this.elements = [
      {
        name: 'first_name',
        selector: '#fb-timeline-cover-name',
        modifier: this.parseFirstname
      },
      {
        name: 'name',
        selector: '#fb-timeline-cover-name',
        modifier: this.parseLastname
      },
      {
        name: 'city',
        selector: '.fsm .uiList._4kg'
      },
      {
        name: 'avatar',
        selector: '.profilePic.img',
        attribute: 'src',
        modifier: this.getAvatar
      },
      {
        name: 'websites',
        selector: '._4bl9._2pis._2dbl ._c24._50f3 a[rel]',
        modifier: this.parseProtocol
      }
    ]
  }

  BaseAggregator.apply(this, arguments)
}

FacebookAggregator.prototype = BaseAggregator.prototype
FacebookAggregator.prototype.constructor = BaseAggregator

FacebookAggregator.prototype.getType = function() {
  if (document.querySelector('[itemtype="http://schema.org/Organization"]')) {
    return 'company'
  } else if (document.querySelector('[itemtype="http://schema.org/Person"]')) {
    return 'person'
  } else {
    return false
  }
}

FacebookAggregator.prototype.getAvatar = function() {
    // TODO: Only in profile page, get ID parameter from url when exist
    var path = window.location.pathname
    if (path.length) {
        path = 'https://graph.facebook.com/' + path + '/picture?type=large'
    }
    return path;
}