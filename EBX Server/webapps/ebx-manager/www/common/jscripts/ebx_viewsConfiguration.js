function ebx_selectHierarchyLevel(newLevel, submitButtonId) {
	document.getElementById(ebx_hierarchyLevelsConf_LevelPathParameter).value = newLevel;
	var hriLevelSubmitButton = document.getElementById(submitButtonId);

	// IE strikes again.
	// If not set, default button is chosen
	hriLevelSubmitButton.form.ebx_lastSubmitFocused = hriLevelSubmitButton;
	hriLevelSubmitButton.click();
}

var ebx_treeHelper_currentInputField = null;

var ebx_helperTreePanel;
var EBX_HELPER_TREE_PANEL_ID = "ebx_helperTreePanel";

function ebx_treeHelper_selectPath(value, concat) {
	if (ebx_treeHelper_currentInputField == null) {
		return;
	}

	if (concat) {
		EBX_Form.insertTextAtCursorPosition(ebx_treeHelper_currentInputField, value);
	} else {
		ebx_treeHelper_currentInputField.value = value;
	}

	ebx_treeHelper_hideShow(null, null);
}

function ebx_treeHelper_hideShow(helperDivId, inputFieldId, buttonId) {
	// Helper can be used on several fields in the same page
	if (ebx_helperTreePanel != null) {
		var toggleButton = document.getElementById(treeHelperCurrentButtonId);
		if (toggleButton !== null) {
			EBX_ButtonUtils.setStateToToggleButton(toggleButton, false);
		}
		ebx_treeHelper_currentInputField = null;
		treeHelperCurrentButtonId = null;
		ebx_helperTreePanel.destroy();
		ebx_helperTreePanel = null;
	}

	var aTreeDiv = document.getElementById(helperDivId);

	if (aTreeDiv == null) {
		return;
	}

	var matchingInputField = document.getElementById(inputFieldId);

	ebx_treeHelper_currentInputField = matchingInputField;
	treeHelperCurrentButtonId = buttonId;
	var bodyEl = document.body;
	if (ebx_helperTreePanel == null) {
		aTreeDiv.style.overflow = "auto";
		ebx_helperTreePanel = new YAHOO.widget.Panel(EBX_HELPER_TREE_PANEL_ID, {
			visible: false,
			close: false,
			draggable: false,
			height: "150px",
			width: matchingInputField.offsetWidth - 2 + "px",
			constraintoviewport: true,
			underlay: "none"
		});
		ebx_helperTreePanel.render(bodyEl);
		ebx_helperTreePanel.setBody(aTreeDiv.innerHTML);
		new YAHOO.widget.TreeView(ebx_helperTreePanel.body).render();
	}
	ebx_helperTreePanel.cfg.setProperty('context', [ inputFieldId, "tl", "bl" ]);
	ebx_helperTreePanel.show();
}

