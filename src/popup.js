'use strict'

// namespace
var popup = {}

popup.$container = $('.container')
popup.templates = {
  login: $('#template-login').html(),
  vcard: {
    primary: $('#template-vcard').html(),
    similar: $('#template-vcard-similar').html(),
    header: $('#template-vcard-header').html(),
    form: $('#template-vcard-form').html()
  },
  vcardSaved: $('#template-saved').html(),
  error: $('#template-error').html(),
}

popup.init = function() {
  chrome.runtime.getBackgroundPage(function(backgroundWindow) {
    popup.api = new backgroundWindow.MinicrmApi()
    popup.api.getUser()
      .done(popup.goto.vcard)
      .fail(popup.goto.login)
      .always(function() {
        popup.preloader.hide()
      })

    popup.background = backgroundWindow.background

    if (!popup.isWindow()) {
      popup.background.lastContact = false
    }
  })
}

popup.isWindow = function() {
  return (typeof popupWindow != 'undefined')
}

popup.getTemplate = function(name) {
  return $.get('templates/' + name + '.html')
}

popup.preloader = {
  show: function() {
    popup.$container.addClass('container--loading')
  },
  hide: function() {
    popup.$container.removeClass('container--loading')
  }
}

popup.changeSaveLabel = function(label) {
  var btn = $('.vcardsave__btn')

  if (label == 'save') {
    btn.text('Zapisz kontakt')
  } else {
    btn.text('Dodaj kontakt')
  }
}

popup.showAllFields = function() {
  $('.vcardform__group.hidden').removeClass('hidden')
  $('#showallfields').closest('.vcardform__group').remove()
}

// merge only non existing properties from second to first contact
// first contact is changed by reference
popup.mergeContacts = function(first, second) {
  for (var prop in second) {
    if ($.isArray(second[prop])) {
      var compareProp = false
      var comparePropModifier = false

      switch (prop) {
        case 'websites':
          compareProp = 'url'
          comparePropModifier = function(value) {
            // escape trailing slash
            // the same happen in aggregator
            // prevents from url duplication when one contact has trailing slash
            return value.replace(/\/+$/, '')
          }
          break;
        case 'emails':
          compareProp = 'address'
          break;
        case 'phones':
          compareProp = 'number'
          break;
      }

      if (compareProp) {
        second[prop].forEach(function(element, index) {
          first[prop] = first[prop] || [] // make sure grep operates on array
          var searchResults = $.grep(first[prop], function(searchElement) {
            if (comparePropModifier) {
              element[compareProp] = comparePropModifier(element[compareProp])
            }
            return element[compareProp] == searchElement[compareProp]
          })

          // push only when does not exist in first contact
          if (searchResults.length == 0) {
            first[prop].push(element)
          }
        })
      }
    } else if (prop == 'avatar' && first[prop]) {
      // always leave updated avatar
    } else if (second[prop]) {
      first[prop] = second[prop]
    }
  }

  return first
}

popup.fetchSimilarContacts = function(contact) {
  // reset when fetching after account change
  popup.changeSaveLabel('add')
  $('#vcardsimilar').html('')

  popup.api.getContacts({
    name: contact.name,
    first_name: contact.firstName
  }).done(function(similarContacts) {
    if (!similarContacts.length) {
      return
    }

    popup.getTemplate('vcard/similar').then(function(template) {
      var html = Mustache.render(template, {
        contacts: similarContacts,
        hasContacts: !!similarContacts.length // helper property used in template
      })
      $('#vcardsimilar').html(html)

      var isMerged = false

      $('#vcardsimilar [data-contact-id]').on('click', function() {
        var $this = $(this)
        var activeClass = 'similaritem--active'

        // restore not-merged contact
        if (isMerged) {
          popup.fillVcardForms(contact, true)
        }

        if ($this.hasClass(activeClass)) {
          $this.removeClass(activeClass)
          $('[name=id]').val('') // without id api saves as new contact
          popup.changeSaveLabel('add')
        } else {
          var similarContactId = $this.data('contact-id')
          // get similar contact from pulled data
          var similarContact = $.grep(similarContacts, function(element) {
            return element.id == similarContactId
          })[0]
          var mergedContact = $.extend(true, {}, contact) // deep object clone

          popup.mergeContacts(mergedContact, similarContact)

          popup.fillVcardForms(mergedContact, true)
          $this.addClass(activeClass)
          $this.siblings('.' + activeClass).removeClass(activeClass)
          popup.changeSaveLabel('save')
          isMerged = true
        }
      })
    })
  })
}

