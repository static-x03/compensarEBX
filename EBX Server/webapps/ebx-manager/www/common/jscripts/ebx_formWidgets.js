/*
 * Copyright TIBCO Software Inc. 2001-2021. All rights reserved.
 */

function EBX_FormWidgets() {
}

/* Map */
EBX_FormWidgets.messages = {};

EBX_FormWidgets.inputEmpty_CSSClass = "ebx_ValueND";
EBX_FormWidgets.inputWithEmptyButton_CSSClass = "ebx_InputWithEmptyButton";
EBX_FormWidgets.emptyButtonHidden_CSSClass = "ebx_EmptyButtonHidden";
EBX_FormWidgets.inputFocusRedirector_CSSClass = "ebx_InputFocusRedirector";

/** * START Multi Occurrences ** */

//@EBXAddonAPI
var ebx_list_occurrenceState_candidate = "OccurrenceStateCandidate";
var ebx_list_occurrenceState_delete = "OccurrenceStateDelete";
var ebx_list_occurrenceState_insert = "OccurrenceStateInsert";
var ebx_list_occurrenceState_update = "OccurrenceStateUpdate";

//@EBXAddonAPI
ebx_list_getOccurrenceState = function (path, index) {
  return EBX_MultiOccurrences.getLineState(EBX_MultiOccurrences.getLine(path, index));
}

//@EBXAddonAPI
ebx_list_setOccurrenceState = function (path, index, occurrenceState) {
  var listId = EBX_MultiOccurrences.pathToListId[path];
  if (listId === undefined) {
    return false;
  }

  var firstCandidateIndex = EBX_MultiOccurrences.countDefinedOccurenceQty(listId);
  if (index > firstCandidateIndex) {
    return false;
  }
  var lineEl = EBX_MultiOccurrences.getLine(path, index);
  if (lineEl === null) {
    return false;
  }

  var currentOccurrenceState = ebx_list_getOccurrenceState(path, index);

  var lineId = lineEl.id;

  if (occurrenceState === ebx_list_occurrenceState_insert || occurrenceState === ebx_list_occurrenceState_update) {

    if (index === firstCandidateIndex) {
      EBX_MultiOccurrences.addAnOccurrence(listId);
      return true;
    }

    if (currentOccurrenceState === ebx_list_occurrenceState_delete) {
      EBX_MultiOccurrences.undeleteLine(listId, lineId);
      EBX_ButtonUtils.setStateToToggleButton(document.getElementById(lineId + EBX_MultiOccurrences.ButtonDeleteSuffix),
          false);
      return true;
    }

  } else if (occurrenceState === ebx_list_occurrenceState_delete) {

    // delete action is only allowed on insert and update statuses
    if (currentOccurrenceState === ebx_list_occurrenceState_insert || currentOccurrenceState
        === ebx_list_occurrenceState_update) {
      EBX_MultiOccurrences.deleteLine(listId, lineId);
      EBX_ButtonUtils.setStateToToggleButton(document.getElementById(lineId + EBX_MultiOccurrences.ButtonDeleteSuffix),
          true);
      return true;
    }

  }

  return false;
}

//@EBXAddonAPI
ebx_list_getDefinedOccurrencesQuantity = function (path) {
  var listId = EBX_MultiOccurrences.pathToListId[path];
  if (listId === undefined) {
    return null;
  }
  return EBX_MultiOccurrences.countDefinedOccurenceQty(listId);
}

function EBX_MultiOccurrences() {
}

EBX_MultiOccurrences.pathToListId = {};

EBX_MultiOccurrences.getLine = function (path, index) {
  var listId = EBX_MultiOccurrences.pathToListId[path];
  if (listId === undefined) {
    return null;
  }
  var listEl = document.getElementById(listId);
  if (listEl === null) {
    return null;
  }
  return EBX_Utils.getElementChildAtIndex(listEl, index);
};

EBX_MultiOccurrences.getLineState = function (lineEl) {
  if (lineEl === null) {
    return null;
  }
  var flagEl = EBX_MultiOccurrences.getLineActionFlag(lineEl);
  if (flagEl === null) {
    return null;
  }

  switch (flagEl.value) {

    case EBX_MultiOccurrences.ActionCandidate:
      return ebx_list_occurrenceState_candidate;

    case EBX_MultiOccurrences.ActionDelete:
      return ebx_list_occurrenceState_delete;

    case EBX_MultiOccurrences.ActionInsert:
      return ebx_list_occurrenceState_insert;

    case EBX_MultiOccurrences.ActionUpdate:
      return ebx_list_occurrenceState_update;

    default:
      return null;
  }
};

EBX_MultiOccurrences.occurrenceLineSuffix = "_occurrenceLine";
EBX_MultiOccurrences.addAnOccurrence = function (listId) {
  var newLine = EBX_MultiOccurrences.getNextFreeOccurence(listId);
  if (newLine === null) {
    ebx_alert(EBX_FormWidgets.messages.UIComponent_UIMultiOccurrencesEditor_AddOccurrence_Disable);
    return;
  }

  EBX_MultiOccurrences.getLineActionFlag(newLine).value = EBX_MultiOccurrences.ActionInsert;

  EBX_Utils.removeCSSClass(newLine, EBX_Form.hidingContainerHiddenCSSClass);
  EBX_Form.setHidingContainerState(newLine, false);

  var newLineId = newLine.id;
  var webName = newLineId.substring(0, newLineId.length - EBX_MultiOccurrences.occurrenceLineSuffix.length);

  EBX_Form.focus(webName);

  EBX_MultiOccurrences.refreshDisplayAddButton(listId);
};

EBX_MultiOccurrences.getNextFreeOccurence = function (listId) {
  var line = document.getElementById(listId).firstChild;
  // get the first candidate line
  if (line === null) {
    return null;
  }
  do {
    if (!line.id) {
      continue;
    }
    if (!EBX_MultiOccurrences.getLineActionFlag(line)) {
      continue;
    }
    if (EBX_MultiOccurrences.getLineActionFlag(line).value == EBX_MultiOccurrences.ActionCandidate) {
      return line;
    }
  } while ((line = line.nextSibling));

  return null;
};

/**
 * @return an <input type="hidden"/> element which wears the action flag in its
 *         value
 */
EBX_MultiOccurrences.getLineActionFlag = function (line) {
  return document.getElementById(line.id + EBX_MultiOccurrences.ActionFlagSuffix);
};

EBX_MultiOccurrences.refreshDisplayAddButton = function (listId) {
  var addActionDiv = document.getElementById(listId + EBX_MultiOccurrences.addButtonSuffix);
  if (addActionDiv === null) {
    return;
  }

  var maxQty = EBX_MultiOccurrences.getMaxOccurenceAllowed(listId);

  var displayActionDiv = false;

  if (maxQty < 0) {
    displayActionDiv = true;
  } else {
    var currentQty = EBX_MultiOccurrences.countDefinedOccurenceQty(listId);

    // no need to display the add button when the currentQty is equal to maxQty
    if (currentQty < maxQty) {
      displayActionDiv = true;
    }
  }

  addActionDiv.style.display = displayActionDiv ? "" : "none";
};

EBX_MultiOccurrences.MaxOccurencesAllowed = [];
EBX_MultiOccurrences.setMaxOccurenceAllowed = function (listId, maxOccurenceAllowed) {
  EBX_MultiOccurrences.MaxOccurencesAllowed[listId] = maxOccurenceAllowed;
};
EBX_MultiOccurrences.getMaxOccurenceAllowed = function (listId) {
  var ret = EBX_MultiOccurrences.MaxOccurencesAllowed[listId];

  if (!ret) {
    ret = -1;
  }

  return ret;
};

EBX_MultiOccurrences.countDefinedOccurenceQty = function (listId) {
  var list = document.getElementById(listId);
  var line = list.firstChild;
  var qty = 0;

  if (line !== null) {
    do {
      if (!line.id) {
        continue;
      }
      if (!EBX_MultiOccurrences.getLineActionFlag(line)) {
        continue;
      }
      if (EBX_MultiOccurrences.getLineActionFlag(line).value == EBX_MultiOccurrences.ActionCandidate) {
        continue;
      }
      qty++;
    } while ((line = line.nextSibling));
  }

  return qty;
};

EBX_MultiOccurrences.LineContentClassName = "ebx_OccurrenceEditorContent";
EBX_MultiOccurrences.LineContentHiddenModeClassName = "ebx_OccurrenceEditorContentHidden";
EBX_MultiOccurrences.deleteLine = function (listId, lineId) {
  var line = document.getElementById(lineId);
  EBX_Utils.addCSSClass(
      EBX_Utils.getFirstRecursiveChildMatchingCSSClass(line, EBX_MultiOccurrences.LineContentClassName),
      EBX_MultiOccurrences.LineContentHiddenModeClassName);

  EBX_MultiOccurrences.getLineActionFlag(line).value = EBX_MultiOccurrences.ActionDelete;

  EBX_MultiOccurrences.refreshDisplayAddButton(listId);

  var button = document.getElementById(lineId + EBX_MultiOccurrences.ButtonDeleteSuffix);
  if (button !== null) {
    button.tabIndex = 0;
  }
};
EBX_MultiOccurrences.undeleteLine = function (listId, lineId) {
  var line = document.getElementById(lineId);
  EBX_Utils.removeCSSClass(
      EBX_Utils.getFirstRecursiveChildMatchingCSSClass(line, EBX_MultiOccurrences.LineContentClassName),
      EBX_MultiOccurrences.LineContentHiddenModeClassName);

  EBX_MultiOccurrences.getLineActionFlag(line).value = EBX_MultiOccurrences.ActionInsert;

  EBX_MultiOccurrences.refreshDisplayAddButton(listId);
  var button = document.getElementById(lineId + EBX_MultiOccurrences.ButtonDeleteSuffix);
  if (button !== null) {
    button.tabIndex = -1;
  }
};

/** *END Multi Occurrences ** */

/** *START Complex List ** */

function EBX_ComplexList() {
}

EBX_ComplexList.collapsedModeClassName = "ebx_ComplexFieldsCollapsed";

EBX_ComplexList.expand = function (listId) {
  EBX_GroupHavingChildren.saveState(listId, false);
  EBX_Utils.removeCSSClass(document.getElementById(listId), EBX_ComplexList.collapsedModeClassName);
};

EBX_ComplexList.collapse = function (listId) {
  EBX_GroupHavingChildren.saveState(listId, true);
  EBX_Utils.addCSSClass(document.getElementById(listId), EBX_ComplexList.collapsedModeClassName);
};

/** *END Complex List ** */

/** *START Localized Block (label description) ** */

function EBX_CollapsibleBlock() {
}

EBX_CollapsibleBlock.collapsedModeClassName = "ebx_CollapsibleBlockCollapsed";
EBX_CollapsibleBlock.buttonIdSuffix = "_ExpandCollapse";

EBX_CollapsibleBlock.expand = function (collapsibleBlockId) {
  EBX_Utils.removeCSSClass(document.getElementById(collapsibleBlockId), EBX_CollapsibleBlock.collapsedModeClassName);
};
EBX_CollapsibleBlock.collapse = function (collapsibleBlockId) {
  EBX_Utils.addCSSClass(document.getElementById(collapsibleBlockId), EBX_CollapsibleBlock.collapsedModeClassName);
};

EBX_CollapsibleBlock.expandHidingContainer = function (hidingContainerBlockId) {
  EBX_GroupHavingChildren.saveState(hidingContainerBlockId, false);
  var hidingContainer = document.getElementById(hidingContainerBlockId);
  EBX_Utils.removeCSSClass(hidingContainer, EBX_Form.hidingContainerHiddenCSSClass);
  EBX_Form.setHidingContainerState(hidingContainer, false);
};
EBX_CollapsibleBlock.collapseHidingContainer = function (hidingContainerBlockId) {
  EBX_GroupHavingChildren.saveState(hidingContainerBlockId, true);
  var hidingContainer = document.getElementById(hidingContainerBlockId);
  EBX_Utils.addCSSClass(hidingContainer, EBX_Form.hidingContainerHiddenCSSClass);
  EBX_Form.setHidingContainerState(hidingContainer, true);
};

EBX_CollapsibleBlock.setExpanded = function (hidingContainerBlockId, isExpanded) {
  var isCollapsed = EBX_Utils.matchCSSClass(document.getElementById(hidingContainerBlockId),
      EBX_Form.hidingContainerHiddenCSSClass);

  // if the expandCollapseBlock is in the desired state, return
  if (isExpanded && !isCollapsed) {
    return;
  }
  if (!isExpanded && isCollapsed) {
    return;
  }

  // else, click on the button
  var button = document.getElementById(hidingContainerBlockId + EBX_CollapsibleBlock.buttonIdSuffix);
  button.click();
};

/** *END Localized Block ** */

/** *START Group having children ** */

function EBX_GroupHavingChildren() {
}

EBX_GroupHavingChildren.mapIdToPath = {};
EBX_GroupHavingChildren.saveStateRequester = new YAHOO.util.XHRDataSource();

// initialized by UITreeForm.java
EBX_GroupHavingChildren.trChildrenIds = {};

EBX_GroupHavingChildren.fieldExpandCollapseTDCSSClass = "ebx_FieldExpandCollapse";

EBX_GroupHavingChildren.trProperties = {};
/**
 * Expands a group and its children.
 *
 * @param {string}
 *            trId row id
 * @param {boolean}
 *            skipSaveStateRequest Optionnal, if equals true does not save group
 *            state in session settings.
 */
EBX_GroupHavingChildren.expand = function (trId, skipSaveStateRequest) {
  if (!skipSaveStateRequest) {
    EBX_GroupHavingChildren.saveState(trId, false);
  }

  var trProperties, i, len, child;
  trProperties = EBX_GroupHavingChildren.getTrProperties(trId);
  for (i = 0, len = trProperties.children.length; i < len; i++) {
    child = trProperties.children[i];
    child.style.display = "";
    EBX_Utils.removeCSSClass(child, EBX_Form.hidingContainerHiddenCSSClass);
    EBX_Form.setHidingContainerState(child, false);
    if (EBX_GroupHavingChildren.hasChildren(child.id) && EBX_GroupHavingChildren.isOpen(child.id)) {
      EBX_GroupHavingChildren.expand(child.id, true);
    }
  }
};
/**
 * Collapses a group and its children.
 *
 * @param {string}
 *            trId row id
 * @param {boolean}
 *            skipSaveStateRequest Optionnal, if equals true does not save group
 *            state in session settings.
 */
EBX_GroupHavingChildren.collapse = function (trId, skipSaveStateRequest) {
  if (!skipSaveStateRequest) {
    EBX_GroupHavingChildren.saveState(trId, true);
  }

  var trProperties, i, len, child;
  trProperties = EBX_GroupHavingChildren.getTrProperties(trId);
  for (i = 0, len = trProperties.children.length; i < len; i++) {
    child = trProperties.children[i];
    if (EBX_GroupHavingChildren.hasChildren(child.id)) {
      EBX_GroupHavingChildren.collapse(child.id, true);
    }
    child.style.display = "none";
    EBX_Utils.addCSSClass(child, EBX_Form.hidingContainerHiddenCSSClass);
    EBX_Form.setHidingContainerState(child, true);
  }
};

/**
 * Save on server the group state, expanded/collapsed
 *
 * @param {String}
 *            trId the id of the selected form row
 * @param {Boolean}
 *            isExpanded true, if group is now expanded
 */
EBX_GroupHavingChildren.saveState = function (trId, isCollapsed) {
  if (EBX_GroupHavingChildren.saveGroupStateRequest === undefined) {
    return;
  }
  var path = EBX_GroupHavingChildren.mapIdToPath[trId];
  var request = [];
  request.push(EBX_GroupHavingChildren.saveGroupStateRequest);
  if (path) {
    request.push("&", EBX_GroupHavingChildren.requestParam_groupPath, "=", encodeURIComponent(path));
  } else {
    request.push("&", EBX_GroupHavingChildren.requestParam_groupId, "=", encodeURIComponent(trId));
  }
  request.push("&", EBX_GroupHavingChildren.requestParam_groupIsCollapsed, "=", isCollapsed);

  EBX_GroupHavingChildren.saveStateRequester.sendRequest(request.join(""),
      null);
};

EBX_GroupHavingChildren.getTrProperties = function (trId) {
  if (EBX_GroupHavingChildren.trProperties[trId] === undefined) {
    var properties;
    var trEl = document.getElementById(trId);
    if (trEl !== null) {
      properties = {};
      properties.trEl = trEl;
      var tdExpandCollapse = EBX_Utils.getFirstDirectChildMatchingCSSClass(trEl,
          EBX_GroupHavingChildren.fieldExpandCollapseTDCSSClass);
      if (tdExpandCollapse !== null) {
        properties.expandCollapseCkb = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(tdExpandCollapse,
            "ebx_ToggleButtonCkb");
      } else {
        properties.expandCollapseCkb = null;
      }
      var childrenIds = EBX_GroupHavingChildren.trChildrenIds[trId];
      if (childrenIds !== undefined) {
        var children = [];
        for (var i = 0, len = childrenIds.length; i < len; i++) {
          children.push(document.getElementById(childrenIds[i]));
        }
        properties.children = children;
      } else {
        properties.children = null;
      }
    } else {
      properties = null;
    }
    EBX_GroupHavingChildren.trProperties[trId] = properties;
  }
  return EBX_GroupHavingChildren.trProperties[trId];
};

EBX_GroupHavingChildren.hasChildren = function (trId) {
  return EBX_GroupHavingChildren.getTrProperties(trId).expandCollapseCkb !== null;
};

EBX_GroupHavingChildren.isOpen = function (trId) {
  if (EBX_GroupHavingChildren.hasChildren(trId) === false) {
    return false;
  }
  return EBX_GroupHavingChildren.getTrProperties(trId).expandCollapseCkb.checked === false;
};

/** *END Group having children ** */

var ebx_HTMLEditorPreview_content = {};
var ebx_HTMLEditorPreview_window = null;

function ebx_html_editorPreview(id, title) {
  if (!id || !ebx_HTMLEditorPreview_content[id]) {
    ebx_alert(EBX_FormWidgets.messages.Adaptation_Node_Editor_Html_Error);
    return;
  }

  if (ebx_HTMLEditorPreview_window !== null) {
    ebx_HTMLEditorPreview_window.close();
  }

  var anHTML_content = ebx_HTMLEditorPreview_content[id];

  ebx_HTMLEditorPreview_window = window.open("about:blank", 'on_editorPreview',
      'scrollbars=yes,status=no,toolbar=no,menubar=no,width=620,height=400', true);

  while (anHTML_content.indexOf("&gt;") > -1) {
    anHTML_content = anHTML_content.replace("&gt;", ">");
  }

  while (anHTML_content.indexOf("&lt;") > -1) {
    anHTML_content = anHTML_content.replace("&lt;", "<");
  }

  anHTML_content = "<html><head><title>" + title + "</title></head><body>" + anHTML_content + "</body></html>";

  window.setTimeout(function () {
    ebx_HTMLEditorPreview_window.document.body.innerHTML = anHTML_content;
  }, 100);
}