function EBX_AjaxSelectRecordObject(aCheckBox, aRowId, isHierarchyApplied) {
	this.checkBox = aCheckBox;
	this.rowId = aRowId;
	this.onGetExceptedResponseCode = function() {
		return 1;
	};

	this.onExecuteIfKO = function(responseXML) {
		this.onWBP_uncheckCheckBox();
	};

	this.onExecuteIfOK = function(responseXML, root) {
		var bodyElement = root.getElementsByTagName('responseBody')[0];
		// if the server wrote "" in the ajax response, the XML parser won't put a void CDATA
		// so by default, the response is ""
		var responseContent = "";
		if (bodyElement.firstChild) {
			responseContent = bodyElement.firstChild.data;
		}

		var nbSelectedRecord = parseInt(responseContent);

		if (isNaN(nbSelectedRecord)) {
			if (this.checkBox.checked === true) {
				onNbSelectedRecord++;
			} else {
				onNbSelectedRecord--;
			}
		} else {
			onNbSelectedRecord = nbSelectedRecord;
		}

		if (this.checkBox.checked === true) {
			this.onWBP_checkCheckBox();
		} else {
			this.onWBP_uncheckCheckBox();
		}
		this.updateLabel();
		return true;
	};

	this.onWBP_checkCheckBox = function() {
		this.checkBox.checked = true;
		if (isHierarchyApplied) {
			this.selectionPropagation(this.checkBox.id, this.checkBox.checked);
		} else {
			this.colorizeTableLine(this.rowId, "#FFC663");
		}
	};

	this.onWBP_uncheckCheckBox = function() {
		this.checkBox.checked = false;
		if (isHierarchyApplied) {
			this.selectionPropagation(this.checkBox.id, this.checkBox.checked);
		} else {
			this.colorizeTableLine(this.rowId, "");
		}
	};

	this.updateLabel = function() {
		var selectReportId = EBX_AjaxTable.pluggedComponentRegister.selectReportRegister[ebx_workspaceTableName];

		if (selectReportId === undefined) {
			EBX_Logger.log("EBX_AjaxSelectRecordObject.updateLabel: select report not found.", EBX_Logger.error);
			return;
		}

		var selectReportNumber = document.getElementById(selectReportId + EBX_AjaxTable.constants.suffixSelectionNumber);
		var selectReportLabelOne = document.getElementById(selectReportId + EBX_AjaxTable.constants.suffixSelectionLabelOne);
		var selectReportLabelMany = document.getElementById(selectReportId + EBX_AjaxTable.constants.suffixSelectionLabelMany);

		if (onNbSelectedRecord === 0) {
			selectReportNumber.innerHTML = "";
			selectReportLabelOne.style.display = "none";
			selectReportLabelMany.style.display = "none";
		} else {
			selectReportNumber.innerHTML = onNbSelectedRecord;

			if (onNbSelectedRecord > 1) {
				selectReportLabelOne.style.display = "none";
				selectReportLabelMany.style.display = "inline";
			} else {
				selectReportLabelOne.style.display = "inline";
				selectReportLabelMany.style.display = "none";
			}
		}
	};

	this.selectionPropagation = function(rowId, checked) {
		var inputs = document.getElementsByTagName("input");
		for ( var i = 0; i < inputs.length; i++) {
			var input = inputs[i];
			if (input.type == "checkbox" && input.id && input.id == rowId) {
				input.checked = checked;
        if (checked) {
          input.title = EBX_Constants.unselectCheckBox;
          EBX_Utils.addCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(input, "ygtvtable"), "ebx_treeLine_selected");
        } else {
          input.title = EBX_Constants.selectCheckBox;
          EBX_Utils.removeCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(input, "ygtvtable"),
              "ebx_treeLine_selected");
        }
			}
		}
	};

	this.colorizeTableLine = function(rowId, newColor) {
		var trs = document.getElementsByTagName("tr");
		for ( var i = 0; i < trs.length; i++) {
			var tr = trs[i];
			if (tr.id && tr.id.indexOf(rowId) != -1 && tr.id.indexOf("onInheritTableRight_") == -1) {
				var tds = tr.getElementsByTagName("td");
				for ( var j = 0; j < tds.length; j++) {
					var td = tds[j];
					if (td.className.indexOf("inheritTable_icon") == -1) {
						td.style.backgroundColor = newColor;
					}
				}
			}
		}
	};
}

EBX_AjaxSelectRecordObject.prototype = new EBX_AbstractAjaxResponseManager();

function EBX_ViewsManagement() {}

EBX_ViewsManagement.variables = {};
EBX_ViewsManagement.constants = {};
EBX_ViewsManagement.dataSourceChangeOrderResponseSchema = {
	resultsList: "changeOrder",
	metaFields: {
		lineId: "lineId",
		newOrder: "newOrder"
	}
};