popup.openWindow = function() {
  chrome.windows.create({url: 'popup-window.html', type: 'popup', width: 330, height: 400})
}

// views namespace
popup.goto = {}

popup.goto.login = function(errorText) {
  popup.getTemplate('login').then(function(template) {
    popup.$container.html(Mustache.render(template, {
      error: errorText
    }))

    var $form = popup.$container.find('form')
    $form.on('submit', function(e) {
      e.preventDefault()
      popup.preloader.show()

      popup.api.signin($form.serializeJSON())
        .done(function(user) {
          popup.api.getUser().always(popup.goto.vcard)
        })
        .fail(function(message) {
          popup.goto.login(message)
        })
        .always(function() {
          popup.preloader.hide()
        })
    })
  })
}

popup.fillVcardForms = function(data, showAllFields) {
  popup.getTemplate('vcard/header').then(function(template) {
    $('#vcardheader').html(Mustache.render(template, {
      data: data
    }))
  })

  popup.getTemplate('vcard/form').then(function(template) {
    $('#vcardform').html(Mustache.render(template, {
      data: data
    }))

    if (!data) {
      popup.showAllFields()
    }

    $('#showallfields').on('change', function() {
      var $checkbox = $(this)
      var $wrapper = $checkbox.closest('.vcardform__group')

      if ($checkbox.is(':checked')) {
        popup.showAllFields()
      }
    })

    $('[data-addinput]').on('click', function() {
      var $this = $(this)
      var name = $this.data('addinput')
      var $input = $('[name="' + name + '"]').first().clone().val('')
      $this.before($input)
    })

    if (showAllFields) {
      popup.showAllFields()
    }
  })
}

popup.renderVcard = function(contact, user) {
  popup.getTemplate('vcard/vcard').then(function(template) {
    popup.$container.html(Mustache.render(template, {
      user: user,
      isWindow: popup.isWindow()
    }))

    popup.fillVcardForms(contact)
    if (contact) {
      popup.fetchSimilarContacts(contact)
      popup.background.lastContact = contact
    }

    var $contactform = $('#contactform')
    $contactform.on('submit', function(e) {
      e.preventDefault()

      var contactData = $contactform.find(':input, textarea').filter(function() {
        // exclude empty fields
        return $.trim(this.value).length > 0
      }).serializeJSON()

      popup.preloader.show()
      popup.api.saveContact(contactData)
        .done(popup.goto.saved)
        .fail(function() {
          popup.goto.error()
        })
        .always(function() {
          popup.preloader.hide()
        })
    })

    var $accountselect = $('#accountselect')
    $accountselect.on('change', function() {
      var slug = $(this).val()

      popup.api.changeRequestAccount(slug)
      popup.fetchSimilarContacts(contact)
    })

    $('#openwindow').on('click', function() {
      popup.openWindow()
    })
  })
}

popup.goto.vcard = function(user) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!popup.isWindow()) {
      // pull data from active page aggregator
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getData'}, function(contact) {
        popup.renderVcard(contact, user)
      })
    } else {
      popup.renderVcard(popup.background.lastContact, user)
    }
  })
}

popup.goto.saved = function(contact) {
  popup.getTemplate('saved').then(function(template) {
    popup.$container.html(Mustache.render(template, {
      contact: contact,
      isWindow: popup.isWindow()
    }))

    $('[data-closewindow]').on('click', function() {
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id)
      })
    })
  })
}

popup.goto.error = function(message) {
  popup.getTemplate('vcard/error').then(function(template) {
    popup.$container.html(Mustache.render(template, {
      message: message
    }))
    popup.$container.find('[data-reload]').on('click', function() {
      window.location.reload()
    })
  })
}

// init the magic
popup.init()