/** *START Facet Enumeration ** */
function EBX_FacetEnumeration() {
}

EBX_FacetEnumeration.firstPage = "FIRST";
EBX_FacetEnumeration.previousPage = "PREVIOUS";
EBX_FacetEnumeration.nextPage = "NEXT";
EBX_FacetEnumeration.lastPage = "LAST";
EBX_FacetEnumeration.InputFieldDisplaySuffix = "_display";

EBX_FacetEnumeration.onFacetEnum_valueField = null;
EBX_FacetEnumeration.onFacetEnum_displayField = null;

function ebx_delFacetEnumeration() {
  EBX_Utils.closeInternalPopup();

  if (EBX_FacetEnumeration.onFacetEnum_valueField !== null) {
    EBX_Form.refreshEmptyButtonFromFacetEnumField(EBX_FacetEnumeration.onFacetEnum_valueField, true);
    EBX_FacetEnumeration.onFacetEnum_valueField = null;
  }

  if (EBX_FacetEnumeration.onFacetEnum_displayField !== null) {
    EBX_FacetEnumeration.onFacetEnum_displayField.focus();
    EBX_FacetEnumeration.onFacetEnum_displayField = null;
  }
}

function ebx_getFacetEnumeration(nodePath, valueFieldId, isMultiple, isTableRef, specificPageIndexInFSMHistory) {
  // remove previous tableRef (if any)
  ebx_delFacetEnumeration();

  EBX_FacetEnumeration.onIsMultiple = isMultiple;

  EBX_FacetEnumeration.onFacetEnum_valueField = document.getElementById(valueFieldId);
  EBX_FacetEnumeration.onFacetEnum_displayField = document.getElementById(valueFieldId
      + EBX_FacetEnumeration.InputFieldDisplaySuffix);
  EBX_FacetEnumeration.onFacetEnum_isTableRef = isTableRef;

  EBX_FacetEnumeration.onFacetEnumURL_getRows = onFacetEnumURL_getRows_basic
      + "&$facetEnum_specificPageIndexInFsmHistory="
      + specificPageIndexInFSMHistory + "&$facetEnum_nodePath=" + nodePath + "&$facetEnum_paginPageIndex=";

  var height = "220";
  if (YAHOO.env.ua.webkit !== 0) {
    height = "230";
  }

  var cmdToCall = "EBX_Utils.openInternalPopup(onFacetEnumURL_getGUI, 400, " + height
      + ", {isDimmed: false,contextElement: EBX_FacetEnumeration.onFacetEnum_displayField});";

  EBX_FormPresenterStatusIndicator.setListenerOnWaitingEnd(cmdToCall);
}

function ebx_facetEnumerationTableRef_seeDetails(inputType, valueFieldId, baseURL, formatedPKPName) {
  var formatedPK = null;
  if (inputType == 'advanced') {
    formatedPK = document.getElementById(valueFieldId).value;
  }
  if (inputType == 'dropdown') {
    var select = document.getElementById(valueFieldId);
    formatedPK = select.options[select.selectedIndex].value;
  }

  if (formatedPK == null || formatedPK == ebx_nullValueForFacetEnum) {
    ebx_alert(EBX_FACET_ENUMERATION_LABEL_ALERT_SELECT_VALUE);
    return;
  }

  var finalURL = baseURL + "&" + formatedPKPName + "=" + encodeURIComponent(formatedPK);

  EBX_Utils.openInternalPopupLargeSizeHostedClose(finalURL);
}

function ebx_manageKeysForFacetEnumeration(event, nodePath, valueFieldId, isMultiple, isTableRef,
    specificPageIndexInFSMHistory) {
  if (EBX_Form.isEventToInputText(event) === false) {
    return true;
  }

  ebx_getFacetEnumeration(nodePath, valueFieldId, isMultiple, isTableRef, specificPageIndexInFSMHistory);

  //return false to ignore current input
  return false;
}

/*
// old code to delete @see UIFECSelectorAfterCreate l.107
EBX_FacetEnumeration.autoSelectNewRecord = function(inputName, labelName, inputValue, labelValue){
var facetEnumInput = parent.document.getElementById(inputName);
var facetEnumLabel = parent.document.getElementById(labelName);
if (facetEnumInput && facetEnumLabel) {
facetEnumInput.value = inputValue;
facetEnumLabel.value = labelValue;
}
parent.EBX_Utils.closeInternalPopup();
};
*/
/** *START Facet Enumeration SELECTOR ** */
EBX_FacetEnumeration.selector_valueField = false;
EBX_FacetEnumeration.selector_displayField = false;
EBX_FacetEnumeration.selector_baseURL = false;
EBX_FacetEnumeration.selector_isTableRef = true;

EBX_FacetEnumeration.selector_currentPageIndex = 0;
EBX_FacetEnumeration.selector_isLastPage = false;

EBX_FacetEnumeration.ajaxFacetEnumSelector = function () {
  this.isMultiple = parent.EBX_FacetEnumeration.onIsMultiple;

  this.onExecuteIfOK = function (responseXML, root) {
    var optionsEl = root.getElementsByTagName('options')[0];
    this.updateDropDown(optionsEl);
    EBX_FacetEnumeration.selector_currentPageIndex = parseInt(optionsEl.attributes.getNamedItem('position').nodeValue,
        10);
    EBX_FacetEnumeration.selector_isLastPage = eval(optionsEl.attributes.getNamedItem('isLast').nodeValue);

    //Redisplay input fields and hide wait div
    EBX_FacetEnumeration.selector_hideInputFields(false);
    return true;
  };

  this.onExecuteIfKO = function (responseXML) {
    EBX_FacetEnumeration.selector_resetList();
    EBX_FacetEnumeration.selector_hideInputFields(false);
  };

  this.onGetExceptedResponseCode = function (callerId) {
    return this.responseCodeOK_OptionsList;
  };

  this.onManageTimeoutResponse = function () {
    //parent.location.href;
    this.selector_closeFacetEnum();
    EBX_Loader.gotoTimeoutPage();
  };

  this.updateDropDown = function (optionsEl) {
    var recordList = document.getElementById('on_values');

    var newOptions = optionsEl.getElementsByTagName('option');
    // not used
    //		var currentDisplayValue = document.getElementById('on_display').value;

    for (var i = 0; i < newOptions.length; ++i) {
      var anOption = newOptions[i];
      var isEnabled = anOption.attributes.getNamedItem('isEnabled').nodeValue;
      var value = "";
      if (anOption.getElementsByTagName('value')[0] && anOption.getElementsByTagName('value')[0].firstChild) {
        value = anOption.getElementsByTagName('value')[0].firstChild.data;
      }

      var label = "";
      if (anOption.getElementsByTagName('label')[0] && anOption.getElementsByTagName('label')[0].firstChild) {
        label = anOption.getElementsByTagName('label')[0].firstChild.data;
      }

      var aNewOption = document.createElement('option');
      if (label) {
        aNewOption.text = label;
      } else {
        aNewOption.text = "";
      }

      aNewOption.value = value;

      //Add new option.
      recordList.options.add(aNewOption);

      if (isEnabled == "false") {
        aNewOption.style.background = "#E0E0E0";
        aNewOption.disabled = true;
      } else {
        if (EBX_FacetEnumeration.selector_valueField.value == aNewOption.value) {
          //Current value is highlighted and selected by default.
          aNewOption.style.background = "#FFF4C1";
          aNewOption.selected = true;
        }
      }
    }

    var rawValues = [];

    // Redisplay as HTML in div
    var valuesDiv = document.getElementById('on_valuesDiv');
    var html = "<select style='width: 100%;'";
    if (EBX_LayoutManager.isIPad) {
      html += " onchange='window.setTimeout(\"EBX_FacetEnumeration.selector_submit()\", 0);'";
    } else {
      html += " ondblclick='EBX_FacetEnumeration.selector_submit();'";
    }
    html += " onkeyup='EBX_FacetEnumeration.selector_listKeyUp(event, this);' size='11' id='on_values'>";
    for (i = 0; i < recordList.options.length; i++) {
      anOption = recordList.options[i];

      rawValues[i] = anOption.value;

      html += "<option";
      if (anOption.disabled) {
        html += " disabled";
      }
      if (anOption.selected) {
        html += " selected";
      }
      var style = "";
      if (anOption.style.background) {
        style += " background: " + anOption.style.background + ";";
      }
      if (anOption.value == parent.ebx_nullValueForFacetEnum) {
        style += " color: #777777; font-style: italic;";
      }
      if (style !== "") {
        html += " style=\"" + style + "\"";
      }
      html += " title=\"" + anOption.text + "\"";
      html += ">";
      html += anOption.text;
      html += "</option>";
    }
    html += "</select>";
    valuesDiv.innerHTML = html;
    valuesDiv.ebx_rawValues = rawValues;

    EBX_Utils.removeCSSClass(document.getElementById("ebx_FacetEnum_SearchButton"),
        EBX_ButtonUtils.buttonPushedCSSClass);
  };

  this.getElementsByNameStartingWith = function (inputFieldIdPart) {
    var elements = parent.document.getElementsByTagName("input");
    var matchingElements = [];
    var cmp = 0;
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].type == "hidden" && elements[i].id.indexOf(inputFieldIdPart, 0) === 0 && elements[i].id.indexOf(
          'action') === -1
          && elements[i].value !== null && elements[i].value.length > 0) {
        matchingElements[cmp] = elements[i];
        cmp++;
      }
    }
    return matchingElements;
  };

  this.isFieldArrayContainValue = function (array, value) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].value == value) {
        return true;
      }
    }
    return false;
  };
};
EBX_FacetEnumeration.ajaxFacetEnumSelector.prototype = new EBX_AbstractAjaxResponseManager();

EBX_FacetEnumeration.selector_init = function () {
  var waitDivText = document.getElementById('on_waitDivText');
  waitDivText.innerHTML = parent.EBX_FACET_ENUMERATION_LABEL_WAIT_DIV_TEXT;

  document.getElementById("ebx_WorkspaceContent").style.overflow = "visible";

  EBX_FacetEnumeration.selector_valueField = parent.EBX_FacetEnumeration.onFacetEnum_valueField;
  EBX_FacetEnumeration.selector_displayField = parent.EBX_FacetEnumeration.onFacetEnum_displayField;
  EBX_FacetEnumeration.selector_baseURL = parent.EBX_FacetEnumeration.onFacetEnumURL_getRows;
  EBX_FacetEnumeration.selector_isTableRef = parent.EBX_FacetEnumeration.onFacetEnum_isTableRef;
};

EBX_FacetEnumeration.selector_search = function () {
  EBX_Utils.addCSSClass(document.getElementById("ebx_FacetEnum_SearchButton"), EBX_ButtonUtils.buttonPushedCSSClass);
  EBX_FacetEnumeration.selector_ajaxCallForSearch(EBX_FacetEnumeration.firstPage);
};

EBX_FacetEnumeration.selector_getRequestURLForSearch = function () {
  var currentDisplayValue = document.getElementById('on_display');
  var buildedUrl = EBX_FacetEnumeration.selector_getRequestURL(EBX_FacetEnumeration.firstPage);
  if (currentDisplayValue) {
    buildedUrl += '&$facetEnum_userInput=' + encodeURIComponent(currentDisplayValue.value);
  }
  return buildedUrl;
};

EBX_FacetEnumeration.selector_getRequestURL = function (page) {
  var buildedUrl = "";

  if (EBX_FacetEnumeration.selector_isTableRef) {
    buildedUrl = EBX_FacetEnumeration.selector_baseURL + page;
  } else {
    if (page === EBX_FacetEnumeration.firstPage) {
      EBX_FacetEnumeration.selector_currentPageIndex = 0;
      buildedUrl = EBX_FacetEnumeration.selector_baseURL + EBX_FacetEnumeration.selector_currentPageIndex;
    }
    if (page === EBX_FacetEnumeration.previousPage) {
      if (EBX_FacetEnumeration.selector_currentPageIndex - 10 <= 0) {
        EBX_FacetEnumeration.selector_currentPageIndex = 0;
      } else {
        EBX_FacetEnumeration.selector_currentPageIndex -= 10;
      }
      buildedUrl = EBX_FacetEnumeration.selector_baseURL + EBX_FacetEnumeration.selector_currentPageIndex;
    }
    if (page === EBX_FacetEnumeration.nextPage) {
      EBX_FacetEnumeration.selector_currentPageIndex += 10;
      buildedUrl = EBX_FacetEnumeration.selector_baseURL + EBX_FacetEnumeration.selector_currentPageIndex;
    }
    if (page === EBX_FacetEnumeration.lastPage) {
      buildedUrl = EBX_FacetEnumeration.selector_baseURL + page;
    }
    // The user input is required for other enumerations.
    var currentDisplayValue = document.getElementById('on_display');
    if (currentDisplayValue) {
      buildedUrl += '&$facetEnum_userInput=' + encodeURIComponent(currentDisplayValue.value);
    }
  }

  return buildedUrl;
};

EBX_FacetEnumeration.selector_selectValue = function () {
  var recordList = document.getElementById('on_values');
  var selectedOption = recordList.options[recordList.selectedIndex];

  if (selectedOption.value == '-') {
    return;
  }
  document.getElementById('on_value').value = selectedOption.value;
  document.getElementById('on_display').value = selectedOption.text;
};

EBX_FacetEnumeration.selector_listKeyUp = function (evenement, refObj) {
  var keyCode = window.event ? evenement.keyCode : evenement.which;
  if (keyCode == EBX_Utils.keyCodes.ENTER) {
    if (refObj.id == 'on_values') {
      EBX_FacetEnumeration.selector_submit();
    }
    if (refObj.id == 'on_display') {
      EBX_FacetEnumeration.selector_search();
    }
  }

  if (refObj.id == 'on_display') {
    if (keyCode == EBX_Utils.keyCodes.DOWN || keyCode == EBX_Utils.keyCodes.UP) {
      EBX_Form.focus('on_values');
    }
  }
};

EBX_FacetEnumeration.selector_commonKeyUp = function (evenement) {
  var keyCode = window.event ? window.event.keyCode : evenement.which;
  if (keyCode == EBX_Utils.keyCodes.ESCAPE) {
    EBX_FacetEnumeration.selector_closeFacetEnum();
  }
};

EBX_FacetEnumeration.selector_submit = function () {
  var values = document.getElementById('on_values');
  var valuesDiv = document.getElementById('on_valuesDiv');
  var rawValues = valuesDiv.ebx_rawValues;

  if (values.selectedIndex < 0 && values.length > 0) {
    ebx_alert(parent.EBX_FACET_ENUMERATION_LABEL_ALERT_SELECT_VALUE);
    return;
  }
  if (values.length === 0) {
    EBX_FacetEnumeration.selector_closeFacetEnum();
    return;
  }

  var selectedOption = values.options[values.selectedIndex];
  //Can't select a disabled option. Thus return false and reset selected index.
  if (selectedOption.disabled) {
    values.selectedIndex = -1;
    values.selected = false;
    return;
  }

  EBX_FacetEnumeration.selector_displayField.value = selectedOption.text;
  EBX_FacetEnumeration.selector_valueField.value = rawValues[values.selectedIndex];

  // activate onchange event on value field
  if (EBX_FacetEnumeration.selector_valueField.onchange) {
    EBX_FacetEnumeration.selector_valueField.onchange();
  }

  EBX_FacetEnumeration.selector_closeFacetEnum();
};

EBX_FacetEnumeration.selector_closeFacetEnum = function () {
  try {
    EBX_FacetEnumeration.selector_displayField.focus();
  } catch (e) {
  }
  parent.ebx_delFacetEnumeration();
};

EBX_FacetEnumeration.selector_resetList = function () {
  var recordList = document.getElementById('on_values');
  for (var i = recordList.length - 1; i >= 0; i--) {
    var achild = recordList.options[i];
    recordList.removeChild(achild);
  }

  //Hide input fields and display wait div
  EBX_FacetEnumeration.selector_hideInputFields(true);
};

EBX_FacetEnumeration.selector_manageButtons = function () {
  // not used
  //	var valuesDiv = document.getElementById('on_valuesDiv');

  var searchButton = document.getElementById('ebx_FacetEnum_SearchButton');
  var firstPageImgLink = document.getElementById('onFacetEnum_FirstPageIcon');
  var previousPageImgLink = document.getElementById('onFacetEnum_PreviousPageIcon');
  var nextPageImgLink = document.getElementById('onFacetEnum_NextPageIcon');
  var lastPageImgLink = document.getElementById('onFacetEnum_LastPageIcon');

  if (document.getElementById('on_waitDiv').style.display == "none") {
    EBX_FacetEnumeration.selector_manageButton(searchButton, false);
    //We are in first page
    if (parseInt(EBX_FacetEnumeration.selector_currentPageIndex, 10) === 0) {
      EBX_FacetEnumeration.selector_manageButton(firstPageImgLink, true);
      EBX_FacetEnumeration.selector_manageButton(previousPageImgLink, true);
    } else {
      EBX_FacetEnumeration.selector_manageButton(firstPageImgLink, false);
      EBX_FacetEnumeration.selector_manageButton(previousPageImgLink, false);
    }

    if (EBX_FacetEnumeration.selector_isLastPage) {
      EBX_FacetEnumeration.selector_manageButton(nextPageImgLink, true);
      EBX_FacetEnumeration.selector_manageButton(lastPageImgLink, true);
    } else {
      EBX_FacetEnumeration.selector_manageButton(nextPageImgLink, false);
      EBX_FacetEnumeration.selector_manageButton(lastPageImgLink, false);
    }
  } else {
    EBX_FacetEnumeration.selector_manageButton(searchButton, true);
    EBX_FacetEnumeration.selector_manageButton(firstPageImgLink, true);
    EBX_FacetEnumeration.selector_manageButton(previousPageImgLink, true);
    EBX_FacetEnumeration.selector_manageButton(nextPageImgLink, true);
    EBX_FacetEnumeration.selector_manageButton(lastPageImgLink, true);
  }
};

EBX_FacetEnumeration.selector_manageButton = function (button, isDisabled) {
  if (!button) {
    return;
  }
  EBX_ButtonUtils.setButtonDisabled(button, isDisabled);
};

EBX_FacetEnumeration.selector_lastPage = function () {
  EBX_FacetEnumeration.selector_ajaxCall(EBX_FacetEnumeration.lastPage);
};

EBX_FacetEnumeration.selector_nextPage = function () {
  EBX_FacetEnumeration.selector_ajaxCall(EBX_FacetEnumeration.nextPage);
};

EBX_FacetEnumeration.selector_firstPage = function () {
  EBX_FacetEnumeration.selector_ajaxCall(EBX_FacetEnumeration.firstPage);
};

EBX_FacetEnumeration.selector_previousPage = function () {
  EBX_FacetEnumeration.selector_ajaxCall(EBX_FacetEnumeration.previousPage);
};