EBX_ViewsManagement.dualListClick = function(event, listEl) {
	var targetEl = EBX_Utils.getTargetElement(event);

	// Check if we are clicking on element inside TABLE
	var tableEl = EBX_Utils.getFirstParentMatchingTagName(targetEl, "table");
	if (tableEl == null) {
		return;
	}

	// Focusing TR element
	var trEl = EBX_Utils.getFirstParentMatchingTagName(targetEl, "tr");
	if (trEl == null) {
		trEl = targetEl;
	}
	if (trEl.tagName.toLowerCase() != "tr") {
		return;
	}
	EBX_DualList.focusListLine(trEl);

	EBX_ButtonUtils.setButtonDisabled(document.getElementById("ebx_MoveTop"), false);
	EBX_ButtonUtils.setButtonDisabled(document.getElementById("ebx_MoveUp"), false);
	EBX_ButtonUtils.setButtonDisabled(document.getElementById("ebx_MoveDown"), false);
	EBX_ButtonUtils.setButtonDisabled(document.getElementById("ebx_MoveBottom"), false);
	EBX_ButtonUtils.setButtonDisabled(document.getElementById("ebx_MdvEditAssignment"), false);
	EBX_ButtonUtils.setButtonDisabled(document.getElementById("ebx_MdvDeleteAssignment"), false);

	EBX_ViewsManagement.populateHiddenFieldsWithSelectedAssignment(listEl.id);
};
EBX_ViewsManagement.getCallbackChangeOrderObject = function() {
	return {
		success: EBX_ViewsManagement.getCallbackChangeOrderSuccess,
		failure: EBX_ViewsManagement.getCallbackChangeOrderFailure,
		scope: EBX_ViewsManagement
	};
};
EBX_ViewsManagement.getCallbackChangeOrderSuccess = function(oRequest, oParsedResponse) {
	var resultObj = oParsedResponse.results;
	var orderListEl = document.querySelector("#ebx_mdv_OrderList");
	var listItemEls = orderListEl.querySelectorAll("tr");

	var resultObj_length = resultObj.length;
	for ( var i = 0; i < resultObj_length; i++) {
		var newId = resultObj[i].lineId + ";" + resultObj[i].newOrder;

		listItemEls[i].id = newId;
	}
};
EBX_ViewsManagement.getCallbackChangeOrderFailure = function(oRequest, oParsedResponse) {
	console.log("DVM Change order callBack failed: " + oParsedResponse);
};
EBX_ViewsManagement.populateHiddenFieldsWithSelectedAssignment = function(listId) {
	var orderListEl = document.querySelector("#" + listId);
	var selectedItemEl = orderListEl.querySelectorAll("tr.ebx_Selected")[0];

	if (selectedItemEl === undefined)
		return undefined;

	var viewIdAndOrder = selectedItemEl.id.split(";");
	var lineIdInputEl = document.querySelector("input[name='" + EBX_ViewsManagement.variables.paramLineIdName + "']");
	var lineOrderInputEl = document.querySelector("input[name='" + EBX_ViewsManagement.variables.paramOrderName + "']");

	lineIdInputEl.value = viewIdAndOrder[0];
	lineOrderInputEl.value = viewIdAndOrder[1];

	return selectedItemEl;
};
EBX_ViewsManagement.swapListNodes = function(direction, listId, containerId) {
	var containerDivEl = document.querySelector("#" + containerId);
	var orderListEl = document.querySelector("#" + listId);
	var itemsEls = orderListEl.rows;
	var lineToSwapPosition = EBX_DualList.getFocusedLineIndex(orderListEl);
	if (lineToSwapPosition == -1)
		return;

	if (lineToSwapPosition <= 0 && (direction == "ebx_MoveUp" || direction == "ebx_MoveTop"))
		return;
	if (lineToSwapPosition >= itemsEls.length - 1 && (direction == "ebx_MoveDown" || direction == "ebx_MoveBottom"))
		return;

	var lineToSwapEl = itemsEls[lineToSwapPosition];

	var lineIdInputEl = containerDivEl.querySelector("input[name='" + EBX_ViewsManagement.variables.paramLineIdName + "']");
	var lineOrderInputEl = containerDivEl.querySelector("input[name='" + EBX_ViewsManagement.variables.paramOrderName + "']");
	var lineDirectionInputEl = containerDivEl.querySelector("input[name='" + EBX_ViewsManagement.variables.paramDirectionName + "']");

	var lineId = lineToSwapEl.id;
	var keyVal = lineId.split(";");
	lineIdInputEl.value = keyVal[0];
	lineOrderInputEl.value = keyVal[1];
	lineDirectionInputEl.value = direction;

	var tBody = orderListEl.children[0];

	if (direction == "ebx_MoveUp") {
		tBody.insertBefore(lineToSwapEl, itemsEls[lineToSwapPosition - 1]);
	} else if (direction == "ebx_MoveDown") {
		tBody.insertBefore(itemsEls[lineToSwapPosition + 1], lineToSwapEl);
	} else if (direction == "ebx_MoveTop") {
		tBody.insertBefore(lineToSwapEl, itemsEls[0]);
	} else if (direction == "ebx_MoveBottom") {
		// "appendChild" as IE8 workaround
		tBody.appendChild(lineToSwapEl);
	}

	EBX_ViewsManagement.dataSourceChangeOrder = new YAHOO.util.XHRDataSource(EBX_ViewsManagement.constants.dataSourceChangeOrderRequestLink);
	EBX_ViewsManagement.dataSourceChangeOrder.responseType = YAHOO.util.DataSource.TYPE_JSON;
	EBX_ViewsManagement.dataSourceChangeOrder.responseSchema = EBX_ViewsManagement.dataSourceChangeOrderResponseSchema;

	var parameterBuf;
	parameterBuf = [];

	parameterBuf.push(EBX_ViewsManagement.constants.viewIdParameter, lineIdInputEl.value);
	parameterBuf.push(EBX_ViewsManagement.constants.orderParameter, lineOrderInputEl.value);
	parameterBuf.push(EBX_ViewsManagement.constants.directionParameter, lineDirectionInputEl.value);

	EBX_ViewsManagement.dataSourceChangeOrder.sendRequest(parameterBuf.join(""), EBX_ViewsManagement.getCallbackChangeOrderObject());
};

/*
 * UITableConfigurationComponentBean Dual List component JS
 * */
function EBX_DualList() {}

EBX_DualList.isUsingDataModelOrdering = false;

