function ebx_openURL(url) {
	var openWindowHasFailed = false;
	var openedWindow = null;

	var url = url.trim();

	if (url.length > 0) {
		// default old values
		var height = 400, width = 400;
		if (EBX_LayoutManager.lastWorkspaceSizeComputed !== null) {
			height = EBX_LayoutManager.lastWorkspaceSizeComputed.h;
			width = EBX_LayoutManager.lastWorkspaceSizeComputed.w;
		}
		try {
			if(ebx_openURL_inNewWindow === false) {
				openedWindow = window.open(ebx_resolvePreviewURL(url), "_blank");
			} else {
				openedWindow = window.open(ebx_resolvePreviewURL(url), null, "height=" + height + ",width=" + width
				+ ",status=yes,toolbar=no,menubar=no,resizable=yes,scrollbars=yes,location=no");
			}


			if ((EBX_LayoutManager.browser === "Chrome" || EBX_LayoutManager.browser === "Safari") && openedWindow === null) {
				// IE seems to return null to window.open, even if the page is successfully loaded
				// Chrome and Safari don't care about the try catch: the error is displayed in the console and the catch block is never executed
				openWindowHasFailed = true;
			}
		} catch (ex) {
			openWindowHasFailed = true;
		}
	} else {
		// Should we display an error in case of empty URL?
		// previous behavior is no
		//		openWindowHasFailed = true;
	}

	if (openWindowHasFailed === true) {
    var escapedUrl = url
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

		var errorMessage = EBX_LocalizedMessage.openURLInNewWindow_urlError;
    errorMessage = errorMessage.replace(new RegExp(ebx_openURL_error_URLPattern, 'g'), escapedUrl);

		ebx_alert(errorMessage);
	}
}

function ebx_resolvePreviewURL(url) {
	if (url.indexOf("/") == 0) {
		return url;
	}
	if (url.indexOf(".") == 0) {
		return url;
	}
	if (url.indexOf("://") > 0) {
		return url;
	}
	if (url.indexOf(":\\") > 0) {
		return url;
	}
	// allow raw data previews
	if (url.indexOf("data:") == 0) {
		return url;
	}

	return "http://" + url;
}

/**
 * ****************************************** Table sort criteria
 * *****************************************
 */
var EBX_TABLE_SORT_ALL_SORTABLE_FIELDS = new Array();
var ebx_tableSort_sortedFields = new Array();

var EBX_TABLE_SORT_ASCENDING_LABEL;
var EBX_TABLE_SORT_DESCENDING_LABEL;
var EBX_TABLE_SORT_ASCENDING_KEY;
var EBX_TABLE_SORT_DESCENDING_KEY;
var EBX_TABLE_SORT_MOVE_UP_BUTTON_ID;
var EBX_TABLE_SORT_MOVE_DOWN_BUTTON_ID;

var EBX_TABLE_SORT_PARAMETER_NAME;

function EBX_TableSortCriterion(nodePath, nodeLabel, sortOrder) {
	this.onNodePath = nodePath;
	this.onNodeLabel = nodeLabel;
	this.onSortOrder = sortOrder;

	this.isSortedAscending = function() {
		if (this.onSortOrder == EBX_TABLE_SORT_ASCENDING_KEY) {
			return true;
		}
		return false;
	};
}

function ebx_tableSort_clearSelect(selectToClear) {
	for (var i = selectToClear.length - 1; i >= 0; i--) {
		var achild = selectToClear.options[i];
		selectToClear.removeChild(achild);
	}
}

function ebx_tableSort_populateSortedList() {
	var sortedList = document.getElementById('onSortedList');
	if (!sortedList) {
		return;
	}

	var selectedIndex = sortedList.selectedIndex;
	ebx_tableSort_clearSelect(sortedList);

	for (var i = 0; i < ebx_tableSort_sortedFields.length; i++) {
		var aCriterion = ebx_tableSort_sortedFields[i];
		var newOption = document.createElement('option');
		newOption.value = aCriterion.onNodePath;
		if (aCriterion.isSortedAscending()) {
			newOption.text = aCriterion.onNodeLabel + ' ( ' + EBX_TABLE_SORT_ASCENDING_LABEL + ' )';
		} else {
			newOption.text = aCriterion.onNodeLabel + ' ( ' + EBX_TABLE_SORT_DESCENDING_LABEL + ' )';
		}
		sortedList.options.add(newOption);
	}
	sortedList.selectedIndex = selectedIndex;

	ebx_tableSort_displayMoveButtons();
}

function ebx_tableSort_isSorted(nodePath) {
	return this.ebx_tableSort_getCriterionForPath(nodePath) != null;
}

function ebx_tableSort_getCriterionForPath(aPath) {
	for (var i = 0; i < ebx_tableSort_sortedFields.length; i++) {
		var aCriterion = ebx_tableSort_sortedFields[i];
		if (aCriterion.onNodePath == aPath) {
			return aCriterion;
		}
	}
	return null;
}

