'use strict'

var CrmAggregator = function () {

    // order matter, page can be personal
    if (this.isPage() && this.isPerson()) {
        this.type = 'person'
        this.elements = [
            {
                name: 'name',
                selector: '#fb-timeline-cover-name',
                modifier: this.parseLastname
            },
            {
                name: 'first_name',
                selector: '#fb-timeline-cover-name',
                modifier: this.parseFirstname
            },
            {
                name: 'avatar',
                selector: false,
                value: this.getAvatar
            },
            {
                name: 'phones',
                selector: '._4bl9 ._50f3 span',
                multiple: true,
                modifier: this.parsePhone
            },
            {
                name: 'emails',
                selector: '._4bl9 ._50f3 a',
                multiple: true,
                modifier: this.parseEmail
            },
            {
                name: 'websites',
                selector: '._4bl9 ._50f3 a',
                modifier: this.parseWebsite,
                multiple: true
            }
        ]
    } else if (this.isPage()) {
        this.type = 'company'
        this.elements = [
            {
                name: 'name',
                selector: '._33vv'
            },
            {
                name: 'avatar',
                selector: false,
                value: this.getAvatar
            },
            {
                name: 'emails',
                selector: '._5aj7 ._50f4',
                multiple: true,
                modifier: this.parseEmail
            },
            {
                name: 'phones',
                selector: '._5aj7 ._50f4',
                multiple: true,
                modifier: this.parsePhone
            },
            {
                name: 'websites',
                selector: '._5aj7 ._50f4',
                modifier: this.parseWebsite,
                multiple: true
            }
        ]
    } else if (this.isPerson()) {
        this.type = 'person'
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
                name: 'avatar',
                selector: false,
                value: this.getAvatar
            },
            {
                name: 'phones',
                selector: '._4bl9 ._50f3 span',
                multiple: true,
                modifier: this.parsePhone
            },
            {
                name: 'emails',
                selector: '._4bl9 ._50f3 a',
                multiple: true,
                modifier: this.parseEmail
            },
            {
                name: 'websites',
                selector: '._4bl9 ._50f3 a',
                modifier: this.parseWebsite,
                multiple: true
            }
        ]
    }
    this.elements.push({
        name: "isFacebook",
        value: 1
    });

    CrmBaseAggregator.apply(this, arguments)
}

CrmAggregator.prototype = new CrmBaseAggregator()
CrmAggregator.prototype.constructor = CrmBaseAggregator

CrmAggregator.prototype.getAvatar = function () {
    var isDefault = !!document.querySelector('.profilePic.silhouette')
    if (isDefault) {
        return false
    }

    var path = window.location.pathname + window.location.search

    /*
     // for simple tests
     var regex = new RegExp(pattern)
     tests.forEach(function(path) {
     console.log(regex.exec(path))
     })
     */
    if (this.type == 'company') {
        var url = document.querySelector('meta[property="al:android:url"]').getAttribute('content');

        var pattern = /page\/([\d]+)/;

        var regex = new RegExp(pattern).exec(url)

        if (regex && regex.length >= 2) {
            var username = regex[1] // get first group
            return 'https://graph.facebook.com/' + username + '/picture?width=192&height=192'
        } else {
            return false
        }

    } else if (this.type == 'person') {
        var timelineReportContainer = document.querySelector('#pagelet_timeline_main_column'),
            data = timelineReportContainer.getAttribute('data-gt'),
            obj = JSON.parse(data);

        if (obj && obj.profile_owner)
            return 'https://graph.facebook.com/' + obj.profile_owner + '/picture?width=192&height=192'
    }

    return false
}

CrmAggregator.prototype.isPerson = function () {
    var isPerson = false


    if (document.querySelector('body.timelineLayout:not(.pagesTimelineLayout)')) {
        isPerson = true;

    } else if (this.isPage()) {
        var titleElement = document.querySelector('._58gj.fsxxl.fwn.fcw')
        var allowedTitles = ['artist', 'politician', 'public figure']
        if (titleElement && allowedTitles.indexOf(titleElement.innerText.toLowerCase()) > -1) {
            isPerson = true
        }
    }

    return isPerson
}

CrmAggregator.prototype.isPage = function () {
    return !document.querySelector('body.pagesTimelineLayout')
}