EBX_FacetEnumeration.selector_ajaxCallForSearch = function () {
  EBX_FacetEnumeration.selector_resetList();
  var ajaxFacetEnumObject = new EBX_FacetEnumeration.ajaxFacetEnumSelector();
  ajaxFacetEnumObject.onExecute(EBX_FacetEnumeration.selector_getRequestURLForSearch());
};

EBX_FacetEnumeration.selector_ajaxCall = function (page) {
  EBX_FacetEnumeration.selector_resetList();
  var ajaxFacetEnumObject = new EBX_FacetEnumeration.ajaxFacetEnumSelector();
  ajaxFacetEnumObject.onExecute(EBX_FacetEnumeration.selector_getRequestURL(page));
};

EBX_FacetEnumeration.selector_initialAjaxCall = function () {
  var recordList = document.getElementById('on_values');
  if (recordList) {
    EBX_FacetEnumeration.selector_ajaxCallForSearch();
  } else {
    setTimeout("EBX_FacetEnumeration.selector_initialAjaxCall()", 200);
  }
};
EBX_FacetEnumeration.focusValuesTaskId = "EBX_FacetEnumeration_focusValuesTask";
EBX_FacetEnumeration.selector_hideInputFields = function (hide) {
  if (hide) {
    document.getElementById("on_valuesDiv").style.display = "none";
    document.getElementById("on_waitDiv").style.display = "";
  } else {
    document.getElementById("on_valuesDiv").style.display = "";
    document.getElementById("on_waitDiv").style.display = "none";
    //        document.getElementById('on_display').focus();
    EBX_Loader.addDynamicallyTaskBeforeTaskId(EBX_Loader_taskId_destroy_loading_layer,
        EBX_FacetEnumeration.focusValuesTaskId,
        EBX_FacetEnumeration.focusValuesTaskId, EBX_Loader.states.onStarting, EBX_FacetEnumeration.focusValuesTask,
        EBX_Utils.returnTrue);
  }

  EBX_FacetEnumeration.selector_manageButtons();
};
EBX_FacetEnumeration.focusValuesTask = function () {
  EBX_Loader.changeTaskState(EBX_FacetEnumeration.focusValuesTaskId, EBX_Loader.states.processing);

  EBX_Form.focus('on_values');

  EBX_Loader.changeTaskState(EBX_FacetEnumeration.focusValuesTaskId, EBX_Loader.states.done);
};
/** *END Facet Enumeration SELECTOR ** */

/** *END Facet Enumeration ** */

/** *START Incremental Search Selector ** */

function EBX_ISS() {
}

/* Constant */
/* feed by UIIncrementalSearchSelectorManagerVC for each ISS added in the page */
EBX_ISS.mapIdPreviewURL = {};
EBX_ISS.mapIdCreateNewURL = {};
EBX_ISS.mapIdAdvancedSelectorURL = {};
EBX_ISS.mapIdPathForNodeIndex = {};
EBX_ISS.mapIdAjaxComponentIndex = {};
EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly = {};
EBX_ISS.javaScriptSelectionListener = {};
EBX_ISS.isManualSearchMode = {};

/* Constants. Null are initialized at the first display */
// height in px for list border (top and bottom) which launch auto-scroll
EBX_ISS.listScrollPadding = 20;
// rolling delay between key press and request in ms
EBX_ISS.requestDelay = 200;
// initial height in px, popup height can't be less than this value
EBX_ISS.initialHeight = 150;

EBX_ISS_State = function (className) {
  this.className = className;
};
EBX_ISS_State.ERROR = new EBX_ISS_State("ebx_ISS_list_Error");
EBX_ISS_State.WAITING_INPUT = new EBX_ISS_State("ebx_ISS_list_WaitingInput");
EBX_ISS_State.NORMAL = new EBX_ISS_State("ebx_ISS_list_Normal");
EBX_ISS_State.HAS_NEXT = new EBX_ISS_State("ebx_ISS_list_HasNext");
EBX_ISS_State.NO_RESULT = new EBX_ISS_State("ebx_ISS_list_NoResult");
EBX_ISS_State.LOADING = new EBX_ISS_State("ebx_ISS_list_Loading");
EBX_ISS_State.WAITING_APV = new EBX_ISS_State("ebx_ISS_list_WaitingAPV");

EBX_ISS.containerCSSClass = "ebx_ISS_Container";
EBX_ISS.containerFocusCSSClass = "ebx_ISS_Container_Focus";
EBX_ISS.containerActiveCSSClass = "ebx_ISS_Container_Active";

EBX_ISS.paneId = "ebx_ISS_pane";
EBX_ISS.pane = null;
EBX_ISS.resize = null;
EBX_ISS.scrollMakerCSSClass = "ebx_ISS_scrollMaker";

EBX_ISS.bodyDivId = "ebx_ISS_body";
EBX_ISS.bodyDivEl = null;
EBX_ISS.originalLabelDivId = "ebx_ISS_OriginalLabel";
EBX_ISS.originalLabelDivEl = null;
// Mantis #12657
EBX_ISS.originalLabelEnabled = false;
EBX_ISS.listId = "ebx_ISS_list";
EBX_ISS.listEl = null;
EBX_ISS.errorDivId = "ebx_ISS_Error";
EBX_ISS.errorDivEl = null;
EBX_ISS.waitingInputDivId = "ebx_ISS_WaitingInput";
EBX_ISS.waitingInputDivEl = null;
EBX_ISS.resultsDivId = "ebx_ISS_Results";
EBX_ISS.resultsDivEl = null;
EBX_ISS.hasNextDivId = "ebx_ISS_HasNext";
EBX_ISS.hasNextDivEl = null;
EBX_ISS.noResultDivId = "ebx_ISS_NoResult";
EBX_ISS.noResultDivEl = null;
EBX_ISS.loadingDivId = "ebx_ISS_Loading";
EBX_ISS.loadingDivEl = null;
EBX_ISS.toolbarDivId = "ebx_ISS_Toolbar";
EBX_ISS.toolbarDivEl = null;
EBX_ISS.createButtonId = "ebx_ISS_CreateButton";
EBX_ISS.createButtonEl = null;
EBX_ISS.advancedSelectorButtonId = "ebx_ISS_AdvancedSelectorButton";
EBX_ISS.advancedSelectorButtonEl = null;
EBX_ISS.waitingAPVDivId = "ebx_ISS_WaitingAPV";
EBX_ISS.waitingAPVDivEl = null;

EBX_ISS.itemPrefixId = "ebx_ISS_Item_";

/* Variables depending to the field */
EBX_ISS.currentScrollMaker = null;
EBX_ISS.currentScrollingContainer = null;
EBX_ISS.currentContainerEl = null;
EBX_ISS.currentInputEl = null;
EBX_ISS.currentButtonEl = null;
EBX_ISS.originalInputLabel = null;
EBX_ISS.originalInputCSSClass = null;
EBX_ISS.results = [];
EBX_ISS.highlightedItemIndex = -2;
EBX_ISS.highlightedItemIndexUI = -2;
EBX_ISS.listState = EBX_ISS_State.NORMAL;
EBX_ISS.requestedIndex = 0;
EBX_ISS.maxItemsByPage = 0;
EBX_ISS.defaultPageExtraSize = 6;
EBX_ISS.defaultItemHeight = undefined;
EBX_ISS.isShown = false;
EBX_ISS.preventBlur = false;
EBX_ISS.originalFormScrollTop = null;
EBX_ISS.currentFormScrollTop = null;
EBX_ISS.currentFormExtraHeightBottom = null;
EBX_ISS.additionnalFormHeight = 0;
EBX_ISS.isCurrentManualSearchMode = false;
EBX_ISS.lazyLoadedElements = [];

EBX_ISS.showPane = function () {
  YAHOO.util.Event.addListener(EBX_ISS.currentScrollingContainer, "scroll",
      EBX_ISS.resetFormScroll, EBX_ISS.currentScrollingContainer.scrollLeft);

  EBX_ISS.pane.show();

  //Avoid creepy graphics bugs on window resize
  EBX_LayoutManager.bodyLayout.addListener("resize", EBX_ISS.revert);

  EBX_Utils.addCSSClass(EBX_ISS.currentContainerEl, EBX_ISS.containerActiveCSSClass);

  EBX_ISS.isShown = true;

  if (EBX_ISS.isCurrentManualSearchMode === true) {
    EBX_ISS.waitingInputDivEl.innerHTML = EBX_LocalizedMessage.comboBox_pressEnterToSearch;
  } else {
    EBX_ISS.waitingInputDivEl.innerHTML = EBX_LocalizedMessage.comboBox_waitingInput;
  }
};

EBX_ISS.hidePane = function () {

  YAHOO.util.Event.removeListener(EBX_ISS.currentScrollingContainer, "scroll", EBX_ISS.resetFormScroll);
  EBX_Utils.removeCSSClass(EBX_ISS.currentContainerEl, EBX_ISS.containerActiveCSSClass);
  EBX_ButtonUtils.setStateToToggleButton(EBX_ISS.currentButtonEl, false);

  EBX_ISS.pane.hide();

  EBX_LayoutManager.bodyLayout.removeListener("resize", EBX_ISS.revert);

  EBX_Loader.onMouseReleasedOnce(EBX_ISS.resetScrollingContainerScrollTop, {
    currentScrollingContainer: EBX_ISS.currentScrollingContainer,
    originalFormScrollTop: EBX_ISS.originalFormScrollTop,
    currentScrollMaker: EBX_ISS.currentScrollMaker
  });

  window.clearTimeout(EBX_ISS.currentRequestTimeoutId);

  EBX_ISS.isShown = false;
  EBX_ISS.preventBlur = false;
  EBX_ISS.currentContainerEl = null;
  EBX_ISS.currentInputEl = null;
  EBX_ISS.currentButtonEl = null;
  EBX_ISS.originalInputLabel = null;
  EBX_ISS.originalInputCSSClass = null;
  EBX_ISS.originalFormScrollTop = null;
  EBX_ISS.currentFormScrollTop = null;
  EBX_ISS.currentFormExtraHeightBottom = null;
  EBX_ISS.additionnalFormHeight = 0;
  EBX_ISS.isCurrentManualSearchMode = false;

  // Reset scroll behavior
  var scrollCtn = EBX_ISS.currentScrollingContainer;
  EBX_ISS.currentScrollingContainer = null;
  EBX_ISS.currentScrollMaker = null;

  EBX_ISS.results = [];
  EBX_ISS.highlightedItemIndex = -2;
  EBX_ISS.highlightedItemIndexUI = -2;
  EBX_ISS.listState = EBX_ISS_State.NORMAL;
  EBX_ISS.requestedIndex = 0;

  window.setTimeout(function () {
    scrollCtn.style.overflowY = '';
  }, 100);
};

EBX_ISS.resetScrollingContainerScrollTop = function (args) {
  args.currentScrollingContainer.scrollTop = args.originalFormScrollTop;
  args.currentScrollMaker.style.height = "";
};

EBX_ISS.currentRequestTimeoutId = null;

EBX_ISS.reload = function () {
  EBX_ISS.results = [];
  EBX_ISS.highlightedItemIndex = -2;
  EBX_ISS.highlightedItemIndexUI = -2;
  EBX_ISS.listState = EBX_ISS_State.WAITING_INPUT;
  EBX_ISS.requestedIndex = 0;

  EBX_ISS.refreshUIItemsList();

  if (EBX_ISS.isShown === false) {
    EBX_ISS.showPane();
  }

  window.clearTimeout(EBX_ISS.currentRequestTimeoutId);
  if (EBX_ISS.isCurrentManualSearchMode !== true) {
    EBX_ISS.currentRequestTimeoutId = window.setTimeout(EBX_ISS.sendRequest, EBX_ISS.requestDelay);
  }
};

EBX_ISS.revert = function () {
  EBX_ISS.lazyLoadedElements.length = 0;
  EBX_ISS.currentInputEl.value = EBX_ISS.originalInputLabel;
  EBX_ISS.currentInputEl.className = EBX_ISS.originalInputCSSClass;
  EBX_ISS.hidePane();
};

EBX_ISS.blurHandler = function (inputEl) {
  EBX_Utils.removeCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(inputEl, EBX_ISS.containerCSSClass),
      EBX_ISS.containerFocusCSSClass);
  if (EBX_ISS.currentInputEl !== inputEl) {
    return;
  }

  if (EBX_ISS.preventBlur === true) {
    window.setTimeout(function () {
      if (EBX_ISS.currentInputEl !== null) {
        EBX_ISS.currentInputEl.focus();
      }
    }, 0);
    return;
  }

  if (EBX_ISS.pane !== null) {
    EBX_ISS.revert();
  }
};

EBX_ISS.focusHandler = function (inputEl) {
  EBX_Utils.addCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(inputEl, EBX_ISS.containerCSSClass),
      EBX_ISS.containerFocusCSSClass);
};

EBX_ISS.init = function (inputEl, clearLabel) {
  if (EBX_ISS.currentInputEl === inputEl) {
    return;
  }
  if (EBX_ISS.currentInputEl !== null) {
    EBX_ISS.blurHandler(EBX_ISS.currentInputEl);
  }
  EBX_ISS.currentContainerEl = EBX_Utils.getFirstParentMatchingCSSClass(inputEl, EBX_ISS.containerCSSClass);
  EBX_ISS.currentInputEl = inputEl;
  EBX_ISS.currentButtonEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(EBX_ISS.currentContainerEl, "ebx_DropDown");
  EBX_ISS.originalInputLabel = inputEl.value;
  EBX_ISS.originalInputCSSClass = inputEl.className;
  EBX_ISS.paneForcedHeight = undefined;
  EBX_ISS.paneForcedWidth = undefined;
  EBX_ISS.currentScrollingContainer = EBX_Form.getFormScrollingContainer(EBX_ISS.currentContainerEl);
  EBX_ISS.originalFormScrollTop = EBX_ISS.currentScrollingContainer.scrollTop;
  EBX_ISS.currentFormScrollTop = EBX_ISS.currentScrollingContainer.scrollTop;

  EBX_ISS.isCurrentManualSearchMode = EBX_ISS.isManualSearchMode[EBX_ISS.currentInputEl.id] !== undefined
      && EBX_ISS.isManualSearchMode[EBX_ISS.currentInputEl.id] === true;

  EBX_ButtonUtils.setStateToToggleButton(EBX_ISS.currentButtonEl, true);
  EBX_ISS.initPane();

  // require pane initialized
  if (EBX_ISS.gutterBottom === undefined) {
    EBX_ISS.computeGutterBottom();
  }
  if (EBX_ISS.defaultItemHeight === undefined) {
    EBX_ISS.computeDefaultItemHeight();
  }
  var D = YAHOO.util.Dom;
  var clientRegion = D.getClientRegion();
  var elRegion = D.getRegion(EBX_ISS.bodyDivEl);
  if (EBX_ISS.maxItemsByPage === 0) {
    var popupHeight = Math.max(EBX_ISS.getMinPopupHeight(clientRegion),
        EBX_ISS.getChoicesPopupMaxHeight(clientRegion, elRegion));
    EBX_ISS.maxItemsByPage = Math.ceil(popupHeight / EBX_ISS.defaultItemHeight);
  }

  EBX_ISS.initScrollMaker();
  EBX_ISS.currentFormExtraHeightBottom = EBX_ISS.getFormExtraHeightBottom();

  if (clearLabel) {
    // Chrome has some problem to align an inline-flex empty input with other elements :
    //https://bugs.chromium.org/p/chromium/issues/detail?id=401185&q=inline%20align%20component%3ABlink%3ELayout%3EFlexbox&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified
    // We should always provide something to let him fix its vertical alignment.
    if (EBX_LayoutManager.browser === "Chrome") {
      inputEl.placeholder = " ";
    }
    inputEl.value = "";
    inputEl.className = "";
  }
};
/**
 * Compute the height of a simple list item.
 */
EBX_ISS.computeDefaultItemHeight = function () {
  var content = [];
  var item = {
    labelForDisplay: 'Not Defined',
    previewURL: ''
  };
  EBX_ISS.createUIItem(content, 0, item);

  if ((EBX_ISS.resultsDivEl !== null) && (EBX_ISS.listEl !== null)) {
    EBX_ISS.resultsDivEl.innerHTML = content.join("");
    EBX_ISS.defaultItemHeight = EBX_ISS.listEl.offsetHeight;
    EBX_ISS.resultsDivEl.innerHTML = "";
  } else {
    EBX_ISS.defaultItemHeight = 22; //fallback
  }
};
/**
 * Set the bottom gutter to use for this combo box.
 */
EBX_ISS.computeGutterBottom = function () {
  var D = YAHOO.util.Dom;
  var clientRegion = D.getClientRegion();
  var wkRegion = D.getRegion(EBX_ISS.currentScrollingContainer);

  var hoveringBottomBar = 0;
  //Overflow auto implies that workspace form bottom bar is positionned over the workspace content.
  if (EBX_ISS.currentScrollingContainer.style.overflow === "auto") {
    hoveringBottomBar = EBX_Form.getWorkspaceFormBottomBarHeight();
  }
  var workspaceContentHeight = wkRegion.bottom - hoveringBottomBar;
  EBX_ISS.gutterBottom = clientRegion.bottom - workspaceContentHeight;
};
/**
 * Return the maximal height of the choices popup. Popup pane shall be yet
 * aligned on input element.
 *
 * @param {YAHOO.util.Region }
 *            clientRegion window client region
 * @param {YAHOO.util.Region }
 *            elRegion choices popup pane element
 * @return {int} the available space height
 */
EBX_ISS.getChoicesPopupMaxHeight = function (clientRegion, elRegion) {
  return clientRegion.bottom - elRegion.top - EBX_ISS.gutterBottom;
};

EBX_ISS.getFormExtraHeightBottom = function () {

  var D = YAHOO.util.Dom;
  var formBodyRegion = D.getRegion(EBX_ISS.currentScrollingContainer);
  var scrollMakerRegion = D.getRegion(EBX_ISS.currentScrollMaker);

  var ret = formBodyRegion.bottom - scrollMakerRegion.bottom;
  if (ret < 0) {
    ret = 0;
  }

  return ret;
};
EBX_ISS.initScrollMaker = function () {
  var scrollMaker = EBX_Utils.getFirstDirectChildMatchingCSSClass(EBX_ISS.currentScrollingContainer,
      EBX_ISS.scrollMakerCSSClass);
  if (scrollMaker === null) {
    scrollMaker = document.createElement("div");
    scrollMaker.className = EBX_ISS.scrollMakerCSSClass;
    EBX_ISS.currentScrollingContainer.appendChild(scrollMaker);
  }
  EBX_ISS.currentScrollMaker = scrollMaker;
};