function ebx_tableSort_populateSortableList() {
	var sortableList = document.getElementById('onSortableList');
	if (!sortableList) {
		return;
	}
	ebx_tableSort_clearSelect(sortableList);

	for (var i = 0; i < EBX_TABLE_SORT_ALL_SORTABLE_FIELDS.length; i++) {
		var aField = EBX_TABLE_SORT_ALL_SORTABLE_FIELDS[i];
		if (ebx_tableSort_isSorted(aField[0])) {
			continue;
		}
		var newOption = document.createElement('option');
		newOption.value = aField[0];
		newOption.text = aField[1];
		sortableList.options.add(newOption);
	}
}

function ebx_tableSort_addCriterion() {
	var sortableList = document.getElementById('onSortableList');
	if (sortableList.selectedIndex == -1) {
		return;
	}

	var nodeToAdd = sortableList.options[sortableList.selectedIndex];
	ebx_tableSort_sortedFields[ebx_tableSort_sortedFields.length] = new EBX_TableSortCriterion(nodeToAdd.value, nodeToAdd.innerHTML,
			EBX_TABLE_SORT_ASCENDING_KEY);
	ebx_tableSort_displaySorted();
	ebx_tableSort_updateResult();
}

function ebx_tableSort_removeSelectedCriterion() {
	var sortedList = document.getElementById('onSortedList');
	if (sortedList.selectedIndex == -1) {
		return;
	}

	var nodeToRemove = sortedList.options[sortedList.selectedIndex];
	ebx_tableSort_sortedFields.splice(sortedList.selectedIndex, 1);
	sortedList.removeChild(nodeToRemove);
	ebx_tableSort_displayMoveButtons();

	ebx_tableSort_updateResult();
}

function ebx_tableSort_sortAscending() {
	var sortedList = document.getElementById('onSortedList');
	if (sortedList.selectedIndex == -1) {
		return;
	}

	var optionToUpdate = sortedList.options[sortedList.selectedIndex];
	var criterion = this.ebx_tableSort_getCriterionForPath(optionToUpdate.value);
	if (!criterion) {
		return;
	}
	criterion.onSortOrder = EBX_TABLE_SORT_ASCENDING_KEY;
	this.ebx_tableSort_displaySorted();

	ebx_tableSort_updateResult();
}

function ebx_tableSort_sortDescending() {
	var sortedList = document.getElementById('onSortedList');
	if (sortedList.selectedIndex == -1) {
		return;
	}

	var optionToUpdate = sortedList.options[sortedList.selectedIndex];
	var criterion = this.ebx_tableSort_getCriterionForPath(optionToUpdate.value);
	if (!criterion) {
		return;
	}
	criterion.onSortOrder = EBX_TABLE_SORT_DESCENDING_KEY;
	this.ebx_tableSort_displaySorted();

	ebx_tableSort_updateResult();
}

function ebx_tableSort_moveSelectedUp() {
	var sortedList = document.getElementById('onSortedList');
	var currentIndex = sortedList.selectedIndex;
	if (currentIndex == -1) {
		return;
	}

	if (currentIndex == 0) {
		return;
	}

	var criterionToMoveUp = ebx_tableSort_sortedFields[currentIndex];
	var criterionToMoveDown = ebx_tableSort_sortedFields[currentIndex - 1];

	var part1 = ebx_tableSort_sortedFields.slice(0, currentIndex - 1);
	part1.push(criterionToMoveUp);
	part1.push(criterionToMoveDown);
	var part2 = ebx_tableSort_sortedFields.slice(currentIndex + 1);

	ebx_tableSort_sortedFields = part1.concat(part2);
	ebx_tableSort_displaySorted();
	sortedList.selectedIndex = currentIndex - 1;
	ebx_tableSort_displayMoveButtons();

	ebx_tableSort_updateResult();
}

function ebx_tableSort_moveSelectedDown() {
	var sortedList = document.getElementById('onSortedList');
	var currentIndex = sortedList.selectedIndex;
	if (currentIndex == -1) {
		return;
	}

	if (currentIndex == sortedList.options.length - 1) {
		return;
	}

	var criterionToMoveDown = ebx_tableSort_sortedFields[currentIndex];
	var criterionToMoveUp = ebx_tableSort_sortedFields[currentIndex + 1];

	var part1 = ebx_tableSort_sortedFields.slice(0, currentIndex);
	part1.push(criterionToMoveUp);
	part1.push(criterionToMoveDown);
	var part2 = ebx_tableSort_sortedFields.slice(currentIndex + 2);

	ebx_tableSort_sortedFields = part1.concat(part2);
	ebx_tableSort_displaySorted();
	sortedList.selectedIndex = currentIndex + 1;
	ebx_tableSort_displayMoveButtons();

	ebx_tableSort_updateResult();
}

function ebx_tableSort_displaySortable() {
	var sortable = document.getElementById('onSortable');
	var sorted = document.getElementById('onSorted');
	ebx_tableSort_populateSortableList();
	sortable.style.display = '';
	sorted.style.display = 'none';
}

