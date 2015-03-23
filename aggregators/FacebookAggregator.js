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
        modifier: this.getAvatar
      },
      {
        name: 'websites',
        selector: '._2kcr._42ef[rel=nofollow]',
        modifier: this.parseWebsite,
        multiple: true
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
        name: 'emails',
        selector: '._4bl7._4bl8 [href^=mailto]',
        multiple: true,
        modifier: this.parseEmail
      },
      {
        name: 'avatar',
        selector: '.profilePic.img',
        attribute: 'src',
        modifier: this.getAvatar
      },
      {
        name: 'websites',
        selector: '._4bl7._4bl8 [rel="nofollow me"]',
        modifier: this.parseWebsite,
        multiple: true
      }
    ]
  }

  BaseAggregator.apply(this, arguments)
}

FacebookAggregator.prototype = BaseAggregator.prototype
FacebookAggregator.prototype.constructor = BaseAggregator

FacebookAggregator.prototype.getAvatar = function() {
  var path = window.location.pathname
  if (this.type == 'company')
    var pattern = '\/(.+)\/info'
  else if (this.type == 'person')
    var pattern = '\/(.+)\/about'

  var regex = new RegExp(pattern).exec(path)
  if (regex && regex.length) {
    username = regex[1] // get first group
    return 'https://graph.facebook.com/' + username + '/picture?type=square'
  } else {
    return false
  }
}
