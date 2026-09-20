var SPREADSHEET_ID = '1jUiiVcpw-XEI26A-eJ-XnoKrCx0fgTfopPEn5JE1jA4';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheetName = 'Website RSVPs';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Attending', 'Guests', 'Events', 'Message']);
    }

    var events = (data.events || []).join(', ');

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.attending || '',
      data.guests || '',
      events,
      data.message || ''
    ]);

    var mailSent = false;
    var mailError = null;

    if (data.email) {
      var subject = "We've received your RSVP — Dishant & Nirshita";
      var body =
        'Hi ' + (data.name || 'there') + ',\n\n' +
        "Thank you for RSVPing to our wedding! Here's a copy of what you submitted:\n\n" +
        'Response: ' + data.attending + '\n' +
        'Number of Guests: ' + data.guests + '\n' +
        'Attending: ' + (events || 'Not specified') + '\n' +
        (data.message ? 'Message: ' + data.message + '\n' : '') +
        "\nWe can't wait to celebrate with you in February 2027!\n\n" +
        'With love,\nDishant & Nirshita';

      try {
        MailApp.sendEmail(data.email, subject, body);
        mailSent = true;
      } catch (mailErr) {
        mailError = mailErr.message;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      mailSent: mailSent,
      mailError: mailError,
      remainingQuota: MailApp.getRemainingDailyQuota()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