function ebx_tableSort_displayMoveButtons() {
	if (ebx_tableSort_sortedFields.length <= 1) {
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_UP_BUTTON_ID), true);
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_DOWN_BUTTON_ID), true);
		return;
	}

	var sortedList = document.getElementById('onSortedList');

	if (sortedList.selectedIndex == -1) {
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_UP_BUTTON_ID), true);
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_DOWN_BUTTON_ID), true);
		return;
	}

	if (sortedList.selectedIndex == 0) {
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_UP_BUTTON_ID), true);
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_DOWN_BUTTON_ID), false);
		return;
	}

	if (sortedList.selectedIndex == sortedList.options.length - 1) {
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_UP_BUTTON_ID), false);
		EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_DOWN_BUTTON_ID), true);
		return;
	}

	EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_UP_BUTTON_ID), false);
	EBX_ButtonUtils.setButtonDisabled(document.getElementById(EBX_TABLE_SORT_MOVE_DOWN_BUTTON_ID), false);
}

function ebx_tableSort_updateResult() {
	var resultInputField = document.getElementById(EBX_TABLE_SORT_PARAMETER_NAME);
	var newResult = "";
	for (var i = 0; i < ebx_tableSort_sortedFields.length; i++) {
		newResult += ebx_tableSort_sortedFields[i].onNodePath + ":" + ebx_tableSort_sortedFields[i].onSortOrder;
		if (i != ebx_tableSort_sortedFields.length - 1) {
			newResult += ";";
		}
	}
	resultInputField.value = newResult;
	return newResult;
}

function ebx_tableSort_displaySorted() {
	var sortable = document.getElementById('onSortable');
	var sorted = document.getElementById('onSorted');
	ebx_tableSort_populateSortedList();
	sortable.style.display = 'none';
	sorted.style.display = '';
}

/**
 * ****************************************** Table sort criteria
 * *****************************************
 */

//START *************************** Button and menu actions ********************************/
function ebx_actionMenuExecute(actionURL, tableName, activationConstraintsArray, aConfirmationMessage, isJSAction, actionLabel) {
	if (!ebx_actionCheckConstraints(tableName, activationConstraintsArray, actionLabel))
		return;

	var jsCmd = actionURL;
	if (!isJSAction) {
		jsCmd = "window.location = \"" + actionURL + "\";";
	}

	if (aConfirmationMessage != null) {
		ebx_confirm({
			question: aConfirmationMessage,
			jsCommandYes: jsCmd
		});
		return;
	}

	window.setTimeout(jsCmd, 0);
}

//TODO ycl/cch : dirty fix for 5.7.1 GP
var isHierarchyApplied = false;
function ebx_actionCheckConstraints(tableName, activationConstraintsArray, actionLabel) {
	var nbSelectedRecord;
	//TODO ycl refactor this since a data set or data space service should not look for a table.
    if (EBX_AjaxTable.isTableExists(tableName)) {
        nbSelectedRecord = EBX_AjaxTable.getSelectedRecordsNumber(tableName);
    } else if (isHierarchyApplied) {
        nbSelectedRecord = onNbSelectedRecord;
    } else {
        nbSelectedRecord = 0;
    }

    var isAny = false;
	var isTable = false;
	var Xs = [];
	for (var i = 0, len = activationConstraintsArray.length; i < len; i++) {
		if (activationConstraintsArray[i] === -1) {
			isAny = true;
		}
		if (activationConstraintsArray[i] === 0) {
			isTable = true;
		}
		if (activationConstraintsArray[i] > 0) {
			Xs.push(activationConstraintsArray[i]);
		}
	}

	//If at least one record must be selected
	if (isAny) {
		//No selected records means an error must be raised
		if (nbSelectedRecord == 0) {
			//Except if the service is also activated on table
			if (isTable)
				return true;

			//Display error message
			ebx_alert(actionLabel, "<p>" + ebx_table_action_error_qty_oneOrMore + "</p>");
			return false;
		}

		//At least a record is selected then everything is OK.
		return true;
	}

	//If there is an activation constraints with a fixed number of selected record
	if (Xs.length > 0) {
		//No error must be raised if no record is selected and the service is activated on table
		if (nbSelectedRecord === 0 && isTable) {
			return true;
		}

		//If one of the activation constraint is the same than the number of selected records => No error must be raised
		if (EBX_Utils.arrayContains(Xs, nbSelectedRecord)) {
			return true;
		}

		//Adapt error message to the number of required records.
		if (Xs.length === 1) {
			if (Xs[0] === 1) {
				ebx_alert(actionLabel, "<p>" + ebx_table_action_error_qty_onlyOne + "</p>");
			} else {
				ebx_alert(actionLabel, "<p>" + Xs[0] + " " + ebx_table_action_error_qty_number + "</p>");
			}
		} else {
			var alertBody = [];
			alertBody.push("<p>");
			alertBody.push(ebx_table_action_error_qty_numberList);
			alertBody.push("</p>");
			alertBody.push("<ul>");
			for (i = 0, len = Xs.length; i < len; i++) {
				alertBody.push("<li>");
				alertBody.push(Xs[i]);
				alertBody.push("</li>");
			}
			alertBody.push("</ul>");
			ebx_alert(actionLabel, alertBody.join(""));
		}
		return false;
	}

	return true;
}
//END *************************** Table Actions ********************************/
