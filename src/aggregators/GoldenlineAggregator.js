'use strict'

var CrmAggregator = function () {
    this.type = this.getContactType()

    if (this.type == 'company') {
        this.elements = [
            {
                name: 'name',
                selector: '[property="name"]'
            },
            {
                name: 'avatar',
                selector: 'img[property="logo"]',
                attribute: 'src',
                modifier: this.parseProtocol
            },
            {
                name: 'websites',
                selector: '.website a[property="url"]',
                multiple: true,
                attribute: 'href',
                modifier: this.parseWebsite
            }
        ]
    } else if (this.type == 'person') {
        this.elements = [
            {
                name: 'first_name',
                selector: '[property="name"]',
                modifier: this.parseFirstname
            },
            {
                name: 'name',
                selector: '[property="name"]',
                modifier: this.parseLastname
            },
            {
                name: 'avatar',
                selector: '#user-profile-header .user-photo img',
                attribute: 'src',
                modifier: this.parseProtocol
            },
            {
                name: 'websites',
                selector: '[property="address"] .pages a',
                multiple: true,
                attribute: 'href',
                modifier: this.parseWebsite
            }
        ]
    }

    this.elements.push({
        name: "isFacebook",
        value: 0
    });
    CrmBaseAggregator.apply(this, arguments)
}

CrmAggregator.prototype = new CrmBaseAggregator()
CrmAggregator.prototype.constructor = CrmBaseAggregator

CrmAggregator.prototype.getContactType = function () {
    if (document.querySelector('body.employer-profile')) {
        return 'company'
    } else if (document.querySelector('body.user-profile')) {
        return 'person'
    } else {
        return false
    }
}