EBX_ISS.keyDownHandler = function (inputEl, event) {
  if (!EBX_ISS.isAnInterestingKeyEvent(event)) {
    return;
  }

  var clearLabel = true;
  // if the field is defined
  if (EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[inputEl.id] !== true
      && EBX_FormNodeIndex.getFormNode(EBX_ISS.mapIdPathForNodeIndex[inputEl.id]).getValue() !== null) {
    clearLabel = false;
  }
  EBX_ISS.init(inputEl, clearLabel);

  if (event.keyCode === EBX_Utils.keyCodes.DOWN) {
    if (EBX_ISS.listState === EBX_ISS_State.WAITING_INPUT) {
      window.clearTimeout(EBX_ISS.currentRequestTimeoutId);
      EBX_ISS.highlightedItemIndex++;
      // avoid highlight index -1 (original value) if original label disabled or JS selection only
      if ((EBX_ISS.originalLabelEnabled === false
          || EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[EBX_ISS.currentInputEl.id] === true)
          && EBX_ISS.highlightedItemIndex === -1) {
        EBX_ISS.highlightedItemIndex++;
      }
      EBX_ISS.sendRequest();
    } else if (EBX_ISS.isShown === false) {
      EBX_ISS.showPane();
      EBX_ISS.highlightedItemIndex++;
      // avoid highlight index -1 (original value) if original label disabled or JS selection only
      if ((EBX_ISS.originalLabelEnabled === false
          || EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[EBX_ISS.currentInputEl.id] === true)
          && EBX_ISS.highlightedItemIndex === -1) {
        EBX_ISS.highlightedItemIndex++;
      }
      EBX_ISS.sendRequest();
    } else {
      EBX_ISS.highlightNextItem();
    }
    return;
  }

  if (event.keyCode === EBX_Utils.keyCodes.UP) {
    EBX_ISS.highlightPreviousItem();
    return;
  }

  if (event.keyCode === EBX_Utils.keyCodes.ESCAPE) {
    EBX_ISS.revert();
    return;
  }

  EBX_ISS.reload();
};

EBX_ISS.keyPressHandler = function (inputEl, event) {
  if (event.keyCode === EBX_Utils.keyCodes.ENTER) {
    if (EBX_ISS.isCurrentManualSearchMode === true) {
      if (EBX_ISS.listState === EBX_ISS_State.WAITING_INPUT) {
        window.clearTimeout(EBX_ISS.currentRequestTimeoutId);
        EBX_ISS.sendRequest();
        YAHOO.util.Event.stopEvent(event);
        return;
      } else if (EBX_ISS.isShown === false) {
        EBX_ISS.showPane();
        EBX_ISS.sendRequest();
        YAHOO.util.Event.stopEvent(event);
        return;
      }
    }

    if (EBX_ISS.isShown === true) {
      EBX_ISS.selectCurrentHighlight();
      YAHOO.util.Event.stopEvent(event);
    }
  }
};

EBX_ISS.launchButtonOnHandler = function (inputId) {
  var inputEl = document.getElementById(inputId);
  inputEl.focus();
  EBX_ISS.init(inputEl, true);
  EBX_ISS.reload();
  window.clearTimeout(EBX_ISS.currentRequestTimeoutId);
  EBX_ISS.sendRequest();
};
EBX_ISS.launchButtonOffHandler = function () {
  EBX_ISS.revert();
};

EBX_ISS.selectCurrentHighlight = function () {
  if (EBX_ISS.highlightedItemIndex < -1) {
    return;
  }
  // -1 is the index of static original item
  if (EBX_ISS.highlightedItemIndex === -1) {
    EBX_ISS.revert();
    return;
  }
  EBX_ISS.selectIndex(EBX_ISS.highlightedItemIndex);
};

EBX_ISS.selectIndex = function (index) {
  var dataItem = EBX_ISS.results[index];

  if (EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[EBX_ISS.currentInputEl.id] === true) {
    var currentFormScrollHeight = EBX_ISS.currentScrollingContainer.scrollHeight;

    var javaScriptSelectionListener = EBX_ISS.javaScriptSelectionListener[EBX_ISS.currentInputEl.id];
    if (javaScriptSelectionListener !== undefined) {
      var fn = eval(javaScriptSelectionListener.fn);
      // not safe, but internal for now
      fn.call(window, dataItem, javaScriptSelectionListener.arg);
    }

    if (EBX_ISS.currentScrollingContainer) {
      var newFormScrollHeight = EBX_ISS.currentScrollingContainer.scrollHeight;
      if (currentFormScrollHeight < newFormScrollHeight) {
        EBX_ISS.originalFormScrollTop += newFormScrollHeight - currentFormScrollHeight;
        // also refresh scrolltop
        EBX_ISS.refreshUIItemsList();
      }
      EBX_ISS.setContext();
    }
  } else {
    EBX_ISS.mapIdPreviewURL[EBX_ISS.currentInputEl.id] = EBX_ISS.results[index].previewURL;

    dataItem.labelLoaded = true;
    EBX_FormNodeIndex.getFormNode(EBX_ISS.mapIdPathForNodeIndex[EBX_ISS.currentInputEl.id]).setValue(dataItem);
    EBX_FormPresenter.stackElementForValidation(EBX_ISS.currentInputEl);

    EBX_ISS.hidePane();
  }
};

EBX_ISS.highlightIndex = function (index, enableAutoScroll) {
  EBX_ISS.highlightedItemIndex = index;

  EBX_ISS.refreshUIHighlightedItem(enableAutoScroll);
};

EBX_ISS.highlightNextItem = function () {
  var indexMaxBound = EBX_ISS.results.length - 1;
  if (EBX_ISS.listState === EBX_ISS_State.HAS_NEXT) {
    indexMaxBound++;
  }

  if (EBX_ISS.highlightedItemIndex >= indexMaxBound) {
    return;
  }

  var newHighlightedIndex = EBX_ISS.highlightedItemIndex + 1;
  // avoid highlight index -1 (original value) if original label disabled or JS selection only
  if ((EBX_ISS.originalLabelEnabled === false
      || EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[EBX_ISS.currentInputEl.id] === true)
      && EBX_ISS.highlightedItemIndex === -1) {
    newHighlightedIndex = EBX_ISS.highlightedItemIndex + 1;
  }

  if (newHighlightedIndex !== EBX_ISS.results.length) {
    EBX_ISS.highlightedItemIndex = newHighlightedIndex;
    EBX_ISS.refreshUIHighlightedItem(true);
  } else {
    EBX_ISS.loadNextPage();
  }
};

EBX_ISS.highlightPreviousItem = function () {
  // -1 is the index of static original item
  if (EBX_ISS.highlightedItemIndex < -1) {
    return;
  }

  EBX_ISS.highlightedItemIndex--;
  // avoid highlight index -1 (original value) if original label disabled or JS selection only
  if ((EBX_ISS.originalLabelEnabled === false
      || EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[EBX_ISS.currentInputEl.id] === true)
      && EBX_ISS.highlightedItemIndex === -1) {
    EBX_ISS.highlightedItemIndex--;
  }

  EBX_ISS.refreshUIHighlightedItem(true);
};

EBX_ISS.refreshUIHighlightedItem = function (enableAutoScroll) {
  // clear the current highlight
  var elToUnHighlight = null;
  // -1 is the index of static original item
  if (EBX_ISS.highlightedItemIndexUI >= -1) {
    if (EBX_ISS.highlightedItemIndexUI === -1) {
      // -1 is the index of static original item
      elToUnHighlight = EBX_ISS.originalLabelDivEl;
    } else if (EBX_ISS.highlightedItemIndexUI !== EBX_ISS.results.length) {
      var idToHighlight = EBX_ISS.itemPrefixId + EBX_ISS.highlightedItemIndexUI;
      elToUnHighlight = document.getElementById(idToHighlight);
    }
    if (elToUnHighlight !== null) {
      EBX_Utils.removeCSSClass(elToUnHighlight, "_ebx_ISS_Item-highlighted");
    }
    // -1 is the index of static original item
    // -2 is the undefined value
    EBX_ISS.highlightedItemIndexUI = -2;
  }

  // apply the highlight

  // -1 is the index of static original item
  if (EBX_ISS.highlightedItemIndex < -1) {
    return;
  }

  //TODO tlu : #26374: when loading next items by pressing key "down",
  // give the loading panel a selected style and then select the first loaded item.
  // => To achieve that, we need the keep the previously highlighted element in a field
  // => Implies to change the EBX_ISS.highlightedItemIndex system
  var elToHighlight = null;
  if (EBX_ISS.highlightedItemIndex === -1) {
    // -1 is the index of static original item
    elToHighlight = EBX_ISS.originalLabelDivEl;
    enableAutoScroll = false;
  } else if (EBX_ISS.highlightedItemIndex !== EBX_ISS.results.length) {
    var idToHighlight = EBX_ISS.itemPrefixId + EBX_ISS.highlightedItemIndex;
    elToHighlight = document.getElementById(idToHighlight);
  }
  if (elToHighlight !== null) {
    EBX_Utils.addCSSClass(elToHighlight, "_ebx_ISS_Item-highlighted");

    // auto scroll
    if (enableAutoScroll) {
      var itemOffsetTop = elToHighlight.offsetTop;
      var itemHeight = elToHighlight.offsetHeight;
      var scrollTop = EBX_ISS.listEl.scrollTop;
      var listHeight = EBX_ISS.listEl.clientHeight;
      var isAbove = itemOffsetTop < scrollTop + EBX_ISS.listScrollPadding;
      if (isAbove) {
        EBX_ISS.listEl.scrollTop = itemOffsetTop - EBX_ISS.listScrollPadding;
      } else {
        var isBelow = itemOffsetTop + itemHeight + EBX_ISS.listScrollPadding > scrollTop + listHeight;
        if (isBelow) {
          EBX_ISS.listEl.scrollTop = itemOffsetTop + itemHeight + EBX_ISS.listScrollPadding - listHeight;
        }
      }
    }
  }

  EBX_ISS.highlightedItemIndexUI = EBX_ISS.highlightedItemIndex;
};

EBX_ISS.initPane = function () {

  if (EBX_ISS.pane === null) {
    EBX_ISS.pane = new YAHOO.widget.Overlay(EBX_ISS.paneId, {
      constraintoviewport: true,
      visible: false
    });

    EBX_ISS.pane.render(document.body);

    var paneBodyContent = [];

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.bodyDivId, "\"");
    paneBodyContent.push(" onmouseOver=\"EBX_ISS.preventBlur = true;\"");
    paneBodyContent.push(" onmouseOut=\"EBX_ISS.preventBlur = false;\"");
    paneBodyContent.push(">");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.originalLabelDivId, "\"");
    paneBodyContent.push(" onclick=\"EBX_ISS.revert();\"");
    paneBodyContent.push(" onmouseover=\"EBX_ISS.highlightIndex(-1, false);\"");
    paneBodyContent.push(">");
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.listId, "\"");
    paneBodyContent.push(">");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.errorDivId, "\"");
    paneBodyContent.push(" class=\"", "ebx_Error", " ", "ebx_IconError", "\"");
    paneBodyContent.push(">");
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.waitingInputDivId, "\"");
    paneBodyContent.push(">");
    paneBodyContent.push(EBX_LocalizedMessage.comboBox_waitingInput);
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.resultsDivId, "\"");
    paneBodyContent.push(">");
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.hasNextDivId, "\"");
    paneBodyContent.push(" onclick=\"EBX_ISS.loadNextPage();\"");
    paneBodyContent.push(" title=\"" + EBX_LocalizedMessage.comboBox_more + "\"");
    paneBodyContent.push(">");
    paneBodyContent.push("<div class=\"ebx_Icon\">&nbsp;</div>");
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.noResultDivId, "\"");
    paneBodyContent.push(">");
    paneBodyContent.push(EBX_LocalizedMessage.comboBox_empty);
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.loadingDivId, "\"");
    paneBodyContent.push(" class=\"", "ebx_IconAnimWait", "\"");
    paneBodyContent.push(">");
    paneBodyContent.push(EBX_LocalizedMessage.comboBox_loading);
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.waitingAPVDivId, "\"");
    paneBodyContent.push(" class=\"", "ebx_IconAnimWait", "\"");
    paneBodyContent.push(">");
    paneBodyContent.push(EBX_LocalizedMessage.form_waitingForAPV);
    paneBodyContent.push("</div>");

    // end of list
    paneBodyContent.push("</div>");

    paneBodyContent.push("<div");
    paneBodyContent.push(" id=\"", EBX_ISS.toolbarDivId, "\"");
    paneBodyContent.push(" onclick=\"EBX_ISS.onClickFooter(event);\"");
    paneBodyContent.push(">");

    paneBodyContent.push("<button");
    paneBodyContent.push(" type=\"button\"");
    paneBodyContent.push(" id=\"", EBX_ISS.createButtonId, "\"");
    paneBodyContent.push(" class=\"ebx_FlatButtonNoBorder ebx_TextAndIconLeftButton ebx_Add\"");
    paneBodyContent.push(" onclick=\"EBX_ISS.openCurrentCreate();\"");
    paneBodyContent.push(">");
    paneBodyContent.push("<span class=\"ebx_Icon\">&nbsp;</span>");
    paneBodyContent.push(EBX_LocalizedMessage.comboBox_create);
    paneBodyContent.push("</button>");

    paneBodyContent.push("<button");
    paneBodyContent.push(" type=\"button\"");
    paneBodyContent.push(" id=\"", EBX_ISS.advancedSelectorButtonId, "\"");
    paneBodyContent.push(" class=\"ebx_FlatButtonNoBorder ebx_TextAndIconRightButton ebx_Open\"");
    paneBodyContent.push(" onclick=\"EBX_ISS.openCurrentAdvancedSelector();\"");
    paneBodyContent.push(">");
    paneBodyContent.push(EBX_LocalizedMessage.comboBox_advancedSelector);
    paneBodyContent.push("<span class=\"ebx_Icon\">&nbsp;</span>");
    paneBodyContent.push("</button>");

    paneBodyContent.push("</div>");

    // end of content
    paneBodyContent.push("</div>");

    EBX_ISS.pane.setBody(paneBodyContent.join(""));

    EBX_ISS.listEl = document.getElementById(EBX_ISS.listId);
    //Handle lazy loading for items in list element
    YAHOO.util.Event.addListener(EBX_ISS.listEl, "scroll", EBX_ISS.onScrollInList);

    EBX_ISS.bodyDivEl = document.getElementById(EBX_ISS.bodyDivId);
    EBX_ISS.originalLabelDivEl = document.getElementById(EBX_ISS.originalLabelDivId);
    EBX_ISS.errorDivEl = document.getElementById(EBX_ISS.errorDivId);
    EBX_ISS.waitingInputDivEl = document.getElementById(EBX_ISS.waitingInputDivId);
    YAHOO.util.Event.addListener(EBX_ISS.waitingInputDivEl, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });
    EBX_ISS.resultsDivEl = document.getElementById(EBX_ISS.resultsDivId);
    EBX_ISS.hasNextDivEl = document.getElementById(EBX_ISS.hasNextDivId);
    YAHOO.util.Event.addListener(EBX_ISS.hasNextDivEl, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });
    EBX_ISS.noResultDivEl = document.getElementById(EBX_ISS.noResultDivId);
    YAHOO.util.Event.addListener(EBX_ISS.noResultDivEl, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });
    EBX_ISS.loadingDivEl = document.getElementById(EBX_ISS.loadingDivId);
    YAHOO.util.Event.addListener(EBX_ISS.loadingDivEl, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });
    EBX_ISS.waitingAPVDivEl = document.getElementById(EBX_ISS.waitingAPVDivId);
    YAHOO.util.Event.addListener(EBX_ISS.waitingAPVDivEl, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });
    EBX_ISS.toolbarDivEl = document.getElementById(EBX_ISS.toolbarDivId);
    EBX_ISS.createButtonEl = document.getElementById(EBX_ISS.createButtonId);
    EBX_ISS.advancedSelectorButtonEl = document.getElementById(EBX_ISS.advancedSelectorButtonId);

    EBX_ISS.resize = new YAHOO.util.Resize(EBX_ISS.bodyDivEl, {
      handles: ["br"],
      proxy: true,
      ghost: true,
      setSize: false
    });
    EBX_ISS.resize.subscribe("endResize", EBX_ISS.resizeListener, null, false);
    EBX_ISS.resize.subscribe("startResize", EBX_ISS.resetProxyPosition, null, false);
    EBX_ISS.resize.subscribe("proxyResize", EBX_ISS.computeProxyWidth, null, false);
  }

  EBX_ISS.pane.cfg.setProperty("width", EBX_ISS.getMinPopupWidth() + "px");
  EBX_ISS.listEl.style.maxHeight = EBX_ISS.initialHeight + "px";
  EBX_ISS.resize.set("minWidth", EBX_ISS.currentContainerEl.offsetWidth + EBX_ISS.getLastIEGap());
  EBX_ISS.resize.set("width", EBX_ISS.currentContainerEl.offsetWidth + EBX_ISS.getLastIEGap());

  EBX_ISS.setContext();

  var originalLabelContent = [];

  EBX_ISS.addItemLabel(
      originalLabelContent,
      EBX_ISS.originalInputLabel && EBX_ISS.originalInputLabel.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      EBX_ISS.mapIdPreviewURL[EBX_ISS.currentInputEl.id] !== undefined,
      "EBX_ISS.openCurrentPreview(event);");
  EBX_ISS.originalLabelDivEl.innerHTML = originalLabelContent.join("");

  EBX_ISS.originalLabelDivEl.className = EBX_ISS.originalInputCSSClass;

  if (EBX_ISS.originalLabelEnabled === false || EBX_ISS.mapIdIsUsedForJavaScriptSelectionOnly[EBX_ISS.currentInputEl.id]
      === true) {
    EBX_ISS.originalLabelDivEl.style.display = "none";
  } else {
    EBX_ISS.originalLabelDivEl.style.display = "";
  }

  var createButtonEnabled = EBX_ISS.mapIdCreateNewURL[EBX_ISS.currentInputEl.id] !== undefined;
  var advancedSelectorButtonEnabled = EBX_ISS.mapIdAdvancedSelectorURL[EBX_ISS.currentInputEl.id] !== undefined;

  if (createButtonEnabled || advancedSelectorButtonEnabled) {
    EBX_ISS.toolbarDivEl.style.display = "block";
  } else {
    EBX_ISS.toolbarDivEl.style.display = "none";
  }

  if (createButtonEnabled === true) {
    EBX_ISS.createButtonEl.style.display = "";
  } else {
    EBX_ISS.createButtonEl.style.display = "none";
  }

  if (advancedSelectorButtonEnabled === true) {
    EBX_ISS.advancedSelectorButtonEl.style.display = "";
  } else {
    EBX_ISS.advancedSelectorButtonEl.style.display = "none";
  }
};

EBX_ISS.setContext = function () {
  // [-1, -1] for left outline and no border bottom to the container
  EBX_ISS.pane.cfg.setProperty("context", [EBX_ISS.currentInputEl, 'tl', 'bl', null, [-1, -1]]);
};

