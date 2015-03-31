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
  })
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

    var html = Mustache.render(popup.templates.vcard.similar, {
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
        popup.fillVcardForms(contact)
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

        popup.fillVcardForms(mergedContact)
        $this.addClass(activeClass)
        $this.siblings('.' + activeClass).removeClass(activeClass)
        popup.changeSaveLabel('save')
        isMerged = true
      }

      popup.showAllFields()
    })
  })
}

// views namespace
popup.goto = {}

popup.goto.login = function(errorText) {
  popup.$container.html(Mustache.render(popup.templates.login, {
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
}

popup.fillVcardForms = function(data) {
  $('#vcardform').html(Mustache.render(popup.templates.vcard.form, {
    data: data
  }))
  $('#vcardheader').html(Mustache.render(popup.templates.vcard.header, {
    data: data
  }))

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
}

popup.goto.vcard = function(user) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // pull data from active page aggregator
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getData'}, function(response) {
      // render vcard wireframe
      popup.$container.html(Mustache.render(popup.templates.vcard.primary, {
        user: user
      }))

      popup.fillVcardForms(response)
      if (response) {
        popup.fetchSimilarContacts(response)
      } else {
        // on unsupported sites show empty form
        popup.showAllFields()
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
        popup.fetchSimilarContacts(response)
      })
    })
  })
}

popup.goto.saved = function(contact) {
  popup.$container.html(Mustache.render(popup.templates.vcardSaved, contact))
}

popup.goto.error = function(message) {
  popup.$container.html(Mustache.render(popup.templates.error, {
    message: message
  }))
  popup.$container.find('[data-reload]').on('click', function() {
    window.location.reload()
  })
}

// init the magic
popup.init()