EBX_DualList.switchOrderingMethod = function(checkboxEl) {
  var selectedColumnsEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(checkboxEl.parentNode.parentNode.parentNode,
      "ebx_selectedColumnsList");
  var selectedOptionsEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(checkboxEl.parentNode.parentNode.parentNode,
      "ebx_hidden_selectedColumnsList");
	if (selectedColumnsEl === null || selectedOptionsEl === null) {
		return;
	}

	if (checkboxEl.checked) {
		EBX_DualList.isUsingDataModelOrdering = true;
		EBX_Utils.addCSSClass(selectedColumnsEl, "ebx_InactiveSelectedColumnsList");
	} else {
		EBX_DualList.isUsingDataModelOrdering = false;
		EBX_Utils.removeCSSClass(selectedColumnsEl, "ebx_InactiveSelectedColumnsList");
	}

	if (EBX_DualList.isUsingDataModelOrdering) {
		EBX_DualList.sortElementsAccordingToDMAOrder(selectedColumnsEl, selectedOptionsEl);
	}

	EBX_DualList.switchMiddleCtrlButtonsState(selectedColumnsEl.parentNode);
	EBX_DualList.switchFixedColumnsSelectorState(selectedColumnsEl.parentNode);
};

EBX_DualList.sortElementsAccordingToDMAOrder = function(selectedColumnsEl, selectedOptionsEl) {
	var availableColumnItems = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedColumnsEl.parentNode, "ebx_availableColumnsList").children;
	var availableOptionItems = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedColumnsEl.parentNode, "ebx_hidden_availableColumnsList").children;

	while (selectedColumnsEl.firstChild) {
		selectedColumnsEl.removeChild(selectedColumnsEl.firstChild);
	}
	while (selectedOptionsEl.firstChild) {
		selectedOptionsEl.removeChild(selectedOptionsEl.firstChild);
	}

	var available_length = availableColumnItems.length;
	for ( var i = 0; i < available_length; i++) {
		if (EBX_Utils.matchCSSClass(availableColumnItems[i], "ebx_HiddenListElement")) {
			var columnNodeToCopy = availableColumnItems[i].cloneNode(true);
			EBX_Utils.removeCSSClass(columnNodeToCopy, "ebx_HiddenListElement");
			selectedColumnsEl.appendChild(columnNodeToCopy);

			var optionNodeToCopy = availableOptionItems[i].cloneNode(true);

			// Thanks to the almighty IE8! (clone node seems to ignore 'selected')
			optionNodeToCopy.selected = true;

			selectedOptionsEl.appendChild(optionNodeToCopy);
		}
	}
};

EBX_DualList.switchMiddleCtrlButtonsState = function(dualListContainerEl) {
	var selectedColumnsCtrlsEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(dualListContainerEl, "ebx_selectedColumnsCtrls");
	if (selectedColumnsCtrlsEl === null) {
		return;
	}

	var moveTopButton = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedColumnsCtrlsEl, "ebx_MoveTop");
	var moveUpButton = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedColumnsCtrlsEl, "ebx_MoveUp");
	var moveDownButton = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedColumnsCtrlsEl, "ebx_MoveDown");
	var moveBottomButton = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedColumnsCtrlsEl, "ebx_MoveBottom");

	if (moveTopButton !== null) {
		EBX_ButtonUtils.setButtonDisabled(moveTopButton, EBX_DualList.isUsingDataModelOrdering);
	}
	if (moveUpButton !== null) {
		EBX_ButtonUtils.setButtonDisabled(moveUpButton, EBX_DualList.isUsingDataModelOrdering);
	}
	if (moveDownButton !== null) {
		EBX_ButtonUtils.setButtonDisabled(moveDownButton, EBX_DualList.isUsingDataModelOrdering);
	}
	if (moveBottomButton !== null) {
		EBX_ButtonUtils.setButtonDisabled(moveBottomButton, EBX_DualList.isUsingDataModelOrdering);
	}
};

EBX_DualList.switchFixedColumnsSelectorState = function(dualListContainerEl) {
	var fixedColumnsSelectorEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(dualListContainerEl, "ebx_fixColumnsCountSelector");

	if (fixedColumnsSelectorEl === null) {
		return;
	}

	EBX_ButtonUtils.setButtonDisabled(fixedColumnsSelectorEl, EBX_DualList.isUsingDataModelOrdering);
	fixedColumnsSelectorEl.selectedIndex = 0;
};