EBX_ISS.resetProxyPosition = function (yuiEvent) {
  var proxyEl = EBX_ISS.resize.getProxyEl();
  proxyEl.style.top = "0";
  proxyEl.style.left = "0";

  // compute max bounds

  // compute resizeMaxBounds
  var D = YAHOO.util.Dom;
  var clientRegion = D.getClientRegion();
  var elRegion = D.getRegion(EBX_ISS.bodyDivEl);

  EBX_ISS.resize.set("maxWidth", clientRegion.right - elRegion.left - YAHOO.widget.Overlay.VIEWPORT_OFFSET);
  EBX_ISS.resize.set("maxHeight", EBX_ISS.getChoicesPopupMaxHeight(clientRegion, elRegion));
};

EBX_ISS.computeProxyWidth = function (yuiEvent) {
  var proxyEl = EBX_ISS.resize.getProxyEl();
  var gap = 2;
  if (YAHOO.env.ua.gecko !== 0) {
    gap--;
  }
  proxyEl.style.width = yuiEvent.width - gap + "px";
};

EBX_ISS.resizeListener = function (yuiEvent) {
  EBX_ISS.resizeListHeight(yuiEvent.height);
  EBX_ISS.paneForcedHeight = yuiEvent.height;
  EBX_ISS.paneForcedWidth = yuiEvent.width;

  // set width
  // + 2 for right border and outline
  var gap = 2;
  if (YAHOO.env.ua.gecko !== 0) {
    gap++;
  }
  var totalWidth = yuiEvent.width + gap;
  EBX_ISS.pane.cfg.setProperty("width", totalWidth + "px");

  //TODO bug new skin #105 : If resize is release outside the iframe, input is no more focused and EBX_ISS.currentInput is null
  // It is not possible to cancel the resize when input field is blured (tried destroy() and reset() methods)
  if (EBX_ISS.currentInputEl) {
    var request = [];
    request.push(EBX_ISS.saveWidthRequest);
    request.push("&", EBX_ISS.requestParam_ajaxComponentIndex, "=",
        encodeURIComponent(EBX_ISS.mapIdAjaxComponentIndex[EBX_ISS.currentInputEl.id]));
    request.push("&", EBX_ISS.requestParam_paginPageIndex, "=", EBX_ISS.requestedIndex);
    request.push("&", EBX_ISS.requestParam_popupWidth, "=", totalWidth);
    request.push("&", EBX_ISS.requestParam_popupHeight, "=", Math.max(yuiEvent.height, EBX_ISS.initialHeight));

    EBX_ISS.saveWidthRequester.sendRequest(request.join(""), null);
  }
};
EBX_ISS.resizeListHeight = function (height) {
  var availableHeight = height;
  availableHeight -= EBX_ISS.originalLabelDivEl.offsetHeight;
  availableHeight -= EBX_ISS.toolbarDivEl.offsetHeight;

  // set height
  EBX_ISS.listEl.style.maxHeight = availableHeight + "px";
};

/**
 * It is impossible to prevent the scroll of the form, so the only solution
 * found is to reset scroll positions.
 * http://www.quirksmode.org/dom/events/scroll.html "You cannot prevent the
 * scrolling."
 */
EBX_ISS.resetFormScroll = function (event, scrollLeft) {
  EBX_ISS.currentScrollingContainer.scrollTop = EBX_ISS.currentFormScrollTop;
  EBX_ISS.currentScrollingContainer.scrollLeft = scrollLeft;
};

EBX_ISS.refreshUIItemsList = function () {
  var content = [], resultItem;
  for (var i = 0, length = EBX_ISS.results.length; i < length; i++) {
    resultItem = EBX_ISS.results[i];
    EBX_ISS.createUIItem(content, i, resultItem);
  }
  EBX_ISS.resultsDivEl.innerHTML = content.join("");
  if (EBX_ISS.listState === EBX_ISS_State.HAS_NEXT) {
    EBX_ISS.addLazyLoadHandler(EBX_ISS.hasNextDivEl, EBX_ISS.loadNextPage);
  }
  EBX_ISS.refreshUIHighlightedItem(true);
  EBX_ISS.refreshUIItemsListPosition();
};
/**
 * Set popup dimensions and positions. Dimensions will fit to workspace.
 */
EBX_ISS.refreshUIItemsListPosition = function () {
  if (EBX_ISS.currentScrollingContainer !== undefined) {
    var resizeMinHeight = Math.max(EBX_ISS.defaultItemHeight + 4, EBX_ISS.listEl.offsetHeight);
    if (resizeMinHeight > EBX_ISS.initialHeight) {
      resizeMinHeight = EBX_ISS.initialHeight;
    }
    EBX_ISS.resize.set("minHeight", resizeMinHeight);
    EBX_ISS.listEl.className = EBX_ISS.listState.className;
    // The max list height available space
    var D = YAHOO.util.Dom;
    var clientRegion = D.getClientRegion();
    var elRegion = D.getRegion(EBX_ISS.pane.element);
    var maxListHeight = EBX_ISS.getChoicesPopupMaxHeight(clientRegion, elRegion);
    var availSpace = Math.max(maxListHeight, EBX_ISS.getMinPopupHeight(clientRegion));
    var workspaceSpaceBottomWidget = EBX_ISS.currentScrollingContainer.scrollHeight
        - YAHOO.widget.Overlay.VIEWPORT_OFFSET
        - (EBX_ISS.currentInputEl.offsetHeight + EBX_ISS.currentInputEl.offsetTop);
    if (workspaceSpaceBottomWidget > 0) {
      availSpace = Math.min(availSpace, workspaceSpaceBottomWidget);
    }
    //The actual height of the list
    var listHeight = 0;
    if ((EBX_ISS.listState === EBX_ISS_State.NO_RESULT) || (EBX_ISS.listState === EBX_ISS_State.WAITING_INPUT)) {
      listHeight = EBX_ISS.getMinPopupHeight(clientRegion);
    } else {
      listHeight = EBX_ISS.resultsDivEl.offsetHeight;
    }
    listHeight += EBX_ISS.originalLabelDivEl.offsetHeight + EBX_ISS.toolbarDivEl.offsetHeight
        + EBX_Utils.getHScrollHeight();
    //if a height is fixed, will use this one
    if (EBX_ISS.paneForcedHeight !== undefined) {
      listHeight = Math.min(listHeight, EBX_ISS.paneForcedHeight);
    }
    var paneHeight = Math.min(listHeight, availSpace);
    paneHeight = Math.max(paneHeight, resizeMinHeight);
    EBX_ISS.pane.element.style.height = paneHeight + "px";
    //If a width is fixed will use this one
    if (EBX_ISS.paneForcedWidth !== undefined) {
      var maxWidth = clientRegion.right - elRegion.left - YAHOO.widget.Overlay.VIEWPORT_OFFSET;
      maxWidth = Math.min(maxWidth, EBX_ISS.paneForcedWidth);
      maxWidth = Math.max(maxWidth, EBX_ISS.getMinPopupWidth());
      EBX_ISS.pane.element.style.width = maxWidth + "px";
    }
    EBX_ISS.resizeListHeight(paneHeight);
    elRegion = D.getRegion(EBX_ISS.pane.element);
    var excessHeight = elRegion.bottom - clientRegion.bottom + EBX_ISS.gutterBottom;
    if (excessHeight > 0) {
      EBX_ISS.additionnalFormHeight += excessHeight;
      //In a form with currently no scroll, prevent scroll bar appears
      if ((EBX_ISS.currentFormExtraHeightBottom > 0) && (excessHeight > 0)) {
        EBX_ISS.currentScrollingContainer.style.overflowY = 'hidden';
      }
      EBX_ISS.currentScrollMaker.style.height =
          EBX_ISS.currentFormExtraHeightBottom + EBX_ISS.additionnalFormHeight + "px";
      EBX_ISS.currentFormScrollTop = EBX_ISS.originalFormScrollTop + EBX_ISS.additionnalFormHeight;
      EBX_ISS.currentScrollingContainer.scrollTop = EBX_ISS.currentFormScrollTop;
    }
    // [-1, -1] for left outline and no border bottom to the container
    EBX_ISS.pane.align('tl', 'bl', [-1, -1]);
    if ((EBX_ISS.highlightedItemIndex <= -1) && (EBX_ISS.results.length > 0)) {
      EBX_ISS.highlightIndex(0);
    }
  }
};
/**
 * Create an item in the result list
 */
EBX_ISS.createUIItem = function (content, index, item) {
  content.push("<div");
  content.push(" id=\"", EBX_ISS.itemPrefixId, index, "\"");
  content.push(" class=\"ebx_ISS_Item");
  if (item.cssClass !== undefined) {
    content.push(" ", item.cssClass);
  }
  content.push("\"");
  content.push(" onclick=\"EBX_ISS.selectIndex(" + index + ");\"");
  content.push(" onmouseover=\"EBX_ISS.highlightIndex(" + index + ", false);\"");
  content.push(">");
  EBX_ISS.addItemLabel(content, item.labelForDisplay, item.previewURL
      !== undefined, "EBX_ISS.openPreviewResultIndex(event, " + index + ");");
  content.push("</div>");
};

EBX_ISS.addItemLabel = function (bufferArray, labelForDisplay, isPreviewEnabled, onclick) {
  if (isPreviewEnabled) {
    bufferArray.push("<div");
    bufferArray.push(" class=\"ebx_ISS_Item_WithPreview\"");
    bufferArray.push(">");
  }

  if (labelForDisplay.length === 0) {
    labelForDisplay = " ";
  }
  /* if the labelForDisplay is made of spaces only, it must not be collapsed */
  bufferArray.push(labelForDisplay.replace(" ", "&nbsp;"));

  if (isPreviewEnabled) {
    bufferArray.push("<button");
    bufferArray.push(" type=\"button\"");
    bufferArray.push(" class=\"ebx_FlatButton ebx_IconButton ebx_Open\"");
    bufferArray.push(" title=\"", EBX_LocalizedMessage._general_preview, "\"");
    bufferArray.push(" onclick=\"", onclick, "\"");
    bufferArray.push(">");
    bufferArray.push("<span class=\"ebx_Icon\">&nbsp;</span>");
    bufferArray.push("</button>");

    bufferArray.push("</div>");
  }
};

EBX_ISS.dataSource = new YAHOO.util.XHRDataSource();
EBX_ISS.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
EBX_ISS.dataSource.responseSchema = {
  resultsList: "items",
  fields: [{
    key: "key"
  }, {
    key: "label"
  }, {
    key: "labelForDisplay"
  }, {
    key: "cssClass"
  }, {
    key: "previewURL"
  }],
  metaFields: {
    hasNext: "hasNext",
    nextIndex: "nextIndex",
    fixedWidth: "fixedWidth",
    fixedHeight: "fixedHeight",
  }
};
EBX_ISS.saveWidthRequester = new YAHOO.util.XHRDataSource();

EBX_ISS.loadNextPage = function () {
  EBX_ISS.sendRequest();
};

EBX_ISS.sendRequest = function () {
  if (EBX_FormPresenterStatusIndicator.isWaiting()) {
    EBX_FormPresenterStatusIndicator.setListenerOnWaitingEnd(EBX_ISS.sendRequest);
    EBX_ISS.listState = EBX_ISS_State.WAITING_APV;
    EBX_ISS.refreshUIItemsList();
    return;
  }

  var request = [];
  request.push(EBX_ISS.sendingRequest);
  request.push("&", EBX_ISS.requestParam_ajaxComponentIndex, "=",
      encodeURIComponent(EBX_ISS.mapIdAjaxComponentIndex[EBX_ISS.currentInputEl.id]));
  request.push("&", EBX_ISS.requestParam_userInput, "=", encodeURIComponent(EBX_ISS.currentInputEl.value));
  request.push("&", EBX_ISS.requestParam_paginPageIndex, "=", EBX_ISS.requestedIndex);
  request.push("&", EBX_ISS.requestParam_maxItemsByPage, "=", Math.max(EBX_ISS.maxItemsByPage, 10)
      + EBX_ISS.defaultPageExtraSize);
  EBX_ISS.dataSource.sendRequest(request.join(""), {
    success: EBX_ISS.receiveSuccess,
    failure: EBX_ISS.receiveFailure,
    argument: EBX_ISS.currentInputEl.value
  });

  EBX_ISS.listState = EBX_ISS_State.LOADING;
  EBX_ISS.refreshUIItemsList();
};

EBX_ISS.receiveSuccess = function (oRequest, oParsedResponse, argument) {
  // reject outdated requests
  if (!EBX_ISS.currentInputEl || (argument !== EBX_ISS.currentInputEl.value)) {
    return;
  }

  EBX_ISS.results = EBX_ISS.results.concat(oParsedResponse.results);
  EBX_ISS.paneForcedWidth = oParsedResponse.meta.fixedWidth;
  EBX_ISS.paneForcedHeight = oParsedResponse.meta.fixedHeight;

  if (oParsedResponse.meta.hasNext) {
    EBX_ISS.listState = EBX_ISS_State.HAS_NEXT;
  } else if (EBX_ISS.results.length === 0) {
    EBX_ISS.listState = EBX_ISS_State.NO_RESULT;
  } else {
    EBX_ISS.listState = EBX_ISS_State.NORMAL;
  }
  EBX_ISS.requestedIndex = oParsedResponse.meta.nextIndex;

  EBX_ISS.refreshUIItemsList();
};

EBX_ISS.receiveFailure = function (oRequest, oParsedResponse, argument) {
  if (EBX_ISS.currentInputEl === null) {
    return;
  }
  // reject outdated requests
  if (argument !== EBX_ISS.currentInputEl.value) {
    return;
  }

  if (oParsedResponse.status == 401) {
    EBX_Loader.gotoTimeoutPage();
  } else {
    // TODO CCH it could be beautiful to add an iFrame with the result of the page (whole HTML content)
    // oParsedResponse.responseText
    // TODO CCH Filter the response code so that user is not annoyed by error messages which he do not bother.
    // EBX_UserMessageManager.addMessage("Error #" + oParsedResponse.status + ": " + oParsedResponse.statusText, EBX_UserMessageManager.ERROR);
    EBX_ISS.errorDivEl.innerHTML = decodeURIComponent(oParsedResponse.statusText);
  }
  EBX_ISS.listState = EBX_ISS_State.ERROR;
  EBX_ISS.refreshUIItemsList();
};

/**
 * Return true if the key pressed is not Alt, Meta or other specials unused
 */
EBX_ISS.isAnInterestingKeyEvent = function (event) {
  // when metaKey is pressed
  if (event.metaKey === 1 || event.keyCode === EBX_Utils.keyCodes.WIN_KEY) {
    return false;
  }

  // when contextual menu is pressed
  if (event.keyCode === EBX_Utils.keyCodes.WIN_MENU) {
    return false;
  }

  if (event.ctrlKey === 1) {
    // paste action (CTRL+V) is allowed
    if (event.keyCode !== EBX_Utils.keyCodes.KEY_V) {
      // both ctrl & alt is allowed
      if (event.altKey === 0) {
        return false;
      }
    }
  } else {
    if (event.altKey === 1) {
      return false;
    }
  }

  // when ctrl is pressed alone
  if (event.keyCode === EBX_Utils.keyCodes.CTRL) {
    return false;
  }

  // when alt is pressed alone
  if (event.keyCode === EBX_Utils.keyCodes.ALT) {
    return false;
  }

  // when shift is pressed alone
  if (event.shiftKey === 1 || event.keyCode === EBX_Utils.keyCodes.SHIFT) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.CAPS_LOCK) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.NUM_LOCK) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.SCROLL_LOCK) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.TAB) {
    // disable preventBlur even if the mouse is inside the list area
    EBX_ISS.preventBlur = false;
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.ENTER) {
    return false;
  }

  if (EBX_Utils.isFunctionKey(event.keyCode)) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.PAUSE) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.PAGE_DOWN || event.keyCode === EBX_Utils.keyCodes.PAGE_UP) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.LEFT || event.keyCode === EBX_Utils.keyCodes.RIGHT) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.HOME || event.keyCode === EBX_Utils.keyCodes.END) {
    return false;
  }

  // when UP_ARROW is pressed while ISS is not shown
  if (event.keyCode === EBX_Utils.keyCodes.UP && EBX_ISS.isShown === false) {
    return false;
  }

  // when ESCAPE is pressed while ISS is not shown
  if (event.keyCode === EBX_Utils.keyCodes.ESCAPE && EBX_ISS.isShown === false) {
    return false;
  }

  return true;
};

EBX_ISS.emptyButtonHandler = function (labelInputId) {
  EBX_ISS.mapIdPreviewURL[labelInputId] = undefined;
  var labelEl = document.getElementById(labelInputId);
  EBX_FormNodeIndex.getFormNode(EBX_ISS.mapIdPathForNodeIndex[labelInputId]).setValue(null);
  EBX_FormPresenter.stackElementForValidation(labelEl);
  labelEl.focus();
};

EBX_ISS.openPreviewResultIndex = function (event, resultIndex) {
  var previewURL = EBX_ISS.results[resultIndex].previewURL;
  if (previewURL === undefined) {
    return;
  }
  EBX_ISS.preventBlur = false;
  YAHOO.util.Event.stopEvent(event);
  EBX_Utils.openInternalPopupLargeSizeHostedClose(previewURL);
};
EBX_ISS.openCurrentPreview = function (event) {
  var previewURL = EBX_ISS.mapIdPreviewURL[EBX_ISS.currentInputEl.id];
  if (previewURL === undefined) {
    return;
  }
  YAHOO.util.Event.stopEvent(event);
  EBX_Utils.openInternalPopupLargeSizeHostedClose(previewURL);
};
EBX_ISS.openCurrentCreate = function () {
  var createNewURL = EBX_ISS.mapIdCreateNewURL[EBX_ISS.currentInputEl.id];
  if (createNewURL === undefined) {
    return;
  }
  EBX_ISS.preventBlur = false;
  EBX_Utils.openInternalPopupLargeSizeHostedClose(createNewURL);
};
EBX_ISS.openCurrentAdvancedSelector = function () {
  var advancedSelectorURL = EBX_ISS.mapIdAdvancedSelectorURL[EBX_ISS.currentInputEl.id];
  if (advancedSelectorURL === undefined) {
    return;
  }
  EBX_ISS.preventBlur = false;
  EBX_Utils.openInternalPopupLargeSizeHostedClose(advancedSelectorURL);
};
EBX_ISS.onClickFooter = function (event) {
  if (EBX_ISS.preventBlur) {
    YAHOO.util.Event.stopEvent(event);
    if (EBX_ISS.currentInputEl !== null) {
      EBX_ISS.currentInputEl.focus();
    }
  }
};

EBX_ISS.openPreview = function (inputId) {
  var previewURL = EBX_ISS.mapIdPreviewURL[inputId];
  if (previewURL === undefined) {
    return;
  }
  EBX_Utils.openInternalPopupLargeSizeHostedClose(previewURL);
};
/**
 * Compute the pop up height basis
 *
 * @param {Region} clientRegion the window region
 * @return {int} the popup height
 */
