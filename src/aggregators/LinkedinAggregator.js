'use strict'

var CrmAggregator = function () {
    this.type = this.getContactType()

    if (this.type == 'company') {
        this.elements = [
            {
                name: 'name',
                selector: '.org-top-card-module__name'
            },
            {
                name: 'avatar',
                selector: 'img.org-top-card-module__logo',
                attribute: 'src',
                modifier: this.parseProtocol
            }
        ]
    } else if (this.type == 'person') {
        this.elements = [
            {
                name: 'first_name',

                selector: '.pv-top-card-section__name',
                modifier: this.parseFirstname
            },
            {
                name: 'name',
                selector: '.pv-top-card-section__name',
                modifier: this.parseLastname
            },
            {
                name: 'avatar',
                selector: '.pv-top-card-section__photo img',
                attribute: 'src',
                modifier: this.parseProtocol
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
    if (document.querySelector('.org-top-card-module')) {
        return 'company'
    } else if (document.querySelector('.pv-profile-section')) {
        return 'person'
    } else {
        return false
    }
}