var FacebookAggregator = function() {
  this.type = this.getContactType()

  if (this.type == 'company') {
    this.elements = [
      {
        name: 'name',
        selector: '._58gi'
      },
      {
        name: 'avatar',
        selector: false,
        value: this.getAvatar
      },
      {
        name: 'phones',
        selector: '._2n7q._42ef._c24._50f3',
        multiple: true,
        modifier: this.parsePhone
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
        selector: false,
        value: this.getAvatar
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

FacebookAggregator.prototype = new BaseAggregator()
FacebookAggregator.prototype.constructor = BaseAggregator

FacebookAggregator.prototype.getAvatar = function() {
  var path = window.location.pathname + window.location.search
  /*
    // for simple tests  
    var regex = new RegExp(pattern)
    tests.forEach(function(path) {
      console.log(regex.exec(path))
    })
  */
  if (this.type == 'company') {
    /*
      var tests = [
        '/sushidopl',
        '/sushidopl?fref=ts',
        '/sushidopl/info?tab=overview',
        '/pages/PZ2SOMSiT/295807223800306?fref=ts',
        '/ageno.internet/info?tab=overview',
      ]
    */
    var pattern = /\/(?:pages\/[a-zA-Z0-9]*\/)?([^\/?&]+)(?:\?|\/)?/
  } else if (this.type == 'person') {
    /*
      var tests = [
        '/profile.php?id=100006937815053&fref=ts',
        '/Wujku',
      ]
    */
    var pattern = /\/(?:profile\.php\?id=)?([^\/?&]+)(?:\\?|\/)?/
  }

  var regex = new RegExp(pattern).exec(path)
  if (regex && regex.length >= 2) {
    var username = regex[1] // get first group
    return 'https://graph.facebook.com/' + username + '/picture?type=square'
  } else {
    return false
  }
}

FacebookAggregator.prototype.getContactType = function() {
  if (document.querySelector('body.pagesTimelineLayout')) {
    return 'company'
  } else if (document.querySelector('body.timelineLayout:not(.pagesTimelineLayout)')) {
    return 'person'
  } else {
    return false
  }
}