EBX_DualList.middleCtrls = function(btnClassName, cntnrId) {
	var container = document.querySelector("#" + cntnrId);
	var selectedColumnsEls = container.querySelector(".ebx_hidden_selectedColumnsList");
	var availableColumnsEls = container.querySelector(".ebx_hidden_availableColumnsList");
	var selectedColumnsOpts = selectedColumnsEls.options;
	var availableColumnsOpts = availableColumnsEls.options;

	var fixedColumnsSelectorEl = container.querySelector(".ebx_fixColumnsCountSelector");

	var selectedListEl = container.querySelector(".ebx_selectedColumnsList");
	var availableListEl = container.querySelector(".ebx_availableColumnsList");

	var selectedListIdx = EBX_DualList.getFocusedLineIndex(selectedListEl);
	var availableListIdx = EBX_DualList.getFocusedLineIndex(availableListEl);

	var cssDualListODFColumns = "ebx_dualList_ODFColumns";
	var cssDualListSortColumns = "ebx_dualList_SortColumns";

	var regexpODFColumns = new RegExp(cssDualListODFColumns, 'i');
	var regexpSortColumns = new RegExp(cssDualListSortColumns, 'i');
	var isCurrentActionOnODFColumns = container.id.match(regexpODFColumns);
	var isCurrentActionOnSortColumns = container.id.match(regexpSortColumns);

	if (btnClassName.indexOf("ebx_MoveAllLeft") > -1) {
		if (!EBX_DualList.isUsingDataModelOrdering) {
			var available_length = availableListEl.children.length;
			for ( var i = 0; i < available_length; i++) {
				var currentAvailableEl = availableListEl.children[i];

				if (!EBX_Utils.matchCSSClass(currentAvailableEl, "ebx_HiddenListElement")) {
					selectedListEl.appendChild(currentAvailableEl.cloneNode(true));
					currentAvailableEl.className = "ebx_HiddenListElement";

					if (EBX_LayoutManager.isIE8) {
						var optionToCopy = availableColumnsOpts[i].cloneNode(true);
						// Thanks to IE8!
						optionToCopy.selected = true;
						selectedColumnsEls.insertBefore(optionToCopy, selectedColumnsOpts[selectedColumnsOpts.length]);
					} else {
						// ... but FF 3.6.28 needs it as mandatory parameter!
						selectedColumnsOpts[selectedColumnsOpts.length] = availableColumnsOpts[i].cloneNode(false);
					}
				}
			}

			// workaround for firstElementChild (IE8)
			// Here we keep selection where it is (if there is)
			var selectedLi = EBX_Utils.getFirstDirectChildMatchingCSSClass(selectedListEl, "ebx_Selected");
			EBX_DualList.focusListLine(selectedLi);
		} else {
			while (selectedListEl.firstChild) {
				selectedListEl.removeChild(selectedListEl.firstChild);
			}

			var selectContainer = selectedColumnsEls.parentNode;
			// shallow copy to empty options list
			var newSelectedColumnsEls = selectedColumnsEls.cloneNode(false);

			var available_length = availableListEl.children.length;
			for ( var i = 0; i < available_length; i++) {
				var currentToCopyEl = availableListEl.children[i].cloneNode(true);

				if (EBX_Utils.matchCSSClass(currentToCopyEl, "ebx_HiddenListElement")) {
					EBX_Utils.removeCSSClass(currentToCopyEl, "ebx_HiddenListElement");
				} else {
					EBX_Utils.addCSSClass(availableListEl.children[i], "ebx_HiddenListElement");
				}

				selectedListEl.appendChild(currentToCopyEl);
				newSelectedColumnsEls.appendChild(availableColumnsOpts[i].cloneNode());
			}
			selectContainer.replaceChild(newSelectedColumnsEls, selectedColumnsEls);
		}

		if (fixedColumnsSelectorEl != null) {

			var numberOfColumns = selectedListEl.children.length;

			var noFixedColumnLabel = EBX_DualList.customViewNoFixedColumnLabel;
			fixedColumnsSelectorEl.options[0] = new Option(noFixedColumnLabel);
			var fixFirstColumnLabel = EBX_DualList.customViewFixFirstColumnLabel;
			fixedColumnsSelectorEl.options[1] = new Option(fixFirstColumnLabel);
			for ( var i = 2; i < numberOfColumns; i++) {
				var optionLabel = EBX_DualList.customViewFixManyColumnsLabel.replace("{0}", i);
				fixedColumnsSelectorEl.options[i] = new Option(optionLabel);
			}
		}
	}

	else if (btnClassName.indexOf("ebx_MoveAllRight") > -1) {
		var available_length = availableListEl.children.length;
		for ( var i = 0; i < available_length; i++) {
			availableListEl.children[i].className = "";
		}
		selectedListEl.innerHTML = "";

		selectedColumnsEls.length = 0;
		if (fixedColumnsSelectorEl != null) {
			fixedColumnsSelectorEl.length = 1;
		}

		// workaround for firstElementChild (IE8)
		var firstLi = EBX_Utils.getFirstDirectChildMatchingTagName(availableListEl, "li");
		EBX_DualList.focusListLine(firstLi);
	}

	else if (btnClassName.indexOf("ebx_MoveLeft") > -1 && availableListIdx > -1) {
		var optionToCopy = availableColumnsOpts[availableListIdx].cloneNode(true);

		// Thanks to IE8!
		optionToCopy.selected = true;

		selectedColumnsEls.insertBefore(optionToCopy, selectedColumnsOpts[selectedColumnsOpts.length]);

		var availableItemsEls = availableListEl.querySelectorAll("li");
		var nodeToCopy = availableItemsEls[availableListIdx].cloneNode(true);

		if (selectedListEl.className.indexOf(cssDualListSortColumns) > -1) {
			nodeToCopy.innerHTML += "<span class=\"ebx_SortingColumnButtonContainer\"><span class=\"ebx_SortingColumnLabel\">"
					+ EBX_DualList.sortAscendingLabel + "</span><button type=\"button\" " + "class=\"ebx_IconFlatButtonSmall ebx_AscendingColumn\">"
					+ "<span class=\"ebx_SmallIcon\"></span></button></span>";
		}

		if (isCurrentActionOnSortColumns || !EBX_DualList.isUsingDataModelOrdering) {
			selectedListEl.appendChild(nodeToCopy);
		}

		EBX_DualList.focusListLine(nodeToCopy);
		selectedListEl.scrollTop = nodeToCopy.offsetTop;

		availableItemsEls[availableListIdx].className = "ebx_HiddenListElement";
		EBX_DualList.focusAvailableLine(availableListIdx, availableListEl);

		// must be done after hiding availableItem
		if (isCurrentActionOnODFColumns && EBX_DualList.isUsingDataModelOrdering) {
			EBX_DualList.sortElementsAccordingToDMAOrder(selectedListEl, selectedColumnsEls);

			var newNode = document.getElementById(nodeToCopy.id);
			EBX_DualList.focusListLine(newNode);
		}

		if (fixedColumnsSelectorEl != null && selectedColumnsEls.length > 1) {
			var optionLabel = EBX_DualList.customViewFixFirstColumnLabel;
			optionLabel = EBX_DualList.customViewFixManyColumnsLabel.replace("{0}", fixedColumnsSelectorEl.length);
			fixedColumnsSelectorEl.options[fixedColumnsSelectorEl.length] = new Option(optionLabel);
		}
	}

	else if (btnClassName.indexOf("ebx_MoveRight") > -1 && selectedListIdx > -1) {
		var selectedItemsEls = selectedListEl.querySelectorAll("li");
		var toMoveEl = selectedItemsEls[selectedListIdx];
		var orderSpan = toMoveEl.querySelector("span.ebx_SortingColumnButtonContainer");

		if (orderSpan != null) {
			toMoveEl.removeChild(orderSpan);
		}

		var available_length = availableListEl.children.length;
		for ( var i = 0; i < available_length; i++) {
			if (toMoveEl.id === availableListEl.children[i].id) {
				availableListEl.children[i].className = "";
				EBX_DualList.focusListLine(availableListEl.children[i]);

				var toFocusLineEl = selectedItemsEls[selectedListIdx + 1];
				if (toFocusLineEl == null && selectedListIdx > 0) {
					toFocusLineEl = selectedItemsEls[selectedListIdx - 1];
				}
				if (toFocusLineEl != null) {
					EBX_DualList.focusListLine(toFocusLineEl);
				}
				break;
			}
		}

		selectedListEl.removeChild(toMoveEl);
		// #11140: FF 3.6 does not support remove() !?!
		selectedColumnsOpts[selectedListIdx] = null;

		if (fixedColumnsSelectorEl != null) {
			if (fixedColumnsSelectorEl.selectedIndex == fixedColumnsSelectorEl.length - 1) {
				fixedColumnsSelectorEl.selectedIndex = fixedColumnsSelectorEl.selectedIndex - 1;
			}
			if (fixedColumnsSelectorEl.length > 1) {
				fixedColumnsSelectorEl.length--;
			}

			if (fixedColumnsSelectorEl.length == 1) {
				fixedColumnsSelectorEl.selectedIndex = 0;
			}
		}
	}

	EBX_DualList.updateFixedColumns(container.querySelector(".ebx_fixColumnsCountSelector"));
};