EBX_ISS.getMinPopupHeight = function (clientRegion) {
  var minItemsDisplayed = clientRegion.height > 700 ? 8 : 3;

  var height = 0;
  if (EBX_ISS.results && EBX_ISS.results.length > minItemsDisplayed) {
    height = (minItemsDisplayed+ 0.5) * EBX_ISS.defaultItemHeight; //0.5 in order to show if there is something to scroll
  } else {
    height = Math.max(1, EBX_ISS.results.length) * EBX_ISS.defaultItemHeight;
  }
  height += EBX_ISS.toolbarDivEl.offsetHeight + EBX_Utils.getHScrollHeight();
  return height;
};
/**
 * Compute the pop up width basis
 *
 * @return {int} the popup width
 */
EBX_ISS.getMinPopupWidth = function () {
  // + 2 for right border and outline
  var gap = 2;
  var lastIEGap = EBX_ISS.getLastIEGap();
  if (YAHOO.env.ua.gecko !== 0 || EBX_LayoutManager.browser == "Chrome") {
    gap++;
  }
  return EBX_ISS.currentContainerEl.offsetWidth + gap + lastIEGap;
};
EBX_ISS.getLastIEGap = function () {
  var lastIEGap = 0;
  if (EBX_LayoutManager.browser == "IE" || EBX_LayoutManager.browser == "MSIE" || EBX_LayoutManager.browser == "Edge") {
    lastIEGap = 1;
  }
  return lastIEGap;
};
/**
 * Add an element which will be lazy loaded on scroll. Element shall be in popup
 * list elements
 *
 * @param {element}
 *            elem the lazy laoded element
 * @param {function}
 *            onLazyLoad callback fired when element is visible
 */
EBX_ISS.addLazyLoadHandler = function (elem, onLazyLoad) {
  var elemLazyLoaded = {
    element: elem,
    onLazyLoad: onLazyLoad
  };
  EBX_ISS.lazyLoadedElements.push(elemLazyLoaded);
};
EBX_ISS.onScrollInList = function (e) {
  clearTimeout(EBX_ISS.onScrollInListTimeout);
  EBX_ISS.onScrollInListTimeout = setTimeout(function () {

    EBX_Loader.onMouseReleasedOnce(EBX_ISS.handleLazyLoading);
  }, 100);
};
/**
 * Iterate over scruted elements and fire lazy load event if they are visible
 */
EBX_ISS.handleLazyLoading = function () {
  for (var i = 0; i < EBX_ISS.lazyLoadedElements.length; i++) {
    var elemLazyLoaded = EBX_ISS.lazyLoadedElements[i];
    var elem = elemLazyLoaded.element;
    var onLazyLoad = elemLazyLoaded.onLazyLoad;

    //elem is visible ?
    var D = YAHOO.util.Dom;
    var listRegion = D.getRegion(EBX_ISS.listEl);
    var elRegion = D.getRegion(elem);
    var isVisible = ((listRegion.top <= elRegion.top) && (listRegion.bottom >= elRegion.bottom));
    if (isVisible) {
      EBX_ISS.lazyLoadedElements.splice(i, 1);
      onLazyLoad();
    }
  }
};
EBX_ISS.notifyInputPositionChanged = function () {
  if (EBX_ISS.pane !== null) {
    EBX_ISS.pane.align('tl', 'bl', [-1, -1]);
  }
};

/** *END Incremental Search Selector ** */

/** START ISS advanced selector */

function ebx_parentISSAdvancedSelectKeyAndClosePopup(issPath, keyValue) {
  parent.EBX_FormNode.setValue(issPath, {
    key: keyValue
  });
  parent.EBX_Utils.closeInternalPopup();
}

/** END ISS advanced selector */

/** *START List ComboBox ** */

function EBX_LCB() {
};

EBX_LCB.previewURLs = [];
EBX_LCB.listId = [];
EBX_LCB.previewButton = [];
EBX_LCB.deleteButton = [];
EBX_LCB.isListHiddenIfEmpty = [];

EBX_LCB.containerCSSClass = "ebx_LCB_Container";
EBX_LCB.displayListCSSClass = "ebx_LCB_DisplayList";
EBX_LCB.stateEmptyCSSClass = "ebx_LCB_StateEmpty";
EBX_LCB.lineActionsCSSClass = "ebx_LCB_LineActions";
EBX_LCB.freshlyAddedCSSClass = "ebx_LCB_FreshlyAdded";

EBX_LCB.previewLine = function (button, valuesSelectId) {
  var itemEl = button.parentNode.parentNode;
  var index = EBX_Utils.getIndex(itemEl);

  var previewURLsForThisList = EBX_LCB.previewURLs[valuesSelectId];
  if (previewURLsForThisList === undefined) {
    return;
  }

  var previewURL = previewURLsForThisList[index];
  if (previewURL === undefined) {
    return;
  }

  EBX_Utils.openInternalPopupLargeSizeHostedClose(previewURL);
};

EBX_LCB.deleteLine = function (button, path) {
  var itemEl = button.parentNode.parentNode;
  var listEl = itemEl.parentNode;

  var index = EBX_Utils.getIndex(itemEl);
  var previousValue = ebx_form_getNodeValue(path) || [];
  var newValue = previousValue.slice(0, index).concat(previousValue.slice(index + 1));

  ebx_form_setNodeValue(path, newValue);

  var node = EBX_FormNodeIndex.getFormNode(path);
  var valuesSelectId = node.getEditor().getValuesSelectId();

  var valuesSelect = document.getElementById(valuesSelectId);

  listEl.parentNode.scrollTop = listEl.parentNode.scrollHeight;

  EBX_LCB.refreshCSSClasses(valuesSelectId,
      EBX_Utils.getFirstParentMatchingCSSClass(listEl, EBX_LCB.containerCSSClass), valuesSelect.length === 0);
};

EBX_LCB.createLine = function (value, path) {
  if (value === null) {
    return;
  }

  var previousValue = ebx_form_getNodeValue(path) || [];
  var newValue = [];
  EBX_Utils.forEach(previousValue, function (item) {
    newValue.push(item);
  });
  newValue.push(value);

  ebx_form_setNodeValue(path, newValue);

  var node = EBX_FormNodeIndex.getFormNode(path);
  var valuesSelectId = node.getEditor().getValuesSelectId();

  var valuesSelect = document.getElementById(valuesSelectId);
  var listEl = document.getElementById(EBX_LCB.listId[valuesSelectId]);

  listEl.parentNode.scrollTop = listEl.parentNode.scrollHeight;

  EBX_ISS.revert();
  EBX_LCB.refreshCSSClasses(valuesSelectId,
      EBX_Utils.getFirstParentMatchingCSSClass(listEl, EBX_LCB.containerCSSClass), valuesSelect.length === 0);
};

EBX_LCB.refreshCSSClasses = function (valuesSelectId, containerEl, isEmpty) {

  if (containerEl === null) {
    return;
  }

  if (isEmpty) {
    EBX_Utils.addCSSClass(containerEl, EBX_LCB.stateEmptyCSSClass);
  } else {
    EBX_Utils.removeCSSClass(containerEl, EBX_LCB.stateEmptyCSSClass);
  }

  if (EBX_LCB.isListHiddenIfEmpty[valuesSelectId] === true) {
    // if this boolean is not specified, EBX_LCB.displayListCSSClass is already set on containerEl
    if (isEmpty) {
      EBX_Utils.removeCSSClass(containerEl, EBX_LCB.displayListCSSClass);
    } else {
      EBX_Utils.addCSSClass(containerEl, EBX_LCB.displayListCSSClass);
    }
  }

};

/** *END List ComboBox ** */

/** *START Preview Image ** */

EBX_Form.previewPanel = null;
EBX_Form.previewPanelId = "ebx_Form_PreviewPanel";

EBX_Form.previewImage = function (externalResourcePath, webName) {
  var selectElement = document.getElementById(webName);

  if (selectElement.selectedIndex < 0) {
    return;
  }

  if (selectElement.options[selectElement.selectedIndex].value == ebx_nullValueForFacetEnum) {
    return;
  }

  var imageFileName = selectElement.options[selectElement.selectedIndex].text;
  EBX_Form.openPreviewImage(externalResourcePath + imageFileName, imageFileName);
};

EBX_Form.previewImage = function (externalResourcePath, webName) {
  var selectElement = document.getElementById(webName);

  if (selectElement.selectedIndex < 0) {
    return;
  }

  if (selectElement.options[selectElement.selectedIndex].value == ebx_nullValueForFacetEnum) {
    return;
  }

  var imageFileName = selectElement.options[selectElement.selectedIndex].text;
  EBX_Form.openPreviewImage(externalResourcePath + imageFileName, imageFileName);
};

EBX_Form.openPreviewImage = function (imageURL, altText) {
  if (EBX_Form.previewPanel === null) {
    EBX_Form.previewPanel = new YAHOO.widget.Panel(EBX_Form.previewPanelId, {
      close: true,
      draggable: false,
      modal: true,
      fixedCenter: true,
      visible: false
    });
    EBX_Form.previewPanel.render(document.body);
  }

  var previewPanelBodyContent = [];

  previewPanelBodyContent.push("<div id=\"ebx_Form_PreviewPanelScroller\"");
  previewPanelBodyContent.push("style=\"");
  previewPanelBodyContent.push("max-height:", document.body.clientHeight - 65, "px;");
  previewPanelBodyContent.push("max-width:", document.body.clientWidth - 50, "px;");
  previewPanelBodyContent.push("\"");
  previewPanelBodyContent.push(">");

  var extension = imageURL.substring(imageURL.lastIndexOf("."), imageURL.length);

  switch (extension) {
    case ".swf":
      previewPanelBodyContent.push("<embed");
      previewPanelBodyContent.push(" src=\"", imageURL, "\"");
      previewPanelBodyContent.push(" quality=\"best\"/");
      previewPanelBodyContent.push(" onload=\"EBX_Form.previewPanel.show()\"");
      previewPanelBodyContent.push("/>");
      break;

    case ".gif":
    case ".jpg":
    case ".jpeg":
    case ".png":
    case ".bmp":
      previewPanelBodyContent.push("<img");
      previewPanelBodyContent.push(" src=\"", imageURL, "\"");
      previewPanelBodyContent.push(" alt=\"", altText, "\"");
      previewPanelBodyContent.push(" onload=\"EBX_Form.previewPanel.show()\"");
      previewPanelBodyContent.push("/>");
      break;

    default:
      break;
  }

  previewPanelBodyContent.push("</div>");

  EBX_Form.previewPanel.setBody(previewPanelBodyContent.join(""));

  YAHOO.util.Event.addListener(EBX_Form.previewPanelId + "_mask", "click", EBX_Form.closePreviewImage);
};

EBX_Form.closePreviewImage = function () {
  EBX_Form.previewPanel.hide();
};

/** *END Preview Image ** */

EBX_Form.isEventToInputText = function (event) {
  // when metaKey is pressed
  if (event.metaKey === 1) {
    return false;
  }

  if (event.ctrlKey === 1) {
    // paste action is allowed
    if (event.keyCode !== EBX_Utils.keyCodes.KEY_V) {
      // both ctrl & alt is allowed
      if (event.altKey === 0) {
        return false;
      }
    }
  } else {
    if (event.altKey === 1) {
      return false;
    }
  }

  // when shift is pressed alone
  if (event.shiftKey === 1 && event.keyCode === EBX_Utils.keyCodes.SHIFT) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.TAB) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.ENTER) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.ESCAPE) {
    return false;
  }

  if (EBX_Utils.isFunctionKey(event.keyCode)) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.PAUSE) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.PAGE_DOWN || event.keyCode === EBX_Utils.keyCodes.PAGE_UP) {
    return false;
  }

  if (event.keyCode === EBX_Utils.keyCodes.HOME || event.keyCode === EBX_Utils.keyCodes.END) {
    return false;
  }

  return true;
};

/** *START empty, nil and overwrite buttons ** */
/** END empty buttons * */
EBX_Form.EmptySuffix = "_Empty";
/*START empty button for RadioButtonGroup */
EBX_Form.emptyRadioButtonGroup = function (radioButtonGroupName, isUserInput) {
  var radioButtonGroupElements = document.getElementsByName(radioButtonGroupName);
  var firstRadioButton = null;
  for (var i = 0; i < radioButtonGroupElements.length; i++) {
    radioButtonGroupElements[i].checked = false;
    // IE includes getElementById in getElementsByName
    // so exclude the inputFocusRedirector
    if (firstRadioButton === null && !EBX_Utils.matchCSSClass(radioButtonGroupElements[i],
        EBX_FormWidgets.inputFocusRedirector_CSSClass)) {
      firstRadioButton = radioButtonGroupElements[i];
    }
  }
  EBX_ButtonUtils.setButtonDisabled(document.getElementById(radioButtonGroupName + EBX_Form.EmptySuffix), true);

  if (firstRadioButton !== null) {
    if (isUserInput === true) {
      firstRadioButton.focus();
      EBX_FormPresenter.stackElementForValidation(firstRadioButton);
    }
  }
};
EBX_Form.refreshEmptyButtonFromRadioButton = function (radioButtonName, isUserInput) {
  var radioButtonGroupElements = document.getElementsByName(radioButtonName);
  for (var i = 0; i < radioButtonGroupElements.length; i++) {
    if (radioButtonGroupElements[i].checked === true) {
      EBX_ButtonUtils.setButtonDisabled(document.getElementById(radioButtonName + EBX_Form.EmptySuffix), false);
      if (isUserInput === true) {
        EBX_FormPresenter.stackElementForValidation(radioButtonGroupElements[i]);
      }
      return;
    }
  }
  EBX_ButtonUtils.setButtonDisabled(document.getElementById(radioButtonName + EBX_Form.EmptySuffix), true);
  if (isUserInput === true) {
    // is this code still alive? if yes, fix it about IE including getElementById in getElementsByName (inputFocusRedirector having no name)
    EBX_FormPresenter.stackElementForValidation(radioButtonGroupElements[0]);
  }
};
/*END empty button for RadioButtonGroup */
/*START empty button for String */
EBX_Form.emptyInputText = function (inputTextId) {
  document.getElementById(inputTextId).value = "";

  var emptyButton = document.getElementById(inputTextId + EBX_Form.EmptySuffix);
  if (emptyButton) {
    EBX_ButtonUtils.setButtonDisabled(emptyButton, true);
  }

  EBX_Form.focus(inputTextId);
};
EBX_Form.whenStringInputIsKeyPressedOrChange = function (inputTextEl) {
  // let moment to the browser to set new value
  setTimeout("EBX_Form.refreshEmptyButtonFromField('" + inputTextEl.id + "');", 50);
};
EBX_Form.refreshEmptyButtonFromField = function (inputTextId) {
  var emptyButton = document.getElementById(inputTextId + EBX_Form.EmptySuffix);
  if (!emptyButton) {
    return;
  }

  if (document.getElementById(inputTextId).value === "") {
    EBX_ButtonUtils.setButtonDisabled(emptyButton, true);
  } else {
    EBX_ButtonUtils.setButtonDisabled(emptyButton, false);
  }
};
/*END empty button for String */
/*START empty button for Date */
EBX_Form.dateSuffixes = function () {
};

EBX_Form.emptyDateInputs = function (dateInputsBaseName, enableValidation) {
  var dateInputsContainerEl = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.DateInputs);

  var firstDateField = null;
  for (var i = 0; i < dateInputsContainerEl.childNodes.length; i++) {
    if (dateInputsContainerEl.childNodes[i].nodeType === 1 && dateInputsContainerEl.childNodes[i].tagName === "INPUT"
        && dateInputsContainerEl.childNodes[i].type === "text") {
      dateInputsContainerEl.childNodes[i].value = "";
      if (firstDateField === null) {
        firstDateField = dateInputsContainerEl.childNodes[i];
      }
    }
  }
  var emptyButt = document.getElementById(dateInputsBaseName + EBX_Form.EmptySuffix);
  if (emptyButt !== null) {
    EBX_ButtonUtils.setButtonDisabled(emptyButt, true);
  }

  if (firstDateField !== null && enableValidation) {
    firstDateField.focus();
    EBX_FormPresenter.stackElementForValidation(firstDateField);
  }
};
EBX_Form.whenDateInputIsKeyPressedOrChange = function (dateInputsBaseName) {
  // let a moment to the browser to set new value
  // inputting value is already listen by the default system
  setTimeout("EBX_Form.refreshEmptyButtonFromDateField('" + dateInputsBaseName + "', false);", 50);
};

EBX_Form.refreshEmptyButtonFromDateField = function (dateInputsBaseName, enableValidation) {
  var dateInputsContainerEl = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.DateInputs);
  if (enableValidation === true) {
    var firstInput = EBX_Utils.getFirstRecursiveChildMatchingTagName(dateInputsContainerEl, "input");
    if (firstInput !== null) {
      EBX_FormPresenter.stackElementForValidation(firstInput);
    }
  }

  if (!document.getElementById(dateInputsBaseName + EBX_Form.EmptySuffix)) {
    return;
  }

  for (var i = 0; i < dateInputsContainerEl.childNodes.length; i++) {
    if (dateInputsContainerEl.childNodes[i].nodeType === 1 && dateInputsContainerEl.childNodes[i].tagName === "INPUT"
        && dateInputsContainerEl.childNodes[i].type === "text" && dateInputsContainerEl.childNodes[i].value !== "") {
      EBX_ButtonUtils.setButtonDisabled(document.getElementById(dateInputsBaseName + EBX_Form.EmptySuffix), false);
      return;
    }
  }
  EBX_ButtonUtils.setButtonDisabled(document.getElementById(dateInputsBaseName + EBX_Form.EmptySuffix), true);
};

EBX_Form.dateFieldBlur = function (dateInputsBaseName, dateField) {
  var dateInputsContainerEl = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.DateInputs);
  dateInputsContainerEl.validationTimeout = window.setTimeout(function () {
    EBX_FormPresenter.stackElementForValidation(dateField);
  }, 100);
};
EBX_Form.dateFieldFocus = function (dateInputsBaseName) {
  var dateInputsContainerEl = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.DateInputs);
  if (dateInputsContainerEl.validationTimeout !== undefined) {
    window.clearTimeout(dateInputsContainerEl.validationTimeout);
    dateInputsContainerEl.validationTimeout = undefined;
  }
};

/*END empty button for Date */
/*START empty button for FacetEnum */
EBX_Form.emptyFacetEnum = function (fieldId, isUserInput) {
  var fieldEl = document.getElementById(fieldId);
  fieldEl.value = ebx_nullValueForFacetEnum;

  document.getElementById(fieldId
      + EBX_FacetEnumeration.InputFieldDisplaySuffix).value = EBX_FACET_ENUMERATION_LABEL_NULL_VALUE;

  var emptyButton = document.getElementById(fieldId + EBX_Form.EmptySuffix);
  if (emptyButton !== null) {
    EBX_ButtonUtils.setButtonDisabled(emptyButton, true);
  }

  if (isUserInput === true) {
    EBX_Form.focus(fieldId + EBX_FacetEnumeration.InputFieldDisplaySuffix);
    EBX_FormPresenter.stackElementForValidation(fieldEl);
  }
};
EBX_Form.refreshEmptyButtonFromFacetEnumField = function (fieldEl, isUserInput) {

  if (isUserInput === true) {
    EBX_FormPresenter.stackElementForValidation(fieldEl);
  }

  var emptyButton = document.getElementById(fieldEl.id + EBX_Form.EmptySuffix);
  if (emptyButton === null) {
    return;
  }
  if (fieldEl.value == ebx_nullValueForFacetEnum) {
    EBX_ButtonUtils.setButtonDisabled(emptyButton, true);
  } else {
    EBX_ButtonUtils.setButtonDisabled(emptyButton, false);
  }
};
/*END empty button for FacetEnum */
/** END empty buttons * */

