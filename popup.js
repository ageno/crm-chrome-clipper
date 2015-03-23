var $container = $('.container')
var togglePreloader = function(action) {
  if (!action) {
    action = $container.hasClass('container--loading') ? 'hide' : 'show'
  }

  if (action == 'hide')
    $container.removeClass('container--loading')
  else
    $container.addClass('container--loading')
}

var changeSaveLabel = function(label) {
  var btn = $('.vcardsave__btn')

  if (label == 'save')
    btn.text('Zapisz kontakt')
  else
    btn.text('Dodaj kontakt')
}

var api
chrome.runtime.getBackgroundPage(function(backgroundWindow) {
  api = new backgroundWindow.MinicrmApi()

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    togglePreloader('hide')

    api.getUser().then(function(user) {
      MinicrmUser = user
      if (MinicrmUser)
        showVcard(tabs[0], api.user)
      else
        showLogin(tabs[0])
    })
  })
})


var templates = {
  login: $('#template-login').html(),
  vcard: {
    primary: $('#vcard').html(),
    similar: $('#vcard-similar').html(),
    header: $('#vcard-header').html(),
    form: $('#vcard-form').html()
  },
  vcardSaved: $('#vcard-saved').html(),
  error: $('#template-error').html(),
}

var fillVcardForms = function(data) {
  $('#vcardform').html(Mustache.render(templates.vcard.form, {
    data: data
  }))
  $('#vcardheader').html(Mustache.render(templates.vcard.header, {
    data: data
  }))
}

var showSavedContact = function(contact) {
  $container.html(Mustache.render(templates.vcardSaved, contact))
}

var showError = function(message) {
  $container.html(Mustache.render(templates.error, {
    message: message
  }))
  $container.find('[data-reload]').on('click', function() {
    window.location.reload()
  })
}

var fetchSimilar = function(response) {
  if (!response)
    return

  // reset when fetching after account change
  changeSaveLabel('add')
  $('#vcardsimilar').html('')

  api.getContacts({
    name: response.name,
    first_name: response.firstName
  }).done(function(data) {
    if (data.length) {
      var contacts = data
      var html = Mustache.render(templates.vcard.similar, {
        contacts: contacts,
        hasContacts: !!contacts.length
      })
      $('#vcardsimilar').html(html)
      $('#vcardsimilar [data-contact-id]').on('click', function() {
        var $this = $(this)
        var activeClass = 'similaritem--active'

        if ($this.hasClass(activeClass)) {
          // when toggling active leave fields but save as new contact
          $this.removeClass(activeClass)
          $('[name=id]').val('')
          changeSaveLabel('add')
        } else {
          var contactId = $this.data('contact-id')
          var contact = $.grep(contacts, function(element) {
            return element.id == contactId
          })[0]

          var merged = response
          for (key in contact) {
            if (contact[key] instanceof Array) {
              merged[key] = $.merge([], contact[key], response[key])
            } else if (contact[key]) {
              merged[key] = contact[key]
            }
          }

          fillVcardForms(merged)

          $this.addClass(activeClass)
          $this.siblings('.'+activeClass).removeClass(activeClass)
          changeSaveLabel('save')
        }

        showAllFields()
      })
    }
  })
}

var showAllFields = function() {
  $('.vcardform__group.hidden').removeClass('hidden')
}

var showVcard = function(tab, user) {
  chrome.tabs.sendMessage(tab.id, {action: 'getData'}, function(response) {
    $container.html(Mustache.render(templates.vcard.primary, {
      user: user
    }))

    fillVcardForms(response)
    fetchSimilar(response)

    // on unsupported sites show empty form
    if (!response) {
      showAllFields()
    }

    var $contactform = $('#contactform')
    $contactform.on('submit', function(e) {
      e.preventDefault()

      var contactData = $contactform.find(':input').filter(function () {
        // exclude empty fields
        return $.trim(this.value).length > 0
      }).serializeJSON()

      api.saveContact(contactData)
        .success(showSavedContact)
        .fail(function() {
          showError()
        })
    })

    var $accountselect = $('#accountselect')
    $accountselect.on('change', function() {
      var slug = $(this).val()

      api.changeRequestAccount(slug)
      fetchSimilar(response)
    })

    $(document).on('change', '#showallfields', function() {
      var $checkbox = $(this)
      var $wrapper = $checkbox.closest('.vcardform__group')

      if ($checkbox.is(':checked')) {
        showAllFields()
        $wrapper.remove()
      }
    })

    $(document).on('click', '[data-addinput]', function() {
      var $this = $(this)
      var name = $this.data('addinput')
      var $input = $('[name="'+name+'"]').first().clone().val('')
      $this.before($input)
    })
  })
}

var showLogin = function(tab, error) {
  $container.html(Mustache.render(templates.login, {
    error: error
  }))

  var $form = $container.find('form')
  $form.on('submit', function(e) {
    e.preventDefault()
    togglePreloader('show')

    api.signin($form.serializeJSON())
      .done(function(user) {
        showVcard(tab, user)
      })
      .fail(function(data) {
        showLogin(tab, data)
      })
      .always(function() {
        togglePreloader('hide')
      })
  })
}