EBX_DualList.swapListNodes = function(btnClassName, cntnrId) {
	var container = document.querySelector("#" + cntnrId);
	var selectedColumnsEl = container.querySelector(".ebx_hidden_selectedColumnsList");
	var optionsEls = selectedColumnsEl.options;

	var selectedListEl = container.querySelector(".ebx_selectedColumnsList");
	var selectedItemsEls = selectedListEl.querySelectorAll("li");
	var selectedIdx = EBX_DualList.getFocusedLineIndex(selectedListEl);

	if (selectedIdx < 0) {
		return;
	}

	if (btnClassName.indexOf("ebx_MoveUp") > -1 && selectedIdx > 0) {
		selectedColumnsEl.insertBefore(optionsEls[selectedIdx], optionsEls[selectedIdx - 1]);
		selectedListEl.insertBefore(selectedItemsEls[selectedIdx], selectedItemsEls[selectedIdx - 1]);

		EBX_DualList.scrollToElementIfNotVisible(selectedItemsEls[selectedIdx], selectedListEl);
	}
	if (btnClassName.indexOf("ebx_MoveTop") > -1) {
		selectedColumnsEl.insertBefore(optionsEls[selectedIdx], optionsEls[0]);
		selectedListEl.insertBefore(selectedItemsEls[selectedIdx], selectedItemsEls[0]);

		selectedListEl.scrollTop = 0;
	}
	if (btnClassName.indexOf("ebx_MoveDown") > -1 && selectedIdx < optionsEls.length) {
		selectedColumnsEl.insertBefore(optionsEls[selectedIdx], optionsEls[selectedIdx + 2]);

		if (selectedIdx + 2 < selectedItemsEls.length) {
			selectedListEl.insertBefore(selectedItemsEls[selectedIdx], selectedItemsEls[selectedIdx + 2]);
		} else {
			// IE8 workaround
			selectedListEl.appendChild(selectedItemsEls[selectedIdx]);
		}

		EBX_DualList.scrollToElementIfNotVisible(selectedItemsEls[selectedIdx], selectedListEl);
	}
	if (btnClassName.indexOf("ebx_MoveBottom") > -1 && selectedIdx < optionsEls.length) {
		selectedColumnsEl.insertBefore(optionsEls[selectedIdx], optionsEls[optionsEls.length]);

		// IE8 workaround
		selectedListEl.appendChild(selectedItemsEls[selectedIdx]);

		selectedListEl.scrollTop = selectedItemsEls[selectedItemsEls.length - 1].offsetTop;
	}

	EBX_DualList.updateFixedColumns(container.querySelector(".ebx_fixColumnsCountSelector"));
};