EBX_Form.focusInputField = function (webName) {

  var el = document.getElementById(webName);

  if (el === null) {
    return;
  }

  EBX_Form.focusElementIfStillVisible(el);

  // TODO CCH
  // if null : redirect on the null button
  // else if an element is find with webName, focus it
  // else focus the first visible input in the ebx_InputFieldWrapper
};

/** START nil buttons * */

EBX_Form.NilClassName = "ebx_Nil";
EBX_Form.NullSuffix = "_isNull";

EBX_Form.isNil = function (fieldWrapperId) {
  return EBX_Utils.matchCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(document.getElementById(fieldWrapperId),
      EBX_Form.OverwrittenValueClassName), EBX_Form.NilClassName);
};
/*START nil button for String */
EBX_Form.setStringNullOn = function (webName) {
  var form = document.getElementById(EBX_Form.WorkspaceFormId);
  var inputTextEl = form[webName];

  inputTextEl.oldValue = inputTextEl.value;

  EBX_Form.emptyInputText(inputTextEl.id);
  inputTextEl.readOnly = true;

  EBX_Utils.addCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(inputTextEl, EBX_Form.OverwrittenValueClassName),
      EBX_Form.NilClassName);

  inputTextEl.value = "";

  var button = document.getElementById(webName + EBX_Form.NullSuffix);
  if (button) {
    button.tabindex = "0";
  }
};
EBX_Form.setStringNullOff = function (webName) {
  var form = document.getElementById(EBX_Form.WorkspaceFormId);
  var inputTextEl = form[webName];

  inputTextEl.readOnly = false;

  EBX_Utils.removeCSSClass(EBX_Utils.getFirstParentMatchingCSSClass(inputTextEl, EBX_Form.OverwrittenValueClassName),
      EBX_Form.NilClassName);

  if (inputTextEl.oldValue) {
    inputTextEl.value = inputTextEl.oldValue;
  } else {
    inputTextEl.value = "";
  }
  EBX_Form.refreshEmptyButtonFromField(webName);

  var button = document.getElementById(webName + EBX_Form.NullSuffix);
  if (button) {
    button.tabindex = "-1";
  }

  inputTextEl.focus();
};
/*END nil button for String */
/*START nil button for Complex or List */
EBX_Form.setComplexOrListNullOn = function (webName) {
  EBX_Utils.addCSSClass(
      EBX_Utils.getFirstParentMatchingCSSClass(document.getElementById(webName + EBX_Form.InputFieldWrapperSuffix),
          EBX_Form.OverwrittenValueClassName), EBX_Form.NilClassName);

  var button = document.getElementById(webName + EBX_Form.NullSuffix);
  if (button) {
    button.tabindex = "0";
  }
};
EBX_Form.setComplexOrListNullOff = function (webName) {
  EBX_Utils.removeCSSClass(
      EBX_Utils.getFirstParentMatchingCSSClass(document.getElementById(webName + EBX_Form.InputFieldWrapperSuffix),
          EBX_Form.OverwrittenValueClassName), EBX_Form.NilClassName);

  var button = document.getElementById(webName + EBX_Form.NullSuffix);
  if (button) {
    button.tabindex = "-1";
  }

  EBX_Form.focusInputField(webName);
};
/*END nil button for Complex or List */
/** END nil buttons * */

/** START inherit button * */
EBX_Form.ActivableComponentClassName = "ebx_ActivableComponent";
EBX_Form.InheritedClassName = "ebx_Inherited";

EBX_Form.setInheritedOn = function (webName) {
  var firstParentInput = EBX_Utils.getFirstParentMatchingCSSClass(
      document.getElementById(webName + EBX_Form.InputFieldWrapperSuffix),
      EBX_Form.ActivableComponentClassName);
  if (firstParentInput == null) {
    return;
  }

  EBX_Utils.addCSSClass(firstParentInput, EBX_Form.InheritedClassName);
};
EBX_Form.setInheritedOff = function (webName) {
  var firstParentInput = EBX_Utils.getFirstParentMatchingCSSClass(
      document.getElementById(webName + EBX_Form.InputFieldWrapperSuffix),
      EBX_Form.ActivableComponentClassName);
  if (firstParentInput == null) {
    return;
  }

  EBX_Utils.removeCSSClass(firstParentInput, EBX_Form.InheritedClassName);

  EBX_Form.focusInputField(webName);
};
/** START inherit button * */

/** *END empty, nil and overwrite buttons ** */

/* ** START Calendar ** */

EBX_Form.calendar = null;
EBX_Form.calendarConfig = {
  close: true
};

EBX_Form.calendarPanel = null;
EBX_Form.calendarPanelId = "ebx_Form_CalendarPanel";

EBX_Form.calendarMaskId = "ebx_Form_CalendarMask";
EBX_Form.calendarMask = null;
EBX_Form.getCalendarMask = function () {
  if (EBX_Form.calendarMask === null) {
    EBX_Form.calendarMask = document.createElement("div");
    EBX_Form.calendarMask.id = EBX_Form.calendarMaskId;
    EBX_Form.calendarMask.style.display = "none";

    YAHOO.util.Event.addListener(EBX_Form.calendarMask, "click", EBX_Form.hideCalendarPanel);
  }

  return EBX_Form.calendarMask;
};

EBX_Form.openXPathCalendarHelper = function (inputFieldId) {
  ebx_treeHelper_hideShow(null, null);

  var inputField = document.getElementById(inputFieldId);

  if (EBX_Form.calendarPanel === null) {
    EBX_Form.calendarPanel = new YAHOO.widget.Overlay(EBX_Form.calendarPanelId, {
      constraintoviewport: true,
      visible: false,
      draggable: true,
      effect: {
        effect: YAHOO.widget.ContainerEffect.FADE,
        duration: 0.2
      }
    });
    EBX_Form.calendarPanel.render(inputField.form);
  }

  if (EBX_Form.calendar === null) {
    EBX_Form.calendar = new YAHOO.widget.Calendar(EBX_Form.calendarPanel.element, {
      close: true,
      draggable: true
    });
  }

  var today = new Date();
  var dateToSelect = today.getMonth() + 1;

  dateToSelect += "/";
  var pagedate = dateToSelect;

  dateToSelect += today.getDate();
  dateToSelect += "/";

  dateToSelect += today.getFullYear();
  pagedate += today.getFullYear();

  EBX_Form.calendar.selectEvent.unsubscribe(EBX_Form.calendarXPathSelectionHandler);
  EBX_Form.calendar.selectEvent.unsubscribe(EBX_Form.calendarSelectionHandler);

  EBX_Form.calendar.select(dateToSelect);
  EBX_Form.calendar.cfg.setProperty("pagedate", pagedate);
  EBX_Form.calendar.selectEvent.subscribe(EBX_Form.calendarXPathSelectionHandler, inputField);
  EBX_Form.calendar.hideEvent.subscribe(EBX_Form.hideCalendarPanel);
  EBX_Form.calendar.render();
  EBX_Form.calendar.show();

  EBX_Form.calendarPanel.cfg.setProperty('context', [inputField, 'tl', 'bl']);

  EBX_Form.showCalendarPanel();
};

EBX_Form.calendarXPathSelectionHandler = function (type, args, inputField) {
  var dates = args[0];
  var date = dates[0];
  var year = date[0];
  var month = date[1];
  var day = date[2];
  EBX_Form.insertTextAtCursorPosition(inputField, "'" + year + "-" + month + "-" + day + "'");

  EBX_Form.hideCalendarPanel();
};

EBX_Form.openCalendar = function (yearFieldId, monthFieldId, dayFieldId, dateInputsBaseName) {
  var fieldsObj = {
    yearField: document.getElementById(yearFieldId),
    monthField: document.getElementById(monthFieldId),
    dayField: document.getElementById(dayFieldId),
    dateInputsBaseName: dateInputsBaseName
  };

  if (EBX_Form.calendarPanel === null) {
    EBX_Form.calendarPanel = new YAHOO.widget.Overlay(EBX_Form.calendarPanelId, {
      constraintoviewport: true,
      visible: false
    });
    EBX_Form.calendarPanel.render(document.body);
  }

  if (EBX_Form.calendar === null) {
    EBX_Form.calendar = new YAHOO.widget.Calendar(EBX_Form.calendarPanel.element, EBX_Form.calendarConfig);
    EBX_Form.calendar.Style.CSS_NAV_LEFT = "ebx_FlatButton ebx_IconButton ebx_PagingPrevious";
    EBX_Form.calendar.Style.CSS_NAV = "ebx_FlatButton";
    EBX_Form.calendar.Style.CSS_NAV_RIGHT = "ebx_FlatButton ebx_IconButton ebx_PagingNext";

    EBX_Form.calendar.renderNavEvent.subscribe(function () {
      document.getElementById(EBX_Form.calendarPanelId + "_nav_cancel").className = "ebx_Button";
      document.getElementById(EBX_Form.calendarPanelId + "_nav_cancel").parentNode.className = "";
      document.getElementById(EBX_Form.calendarPanelId + "_nav_submit").className = "ebx_Button ebx_DefaultButton";
      document.getElementById(EBX_Form.calendarPanelId + "_nav_submit").parentNode.className = "";
    });

    EBX_Form.calendar.renderEvent.subscribe(EBX_Form.setCalendarPaginButtonsStyle);
  }

  var today = new Date();
  var dateToSelect = "";
  /* month/day/year */
  var monthValue = parseInt(fieldsObj.monthField.value, 10);
  if (isNaN(monthValue)) {
    dateToSelect += today.getMonth() + 1;
  } else {
    dateToSelect += monthValue;
  }

  dateToSelect += "/";
  var pagedate = dateToSelect;
  /* month/year */
  var dayValue = parseInt(fieldsObj.dayField.value, 10);
  if (isNaN(dayValue)) {
    dateToSelect += today.getDate();
  } else {
    dateToSelect += dayValue;
  }

  dateToSelect += "/";

  var yearValue = parseInt(fieldsObj.yearField.value, 10);
  if (isNaN(yearValue)) {
    dateToSelect += today.getFullYear();
    pagedate += today.getFullYear();
  } else {
    dateToSelect += yearValue;
    pagedate += yearValue;
  }

  EBX_Form.calendar.selectEvent.unsubscribe(EBX_Form.calendarSelectionHandler);
  EBX_Form.calendar.selectEvent.unsubscribe(EBX_Form.calendarXPathSelectionHandler);

  EBX_Form.calendar.select(dateToSelect);
  EBX_Form.calendar.cfg.setProperty("pagedate", pagedate);

  EBX_Form.calendar.selectEvent.subscribe(EBX_Form.calendarSelectionHandler, fieldsObj);
  EBX_Form.calendar.hideEvent.subscribe(EBX_Form.hideCalendarPanel);

  EBX_Form.calendar.render();
  EBX_Form.calendar.show();

  EBX_Form.calendarPanel.cfg.setProperty('context',
      [dateInputsBaseName + EBX_Form.dateSuffixes.DateInputs, 'tl', 'bl']);

  EBX_Form.showCalendarPanel();
};

EBX_Form.setCalendarPaginButtonsStyle = function () {
  EBX_Form.calendar.linkLeft.title = EBX_Form.calendar.linkLeft.innerHTML;
  EBX_Form.calendar.linkLeft.innerHTML = "<span class=\"ebx_Icon\">&nbsp;</span>";

  EBX_Form.calendar.linkRight.title = EBX_Form.calendar.linkRight.innerHTML;
  EBX_Form.calendar.linkRight.innerHTML = "<span class=\"ebx_Icon\">&nbsp;</span>";
};

EBX_Form.calendarSelectionHandler = function (type, args, fieldsObj) {
  var dates = args[0];
  var date = dates[0];
  var year = date[0], month = date[1], day = date[2];

  fieldsObj.yearField.value = year;
  fieldsObj.monthField.value = month;
  fieldsObj.dayField.value = day;

  EBX_Form.refreshEmptyButtonFromDateField(fieldsObj.dateInputsBaseName, true);

  EBX_Form.hideCalendarPanel();
};
EBX_Form.showCalendarPanel = function () {
  EBX_Form.calendarPanel.show();
  YAHOO.util.Event.addListener(EBX_Form.calendarPanel.element, "click", function (event) {
    YAHOO.util.Event.stopEvent(event);
  });
  EBX_Form.calendar.renderEvent.subscribe(function () {
    YAHOO.util.Event.addListener(EBX_Form.calendarPanel.element, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });
  });

  var calendarMask = EBX_Form.getCalendarMask();
  EBX_Form.calendarPanel.element.parentNode.appendChild(calendarMask);
  calendarMask.style.display = "";
};
EBX_Form.hideCalendarPanel = function () {
  EBX_Form.calendarPanel.hide();

  var calendarMask = EBX_Form.getCalendarMask();
  calendarMask.style.display = "none";
};

EBX_Form.fillTimeDateWithNow = function (dateInputsBaseName) {
  EBX_Form.fillTimeDate(dateInputsBaseName, new Date(), true);
};
EBX_Form.fillTimeDate = function (dateInputsBaseName, date, enableValidation) {
  EBX_Form.fillTimeDateFields(
      dateInputsBaseName,
      enableValidation,
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
  );
};
EBX_Form.fillTimeDateFields = function (dateInputsBaseName, enableValidation, year, month, day, hour, minute, second,
    millisecond) {
  var fieldYear = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.year);
  if (fieldYear) {
    fieldYear.value = year;
  }

  // fill-a-zero-before was disabled for day and month #4609

  var fieldMonth = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.month);
  if (fieldMonth) {
    fieldMonth.value = /*(date.getMonth() < 9 ? "0" : "") + */month;
  }

  var fieldDay = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.day);
  if (fieldDay) {
    fieldDay.value = /*(date.getDate() < 10 ? "0" : "") + */day;
  }

  var fieldHour = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.hour);
  if (fieldHour) {
    fieldHour.value = (hour < 10 ? "0" : "") + hour;
  }

  var fieldMinute = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.minute);
  if (fieldMinute) {
    fieldMinute.value = (minute < 10 ? "0" : "") + minute;
  }

  var fieldSecond = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.second);
  if (fieldSecond) {
    fieldSecond.value = (second < 10 ? "0" : "") + second;
  }

  var fieldMilliSecond = document.getElementById(dateInputsBaseName + EBX_Form.dateSuffixes.milliSecond);
  if (fieldMilliSecond) {
    fieldMilliSecond.value = (millisecond < 10 ? "00" : millisecond < 100 ? "0" : "") + millisecond;
  }

  EBX_Form.refreshEmptyButtonFromDateField(dateInputsBaseName, enableValidation);
};

/** *END Calendar ** */

/** * START Text utils ** */
EBX_Form.insertTextAtCursorPosition = function (targetObject, text) {
  var scrollPos = targetObject.scrollTop;
  if (YAHOO.env.ua.ie) {
    targetObject.focus();
    document.selection.createRange().text = text;
  } else {
    // Others
    var startPosition = targetObject.selectionStart;
    var endPosition = targetObject.selectionEnd;
    targetObject.value = targetObject.value.substring(0, startPosition) + text + targetObject.value.substring(
        endPosition);
    targetObject.setSelectionRange(startPosition + text.length, startPosition + text.length);
  }
  targetObject.scrollTop = scrollPos;
};
/** * END Text Utils ** */

/** *START Hierarchy popup ** */

/**
 * Opens a pop-up to view (and edit) the data for the clicked node.
 */
ebx_openHRINodeInPopup = function (popupUrl) {
  var popupHriNode = window.open(popupUrl, 'EditHriNode',
      'width=800,height=600,scrollbars=yes,resizable=yes,menu=no,dependent=yes,status=yes');
  popupHriNode.window.focus();
};

/** *END Hierarchy popup ** */

/** *START Data Services ** */

function EBX_DataServices() {
}

EBX_DataServices.onSelectAll = function (tableElementId, selectAllId) {
  var tableElement = document.getElementById(tableElementId);
  var isChecked = document.getElementById(selectAllId).checked;

  var allInputs = tableElement.getElementsByTagName('INPUT');
  var length = allInputs.length;
  for (var i = 0; i < length; i++) {
    var anyInput = allInputs[i];
    if (anyInput.type === "checkbox") {
      anyInput.checked = isChecked;
    }
  }
};

EBX_DataServices.onSelectRow = function (selectRowClass, rowOperationsClass, selectRowId, selectAllId, tableElementId) {
  var tableElement = document.getElementById(tableElementId);
  var selectRowInput = document.getElementById(selectRowId);

  //select all operation for row
  {
    var operationInputs = EBX_Utils.getRecursiveChildrenMatchingCSSClass(tableElement, rowOperationsClass);
    for (var i = 0; i < operationInputs.length; i++) {
      var operationInput = operationInputs[i];
      if (operationInput.type === "checkbox") {
        operationInput.checked = selectRowInput.checked;
      }
    }
  }

  //check if all rows are selected
  EBX_DataServices.checkAllRowSelected(selectRowClass, selectAllId, tableElement);
};

EBX_DataServices.onSelectOperation = function (rowOperationsClass, selectRowClass, selectRowInputId, selectAllId,
    tableElementId) {
  var tableElement = document.getElementById(tableElementId);
  var selectRowInput = document.getElementById(selectRowInputId);

  var operationInputs = EBX_Utils.getRecursiveChildrenMatchingCSSClass(tableElement, rowOperationsClass);
  var isAllSelected = true;
  for (var i = 0; i < operationInputs.length; i++) {
    if (!operationInputs[i].checked) {
      isAllSelected = false;
    }
  }

  if (isAllSelected) {
    selectRowInput.checked = true;
  } else {
    selectRowInput.checked = false;
  }

  //check if all rows are selected
  EBX_DataServices.checkAllRowSelected(selectRowClass, selectAllId, tableElement);
};

EBX_DataServices.checkAllRowSelected = function (selectRowClass, selectAllId, tableElement) {
  var isAllFirstColumnSelected = true;
  {
    var selectRowInputs = EBX_Utils.getRecursiveChildrenMatchingCSSClass(tableElement, selectRowClass);
    for (var i = 0; i < selectRowInputs.length; i++) {
      if (!selectRowInputs[i].checked) {
        isAllFirstColumnSelected = false;
      }
    }
  }

  var selectAllInput = document.getElementById(selectAllId);
  if (isAllFirstColumnSelected) {
    selectAllInput.checked = true;
  } else {
    selectAllInput.checked = false;
  }
};
/** *END Data Services ** */

