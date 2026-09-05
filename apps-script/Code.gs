function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e.parameter.action;

  switch (action) {
    case 'getMembers':
      return jsonResponse(sheetToObjects(getSheet('members')));

    case 'getBadges':
      return jsonResponse(sheetToObjects(getSheet('badges')));

    case 'getRequirements': {
      var reqs = sheetToObjects(getSheet('requirements'));
      var badgeId = e.parameter.badge_id;
      if (badgeId) {
        reqs = reqs.filter(function(r) { return r.badge_id === badgeId; });
      }
      reqs.sort(function(a, b) { return a.sort_order - b.sort_order; });
      return jsonResponse(reqs);
    }

    case 'getProgress': {
      var memberId = e.parameter.member_id;
      if (!memberId) return errorResponse('member_id is required');
      var progress = sheetToObjects(getSheet('progress'));
      progress = progress.filter(function(p) { return p.member_id === memberId; });
      return jsonResponse(progress);
    }

    case 'getAllData': {
      var members = sheetToObjects(getSheet('members'));
      var badges = sheetToObjects(getSheet('badges'));
      var requirements = sheetToObjects(getSheet('requirements'));
      requirements.sort(function(a, b) { return a.sort_order - b.sort_order; });

      var result = {
        members: members,
        badges: badges,
        requirements: requirements
      };

      var mid = e.parameter.member_id;
      if (mid) {
        var allProgress = sheetToObjects(getSheet('progress'));
        result.progress = allProgress.filter(function(p) { return p.member_id === mid; });
      }

      return jsonResponse(result);
    }

    default:
      return errorResponse('Unknown action: ' + action);
  }
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var action = body.action;

  switch (action) {
    case 'markRequirement': {
      var memberId = body.member_id;
      var requirementId = body.requirement_id;
      var completed = body.completed ? 'TRUE' : 'FALSE';
      var markedBy = body.marked_by || '';
      var dateStr = new Date().toISOString().split('T')[0];

      if (!memberId || !requirementId) {
        return errorResponse('member_id and requirement_id are required');
      }

      var sheet = getSheet('progress');
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(memberId) && String(data[i][1]) === String(requirementId)) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 3, 1, 3).setValues([[completed, dateStr, markedBy]]);
      } else {
        sheet.appendRow([memberId, requirementId, completed, dateStr, markedBy]);
      }

      return jsonResponse({
        member_id: memberId,
        requirement_id: requirementId,
        completed: completed,
        date_completed: dateStr,
        marked_by: markedBy
      });
    }

    default:
      return errorResponse('Unknown action: ' + action);
  }
}
