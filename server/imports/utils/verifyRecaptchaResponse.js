import { URL } from 'url';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

export function verifyRecaptchaResponse(recaptchaResponse) {
  const result = HTTP.post('https://www.google.com/recaptcha/api/siteverify', {
    params: {
      secret: Meteor.settings.recaptchaSecret,
      response: recaptchaResponse
    }
  });

  const { success, challenge_ts: challengeDateStr, hostname } = result.data;
  const challengeDate = new Date(challengeDateStr);

  if (! success) {
    throw new Meteor.Error(403, 'reCAPTCHA 驗證失敗！');
  }

  // 只接受一分鐘以內的有效 response
  if (Date.now() + 60000 < challengeDate.getTime()) {
    throw new Meteor.Error(403, 'reCAPTCHA 回應過期，請重新進行驗證！');
  }

  // 判斷 hostname 是否符合
  if (new URL(Meteor.absoluteUrl()).hostname !== hostname) {
    throw new Meteor.Error(403, 'reCAPTCHA 回應來源不符，請重新進行驗證！');
  }

  return true;
}