/** *START Checkbox group selection ** */
EBX_FormWidgets.checkboxGroupCSSClass = "ebx_CheckboxGroup";
EBX_FormWidgets.checkboxGroupSelectAllCSSClass = "ebx_CheckboxGroupSelectAll";
EBX_FormWidgets.checkboxGroupSelectAll = function (checkboxAllEl) {
  var checkboxGroupParentElement = EBX_Utils.getFirstParentMatchingCSSClass(checkboxAllEl,
      EBX_FormWidgets.checkboxGroupCSSClass);
  var inputEls = checkboxGroupParentElement.getElementsByTagName("INPUT");

  var checked = checkboxAllEl.checked;
  var i = inputEls.length;
  while (i--) {
    var inputEl = inputEls[i];
    if (inputEl.type === "checkbox" && inputEl.disabled !== true) {
      inputEl.checked = checked;
    }
  }

  EBX_FormPresenter.stackElementForValidation(checkboxGroupParentElement);
};

EBX_FormWidgets.checkboxGroupRefreshSelectAll = function (checkboxEl, isUserInput) {
  var checkboxGroupParentElement = EBX_Utils.getFirstParentMatchingCSSClass(checkboxEl,
      EBX_FormWidgets.checkboxGroupCSSClass);
  var inputEls = checkboxGroupParentElement.getElementsByTagName("INPUT");

  var selectAllCheckboxContainer = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(checkboxGroupParentElement,
      EBX_FormWidgets.checkboxGroupSelectAllCSSClass);

  if (selectAllCheckboxContainer === null) {
    if (isUserInput === true) {
      EBX_FormPresenter.stackElementForValidation(checkboxGroupParentElement);
    }
    return;
  }

  var selectAllCheckbox = selectAllCheckboxContainer.getElementsByTagName("INPUT")[0];

  var allAreChecked = true;

  var i = inputEls.length;
  while (i--) {
    var inputEl = inputEls[i];
    if (inputEl !== selectAllCheckbox && inputEl.type === "checkbox" && inputEl.disabled !== true && inputEl.checked
        === false) {
      allAreChecked = false;
      break;
    }
  }

  selectAllCheckbox.checked = allAreChecked;

  if (isUserInput === true) {
    EBX_FormPresenter.stackElementForValidation(checkboxGroupParentElement);
  }
};
/** *END Checkbox group selection ** */

/** *START Select multiple selection ** */
EBX_FormWidgets.selectMultipleCSSClass = "ebx_SelectMultiple";
EBX_FormWidgets.selectMultipleSelectAllCSSClass = "ebx_SelectMultipleSelectAll";
EBX_FormWidgets.selectMultipleSelectAll = function (checkboxAllEl) {
  var selectMultipleParentElement = EBX_Utils.getFirstParentMatchingCSSClass(checkboxAllEl,
      EBX_FormWidgets.selectMultipleCSSClass);
  var optionEls = selectMultipleParentElement.getElementsByTagName("SELECT")[0].options;

  var checked = checkboxAllEl.checked;
  var i = optionEls.length;
  while (i--) {
    optionEls[i].selected = checked;
  }

  EBX_FormPresenter.stackElementForValidation(selectMultipleParentElement);
};
EBX_FormWidgets.selectMultipleRefreshSelectAll = function (optionOrSelectEl, isUserInput) {
  var selectMultipleParentElement = EBX_Utils.getFirstParentMatchingCSSClass(optionOrSelectEl,
      EBX_FormWidgets.selectMultipleCSSClass);
  var optionEls = selectMultipleParentElement.getElementsByTagName("SELECT")[0].options;

  var selectAllCheckboxContainer = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(selectMultipleParentElement,
      EBX_FormWidgets.selectMultipleSelectAllCSSClass);

  if (selectAllCheckboxContainer === null) {
    return;
  }

  var selectAllCheckbox = selectAllCheckboxContainer.getElementsByTagName("INPUT")[0];

  var allAreSelected = true;

  var i = optionEls.length;
  while (i--) {
    var optionEl = optionEls[i];
    if (optionEl.selected === false) {
      allAreSelected = false;
      break;
    }
  }

  selectAllCheckbox.checked = allAreSelected;

  if (isUserInput === true) {
    EBX_FormPresenter.stackElementForValidation(selectMultipleParentElement);
  }
};
/** *END Select multiple selection ** */

/** *START UDA type selector ** */

EBX_FormWidgets.udaClassesByKeyByContainerId = {};

EBX_FormWidgets.udaSelectListener = function (value, containerId) {
  var containerEl = document.getElementById(containerId);

  var cssClass = null;
  if (value !== null) {
    cssClass = EBX_FormWidgets.udaClassesByKeyByContainerId[containerId][value.key];
  }

  var child = containerEl.firstChild;
  if (child === null) {
    return null;
  }
  do {
    if (EBX_Utils.matchCSSClass(child, cssClass)) {
      child.style.display = "";
    } else {
      child.style.display = "none";
    }
  } while ((child = child.nextSibling));
};

/** *END UDA type selector ** */

/** * START Association Node ** */
function EBX_AssociationNode() {
}

EBX_AssociationNode.dataSourceAssociationNodeActionsResponseSchema = {
  resultsList: "messages",
  fields: [{
    key: "message"
  }, {
    key: "severity"
  }]
};
EBX_AssociationNode.dataSourceAssociationNodeActions = new YAHOO.util.XHRDataSource();
EBX_AssociationNode.dataSourceAssociationNodeActions.responseType = YAHOO.util.DataSource.TYPE_JSON;
EBX_AssociationNode.dataSourceAssociationNodeActions.responseSchema = EBX_AssociationNode.dataSourceAssociationNodeActionsResponseSchema;

EBX_AssociationNode.dataSourceAssociationNodeDuplicateResponseSchema = {
  resultsList: "url"
};
EBX_AssociationNode.dataSourceAssociationNodeDuplicate = new YAHOO.util.XHRDataSource();
EBX_AssociationNode.dataSourceAssociationNodeDuplicate.responseType = YAHOO.util.DataSource.TYPE_JSON;
EBX_AssociationNode.dataSourceAssociationNodeDuplicate.responseSchema = EBX_AssociationNode.dataSourceAssociationNodeDuplicateResponseSchema;

EBX_AssociationNode.sendRequest = function (requestURL, tableName) {
  EBX_AjaxTable.AjaxTableRegister[tableName].isTableReady = false;
  EBX_AjaxTable.AjaxTableRegister[tableName].setState(EBX_Table_State.LOADING);

  EBX_AssociationNode.dataSourceAssociationNodeActions.sendRequest(requestURL, {
    success: EBX_AssociationNode.actionSuccess,
    failure: EBX_AssociationNode.actionFailure,
    argument: {
      tableName: tableName
    }
  });
};

EBX_AssociationNode.sendDuplicateRequest = function (requestURL, tableName) {
  EBX_AjaxTable.AjaxTableRegister[tableName].isTableReady = false;
  EBX_AjaxTable.AjaxTableRegister[tableName].setState(EBX_Table_State.LOADING);

  EBX_AssociationNode.dataSourceAssociationNodeDuplicate.sendRequest(requestURL, {
    success: EBX_AssociationNode.duplicateSuccess,
    failure: EBX_AssociationNode.actionFailure,
    argument: {
      tableName: tableName
    }
  });
};

EBX_AssociationNode.actionSuccess = function (oRequest, oParsedResponse, argument) {
  var messages = oParsedResponse.results;
  if (messages !== undefined) {
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i].message;
      var severity = messages[i].severity;
      if (severity === undefined) {
        severity = EBX_UserMessageManager.INFO;
      }
      EBX_UserMessageManager.addMessage(message, severity);
    }
  }
  EBX_AjaxTable.refreshCurrentPage(argument.tableName);
  EBX_FormPresenter.updateFromSubSession();
};

EBX_AssociationNode.duplicateSuccess = function (oRequest, oParsedResponse, argument) {
  var url = oParsedResponse.results;
  if (url !== undefined) {
    EBX_Utils.openInternalPopupLargeSizeHostedClose(url);
  }
  EBX_AjaxTable.AjaxTableRegister[argument.tableName].isTableReady = true;
  EBX_AjaxTable.AjaxTableRegister[argument.tableName].setState(EBX_Table_State.NORMAL);
};

EBX_AssociationNode.actionFailure = function (oRequest, oParsedResponse, argument) {
  // case of builder.sendError(...)
  EBX_AjaxTable.AjaxTableRegister[argument.tableName].isTableReady = true;
  EBX_AjaxTable.AjaxTableRegister[argument.tableName].setState(EBX_Table_State.ERROR);
};

/** * END Association Node ** */

/** START button icon selector * */
/* init by CtbUIBeanToolbarButtonIcon */
var EBX_BUTTON_ICON_SELECTOR_SECTION_TITLE_BUILT_IN = "";
var EBX_BUTTON_ICON_SELECTOR_SECTION_TITLE_FONT_AWESOME = "";

var EBX_BUTTON_ICON_SELECTOR_PANEL_ID = "ebx_ButtonIconSelectorPanel";
var EBX_BUTTON_ICON_SELECTOR_PANEL_LZ = null;
var EBX_BUTTON_ICON_SELECTOR_FONT_AWESOME_SECTION_ID = "ebx_ButtonIconSelectorFASection";
var EBX_BUTTON_ICON_SELECTOR_PANEL_MASK_ID = "ebx_ButtonIconSelector_Mask";

var ebx_buttonIconSelector_current_previewButtonWrapperId = null;
var ebx_buttonIconSelector_current_hiddenFieldId = null;
var ebx_buttonIconSelector_current_toggleButtonId = null;

var ebx_buttonIconSelector_currentScrollingContainer = null;
var ebx_buttonIconSelector_originalFormScrollTop = null;
var ebx_buttonIconSelector_formScrollMaker = null;

var EBX_BUTTON_ICON_SELECTOR_SELECTOR_MAX_HEIGHT = 234;//220 + 2*5(padding.top&bottom) + 2*2(border.top&bottom)

function ebx_buttonIconSelector_showPanel(previewButtonWrapperId, hiddenFieldId, toggleButtonId, iconNamesUrl) {
  if (EBX_BUTTON_ICON_SELECTOR_PANEL_LZ === null) {
    EBX_BUTTON_ICON_SELECTOR_PANEL_LZ = new YAHOO.widget.Overlay(EBX_BUTTON_ICON_SELECTOR_PANEL_ID, {
      constraintoviewport: true,
      visible: false
    });

    EBX_BUTTON_ICON_SELECTOR_PANEL_LZ.render(document.body);

    var bodyContent = [];

    bodyContent.push("<div class=\"ebx_ButtonIconSelectorPanelContent ebx_ColoredBorder ebx_SmallFormButtons\">");
    {
      bodyContent.push("<div class=\"ebx_ButtonIconSelectorPanelSection ebx_ColoredBorder\">",
          EBX_BUTTON_ICON_SELECTOR_SECTION_TITLE_BUILT_IN,
          "</div>");
      bodyContent.push(
          ebx_buttonIconSelector_buildButtonsWithHiddenFieldNextSibling(EBX_BUTTON_ICON_SELECTOR_BUILT_IN_ICON_NAMES));

      bodyContent.push("<div class=\"ebx_ButtonIconSelectorPanelSection ebx_ColoredBorder\">",
          EBX_BUTTON_ICON_SELECTOR_SECTION_TITLE_FONT_AWESOME, "</div>");
      bodyContent.push("<div id=\"", EBX_BUTTON_ICON_SELECTOR_FONT_AWESOME_SECTION_ID, "\"></div>");
    }
    bodyContent.push("</div>");

    EBX_BUTTON_ICON_SELECTOR_PANEL_LZ.setBody(bodyContent.join(""));

    ebx_buttonIconSelector_goFetchFontAwesomeIconsAndFillSection(iconNamesUrl);

    YAHOO.util.Event.addListener(EBX_BUTTON_ICON_SELECTOR_PANEL_LZ.body, "click", ebx_buttonIconSelector_clickListener);
  }

  var previewButtonWrapperEl = document.getElementById(previewButtonWrapperId);

  // auto-scroll feature
  {
    ebx_buttonIconSelector_currentScrollingContainer = EBX_Form.getFormScrollingContainer(previewButtonWrapperEl);
    ebx_buttonIconSelector_originalFormScrollTop = ebx_buttonIconSelector_currentScrollingContainer.scrollTop;
    if (ebx_buttonIconSelector_formScrollMaker === null) {
      ebx_buttonIconSelector_formScrollMaker = document.createElement("div");
      ebx_buttonIconSelector_currentScrollingContainer.appendChild(ebx_buttonIconSelector_formScrollMaker);
    }
    var D = YAHOO.util.Dom;
    var clientRegion = D.getClientRegion();
    var elRegion = D.getRegion(previewButtonWrapperEl);

    var excessHeight = elRegion.bottom + EBX_BUTTON_ICON_SELECTOR_SELECTOR_MAX_HEIGHT - clientRegion.bottom
        + YAHOO.widget.Overlay.VIEWPORT_OFFSET;
    if (excessHeight < 0) {
      excessHeight = 0;
    }
    var formBodyRegion = D.getRegion(ebx_buttonIconSelector_currentScrollingContainer);
    var scrollMakerRegion = D.getRegion(ebx_buttonIconSelector_formScrollMaker);

    var formExtraHeightBottom = formBodyRegion.bottom - scrollMakerRegion.bottom;
    if (formExtraHeightBottom < 0) {
      formExtraHeightBottom = 0;
    }
    ebx_buttonIconSelector_formScrollMaker.style.height = formExtraHeightBottom + excessHeight + "px";
    ebx_buttonIconSelector_currentScrollingContainer.scrollTop = ebx_buttonIconSelector_originalFormScrollTop
        + excessHeight;
  }

  EBX_BUTTON_ICON_SELECTOR_PANEL_LZ.cfg.setProperty('context', [previewButtonWrapperEl, 'tl', 'bl']);
  ebx_buttonIconSelector_showMask();
  EBX_BUTTON_ICON_SELECTOR_PANEL_LZ.show();

  ebx_buttonIconSelector_current_previewButtonWrapperId = previewButtonWrapperId;
  ebx_buttonIconSelector_current_hiddenFieldId = hiddenFieldId;
  ebx_buttonIconSelector_current_toggleButtonId = toggleButtonId;
}

function ebx_buttonIconSelector_goFetchFontAwesomeIconsAndFillSection(iconNamesUrl) {
  var callback = new Object();

  callback.success = function (response) {
    var jsonData = JSON.parse(response.responseText);

    document.getElementById(
        EBX_BUTTON_ICON_SELECTOR_FONT_AWESOME_SECTION_ID).innerHTML = ebx_buttonIconSelector_buildButtonsWithHiddenFieldNextSibling(
        jsonData.iconNames, "fa-");
  };

  callback.failure = function (response) {
    EBX_Logger.log("ebx_buttonIconSelector_goFetchFontAwesomeIconsAndFillSection: failed. Response: " + response,
        EBX_Logger.error);
  };

  YAHOO.util.Connect.asyncRequest('GET', iconNamesUrl, callback);
}

function ebx_buttonIconSelector_clickListener(event) {
  var clickedButton;
  var target = EBX_Utils.getTargetElement(event);

  if (target.tagName !== undefined && target.tagName.toLowerCase() == "button") {
    clickedButton = target;
  } else {
    clickedButton = EBX_Utils.getFirstParentMatchingTagName(target, "button");
  }

  if (clickedButton === null) {
    return;
  }

  var iconName = clickedButton.nextSibling.value;

  document.getElementById(ebx_buttonIconSelector_current_hiddenFieldId).value = iconName;
  ebx_buttonIconSelector_updatePreviewButton(ebx_buttonIconSelector_current_previewButtonWrapperId, iconName);

  ebx_buttonIconSelector_hidePanel();
}

function ebx_buttonIconSelector_buildButtonsWithHiddenFieldNextSibling(iconNames, prefix) {
  var i, len;
  var ret = [];
  if (prefix === undefined) {
    prefix = "";
  }

  for (i = 0, len = iconNames.length; i < len; i++) {
    ret.push(ebx_buttonIconSelector_buildButton(prefix + iconNames[i]));
    ret.push("<input type=\"hidden\" value=\"", prefix, iconNames[i], "\"/>");
  }

  return ret.join("");
}

function ebx_buttonIconSelector_hidePanel() {
  if (EBX_BUTTON_ICON_SELECTOR_PANEL_LZ === null) {
    return;
  }
  EBX_BUTTON_ICON_SELECTOR_PANEL_LZ.hide();
  ebx_buttonIconSelector_hideMask();
  EBX_ButtonUtils.setStateToToggleButton(document.getElementById(ebx_buttonIconSelector_current_toggleButtonId), false);
  ebx_buttonIconSelector_currentScrollingContainer.scrollTop = ebx_buttonIconSelector_originalFormScrollTop;
  ebx_buttonIconSelector_formScrollMaker.style.height = 0;

  ebx_buttonIconSelector_current_previewButtonWrapperId = null;
  ebx_buttonIconSelector_current_hiddenFieldId = null;
  ebx_buttonIconSelector_current_toggleButtonId = null;
}

function ebx_buttonIconSelector_showMask() {
  var maskEl = document.getElementById(EBX_BUTTON_ICON_SELECTOR_PANEL_MASK_ID);

  if (maskEl === null) {
    maskEl = document.createElement("div");
    maskEl.id = EBX_BUTTON_ICON_SELECTOR_PANEL_MASK_ID;
    maskEl.className = "ebx_PageMask";
    maskEl.onclick = ebx_buttonIconSelector_hidePanel;
  } else {
    maskEl.style.display = "";
  }

  document.body.appendChild(maskEl);
}

function ebx_buttonIconSelector_hideMask() {
  var maskEl = document.getElementById(EBX_BUTTON_ICON_SELECTOR_PANEL_MASK_ID);

  if (maskEl !== null) {
    maskEl.style.display = "none";
  }
}

function ebx_buttonIconSelector_updatePreviewButton(previewButtonWrapperId, iconName) {
  document.getElementById(previewButtonWrapperId).innerHTML = ebx_buttonIconSelector_buildButton(iconName);
}

function ebx_buttonIconSelector_buildButton(iconName) {
  var regexpIconNamePattern = new RegExp(EBX_BUTTON_ICON_SELECTOR_ICON_NAME_PATTERN, 'g');

  // startsWith "fa-"
  if (iconName.indexOf("fa-") === 0) {
    // special font awesome way to do
    return EBX_BUTTON_ICON_SELECTOR_BUTTON_FONT_AWESOME_TEMPLATE_HTML.replace(regexpIconNamePattern, iconName);
  } else {
    // built-in icon
    return EBX_BUTTON_ICON_SELECTOR_BUTTON_BUILT_IN_TEMPLATE_HTML.replace(regexpIconNamePattern, iconName);
  }
}

/** END button icon selector * */

/** Module Element Selector * */
function EBX_MES_Constants() {
}