EBX_DualList.updateFixedColumns = function(selectorEl) {
	if (selectorEl == null) {
		return;
	}
	var nbOfColumnsToFix = selectorEl.selectedIndex;

	var selectedColumnsEls = document.querySelector(".ebx_hidden_selectedColumnsList");
	var selectedColumnsOpts = selectedColumnsEls.options;

	var fixedColumnsEls = document.querySelector(".ebx_hidden_fixedColumns");
	fixedColumnsEls.innerHTML = "";

	for ( var i = 0; i < nbOfColumnsToFix; i++) {
		fixedColumnsEls.appendChild(selectedColumnsOpts[i].cloneNode(true));
	}
};

EBX_DualList.getFocusedLineIndex = function(listEl) {
	var focusedEl = listEl.querySelector(".ebx_Selected");
	if (focusedEl === null) {
		return -1;
	}
	return EBX_Utils.getIndex(focusedEl);
};

EBX_DualList.focusListLine = function(lineEl) {
	if (lineEl == null) {
		return;
	}
	var parentListEl = lineEl.parentNode;
	if (parentListEl == null) {
		return;
	}

	var listLineEls = parentListEl.querySelectorAll(".ebx_Selected");
	if (listLineEls != null) {
		var list_length = listLineEls.length;
		for ( var i = 0; i < list_length; i++) {
			listLineEls[i].className = listLineEls[i].className.replace(" ebx_Selected", "");
		}
	}
	lineEl.className += " ebx_Selected";

	EBX_DualList.scrollToElementIfNotVisible(lineEl, lineEl.parentNode);
};

EBX_DualList.reverseOrder = function(orderCtrlEl, hiddenSelectName) {
	// forces to be focused before trying to change order
	EBX_DualList.focusListLine(orderCtrlEl.parentNode);

	var isAscending = true;
	var orderLabelEl = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(orderCtrlEl, "ebx_SortingColumnLabel");
	var orderButtonEl = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(orderCtrlEl, "ebx_AscendingColumn");
	if (orderButtonEl == null) {
		isAscending = false;
		orderButtonEl = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(orderCtrlEl, "ebx_DescendingColumn");
	}

	var currentClassName = orderButtonEl.className;
	if (isAscending) {
		orderLabelEl.innerHTML = EBX_DualList.sortDescendingLabel;
		orderButtonEl.className = currentClassName.replace("ebx_AscendingColumn", "ebx_DescendingColumn");
	} else {
		orderLabelEl.innerHTML = EBX_DualList.sortAscendingLabel;
		orderButtonEl.className = currentClassName.replace("ebx_DescendingColumn", "ebx_AscendingColumn");
	}

	var list = EBX_Utils.getFirstParentMatchingTagName(orderCtrlEl, "ul");
	var index = EBX_DualList.getFocusedLineIndex(list);

	var hiddenSelect = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(list.parentNode, "ebx_hidden_selectedColumnsList");
	var elementValue = hiddenSelect.options[index].value;

	var descFlag = elementValue.indexOf(":DESC");
	if (descFlag > 0) {
		elementValue = elementValue.toString().replace(":DESC", ":ASC");
	} else {
		elementValue = elementValue.toString().replace(":ASC", ":DESC");
	}
	hiddenSelect.options[index].value = elementValue;
};

