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

    case 'getDashboardData': {
      var allMembers = sheetToObjects(getSheet('members'));
      var badges = sheetToObjects(getSheet('badges'));
      var requirements = sheetToObjects(getSheet('requirements'));
      requirements.sort(function(a, b) { return a.sort_order - b.sort_order; });
      var allProgress = sheetToObjects(getSheet('progress'));
      return jsonResponse({
        members: allMembers,
        badges: badges,
        requirements: requirements,
        progress: allProgress
      });
    }

    case 'getTeamData': {
      var team = e.parameter.team;
      if (!team) return errorResponse('team is required');
      var allMembers = sheetToObjects(getSheet('members'));
      var teamMembers = allMembers.filter(function(m) { return m.team === team; });
      var badges = sheetToObjects(getSheet('badges'));
      var requirements = sheetToObjects(getSheet('requirements'));
      requirements.sort(function(a, b) { return a.sort_order - b.sort_order; });
      var memberIds = {};
      teamMembers.forEach(function(m) { memberIds[m.member_id] = true; });
      var allProgress = sheetToObjects(getSheet('progress'));
      var teamProgress = allProgress.filter(function(p) { return memberIds[p.member_id]; });
      return jsonResponse({
        members: teamMembers,
        badges: badges,
        requirements: requirements,
        progress: teamProgress
      });
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

    case 'addMember': {
      var fullName = body.full_name;
      var memberTeam = body.team;
      if (!fullName || !memberTeam) {
        return errorResponse('full_name and team are required');
      }
      var memberSheet = getSheet('members');
      var memberData = memberSheet.getDataRange().getValues();
      var maxNum = 0;
      for (var j = 1; j < memberData.length; j++) {
        var id = String(memberData[j][0]);
        if (id.charAt(0) === 'M') {
          var num = parseInt(id.substring(1), 10);
          if (num > maxNum) maxNum = num;
        }
      }
      var newId = 'M' + String(maxNum + 1).padStart(3, '0');
      memberSheet.appendRow([newId, fullName, memberTeam]);
      return jsonResponse({ member_id: newId, full_name: fullName, team: memberTeam });
    }

    case 'addBadge': {
      var badgeName = body.badge_name;
      var badgeDesc = body.description || '';
      var reqs = body.requirements || [];
      if (!badgeName) {
        return errorResponse('badge_name is required');
      }

      var badgeSheet = getSheet('badges');
      var badgeData = badgeSheet.getDataRange().getValues();
      var maxBadgeNum = 0;
      for (var b = 1; b < badgeData.length; b++) {
        var bid = String(badgeData[b][0]);
        if (bid.charAt(0) === 'B') {
          var bnum = parseInt(bid.substring(1), 10);
          if (bnum > maxBadgeNum) maxBadgeNum = bnum;
        }
      }
      var newBadgeId = 'B' + String(maxBadgeNum + 1).padStart(3, '0');
      badgeSheet.appendRow([newBadgeId, badgeName, badgeDesc]);

      var reqSheet = getSheet('requirements');
      var reqData = reqSheet.getDataRange().getValues();
      var maxReqNum = 0;
      for (var r = 1; r < reqData.length; r++) {
        var rid = String(reqData[r][0]);
        if (rid.charAt(0) === 'R') {
          var rnum = parseInt(rid.substring(1), 10);
          if (rnum > maxReqNum) maxReqNum = rnum;
        }
      }

      var createdReqs = [];
      for (var k = 0; k < reqs.length; k++) {
        var reqNum = maxReqNum + k + 1;
        var newReqId = 'R' + String(reqNum).padStart(3, '0');
        reqSheet.appendRow([newReqId, newBadgeId, reqs[k], k + 1]);
        createdReqs.push({ requirement_id: newReqId, badge_id: newBadgeId, requirement_text: reqs[k], sort_order: k + 1 });
      }

      return jsonResponse({
        badge: { badge_id: newBadgeId, badge_name: badgeName, description: badgeDesc },
        requirements: createdReqs
      });
    }

    default:
      return errorResponse('Unknown action: ' + action);
  }
}
