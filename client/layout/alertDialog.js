'use strict';
import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

export const rShowAlertDialog = new ReactiveVar(false);
let strAlertDialogTitle = '';
let strAlertDialogMessage = '';
let strAlertDialogDefaultValue = null;
let strAlertDialogType = 'alert';
let strAlertDialogInputType = 'text';
let strAlertDialogCustomSetting = '';
let funcAlertDialogCallback = null;
let blAlertDialogOK = false;
let blRecaptcha = false;

export const alertDialog = {
  dialog: function(options) {
    strAlertDialogType = options.type;
    strAlertDialogTitle = options.title;
    strAlertDialogMessage = options.message;
    strAlertDialogInputType = options.inputType || 'text';
    strAlertDialogDefaultValue = options.defaultValue || null;
    strAlertDialogCustomSetting = options.customSetting || '';
    funcAlertDialogCallback = options.callback;
    blRecaptcha = options.recaptcha || false;
    blAlertDialogOK = false;
    rShowAlertDialog.set(true);
  },
  alert: function(options) {
    const defaultOption = {
      type: 'alert',
      title: ''
    };

    if (typeof options === 'string') {
      defaultOption.message = options;
      options = {};
    }

    Object.assign(defaultOption, options);
    this.dialog(defaultOption);
  },
  confirm: function(options) {
    const defaultOption = {
      type: 'confirm',
      title: ''
    };

    Object.assign(defaultOption, options);
    this.dialog(defaultOption);
  },
  prompt: function(options) {
    const defaultOption = {
      type: 'prompt',
      title: ''
    };

    Object.assign(defaultOption, options);
    this.dialog(defaultOption);
  }
};

Template.alertDialog.onRendered(function() {
  const $form = this.$('form');
  if (strAlertDialogType === 'prompt') {
    $form
      .find('input:first')
      .trigger('focus');
  }
  else {
    $form
      .find('button:last')
      .trigger('focus');
  }

  $(document).on('keydown.alertDialog', (e) => {
    if (e.which === 13) { // return
      $form.trigger('submit');
    }
    else if (e.which === 27) { // ESC
      $form.trigger('reset');
    }
  });

  if (blRecaptcha) {
    this.recaptchaClientId = grecaptcha.render(this.$('.g-recaptcha')[0], {
      sitekey: Meteor.settings.public.recaptchaSiteKey,
      badge: 'inline',
      size: 'invisible',
      hl: 'zh-tw',
      callback: (recaptchaResponse) => {
        this.recaptchaResponse = recaptchaResponse;
        rShowAlertDialog.set(false);
      }
    });
  }
});
Template.alertDialog.onDestroyed(function() {
  $(document).off('keydown.alertDialog');

  const callback = funcAlertDialogCallback;
  const ok = blAlertDialogOK;
  if (strAlertDialogType === 'prompt') {
    const value = this.$('input').val();
    this.$('input').val('');
    if (callback) {
      callback(ok && value, this.recaptchaResponse);
    }
  }
  else if (callback) {
    callback(ok, this.recaptchaResponse);
  }
});
Template.alertDialog.helpers({
  customInput() {
    return `
      <input name="alert-dialog-custom-input" class="form-control"
             type="${strAlertDialogInputType}"
             value="${(strAlertDialogDefaultValue === null) ? '' : strAlertDialogDefaultValue}"
             ${strAlertDialogCustomSetting} />
    `;
  },
  alertDialogTitle() {
    return strAlertDialogTitle;
  },
  alertDialogMessage() {
    return strAlertDialogMessage;
  },
  showTitle() {
    return strAlertDialogTitle.length > 0;
  },
  showInput() {
    return strAlertDialogType === 'prompt';
  },
  showCancelButton() {
    return strAlertDialogType !== 'alert';
  },
  recaptchaEnabled() {
    return blRecaptcha;
  }
});
Template.alertDialog.events({
  'click [for], touchstart [for]'(event, templateInstance) {
    const forFieldName = $(event.currentTarget).attr('for');
    const $inputTarget = $(templateInstance.find(`[name="${forFieldName}"]`));

    $inputTarget.trigger('focus');
  },
  reset(event) {
    event.preventDefault();
    blAlertDialogOK = false;
    rShowAlertDialog.set(false);
  },
  submit(event, templateInstance) {
    event.preventDefault();

    blAlertDialogOK = true;

    if (blRecaptcha) {
      grecaptcha.execute(templateInstance.recaptchaClientId);
    }
    else {
      rShowAlertDialog.set(false);
    }
  }
});