EBX_DualList.focusAvailableLine = function(availableListIdx, availableListEl) {
	var lineToFocus = null;
	var available_length = availableListEl.children.length;
	for ( var i = availableListIdx; i < available_length; i++) {
		if (availableListEl.children[i].className.indexOf("ebx_HiddenListElement") < 0) {
			lineToFocus = availableListEl.children[i];
			EBX_DualList.focusListLine(lineToFocus);
			break;
		}
	}

	if (lineToFocus == null) {
		for ( var i = availableListIdx - 1; i >= 0; i--) {
			if (availableListEl.children[i].className.indexOf("ebx_HiddenListElement") < 0) {
				EBX_DualList.focusListLine(availableListEl.children[i]);
				break;
			}
		}
	}
};

EBX_DualList.scrollToElementIfNotVisible = function(itemEl, containerEl) {
	var containerElTop = containerEl.offsetTop;
	var containerElBottom = containerEl.offsetTop + containerEl.offsetHeight;
	var itemElTop = itemEl.offsetTop;

	var isElementUnderContainer = itemElTop + itemEl.offsetHeight - containerEl.scrollTop > containerElBottom;
	var isElementAboveContainer = itemElTop < containerElTop + containerEl.scrollTop;

	if (isElementUnderContainer || isElementAboveContainer) {
		containerEl.scrollTop = itemEl.offsetTop - containerEl.offsetTop;
	}
};

EBX_DualList.dualListClick = function(event, listEl) {
	var targetEl = EBX_Utils.getTargetElement(event);

	// Check if we are clicking on element inside UL
	var ulEl = EBX_Utils.getFirstParentMatchingTagName(targetEl, "ul");
	if (ulEl == null) {
		return;
	}

	var isAvailableColumnsList = ulEl.className.indexOf("ebx_availableColumnsList") >= 0;
	var isSelectedColumnsList = ulEl.className.indexOf("ebx_selectedColumnsList") >= 0;
	if (!isAvailableColumnsList && !isSelectedColumnsList) {
		return;
	}

	// Focusing LI element
	var liEl = EBX_Utils.getFirstParentMatchingTagName(targetEl, "li");
	if (liEl == null) {
		liEl = targetEl;
	}
	if (liEl.tagName.toLowerCase() != "li") {
		return;
	}
	EBX_DualList.focusListLine(liEl);

	// Test if action to do is reverse sorting order
	var sortEl = targetEl;
	var isSortingEl = EBX_Utils.matchCSSClass(sortEl, "ebx_SortingColumnButtonContainer");
	if (!isSortingEl) {
		sortEl = EBX_Utils.getFirstParentMatchingCSSClass(targetEl, "ebx_SortingColumnButtonContainer");
	}
	if (sortEl != null) {
		EBX_DualList.reverseOrder(sortEl, listEl.querySelectorAll(".ebx_hidden_selectedColumnsList")[0].name);
	}
};

function ebx_hriToggleSortStrategy() {
  var radioOrdering = document.getElementById("ebx_sortStrategyOrdering");
  var radioSort = document.getElementById("ebx_sortStrategySort");
  if (radioOrdering) {
    ebx_hriToggleSortStrategyDisplay("ebx_hriSortStrategyOrderingWrapper", radioOrdering.checked);
  }
  if (radioSort) {
    ebx_hriToggleSortStrategyDisplay("ebx_hriSortStrategySortWrapper", radioSort.checked);
  }
}

function ebx_hriToggleSortStrategyDisplay(idElement, isDisplay) {
  var el = document.getElementById(idElement);
  el.style.display = isDisplay ? "block" : "none";
}

function ebx_hriUpdateSortedCriteria() {
  var sortedColumnsList = document.getElementById("ebx_hidden_selectedColumnsList");
  var newResult = "";
	var isFirst = true;
	if(sortedColumnsList != null ){
    for (var i = 0; i < sortedColumnsList.children.length; i++) {
      if(!isFirst){
      	newResult += ";";
			}else{
      	isFirst = false;
			}
    	newResult += sortedColumnsList.children[i].value;
    }
	}
  //_ebx prefix
  var sortField = document.getElementById("$table_sort_formatedCriteria");
  sortField.value = newResult;
}

function ebx_hriSortStrategySwapListNodes(btnClassName, cntnrId) {
  EBX_DualList.swapListNodes(btnClassName, cntnrId);
  ebx_hriUpdateSortedCriteria();
}

function ebx_hriSortStrategyMiddleCtrls(btnClassName, cntnrId) {
  EBX_DualList.middleCtrls(btnClassName, cntnrId);
  ebx_hriUpdateSortedCriteria();
}

function ebx_hriSortStrategyDualListClick(event, listEl) {
  EBX_DualList.dualListClick(event, listEl);
  ebx_hriUpdateSortedCriteria();
}
