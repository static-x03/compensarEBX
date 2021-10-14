/*START Button Utils */
function EBX_ButtonUtils() {
}

EBX_ButtonUtils.buttonPushedCSSClass = "ebx_ButtonPushed";
EBX_ButtonUtils.disabledButtonCSSClass = "ebx_Disabled";
EBX_ButtonUtils.defaultButtonCSSClass = "ebx_DefaultButton";
EBX_ButtonUtils.waitingButtonModeCSSClass = "ebx_WaitingButtonMode";

EBX_ButtonUtils.toggleButtonCkbIdSuffix = "_ckb";

EBX_ButtonUtils.buttonsConfirmMessages = [];
EBX_ButtonUtils.toggleButtonsConfirmMessagesOff = [];

EBX_ButtonUtils.jsButtonsCmds = [];
EBX_ButtonUtils.toggleButtonsCmdsOn = [];
EBX_ButtonUtils.toggleButtonsCmdsOff = [];

EBX_ButtonUtils.switchButtonsLabel1 = [];
EBX_ButtonUtils.switchButtonsLabel2 = [];
EBX_ButtonUtils.switchButtonsCSS1 = [];
EBX_ButtonUtils.switchButtonsCSS2 = [];
EBX_ButtonUtils.switchButtonsTitle1 = [];
EBX_ButtonUtils.switchButtonsTitle2 = [];
EBX_ButtonUtils.switchButtonsMenuText1 = [];
EBX_ButtonUtils.switchButtonsMenuText2 = [];
EBX_ButtonUtils.switchButtonsMenuCSSClass1 = [];
EBX_ButtonUtils.switchButtonsMenuCSSClass2 = [];
EBX_ButtonUtils.switchButtonLabelIdSuffix = "_label";

EBX_ButtonUtils.selectButtonsConfig = [];

EBX_ButtonUtils.linkButtonsDiscardFormModifications = [];

EBX_ButtonUtils.menuButtonsMenu = [];
EBX_ButtonUtils.menuButtonsTitles = [];
EBX_ButtonUtils.menuButtonsFixedWidth = [];

EBX_ButtonUtils.menuButtonArrowSpan = "<span class=\"ebx_MenuButtonArrow fa fa-caret-down\"></span>";

//[EBX_PUBLIC_API]
ebx_buttonUtils_setButtonDisabled = function (buttonEl, disabled) {
  EBX_ButtonUtils.setButtonDisabled(buttonEl, disabled);
};
EBX_ButtonUtils.setButtonDisabled = function (buttonEl, disabled) {
  if (disabled) {
    // workaround for Firefox (on Chrome, it worked)
    // it does not work for IE
    buttonEl.blur();
  }
  buttonEl.disabled = disabled;
  if (disabled) {
    EBX_Utils.addCSSClass(buttonEl, EBX_ButtonUtils.disabledButtonCSSClass);
  } else {
    EBX_Utils.removeCSSClass(buttonEl, EBX_ButtonUtils.disabledButtonCSSClass);
  }
};

//[EBX_PUBLIC_API]
ebx_buttonUtils_setButtonWaitingMode = function (buttonEl, setWaitingMode) {
  buttonEl.disabled = setWaitingMode;

  if (setWaitingMode) {
    EBX_Utils.addCSSClass(buttonEl, EBX_ButtonUtils.waitingButtonModeCSSClass);
  } else {
    EBX_Utils.removeCSSClass(buttonEl, EBX_ButtonUtils.waitingButtonModeCSSClass);
  }
};

EBX_ButtonUtils.isInADisabledParent = function (buttonEl) {
  if (EBX_Utils.getFirstParentMatchingCSSClass(buttonEl, EBX_Table_State.DRAWING.className) !== null) {
    return true;
  }

  if (EBX_Utils.getFirstParentMatchingCSSClass(buttonEl, "ebx_MDMComponentWaitingToolbar") !== null) {
    return true;
  }

  return false;
};

EBX_ButtonUtils.callEvent = function (actionString, self, event) {
  window.setTimeout(
      function () {
        new Function("event", actionString).call(self, event);
      },
      0);
};

EBX_ButtonUtils.jsButtonListener = function (buttonEl, event) {
  if (EBX_ButtonUtils.isInADisabledParent(buttonEl)) {
    return;
  }

  YAHOO.util.Event.stopEvent(event);
  if (EBX_ButtonUtils.buttonsConfirmMessages[buttonEl.id] !== undefined) {
    ebx_confirm({
      question: EBX_ButtonUtils.buttonsConfirmMessages[buttonEl.id],
      jsCommandYes: EBX_ButtonUtils.jsButtonsCmds[buttonEl.id]
    });
    return;
  }
  EBX_ButtonUtils.callEvent(
      EBX_ButtonUtils.jsButtonsCmds[buttonEl.id],
      buttonEl,
      event);
};

EBX_ButtonUtils.toggleButtonListener = function (buttonEl, event) {
  if (EBX_ButtonUtils.isInADisabledParent(buttonEl)) {
    return;
  }

  YAHOO.util.Event.stopEvent(event);
  var checkboxElement = document.getElementById(buttonEl.id + EBX_ButtonUtils.toggleButtonCkbIdSuffix);
  checkboxElement.checked = !checkboxElement.checked;
  EBX_ButtonUtils.toggleButtonCkbListener(checkboxElement, buttonEl.id, event);
};

EBX_ButtonUtils.setStateToToggleButton = function (buttonEl, stateBoolean) {
  if (stateBoolean !== true && stateBoolean !== false) {
    return;
  }

  if (buttonEl === null) {
    return;
  }

  var checkboxElement = document.getElementById(buttonEl.id + EBX_ButtonUtils.toggleButtonCkbIdSuffix);
  if (checkboxElement === null) {
    return;
  }

  checkboxElement.checked = stateBoolean;

  if (stateBoolean === true) {
    EBX_Utils.addCSSClass(buttonEl, EBX_ButtonUtils.buttonPushedCSSClass);
  } else {
    EBX_Utils.removeCSSClass(buttonEl, EBX_ButtonUtils.buttonPushedCSSClass);
  }
};

EBX_ButtonUtils.toggleButtonCkbListener = function (ckbEl, toggleButtonId, event) {
  YAHOO.util.Event.stopPropagation(event);
  if (ckbEl.checked === true) {
    if (EBX_ButtonUtils.buttonsConfirmMessages[toggleButtonId] !== undefined) {
      ebx_confirm({
        question: EBX_ButtonUtils.buttonsConfirmMessages[toggleButtonId],
        jsCommandYes: function () {
          EBX_ButtonUtils.toggleButton_activeStateOn(toggleButtonId, event);
        },
        jsCommandNo: function () {
          EBX_ButtonUtils.toggleButton_cancelStateOn(toggleButtonId);
        }
      });
      return;
    }

    EBX_ButtonUtils.toggleButton_activeStateOn(toggleButtonId, event);
  } else {
    if (EBX_ButtonUtils.toggleButtonsConfirmMessagesOff[toggleButtonId] !== undefined) {
      ebx_confirm({
        question: EBX_ButtonUtils.toggleButtonsConfirmMessagesOff[toggleButtonId],
        jsCommandYes: function () {
          EBX_ButtonUtils.toggleButton_activeStateOff(toggleButtonId, event);
        },
        jsCommandNo: function () {
          EBX_ButtonUtils.toggleButton_cancelStateOff(toggleButtonId);
        }
      });
      return;
    }

    EBX_ButtonUtils.toggleButton_activeStateOff(toggleButtonId, event);
  }
};

// state on = pushed
EBX_ButtonUtils.toggleButton_cancelStateOn = function (toggleButtonId) {
  document.getElementById(toggleButtonId + EBX_ButtonUtils.toggleButtonCkbIdSuffix).checked = false;
};
EBX_ButtonUtils.toggleButton_activeStateOn = function (toggleButtonId, event) {
  var button = document.getElementById(toggleButtonId);

  EBX_Utils.addCSSClass(button, EBX_ButtonUtils.buttonPushedCSSClass);
  EBX_ButtonUtils.callEvent(
      EBX_ButtonUtils.toggleButtonsCmdsOn[toggleButtonId],
      button,
      event);
};

//state off = unpushed
EBX_ButtonUtils.toggleButton_cancelStateOff = function (toggleButtonId) {
  document.getElementById(toggleButtonId + EBX_ButtonUtils.toggleButtonCkbIdSuffix).checked = true;
};
EBX_ButtonUtils.toggleButton_activeStateOff = function (toggleButtonId, event) {
  var button = document.getElementById(toggleButtonId);

  EBX_Utils.removeCSSClass(button, EBX_ButtonUtils.buttonPushedCSSClass);
  EBX_ButtonUtils.callEvent(
      EBX_ButtonUtils.toggleButtonsCmdsOff[toggleButtonId],
      button,
      event);
};

/**
 * Toggle the button and do the JavaScript command.
 *
 * @param {Object}
 *            buttonEl the button to toggle
 */
EBX_ButtonUtils.switchButtonListener = function (buttonEl, event) {
  if (EBX_ButtonUtils.isInADisabledParent(buttonEl)) {
    return;
  }

  YAHOO.util.Event.stopEvent(event);
  document.getElementById(buttonEl.id + EBX_ButtonUtils.toggleButtonCkbIdSuffix).click();
};

EBX_ButtonUtils.switchButtonState1 = 1;
EBX_ButtonUtils.switchButtonState2 = 2;
EBX_ButtonUtils.getStateOfSwitchButton = function (buttonEl) {
  if (document.getElementById(buttonEl.id + EBX_ButtonUtils.toggleButtonCkbIdSuffix).checked === true) {
    return EBX_ButtonUtils.switchButtonState2;
  }
  return EBX_ButtonUtils.switchButtonState1;
};

EBX_ButtonUtils.switchButtonCkbListener = function (ckbEl, switchButtonId, event) {
  YAHOO.util.Event.stopPropagation(event);

  if (ckbEl.checked === true) {
    if (EBX_ButtonUtils.buttonsConfirmMessages[switchButtonId] !== undefined) {
      ebx_confirm({
        question: EBX_ButtonUtils.buttonsConfirmMessages[switchButtonId],
        jsCommandYes: function () {
          EBX_ButtonUtils.switchButton_activeState2(switchButtonId, event);
        },
        jsCommandNo: function () {
          EBX_ButtonUtils.switchButton_cancelState2(switchButtonId);
        }
      });
      return;
    }

    EBX_ButtonUtils.switchButton_activeState2(switchButtonId, event);
  } else {
    if (EBX_ButtonUtils.toggleButtonsConfirmMessagesOff[switchButtonId] !== undefined) {
      ebx_confirm({
        question: EBX_ButtonUtils.toggleButtonsConfirmMessagesOff[switchButtonId],
        jsCommandYes: function () {
          EBX_ButtonUtils.switchButton_activeState1(switchButtonId, event);
        },
        jsCommandNo: function () {
          EBX_ButtonUtils.switchButton_cancelState1(switchButtonId);
        }
      });
      return;
    }
    EBX_ButtonUtils.switchButton_activeState1(switchButtonId, event);
  }
};

EBX_ButtonUtils.switchButton_cancelState1 = function (switchButtonId) {
  document.getElementById(switchButtonId + EBX_ButtonUtils.toggleButtonCkbIdSuffix).checked = true;
};
EBX_ButtonUtils.switchButton_activeState1 = function (switchButtonId, event) {

  // change the state of the button to 1/off
  button = document.getElementById(switchButtonId);
  button.title = EBX_ButtonUtils.switchButtonsTitle1[switchButtonId];
  button.className = EBX_ButtonUtils.switchButtonsCSS1[switchButtonId];

  buttonLabel = document.getElementById(switchButtonId + EBX_ButtonUtils.switchButtonLabelIdSuffix);
  buttonLabel.innerHTML = EBX_ButtonUtils.switchButtonsLabel1[switchButtonId];

  EBX_ButtonUtils.callEvent(
      EBX_ButtonUtils.toggleButtonsCmdsOff[switchButtonId],
      button,
      event);
};

EBX_ButtonUtils.switchButton_cancelState2 = function (switchButtonId) {
  document.getElementById(switchButtonId + EBX_ButtonUtils.toggleButtonCkbIdSuffix).checked = false;
};
EBX_ButtonUtils.switchButton_activeState2 = function (switchButtonId, event) {

  // change the state of the button to 2/on
  button = document.getElementById(switchButtonId);
  button.title = EBX_ButtonUtils.switchButtonsTitle2[switchButtonId];
  button.className = EBX_ButtonUtils.switchButtonsCSS2[switchButtonId];

  buttonLabel = document.getElementById(switchButtonId + EBX_ButtonUtils.switchButtonLabelIdSuffix);
  buttonLabel.innerHTML = EBX_ButtonUtils.switchButtonsLabel2[switchButtonId];

  EBX_ButtonUtils.callEvent(
      EBX_ButtonUtils.toggleButtonsCmdsOn[switchButtonId],
      button,
      event);
};

EBX_ButtonUtils.switchButtonMenuPanel = null;
EBX_ButtonUtils.switchButtonMenuPanelId = "ebx_OverlayForSwitchButtonMenu";
EBX_ButtonUtils.switchButtonMenuId = "ebx_SwitchButtonMenu";
EBX_ButtonUtils.switchButtonWithMenuCSSClass = "ebx_SwitchButtonWithMenu";

EBX_ButtonUtils.switchButtonProposalIsBeingChosen = false;
EBX_ButtonUtils.switchButtonMenuIsDisplayed = false;
EBX_ButtonUtils.currentSwitchButton = null;

EBX_ButtonUtils.getSwitchButtonMenuPanel = function () {
  if (EBX_ButtonUtils.switchButtonMenuPanel === null) {
    EBX_ButtonUtils.switchButtonMenuPanel = new YAHOO.widget.Overlay(EBX_ButtonUtils.switchButtonMenuPanelId);

    var menuButtonBuf = [];
    menuButtonBuf.push("<button");
    menuButtonBuf.push(" type=\"button\"");
    menuButtonBuf.push(" id=\"", EBX_ButtonUtils.switchButtonMenuId, "\"");
    menuButtonBuf.push(" class=\"ebx_Button\"");
    menuButtonBuf.push(" onclick=\"EBX_ButtonUtils.switchButtonMenuDisplay();\"");
    menuButtonBuf.push(" onmousedown=\"EBX_ButtonUtils.menuButtonMouseDownListener(event);\"");
    menuButtonBuf.push(" onmouseover=\"EBX_ButtonUtils.switchButtonMenuListenerMouseover();\"");
    menuButtonBuf.push(" onfocus=\"EBX_ButtonUtils.switchButtonMenuListenerMouseover();\"");
    menuButtonBuf.push(" onmouseout=\"EBX_ButtonUtils.switchButtonListenerMouseOut();\"");
    menuButtonBuf.push(">");
    menuButtonBuf.push(EBX_ButtonUtils.menuButtonArrowSpan);
    menuButtonBuf.push("</button>");

    EBX_ButtonUtils.switchButtonMenuPanel.setBody(menuButtonBuf.join(""));

    EBX_ButtonUtils.menuButtonsTitles[EBX_ButtonUtils.switchButtonMenuId] = [];
  }

  return EBX_ButtonUtils.switchButtonMenuPanel;
};
EBX_ButtonUtils.buildCurrentSwitchButtonMenu = function () {
  var currentCurrentSwitchButtonId = EBX_ButtonUtils.currentSwitchButton.id, item1 = {
    text: EBX_ButtonUtils.switchButtonsMenuText1[currentCurrentSwitchButtonId]
  }, item2 = {
    text: EBX_ButtonUtils.switchButtonsMenuText2[currentCurrentSwitchButtonId]
  };

  if (EBX_ButtonUtils.switchButtonsMenuCSSClass1[currentCurrentSwitchButtonId] !== undefined) {
    item1.classname = EBX_ButtonUtils.switchButtonsMenuCSSClass1[currentCurrentSwitchButtonId];
  }

  if (EBX_ButtonUtils.switchButtonsMenuCSSClass2[currentCurrentSwitchButtonId] !== undefined) {
    item2.classname = EBX_ButtonUtils.switchButtonsMenuCSSClass2[currentCurrentSwitchButtonId];
  }

  if (EBX_ButtonUtils.getStateOfSwitchButton(EBX_ButtonUtils.currentSwitchButton)
      === EBX_ButtonUtils.switchButtonState1) {
    item1.checked = true;
    item2.onclick = {
      fn: EBX_ButtonUtils.toggleCurrentSwitchButton
    };
  } else {
    item1.onclick = {
      fn: EBX_ButtonUtils.toggleCurrentSwitchButton
    };
    item2.checked = true;
  }

  return [item1, item2];
};

EBX_ButtonUtils.toggleCurrentSwitchButton = function () {
  EBX_ButtonUtils.currentSwitchButton.click();
};

EBX_ButtonUtils.switchButtonListenerFocus = function (buttonEl) {
  buttonEl.ebx_hasKbdFocus = true;
  EBX_ButtonUtils.switchButtonListenerMouseOver(buttonEl);
};

EBX_ButtonUtils.switchButtonListenerMouseOver = function (buttonEl) {
  if (EBX_ButtonUtils.switchButtonMenuIsDisplayed) {
    return;
  }

  EBX_ButtonUtils.switchButtonProposalIsBeingChosen = true;
  EBX_ButtonUtils.currentSwitchButton = buttonEl;

  var panel = EBX_ButtonUtils.getSwitchButtonMenuPanel();
  panel.render(document.body);
  panel.cfg.setProperty("context", [buttonEl, "tl", "tr", null, [-1, 0]]);
  panel.show();

  EBX_ButtonUtils.menuButtonsMenu[EBX_ButtonUtils.switchButtonMenuId] = EBX_ButtonUtils.buildCurrentSwitchButtonMenu();

  EBX_Utils.addCSSClass(buttonEl, EBX_ButtonUtils.switchButtonWithMenuCSSClass);
};

EBX_ButtonUtils.switchButtonMenuListenerMouseover = function () {
  EBX_ButtonUtils.switchButtonProposalIsBeingChosen = true;
};

EBX_ButtonUtils.switchButtonListenerBlur = function () {
  if (EBX_ButtonUtils.currentSwitchButton !== null) {
    EBX_ButtonUtils.currentSwitchButton.ebx_hasKbdFocus = false;
  }
  EBX_ButtonUtils.switchButtonListenerMouseOut();
};
EBX_ButtonUtils.switchButtonListenerMouseOut = function () {
  if (EBX_ButtonUtils.switchButtonMenuIsDisplayed) {
    return;
  }
  EBX_ButtonUtils.switchButtonProposalIsBeingChosen = false;
  window.setTimeout(EBX_ButtonUtils.hideCurrentSwitchButtonDecorations,
      EBX_ButtonUtils.hideCurrentSwitchButtonDecorationsTimeout);
};
EBX_ButtonUtils.hideCurrentSwitchButtonDecorationsTimeout = 100;
EBX_ButtonUtils.hideCurrentSwitchButtonDecorations = function () {
  if (EBX_ButtonUtils.switchButtonProposalIsBeingChosen) {
    return;
  }

  if (EBX_ButtonUtils.currentSwitchButton === null) {
    return;
  }

  if (EBX_ButtonUtils.currentSwitchButton.ebx_hasKbdFocus) {
    return;
  }

  EBX_ButtonUtils.getSwitchButtonMenuPanel().hide();

  EBX_Utils.removeCSSClass(EBX_ButtonUtils.currentSwitchButton, EBX_ButtonUtils.switchButtonWithMenuCSSClass);

  EBX_ButtonUtils.currentSwitchButton = null;
};

EBX_ButtonUtils.switchButtonListenerKeyPressed = function (event) {
  if (event.keyCode === EBX_Utils.keyCodes.DOWN) {
    document.getElementById(EBX_ButtonUtils.switchButtonMenuId).click();
  }
};

EBX_ButtonUtils.switchButtonMenuDisplay = function () {
  var hasBeenDisplayed = EBX_ButtonUtils.menuButtonDisplay(EBX_ButtonUtils.switchButtonMenuId,
      EBX_ButtonUtils.currentSwitchButton);
  if (hasBeenDisplayed === false) {
    return;
  }

  EBX_ButtonUtils.switchButtonMenuIsDisplayed = true;

  EBX_ButtonUtils.menuButtonsYUIMenu.mouseOverEvent.subscribe(EBX_ButtonUtils.switchButtonMenuListenerMouseover);
  EBX_ButtonUtils.menuButtonsYUIMenu.hideEvent.subscribe(EBX_ButtonUtils.releaseSwitchButtonMenuSubscribes);
};
EBX_ButtonUtils.releaseSwitchButtonMenuSubscribes = function () {
  EBX_ButtonUtils.menuButtonsYUIMenu.mouseOverEvent.unsubscribe(EBX_ButtonUtils.switchButtonMenuListenerMouseover);
  EBX_ButtonUtils.menuButtonsYUIMenu.hideEvent.unsubscribe(EBX_ButtonUtils.releaseSwitchButtonMenuSubscribes);
  EBX_ButtonUtils.switchButtonMenuIsDisplayed = false;
  EBX_ButtonUtils.switchButtonListenerMouseOut();
};

// deprecated / no more used since 5.7.0 (all buttons are <button>, even links)
EBX_ButtonUtils.linkListener = function (buttonEl, event) {
  if (EBX_ButtonUtils.isInADisabledParent(buttonEl)) {
    YAHOO.util.Event.preventDefault(event);
    return;
  }

  if (EBX_Utils.matchCSSClass(buttonEl, EBX_ButtonUtils.disabledButtonCSSClass) === true) {
    YAHOO.util.Event.preventDefault(event);
    return;
  }

  if (EBX_ButtonUtils.buttonsConfirmMessages[buttonEl.id] !== undefined) {
    if (window.confirm(EBX_ButtonUtils.buttonsConfirmMessages[buttonEl.id]) === false) {
      YAHOO.util.Event.preventDefault(event);
      return;
    }
  }

  if (EBX_ButtonUtils.linkButtonsDiscardFormModifications[buttonEl.id] === true) {
    EBX_Form.setParentFormDiscardModifications(buttonEl);
  }
};

EBX_ButtonUtils.hiddenDefaultSubmitButtonCSSClass = "ebx_HiddenDefaultSubmitButton";
EBX_ButtonUtils.getHiddenDefaultSubmitButton = function (formEl) {
  if (formEl.ebx_defaultSubmitButtonId
      === undefined/* || EBX_Utils.getFirstRecursiveChildMatchingCSSClass(formEl, EBX_ButtonUtils.hiddenDefaultSubmitButtonCSSClass) === null*/) {
    var hiddenDefaultSubmitButton = document.createElement("input");
    hiddenDefaultSubmitButton.type = "submit";
    hiddenDefaultSubmitButton.className = EBX_ButtonUtils.hiddenDefaultSubmitButtonCSSClass;
    hiddenDefaultSubmitButton.tabIndex = -1;
    formEl.insertBefore(hiddenDefaultSubmitButton, formEl.firstChild);
    return hiddenDefaultSubmitButton;
  }

  return EBX_Utils.getFirstRecursiveChildMatchingCSSClass(formEl, EBX_ButtonUtils.hiddenDefaultSubmitButtonCSSClass);
};
EBX_ButtonUtils.setSubmitButtonAsDefault = function (submitButtonId) {
  var submitButton = document.getElementById(submitButtonId), parentForm, currentSubmitButton,
      hiddenDefaultSubmitButton;
  if (submitButton === null) {
    return;
  }

  parentForm = submitButton.form;
  if (parentForm !== undefined) {

    currentSubmitButton = document.getElementById(parentForm.ebx_defaultSubmitButtonId);
    if (currentSubmitButton !== null) {
      EBX_Utils.removeCSSClass(currentSubmitButton, EBX_ButtonUtils.defaultButtonCSSClass);
    }

    hiddenDefaultSubmitButton = EBX_ButtonUtils.getHiddenDefaultSubmitButton(parentForm);
    hiddenDefaultSubmitButton.name = submitButton.name;
    hiddenDefaultSubmitButton.value = submitButton.value;

    EBX_Utils.addCSSClass(submitButton, EBX_ButtonUtils.defaultButtonCSSClass);
    parentForm.ebx_defaultSubmitButtonId = submitButtonId;
  }
};

EBX_ButtonUtils.menuButtonsYUIMenu = null;
EBX_ButtonUtils.menuButtonsMenuId = "ebx_MenuForMenuButtons";
EBX_ButtonUtils.hideAndGetMenuButtonMenu = function () {
  if (EBX_ButtonUtils.menuButtonsYUIMenu === null) {
    EBX_ButtonUtils.menuButtonsYUIMenu = new YAHOO.widget.Menu(EBX_ButtonUtils.menuButtonsMenuId, {
      constraintoviewport: true,
      shadow: false,
      zIndex: 20
    });
    /* zIndex 20 to cover the floating navigation title, which is 10 */
    EBX_ButtonUtils.menuButtonsYUIMenu.hideEvent.subscribe(EBX_ButtonUtils.releaseMenuButton);
  } else {
    EBX_ButtonUtils.menuButtonsYUIMenu.hide();
  }

  return EBX_ButtonUtils.menuButtonsYUIMenu;
};

EBX_ButtonUtils.menuButtonMouseDownListener = function (event) {
  YAHOO.util.Event.stopEvent(event);
};

EBX_ButtonUtils.menuButtonListenerAjax = function (buttonEl, event, menusUrl) {
  if (EBX_ButtonUtils.isInADisabledParent(buttonEl)) {
    return;
  }

  var ajaxHandler = new EBX_AJAXResponseHandler();

  ajaxHandler.handleAjaxResponseSuccess = function (data) {
    buttonEl.style.cursor = "";

    YAHOO.util.Event.stopEvent(event);

    var menu = EBX_ButtonUtils.hideAndGetMenuButtonMenu();

    menu.clearContent();

    var menuContent = JSON.parse(data);
    menu.addItems(menuContent);

    menu.cfg.setProperty("context", [buttonEl, "tl", "bl", null, [1, 0]]);
    menu.ebx_ElementToRelease = buttonEl;

    menu.render(document.body);

    menu.show();

    EBX_ButtonUtils.setMenuButtonPushed(buttonEl);
  };

  ajaxHandler.handleAjaxResponseFailed = function (responseContent) {
    buttonEl.style.cursor = "";
  };

  buttonEl.style.cursor = "wait";
  ajaxHandler.sendRequest(menusUrl);
};

EBX_ButtonUtils.menuButtonListener = function (buttonEl, event) {
  if (EBX_ButtonUtils.isInADisabledParent(buttonEl)) {
    return;
  }

  YAHOO.util.Event.stopEvent(event);
  EBX_ButtonUtils.menuButtonDisplay(buttonEl.id, buttonEl);
};

EBX_ButtonUtils.getMenuItems = function getMenuItems(menuButtonId, tableName, initCallbacks) {
  return EBX_Utils.map(
      EBX_ButtonUtils.menuButtonsMenu[menuButtonId],
      filter);

  function filter(itemGroup) {
    if (!EBX_Utils.isArray(itemGroup)) {
      return filter([itemGroup])[0];
    }

    var filterResult = EBX_Utils.map(itemGroup, function (item) {
      var displayed = true;
      var itemdata;

      if (item.submenu !== undefined) {
        if (item.submenu.itemdata !== undefined) {
          itemdata = EBX_Utils.map(item.submenu.itemdata, filter);
          if (itemdata.length == 0) {
            displayed = false;
          }
        }
      }

      if (displayed) {
        var displayPredicate = item.displayPredicate;
        if (displayPredicate !== undefined) {
          var result = eval(displayPredicate);
          if (typeof result === "boolean") {
            displayed = result;
          }

          if (typeof result === "function") {
            displayed = result(tableName);
          }
        }
      }


      return {
        item: item,
        displayed: displayed,
        itemdata: itemdata
      };
    });

    filterResult = EBX_Utils.filter(filterResult, function (itemWrapper) {
      return itemWrapper && itemWrapper.displayed;
    });

    filterResult = EBX_Utils.map(filterResult, function (itemWrapper) {

      if (initCallbacks) {
        var initCallback = itemWrapper.item.initCallback;
        if (initCallback !== undefined) {
          initCallbacks.push(initCallback);
        }
      }

      if (!itemWrapper.itemdata) {
        return itemWrapper.item;
      }

      var result = copy(itemWrapper.item);
      result.submenu = copy(result.submenu);
      result.submenu.itemdata = itemWrapper.itemdata;

      return result;
    });

    return filterResult;

    function copy(object) {
      var result = {};

      for (var attr in object) {
        if (object.hasOwnProperty(attr)) {
          result[attr] = object[attr];
        }
      }

      return result;
    }
  }
};

// enable dynamic menus, listening to table updates
(function () {
  "use strict";

  EBX_Events.on(null, EBX_AjaxTable.events.refresh, refreshMenus);

  // for now, we have no service which displaying depends on selection
//	EBX_Events.on(null, EBX_AjaxTable.events.selectionChange, refreshMenus);

  function refreshMenus(e) {
    var table = e.target;
    var tableName = table.tableName;

    var tableToolbars = EBX_AjaxTable.getToolbarNamesFromTableName(tableName);
    if (!tableToolbars) {
      return;
    }

    EBX_Utils.forEach(tableToolbars, function (toolbarId) {
      var toolbarElement = document.getElementById(toolbarId);
      if (!toolbarElement) {
        return;
      }

      var menuButtons = EBX_Utils.getRecursiveChildrenMatchingCSSClass(toolbarElement, "ebx_MenuButton");
      EBX_Utils.forEach(menuButtons, function (menuButton) {
        var menuButtonId = menuButton.id;
        var menuItems = EBX_ButtonUtils.getMenuItems(menuButtonId, tableName);

        ebx_buttonUtils_setButtonDisabled(menuButton, isEmpty(menuItems));
      });
    });
  }

  function isEmpty(menu) {
    if (!EBX_Utils.isArray(menu)) {
      return false;
    }

    var length = menu.length;

    for (var i = 0; i < length; i++) {
      if (!isEmpty(menu[i])) {
        return false;
      }
    }

    return true;
  }
})();

/**
 * @return true if the menu has been displayed, false otherwise
 */
EBX_ButtonUtils.menuButtonDisplay = function (menuButtonId, contextElOrId) {
  var menuButtonEl = document.getElementById(menuButtonId), menu, i;
  var toolbarId = getToolbarId(menuButtonEl);
  var tableName;
  if (toolbarId !== null && toolbarId !== undefined) {
    tableName = EBX_AjaxTable.getTableNameFromToolbarName(toolbarId);
    if (tableName === undefined) {
      tableName = null;
    }
  } else {
    tableName = null;
  }

  if (EBX_Utils.matchCSSClass(menuButtonEl, EBX_ButtonUtils.buttonPushedCSSClass)) {
    EBX_ButtonUtils.hideAndGetMenuButtonMenu();
    return false;
  }

  if (EBX_ButtonUtils.buttonsConfirmMessages[menuButtonId] !== undefined) {
    if (window.confirm(EBX_ButtonUtils.buttonsConfirmMessages[menuButtonId]) === false) {
      return false;
    }
  }

  menu = EBX_ButtonUtils.hideAndGetMenuButtonMenu();

  menu.clearContent();
  var initCallbacks = [];

  menu.addItems(EBX_ButtonUtils.getMenuItems(menuButtonId, tableName, initCallbacks));

  // Add the title for each group of menu items
  for (i = 0; i < EBX_ButtonUtils.menuButtonsTitles[menuButtonId].length; i++) {
    menu.setItemGroupTitle(EBX_ButtonUtils.menuButtonsTitles[menuButtonId][i], i);
  }

  // shift menu to underneath the search button
  var filtersSlimSideButtonEl = document.getElementById("ebx_FiltersSlimSideButton");
  if (contextElOrId === filtersSlimSideButtonEl) {
    contextElOrId = document.getElementById("ebx_filtersButton");
  }

  menu.cfg.setProperty("context", [contextElOrId, "tl", "bl", null, [1, 0]]);
  menu.ebx_ElementToRelease = menuButtonEl;

  menu.render(document.body);

  EBX_Utils.forEach(initCallbacks, function (initCallback) {
    eval(initCallback);
  });

  // Fix menu width to avoid size change when dynamic content is displayed
  if (EBX_ButtonUtils.menuButtonsFixedWidth[menuButtonId] === true) {
    var el = menu.element;

    var onShow = function onShow() {
      var rect = el.getBoundingClientRect();
      el.style.width = rect.width.toFixed() + "px";
    };

    var onHide = function onHide() {
      el.style.width = "";

      menu.unsubscribe("show", onShow);
      menu.unsubscribe("hide", onHide);
    };

    menu.subscribe("show", onShow);
    menu.subscribe("hide", onHide);
  }

  menu.show();

  EBX_ButtonUtils.setMenuButtonPushed(menuButtonEl);

  return true;

  function getToolbarId(element) {
    if (element.className.indexOf("ebx_Toolbar") >= 0) {
      return element.id;
    }

    var parent = element.parentElement;
    if (!parent) {
      return null;
    }

    return getToolbarId(parent);
  }
};

EBX_ButtonUtils.setMenuButtonPushed = function (menuButtonEl) {
  EBX_Utils.addCSSClass(menuButtonEl, EBX_ButtonUtils.buttonPushedCSSClass);
};

EBX_ButtonUtils.releaseMenuButton = function () {
  EBX_Utils.removeCSSClass(this.ebx_ElementToRelease, EBX_ButtonUtils.buttonPushedCSSClass);
};

EBX_ButtonUtils.executeMenuItemJSCmd = function (p_sType, p_aArgs, p_oValue) {
  window.setTimeout(p_oValue, 0);
};

EBX_ButtonUtils.executeMenuItemJSCmdWithConfirm = function (p_sType, p_aArgs, p_oValue) {
  ebx_confirm({
    question: p_oValue[1],
    jsCommandYes: p_oValue[0]
  });
};

EBX_ButtonUtils.selectAndExecuteMenuItemJSCmd = function (p_sType, p_aArgs, p_oValue) {
  var button = this.parent.ebx_ElementToRelease;
  var selectedIndex = EBX_ButtonUtils.selectButtonsConfig[button.id].selectedIndex;
  var previousConf = EBX_ButtonUtils.menuButtonsMenu[button.id][selectedIndex];
  var i;

  // change innerHTML
  button.innerHTML = p_oValue[0] + EBX_ButtonUtils.menuButtonArrowSpan;

  // remove previous class names
  var previousClassName = previousConf.onclick.obj[1];
  if (previousClassName !== undefined) {
    var previousClassNames = previousClassName.split(EBX_Utils.CSSClassSeparator);
    var previousClassNames_length = previousClassNames.length;
    for (i = 0; i < previousClassNames_length; i++) {
      EBX_Utils.removeCSSClass(button, previousClassNames[i]);
    }
  }
  // add class name
  button.className += EBX_Utils.CSSClassSeparator + p_oValue[1];

  // remove previous check
  previousConf.checked = false;

  // set item checked
  EBX_ButtonUtils.menuButtonsMenu[button.id][this.index].checked = true;

  // update selected index
  EBX_ButtonUtils.selectButtonsConfig[button.id].selectedIndex = this.index;

  window.setTimeout(p_oValue[2], 0);
};

EBX_ButtonUtils.setMenuItemChecked = function (menuButtonId, menuItemId, setChecked) {

  var menuButtonMenu = EBX_ButtonUtils.menuButtonsMenu[menuButtonId];
  EBX_ButtonUtils.checkIfMenuHasItem(menuButtonMenu, menuItemId, setChecked);

};

/**
 * This method checks if a given menu contains the specified (via its ID)
 * menuItem. If it does, the menuItem is (un)checked depending on setChecked
 * value.
 *
 * @param menuEl
 *            the menu supposed to contain the menuItem
 * @param menuItemId
 *            the menuItem being searched
 * @param setChecked
 *            whether the menuItem is to be checked (if found)
 * @returns {Boolean} true if the menuItem has been found
 */
EBX_ButtonUtils.checkIfMenuHasItem = function (menuEl, menuItemId, setChecked) {
  var i = 0;
  var itemFound = false;
  do {
    var currentMenuItem = menuEl[i];
    if (currentMenuItem.id !== undefined && currentMenuItem.id == menuItemId) {
      currentMenuItem.checked = setChecked;
      return true;
    }
    if (Object.prototype.toString.call(currentMenuItem) === '[object Array]') {
      itemFound = EBX_ButtonUtils.checkIfMenuHasItem(currentMenuItem, menuItemId, setChecked);
    }
    i++;
  } while (i < menuEl.length && !itemFound);

  return itemFound;
};

/*END Button Utils */

/*START Ajax contextual menu */
var ebx_contextualMenu_instance;
var EBX_CONTEXTUAL_MENU_ID = "EBX_ContextualMenu";

var EBX_ContextualMenu = function () {
  /*
  this.id;
  this.menu;
  this.treeLine;
  */

  this.init = function () {
    this.menu = new YAHOO.widget.Menu(EBX_CONTEXTUAL_MENU_ID, {
      shadow: false,
      visible: false
    });
    this.menu.hideEvent.subscribe(ebx_contextualMenuUnFocusLine);
  };

  this.setItems = function (items) {
    this.menu.clearContent();
    this.menu.addItems(items);
  };

  this.setId = function (newId) {
    this.id = newId;
  };

  this.getId = function () {
    return this.id;
  };

  this.show = function () {
    this.menu.show();
  };

  this.hide = function () {
    this.menu.hide();
  };

  this.render = function (appendToNode) {
    this.menu.render(appendToNode);
  };

  this.setContext = function (contextEl) {
    this.menu.cfg.setProperty('context', [contextEl, 'tl', 'bl']);
  };

  this.isDisplayed = function () {
    if (this.menu.cfg.getProperty('visible')) {
      return true;
    }

    return false;
  };

  this.setTreeLine = function (newTreeLine) {
    this.treeLine = newTreeLine;
  };

  this.getTreeLine = function () {
    return this.treeLine;
  };
};

var ebx_contextualMenu_instance = null;

function ebx_initContextualMenu() {
  ebx_contextualMenu_instance = new EBX_ContextualMenu();
  ebx_contextualMenu_instance.init();
}

function EBX_AjaxContextualMenuObject(treeLine, container, anAssistElement) {
  this.assistElement = anAssistElement;
  this.containerDiv = container;
  this.treeLine = treeLine;

  this.onGetExceptedResponseCode = function (callerId) {
    return this.responseCodeOK_OptionsList;
  };

  this.onExecuteIfKO = function (responseXML) {
    ebx_hideContextualMenu();
  };

  this.onExecuteIfOK = function (responseXML, root) {
    var menuList = this.ebx_ExtractMenuList(root);
    if (menuList && menuList.length > 0) {
      this.ebx_ShowContextualMenu(menuList);
      return true;
    }
    return false;
  };

  this.ebx_ExtractMenuList = function (rootElement) {
    var optionsElement = rootElement.getElementsByTagName("options")[0];
    if (optionsElement === undefined) {
      return rootElement;
    }
    var optionListElement = optionsElement.getElementsByTagName("option");
    var list = [];
    for (var i = 0; i < optionListElement.length; i++) {
      var optionElement = optionListElement[i];
      var optionValue = "";
      if (optionElement.getElementsByTagName("value")[0].firstChild) {
        optionValue = optionElement.getElementsByTagName("value")[0].firstChild.data;
      }
      var optionLabel = optionElement.getElementsByTagName("label")[0].firstChild.data;
      var isEnabled = "true";
      if (optionElement.attributes.getNamedItem('isEnabled')) {
        isEnabled = optionElement.attributes.getNamedItem('isEnabled').nodeValue;
      }

      list[i] = [optionLabel, optionValue, isEnabled];
    }
    return list;
  };

  this.ebx_ShowContextualMenu = function (listService) {

    if (ebx_contextualMenu_instance === null) {
      ebx_initContextualMenu();
    }

    // old format
    if (listService[0].length === 3) {
      var items = [];
      var menuItem;
      for (var i = 0; i < listService.length; i++) {
        var aService = listService[i];
        if (!aService || aService.length != 3) {
          return;
        }

        menuItem = {};

        menuItem.text = aService[0];

        if (aService[2] == "true") {
          menuItem.onclick = {
            fn: EBX_ButtonUtils.executeMenuItemJSCmd,
            obj: aService[1]
          };
        } else {
          menuItem.disabled = true;
        }

        items.push(menuItem);
      }

      ebx_contextualMenu_instance.setItems(items);

    } else {

      ebx_contextualMenu_instance.setItems(listService);

    }

    ebx_contextualMenu_instance.setId(this.assistElement.id);
    if (treeLine) {
      ebx_contextualMenu_instance.setTreeLine(this.treeLine);
    }

    ebx_contextualMenu_instance.render(document.getElementById(this.containerDiv).parentNode);
    ebx_contextualMenu_instance.setContext(this.assistElement);

    ebx_contextualMenu_button = anAssistElement;

    ebx_contextualMenu_instance.show();
  };
}

EBX_AjaxContextualMenuObject.prototype = new EBX_AbstractAjaxResponseManager();

function ebx_hideContextualMenu() {
  if (ebx_contextualMenu_instance !== null) {
    ebx_contextualMenu_instance.hide();
  }
}

function ebx_contextualMenuUnFocusLine() {
  // restore the state off for the button
  // do it in a delay to avoid re-display the menu if the user clicks on this button
  //  otherwise it will firstly clicks on the body, then set the toggle button off,
  //  and secondly at the same time but just after, click on the toggle button to enable it again ant opening menu
  // a bug remains: if the user double-clicks on the action button to open the menu,
  //  the menu is displayed, then hidden, then displayed again in a short time, creating a flash effect
  //  but it is a very low priority (users should not double-click on a button)
  if (ebx_contextualMenu_button != null) {
    ebx_contextualMenu_button_timeout = window.setTimeout(function () {
      EBX_ButtonUtils.setStateToToggleButton(ebx_contextualMenu_button, false);
      ebx_contextualMenu_button = null;
    }, 100);
  }
}

//Show or hide the contextual menu under the clicked element
function ebx_manageContextualMenu(treeLine, url, assistElementId, containerDiv) {
  var assistElement = document.getElementById(assistElementId);
  var ajaxContextualMenu = new EBX_AjaxContextualMenuObject(treeLine, containerDiv, assistElement);

  // if the previous button had not the time to set off, it is better to set it off now
  //   (otherwise it will be set off in a few time)
  if (ebx_contextualMenu_button !== null) {
    window.clearTimeout(ebx_contextualMenu_button_timeout);
    EBX_ButtonUtils.setStateToToggleButton(ebx_contextualMenu_button, false);
    ebx_contextualMenu_button = null;
  }

  if (ebx_contextualMenu_instance === null) {
    ebx_initContextualMenu();
  }

  var previousClickedElementId = ebx_contextualMenu_instance.getId();

  var isSameElement = false;
  if (previousClickedElementId && previousClickedElementId == assistElementId) {
    isSameElement = true;
  }

  if (ebx_contextualMenu_instance.isDisplayed()) {
    ebx_hideContextualMenu();
    if (!isSameElement) {
      ajaxContextualMenu.onExecute(url);
    }
  } else {
    ajaxContextualMenu.onExecute(url);
  }
}

var ebx_contextualMenu_button = null;
var ebx_contextualMenu_button_timeout = null;
/*END Ajax contextual menu */

/* START Tabular View ColumnConfiguration */
function ebx_tabularViewColumnLineSelection(aCheckBox, treeLineIndex, checkBoxIDSuffix, contentIDSuffix,
    sortImgIDSuffix) {
  var ajaxSelectTreeLine = new EBX_AjaxSelectTableColumnTreeLineObject(aCheckBox, treeLineIndex, checkBoxIDSuffix,
      contentIDSuffix, sortImgIDSuffix);
  var params = new EBX_Map();
  params.put(EBX_Constants.ajaxTreeLineIndex, treeLineIndex);
  var requestUrl;
  if (aCheckBox.checked == true) {
    requestUrl = EBX_Constants.getRequestLink(ebx_tabularViewColumnConfiguratorSelectNodeEvent, params);
  } else {
    requestUrl = EBX_Constants.getRequestLink(ebx_tabularViewColumnConfiguratorUnselectNodeEvent, params);
  }
  ajaxSelectTreeLine.onExecute(requestUrl);
}

function EBX_AjaxSelectTableColumnTreeLineObject(aCheckBox, treeLineIndex, checkBoxIDSuffix, contentIDSuffix,
    sortImgIDSuffix) {
  this.checkBox = aCheckBox;
  this.treeLineIndex = treeLineIndex;

  this.treeLineCheckBoxIDSuffix = checkBoxIDSuffix;
  this.treeLineContentIDSuffix = contentIDSuffix;
  this.treeLineSortImgIDSuffix = treeLineIndex;

  this.onGetExceptedResponseCode = function () {
    return this.responseCodeOK_OptionsList;
  };

  this.onExecuteIfKO = function (responseXML) {
    if (this.checkBox.checked == true) {
      this.checkBox.checked = false;
    } else {
      this.checkBox.checked = true;
    }
  };

  this.onExecuteIfOK = function (responseXML, root) {
    var impactedTreeLine = this.onExtractImpactedTreeLineIndexes(root);
    if (!impactedTreeLine || impactedTreeLine.length <= 0) {
      this.onExecuteIfKO(responseXML);
      return;
    }

    for (var i = 0; i < impactedTreeLine.length; i++) {
      this.onWBP_applyChange(impactedTreeLine[i], this.checkBox.checked);
    }

    return true;
  };

  this.onExtractImpactedTreeLineIndexes = function (rootElement) {
    var optionsElement = rootElement.getElementsByTagName("options")[0];
    var optionListElement = optionsElement.getElementsByTagName("option");
    var list = [];
    for (var i = 0; i < optionListElement.length; i++) {
      var optionElement = optionListElement[i];
      if (optionElement.getElementsByTagName("value")[0].firstChild) {
        var optionValue = optionElement.getElementsByTagName("value")[0].firstChild.data;
        list[i] = optionValue;
      }
    }
    return list;
  };

  this.onWBP_applyChange = function (treeLineIndex, newValue) {
    var targetCheckBox = document.getElementById(treeLineIndex + this.treeLineCheckBoxIDSuffix);
    if (!targetCheckBox) {
      return;
    }
    targetCheckBox.checked = newValue;

    var content = document.getElementById(treeLineIndex + this.treeLineContentIDSuffix);
    if (!content) {
      return;
    }
    if (newValue || newValue == 'true') {
      EBX_Utils.removeCSSClass(content, "ebx_tabularView_hiddenNode");
    } else {
      EBX_Utils.addCSSClass(content, "ebx_tabularView_hiddenNode");
    }
    var sortImg = document.getElementById(treeLineIndex + this.treeLineSortImgIDSuffix);
    if (!sortImg) {
      return;
    }
    if (!(newValue || newValue == 'true')) {
      sortImg.style.display = 'none';
    }
  };
}

EBX_AjaxSelectTableColumnTreeLineObject.prototype = new EBX_AbstractAjaxResponseManager();
/* END Tabular View ColumnConfiguration */

/*START EBX_NodeDocumentation */

function EBX_NodeDocumentation() {
}

EBX_NodeDocumentation.docPanels = [];

EBX_NodeDocumentation.yuiPanel = null;
EBX_NodeDocumentation.DocumentationPanelId = "ebx_NodeDocumentation_Panel";
/* duration in seconds */
EBX_NodeDocumentation.fadeEffectDuration = 0.25;
EBX_NodeDocumentation.getDocumentationPanel = function () {
  if (EBX_NodeDocumentation.yuiPanel === null) {
    EBX_NodeDocumentation.yuiPanel = new YAHOO.widget.Overlay(EBX_NodeDocumentation.DocumentationPanelId, {
      constraintoviewport: true,
      visible: false,
      effect: {
        effect: YAHOO.widget.ContainerEffect.FADE,
        duration: EBX_NodeDocumentation.fadeEffectDuration
      }
    });
    EBX_NodeDocumentation.yuiPanel.render(document.body);

    YAHOO.util.Event.addListener(EBX_NodeDocumentation.yuiPanel.element, "mouseover",
        EBX_NodeDocumentation.cancelTimedHideCurrentDocNoCheck,
        null, null);
    YAHOO.util.Event.addListener(EBX_NodeDocumentation.yuiPanel.element, "mouseout",
        EBX_NodeDocumentation.launchTimedHideCurrentDocNoCheck,
        null, null);
  }
  return EBX_NodeDocumentation.yuiPanel;
};

EBX_NodeDocumentation.nodeLabelCSSClass = "ebx_nodeLabel";
EBX_NodeDocumentation.documentationPanelBodyClassName = "ebx_dcpBody";

EBX_NodeDocumentation.yuiDataSource = new YAHOO.util.XHRDataSource();
EBX_NodeDocumentation.yuiDataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
EBX_NodeDocumentation.yuiDataSource.responseSchema = {
  resultsList: "innerHTML",
  metaFields: {
    scriptToExecute: "ebx_scriptToExecute"
  }
};

EBX_NodeDocumentation.getDocPanelObj = function (nodeLabelElement) {
  if (nodeLabelElement === undefined) {
    return null;
  }

  var docPanel = EBX_NodeDocumentation.docPanels[nodeLabelElement.id];
  if (docPanel === undefined) {
    return null;
  }

  return docPanel;
};

EBX_NodeDocumentation.displayDocumentation = function (nodeLabelElement) {
  var docPanel = EBX_NodeDocumentation.getDocPanelObj(nodeLabelElement);
  if (docPanel === null) {
    return;
  }

  // is AJAX mode
  if (docPanel.homeKey !== undefined || docPanel.path !== undefined) {

    var requestURI = EBX_Constants.ajaxNodeDocumentationRequest;
    if (docPanel.homeKey !== undefined) {
      requestURI += EBX_Constants.ajaxNodeDocumentationParamHomeKey + docPanel.homeKey;
    }
    if (docPanel.adaptationName !== undefined) {
      requestURI += EBX_Constants.ajaxNodeDocumentationParamAdaptationName + docPanel.adaptationName;
    }
    if (docPanel.contentType !== undefined) {
      requestURI += EBX_Constants.ajaxNodeDocumentationParamContentType + docPanel.contentType;
    }
    if (docPanel.tableName !== undefined) {
      requestURI += EBX_Constants.ajaxNodeDocumentationParamTableName + docPanel.tableName;
    }
    if (docPanel.path !== undefined) {
      requestURI += EBX_Constants.ajaxNodeDocumentationParamPath + docPanel.path;
    }
    requestURI += EBX_Constants.ajaxNodeDocumentationParamAdvancedBlockEnabled + (docPanel.advancedBlockEnabled ? "true"
        : "false");

    EBX_NodeDocumentation.yuiDataSource.sendRequest(requestURI, {
      success: EBX_NodeDocumentation.displayDocumentationFromAjaxResponse,
      failure: EBX_NodeDocumentation.displayDocumentationFromAjaxFailure,
      argument: {
        nodeLabelElement: nodeLabelElement
      }
    });
  } else {
    EBX_NodeDocumentation.displayDocumentationFromNodeLabelDocPanel(nodeLabelElement, docPanel.innerHTML);
    window.setTimeout(docPanel.ebx_scriptToExecute, 0);
  }
};
EBX_NodeDocumentation.displayDocumentationFromAjaxResponse = function (oRequest, oParsedResponse, argument) {
  EBX_NodeDocumentation.docPanels[argument.nodeLabelElement.id] = {
    innerHTML: oParsedResponse.results[0],
    ebx_scriptToExecute: oParsedResponse.meta.scriptToExecute
  };

  EBX_NodeDocumentation.displayDocumentation(argument.nodeLabelElement);
};
EBX_NodeDocumentation.displayDocumentationFromAjaxFailure = function (oRequest, oParsedResponse, argument) {
  if (oParsedResponse.status == 401) {
    EBX_Loader.gotoTimeoutPage();
  }
};

EBX_NodeDocumentation.displayDocumentationFromNodeLabelDocPanel = function (nodeLabelElement, nodeLabelDocPanelHTML) {
  var documentationPanel = EBX_NodeDocumentation.getDocumentationPanel();

  documentationPanel.setBody(nodeLabelDocPanelHTML);

  documentationPanel.cfg.setProperty('context', [nodeLabelElement, 'tl', 'bl', null, [-2, 0]]);

  documentationPanel.show();

  EBX_NodeDocumentation.clearHideEvents();

  EBX_NodeDocumentation.addEventForBody();
};

EBX_NodeDocumentation.launchedDocumentationHideEvents = [];
EBX_NodeDocumentation.documentationHideTimeout = 500;
// duration in ms
EBX_NodeDocumentation.launchTimedHideCurrentDocNoCheck = function () {
  EBX_NodeDocumentation.launchedDocumentationHideEvents.push(
      window.setTimeout("EBX_NodeDocumentation.hideCurrentDocumentationNow();",
          EBX_NodeDocumentation.documentationHideTimeout));

  EBX_NodeDocumentation.addEventForBody();
};
EBX_NodeDocumentation.cancelTimedHideCurrentDocNoCheck = function () {
  EBX_NodeDocumentation.clearHideEvents();

  EBX_NodeDocumentation.removeEventForBody();
};
EBX_NodeDocumentation.hideCurrentDocumentationNow = function (event) {
  var docPanel = EBX_NodeDocumentation.getDocumentationPanel();

  if (event !== undefined) {
    var clickedEl = EBX_Utils.getTargetElement(event);
    if (clickedEl === docPanel.element || EBX_Utils.isChildOf(clickedEl, docPanel.element) === true) {
      return;
    }
  }

  docPanel.hide();

  EBX_LabelTooltip.reinitCurrentToggleButton();

  EBX_NodeDocumentation.removeEventForBody();
};

EBX_NodeDocumentation.displayDocumentationFromButton = function (yuiButtonElement) {
  EBX_NodeDocumentation.displayDocumentation(EBX_Utils.getFirstParentMatchingCSSClass(yuiButtonElement._button,
      EBX_NodeDocumentation.nodeLabelCSSClass));
};

EBX_NodeDocumentation.clearHideEvents = function () {
  while (EBX_NodeDocumentation.launchedDocumentationHideEvents.length !== 0) {
    window.clearTimeout(EBX_NodeDocumentation.launchedDocumentationHideEvents.shift());
  }
};

EBX_NodeDocumentation.addEventForBody = function () {
  if (document.body.addEventListener) {
    /* Firefox and modern browsers */
    document.body.addEventListener("click", EBX_NodeDocumentation.hideCurrentDocumentationNow, false);
  } else if (document.body.attachEvent) {
    /* IE */
    document.body.attachEvent("onclick", EBX_NodeDocumentation.hideCurrentDocumentationNow);
  }
};
EBX_NodeDocumentation.removeEventForBody = function () {
  if (document.body.addEventListener) {
    /* Firefox and modern browsers */
    document.body.removeEventListener("click", EBX_NodeDocumentation.hideCurrentDocumentationNow, false);
  } else if (document.body.attachEvent) {
    /* IE */
    document.body.detachEvent("onclick", EBX_NodeDocumentation.hideCurrentDocumentationNow);
  }
};
/*END EBX_NodeDocumentation */

/*START EBX_LabelTooltip */
EBX_LabelTooltip = function () {
};

EBX_LabelTooltip.displayAllLabelDocButtonsCSSClass = "ebx_DisplayAllLabelDocButtons";

EBX_LabelTooltip.displayAll = function () {
  EBX_Utils.addCSSClass(document.body, EBX_LabelTooltip.displayAllLabelDocButtonsCSSClass);
};
EBX_LabelTooltip.hideAll = function () {
  EBX_Utils.removeCSSClass(document.body, EBX_LabelTooltip.displayAllLabelDocButtonsCSSClass);
  EBX_NodeDocumentation.hideCurrentDocumentationNow();
};
EBX_LabelTooltip.currentLabelDocButtonId = null;
EBX_LabelTooltip.displayDocumentationFromButton = function (buttonId, labelId) {
  EBX_LabelTooltip.reinitCurrentToggleButton();
  EBX_LabelTooltip.currentLabelDocButtonId = buttonId;
  EBX_NodeDocumentation.displayDocumentation(document.getElementById(labelId));
};
EBX_LabelTooltip.reinitCurrentToggleButton = function () {
  if (EBX_LabelTooltip.currentLabelDocButtonId !== null) {
    EBX_ButtonUtils.setStateToToggleButton(document.getElementById(EBX_LabelTooltip.currentLabelDocButtonId), false);
    EBX_LabelTooltip.currentLabelDocButtonId = null;
  }
};

EBX_LabelTooltip.LabelDocButtonCSSClasses = "ebx_IconButtonSmall ebx_LabelDocButtonTooltip";
EBX_LabelTooltip.RawLabelCSSClass = "ebx_RawLabel";
EBX_LabelTooltip.DisplayLabelDocButtonCSSClass = "ebx_DisplayLabelDocButton";

EBX_LabelTooltip.currentLabelContainerElement = null;
EBX_LabelTooltip.currentLabelIsFullyDisplayed = null;

EBX_LabelTooltip.displayTooltip = function (labelContainerElement) {
  EBX_LabelTooltip.currentLabelContainerElement = labelContainerElement;

  var labelElement = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(labelContainerElement,
      EBX_LabelTooltip.RawLabelCSSClass);

  var elementToClone = null;
  if (labelElement.parentNode.tagName == "A") {
    elementToClone = labelElement.parentNode;
  } else {
    elementToClone = labelElement;
  }

  var clonedLabel = elementToClone.cloneNode(true);
  clonedLabel.style.fontSize = YAHOO.util.Dom.getStyle(elementToClone, "font-size");
  clonedLabel.style.fontWeight = YAHOO.util.Dom.getStyle(elementToClone, "font-weight");
  clonedLabel.style.fontFamily = YAHOO.util.Dom.getStyle(elementToClone, "font-family");

  var labelAndButtonContainer = document.createElement("SPAN");
  labelAndButtonContainer.appendChild(clonedLabel);

  var panel = EBX_LabelTooltip.getTooltipPanel();

  panel.setBody(labelAndButtonContainer);

  var nodeLabelDocPanel = EBX_NodeDocumentation.getDocPanelObj(labelContainerElement);
  if (nodeLabelDocPanel !== null) {
    var buttonToClone = elementToClone.nextSibling;

    var buttonBuf = [];
    buttonBuf.push("<button");
    buttonBuf.push(" type=\"button\"");
    buttonBuf.push(" class=\"", EBX_LabelTooltip.LabelDocButtonCSSClasses, "\"");
    buttonBuf.push(" style=\"vertical-align: ", YAHOO.util.Dom.getStyle(buttonToClone, "vertical-align"), "\"");
    buttonBuf.push(" onclick=\"EBX_LabelTooltip.displayDocumentation();\"");
    buttonBuf.push(" title=\"", EBX_LocalizedMessage.label_showDetails, "\"");
    buttonBuf.push(">");
    buttonBuf.push("<span class=\"ebx_SmallIcon\"></span>");
    buttonBuf.push("</button>");

    labelAndButtonContainer.innerHTML += buttonBuf.join("");
  }

  panel.cfg.setProperty('context', [labelContainerElement, 'tl', 'tl']);

  panel.show();
};
EBX_LabelTooltip.hideTooltip = function () {
  EBX_LabelTooltip.getTooltipPanel().hide();
};

EBX_LabelTooltip.LabelDocButtonCSSClass = "ebx_LabelDocButton";
EBX_LabelTooltip.docButtonMarginLeft = null;
EBX_LabelTooltip.refreshDocButtonPosition = function (labelContainerEl, mouseX, mouseY) {
  var docButtonEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(labelContainerEl,
      EBX_LabelTooltip.LabelDocButtonCSSClass);

  if (docButtonEl === null) {
    return;
  }

  var labelContainerRegion = YAHOO.util.Dom.getRegion(labelContainerEl);

  var y = mouseY;

  var startX = mouseX;
  var endX = labelContainerRegion.right;
  var middleX;
  var foundEl;

  while (startX < endX) {
    middleX = Math.floor((startX + endX) / 2);

    foundEl = document.elementFromPoint(middleX, y);

    if (foundEl === null || (foundEl !== labelContainerEl && !EBX_Utils.isChildOf(foundEl, labelContainerEl))) {
      // too much on the right
      endX = middleX;
    } else {
      // too much on the left
      startX = middleX + 1;
    }
  }
  middleX = Math.floor((startX + endX) / 2);

  var gap = labelContainerRegion.right - middleX;

  docButtonEl.style.marginLeft = -(gap - EBX_LabelTooltip.docButtonMarginLeft) + "px";
  docButtonEl.style.marginRight = gap + "px";

};

EBX_LabelTooltip.displayDocumentation = function () {
  EBX_NodeDocumentation.displayDocumentation(EBX_LabelTooltip.currentLabelContainerElement);
};

EBX_LabelTooltip.ToolTipId = "ebx_LabelTooltip";
EBX_LabelTooltip.yuiPanel = null;
EBX_LabelTooltip.fadeEffectDuration = 0.25;
/* duration in seconds */
EBX_LabelTooltip.getTooltipPanel = function () {
  if (EBX_LabelTooltip.yuiPanel === null) {

    var params = {};

    EBX_LabelTooltip.yuiPanel = new YAHOO.widget.Overlay(EBX_LabelTooltip.ToolTipId, params);
    EBX_LabelTooltip.yuiPanel.render(document.body);

    YAHOO.util.Event.addListener(EBX_LabelTooltip.yuiPanel.element, "mouseover",
        EBX_LabelTooltip.cancelTimedHideCurrentNoCheck, null, null);
    YAHOO.util.Event.addListener(EBX_LabelTooltip.yuiPanel.element, "mouseout",
        EBX_LabelTooltip.launchTimedHideCurrentNoCheck, null, null);

    YAHOO.util.Event.addListener(EBX_LabelTooltip.yuiPanel.element, "mouseover",
        EBX_NodeDocumentation.cancelTimedHideCurrentDocNoCheck, null,
        null);
    YAHOO.util.Event.addListener(EBX_LabelTooltip.yuiPanel.element, "mouseout",
        EBX_NodeDocumentation.launchTimedHideCurrentDocNoCheck, null,
        null);
  }
  return EBX_LabelTooltip.yuiPanel;
};

EBX_LabelTooltip.labelContainerWaitForDisplay = null;
EBX_LabelTooltip.launchedShowEvents = [];
EBX_LabelTooltip.ShowTimeout = "1000";
// duration in ms

EBX_LabelTooltip.labelWithTooltipMouseOverListener = function (labelContainerEl, event) {
  EBX_LabelTooltip.cancelTimedHideCurrentTooltip(labelContainerEl);
  EBX_LabelTooltip.launchTimedShowCurrentTooltip(labelContainerEl, event);
};
EBX_LabelTooltip.labelWithTooltipMouseOutListener = function (labelContainerEl) {
  EBX_LabelTooltip.launchTimedHideCurrentTooltip(labelContainerEl);
  EBX_LabelTooltip.cancelTimedShowCurrentTooltip();
};

EBX_LabelTooltip.launchTimedShowCurrentTooltip = function (labelContainerEl, event) {
  // avoid titles level 2 (titles of navigation and workspace)
  if (EBX_Utils.getFirstParentMatchingTagName(labelContainerEl, "H2") !== null) {
    return;
  }
  if (EBX_Utils.getFirstParentMatchingCSSClass(labelContainerEl, "ebx_TitleBreadcrumbItem") !== null) {
    return;
  }

  EBX_LabelTooltip.labelContainerWaitForDisplay = labelContainerEl;

  EBX_LabelTooltip.currentLabelIsFullyDisplayed = EBX_Utils.isFullyDisplayed(labelContainerEl);
  if (EBX_LabelTooltip.currentLabelIsFullyDisplayed) {
    var docButtonEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(labelContainerEl,
        EBX_LabelTooltip.LabelDocButtonCSSClass);
    if (docButtonEl !== null) {
      docButtonEl.style.marginLeft = "";
      docButtonEl.style.marginRight = "";
    }
    return;
  }

  EBX_LabelTooltip.refreshDocButtonPosition(labelContainerEl, event.clientX, event.clientY);

  EBX_LabelTooltip.launchedShowEvents.push(
      setTimeout("EBX_LabelTooltip.showCurrentTooltipNow();", EBX_LabelTooltip.ShowTimeout));
};
EBX_LabelTooltip.cancelTimedShowCurrentTooltip = function () {
  EBX_LabelTooltip.clearShowEvents();
};
EBX_LabelTooltip.showCurrentTooltipNow = function () {
  EBX_LabelTooltip.displayTooltip(EBX_LabelTooltip.labelContainerWaitForDisplay);
  EBX_LabelTooltip.labelContainerWaitForDisplay = null;
};
EBX_LabelTooltip.clearShowEvents = function () {
  while (EBX_LabelTooltip.launchedShowEvents.length != 0) {
    clearTimeout(EBX_LabelTooltip.launchedShowEvents.shift());
  }
};

EBX_LabelTooltip.launchedHideEvents = [];
EBX_LabelTooltip.HideTimeout = "300";
// duration in ms
EBX_LabelTooltip.launchTimedHideCurrentTooltip = function (labelContainerEl) {
  if (labelContainerEl !== EBX_LabelTooltip.currentLabelContainerElement) {
    return;
  }
  EBX_LabelTooltip.launchTimedHideCurrentNoCheck();
};
EBX_LabelTooltip.launchTimedHideCurrentNoCheck = function () {
  EBX_LabelTooltip.launchedHideEvents.push(
      setTimeout("EBX_LabelTooltip.hideCurrentTooltipNow();", EBX_LabelTooltip.HideTimeout));
};
EBX_LabelTooltip.cancelTimedHideCurrentTooltip = function (labelContainerEl) {
  if (labelContainerEl !== EBX_LabelTooltip.currentLabelContainerElement) {
    return;
  }
  EBX_LabelTooltip.cancelTimedHideCurrentNoCheck();
};
EBX_LabelTooltip.cancelTimedHideCurrentNoCheck = function () {
  EBX_LabelTooltip.clearHideEvents();
};
EBX_LabelTooltip.hideCurrentTooltipNow = function () {
  EBX_LabelTooltip.hideTooltip();
};

EBX_LabelTooltip.clearHideEvents = function () {
  while (EBX_LabelTooltip.launchedHideEvents.length != 0) {
    clearTimeout(EBX_LabelTooltip.launchedHideEvents.shift());
  }
};

/*END EBX_LabelTooltip */

/*START EBX_Permalink */

function ebx_displayPermalink(permalink, subject) {
  EBX_Permalink.currentURL = ebx_resolvePermalink(permalink);
  EBX_Permalink.currentSubject = subject;

  if (EBX_Permalink.permalinkPanel === null) {
    EBX_Permalink.buildPermalinkPanel();
  } else {
    EBX_Permalink.displayCurrentPermalink();
  }
}

// See resolvePermalink() in PermaLink.tsx
//As Manager can be "behind" a reverse proxy, we do not know the beginning of the URL ([protocol]://[host]:[port]/...).
function ebx_resolvePermalink(permalink) {
  // If a specific entry url is fully defined
  if (permalink.indexOf("http://") > -1) {
    return permalink;
  }
  if (permalink.indexOf("https://") > -1) {
    return permalink;
  }

  if (permalink.indexOf("/") == 0) {
    return window.location.protocol + "//" + window.location.host + permalink;
  }

  if (permalink.indexOf(".") == 0) {
    return window.location.protocol + "//" + window.location.host + window.location.pathname
        + (window.location.pathname.substring(window.location.pathname.length - 1) == "/" ? "" : "/") + permalink;
  }

  var base_URL = "";
  if (window.location.href.indexOf("?") == -1) {
    base_URL = window.location.href + "?";
  } else {
    base_URL = window.location.href.substring(0, window.location.href.indexOf("?") + 1);
  }

  return base_URL + permalink;
}

function EBX_Permalink() {
}

EBX_Permalink.currentURL = null;
EBX_Permalink.currentParameters = "";
EBX_Permalink.currentSubject = null;
EBX_Permalink.currentMailTo = "";
EBX_Permalink.displayCurrentPermalink = function () {
  document.getElementById(EBX_Permalink.panelTitleSubjectId).innerHTML = EBX_Permalink.currentSubject;

  EBX_Permalink.updateLink();

  EBX_Permalink.permalinkPanel.show();
};
EBX_Permalink.updateLink = function () {
  document.getElementById(EBX_Permalink.inputLinkId).value = EBX_Permalink.getCurrentURLWithParameter();

  var mailto = [];
  mailto.push("mailto:");
  var regex = /&quot;/g;
  mailto.push("?subject=", encodeURIComponent(EBX_LocalizedMessage.permalink_title), " ",
      encodeURIComponent(EBX_Permalink.currentSubject.replace(regex, "\"")));
  mailto.push("&body=", encodeURIComponent(EBX_Permalink.getCurrentURLWithParameter()));
  EBX_Permalink.currentMailTo = mailto.join("");
};
EBX_Permalink.sendCurrentMailTo = function () {
  window.location.href = EBX_Permalink.currentMailTo;
};
EBX_Permalink.getCurrentURLWithParameter = function () {
  if (EBX_Permalink.currentParameters === "") {
    return EBX_Permalink.currentURL;
  } else {
    return EBX_Permalink.currentURL + "&" + EBX_Permalink.currentParameters;
  }
};

EBX_Permalink.canCopyToClipboard = function () {
  return false;
  /*YAHOO.env.ua.ie !== 0 || YAHOO.env.ua.gecko !== 0;*/
};

EBX_Permalink.panelContainerId = "ebx_Permalink_c";
EBX_Permalink.panelId = "ebx_Permalink";
EBX_Permalink.panelTitleSubjectId = "ebx_PermalinkTitleSubject";
EBX_Permalink.inputLinkId = "ebx_PermalinkInputLink";
EBX_Permalink.copyToClipboardId = "ebx_PermalinkCopyToClipboard";
EBX_Permalink.sendFromEmailClientId = "ebx_PermalinkSendFromEmailClient";
EBX_Permalink.parametersBlockId = "ebx_PermalinkParametersBlock";
EBX_Permalink.parametersFormId = "ebx_PermalinkParametersForm";
EBX_Permalink.parametersScopesId = "ebx_PermalinkParameterScopes";
EBX_Permalink.applyId = "ebx_PermalinkApply";

EBX_Permalink.expandedCSSClass = "ebx_PermalinkExpanded";
EBX_Permalink.scopeAutoCSSClass = "ebx_PermalinkScopeAutoEnabled";

EBX_Permalink.permalinkPanel = null;
EBX_Permalink.buildPermalinkPanel = function () {
  EBX_Permalink.yuiDataSource = new YAHOO.util.XHRDataSource();
  EBX_Permalink.yuiDataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
  EBX_Permalink.yuiDataSource.responseSchema = {
    resultsList: "innerHTML",
    metaFields: {
      scriptToExecute: "ebx_scriptToExecute"
    }
  };
  EBX_Permalink.yuiDataSource.sendRequest(EBX_Permalink.panelContentRequest, {
    success: EBX_Permalink.buildPermalinkFromAjaxResponse,
    failure: EBX_Permalink.buildPermalinkFromAjaxFailure
  });
};
EBX_Permalink.buildPermalinkFromAjaxResponse = function (oRequest, oParsedResponse, argument) {

  EBX_Permalink.permalinkPanel = new YAHOO.widget.Panel(EBX_Permalink.panelId, {
    close: true,
    draggable: false,
    modal: true,
    visible: false,
    fixedcenter: true
  });

  EBX_Permalink.permalinkPanel.setBody(oParsedResponse.results[0]);

  EBX_Permalink.permalinkPanel.render(document.body);

  if (EBX_Permalink.canCopyToClipboard() === false) {
    document.getElementById(EBX_Permalink.copyToClipboardId).style.display = "none";
  }

  YAHOO.util.Event.on(EBX_Permalink.panelId + "_mask", "click", function () {
    EBX_Permalink.permalinkPanel.hide();
  });

  window.setTimeout(oParsedResponse.meta.scriptToExecute, 0);

  EBX_Permalink.displayCurrentPermalink();
};
EBX_Permalink.buildPermalinkFromAjaxFailure = function (oRequest, oParsedResponse, argument) {
  if (oParsedResponse.status == 401) {
    EBX_Loader.gotoTimeoutPage();
  }
};

EBX_Permalink.copyToClipboard = function () {
  // Works with IE and Firefox, but with big warnings
  // Thanks to:
  // http://almaer.com/blog/supporting-the-system-clipboard-in-your-web-applications-what-a-pain
  // http://www.dynamic-tools.net/toolbox/copyToClipboard/

  var textTocopy = EBX_Permalink.getCurrentURLWithParameter();

  if (window.clipboardData && clipboardData.setData) {
    clipboardData.setData("Text", textTocopy);
  } else {
    try {
      if (netscape.security.PrivilegeManager.enablePrivilege) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
      } else {
        clipdata = textTocopy;
        return;
      }
    } catch (ex) {
      clipdata = textTocopy;
      return;
    }

    var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(
        Components.interfaces.nsISupportsString);
    str.data = textTocopy;

    var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(
        Components.interfaces.nsITransferable);
    if (!trans) {
      return false;
    }

    trans.addDataFlavor("text/unicode");
    trans.setTransferData("text/unicode", str, textTocopy.length * 2);

    var clipid = Components.interfaces.nsIClipboard;
    var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
    if (!clip) {
      return false;
    }

    clip.setData(trans, null, clipid.kGlobalClipboard);

  }
};

EBX_Permalink.panelContainer = null;
EBX_Permalink.getPanelContainer = function () {
  if (EBX_Permalink.panelContainer === null) {
    EBX_Permalink.panelContainer = document.getElementById(EBX_Permalink.panelContainerId);
  }
  return EBX_Permalink.panelContainer;
};

EBX_Permalink.parametersBlockHeight = null;
EBX_Permalink.getParametersBlockHeight = function () {
  if (EBX_Permalink.parametersBlockHeight === null) {
    var height = 0;
    var childEl = EBX_Utils.firstElementChild(document.getElementById(EBX_Permalink.parametersBlockId));
    do {
      height += childEl.offsetHeight;
    } while ((childEl = EBX_Utils.nextElementSibling(childEl)) !== null);
    EBX_Permalink.parametersBlockHeight = height;
  }
  return EBX_Permalink.parametersBlockHeight;
};

EBX_Permalink.expandParametersBlock = function () {
  var panelContainer = EBX_Permalink.getPanelContainer();
  var parametersBlockHeight = EBX_Permalink.getParametersBlockHeight();
  EBX_Utils.addCSSClass(panelContainer, EBX_Permalink.expandedCSSClass);
  panelContainer.style.marginTop = -(parametersBlockHeight / 2) + "px";
  document.getElementById(EBX_Permalink.parametersBlockId).style.height = parametersBlockHeight + "px";
};
EBX_Permalink.collapseParametersBlock = function () {
  var panelContainer = EBX_Permalink.getPanelContainer();
  EBX_Utils.removeCSSClass(panelContainer, EBX_Permalink.expandedCSSClass);
  panelContainer.style.marginTop = "";
  document.getElementById(EBX_Permalink.parametersBlockId).style.height = "";
};

EBX_Permalink.parametersForm = null;
EBX_Permalink.getPermalinkParametersForm = function () {
  if (EBX_Permalink.parametersForm === null) {
    EBX_Permalink.parametersForm = document.getElementById(EBX_Permalink.parametersFormId);
  }
  return EBX_Permalink.parametersForm;
};

EBX_Permalink.scopeParameterName = "scope";
EBX_Permalink.autoScopeCkbListener = function (checkboxEl) {
  if (checkboxEl.checked) {
    EBX_Utils.addCSSClass(document.getElementById(EBX_Permalink.parametersScopesId), EBX_Permalink.scopeAutoCSSClass);
  } else {
    EBX_Utils.removeCSSClass(document.getElementById(EBX_Permalink.parametersScopesId),
        EBX_Permalink.scopeAutoCSSClass);
  }

  var paramForm = EBX_Permalink.getPermalinkParametersForm();

  var checkedOnce = false;

  for (var i = 0, len = paramForm.elements.length; i < len; i++) {
    field = paramForm.elements[i];
    if (field.name === EBX_Permalink.scopeParameterName) {
      if (checkboxEl.checked) {
        field.disabled = true;
        field.checked = false;
      } else {
        if (!checkedOnce) {
          field.checked = true;
          checkedOnce = true;
        }
        field.disabled = false;
      }
      field.disabled = checkboxEl.checked;
    }
  }
  EBX_Permalink.updateApplyButton();
};

EBX_Permalink.applyParametersButton = null;
EBX_Permalink.getApplyParametersButton = function () {
  if (EBX_Permalink.applyParametersButton === null) {
    EBX_Permalink.applyParametersButton = document.getElementById(EBX_Permalink.applyId);
  }
  return EBX_Permalink.applyParametersButton;
};

EBX_Permalink.updateApplyButton = function () {
  var applyButton = EBX_Permalink.getApplyParametersButton();
  var parameters = EBX_Form.serialize(EBX_Permalink.getPermalinkParametersForm(), true);
  var areParametersIdentical = (parameters == EBX_Permalink.currentParameters);

  EBX_ButtonUtils.setButtonDisabled(applyButton, areParametersIdentical);
  if (areParametersIdentical) {
    EBX_Utils.removeCSSClass(applyButton, EBX_ButtonUtils.defaultButtonCSSClass);
  } else {
    EBX_Utils.addCSSClass(applyButton, EBX_ButtonUtils.defaultButtonCSSClass);
  }
};
EBX_Permalink.applyParameters = function () {
  EBX_Permalink.currentParameters = EBX_Form.serialize(EBX_Permalink.getPermalinkParametersForm(), true);
  EBX_Permalink.updateLink();
  EBX_Permalink.updateApplyButton();
  EBX_Form.focus(EBX_Permalink.inputLinkId);
};

/*END EBX_Permalink */

/*START EBX_WAITPAGE */
function EBX_AjaxKeepSessionAliveObject() {
  this.onExecuteIfOK = function (responseXML, root) {
    return true;
  };

  this.onExecuteIfKO = function (responseXML) {

  };

  this.onGetExceptedResponseCode = function (callerId) {
    return this.responseCodeOK_RequestResponse;
  };
}

EBX_AjaxKeepSessionAliveObject.prototype = new EBX_AbstractAjaxResponseManager();

var ebx_keepSessionAjax = new EBX_AjaxKeepSessionAliveObject();

function ebx_keepSessionAliveAjax() {
  ebx_keepSessionAjax.onExecute(EBX_Constants.getRequestLink(EBX_Constants.ajaxKeepSessionEvent));
  window.setTimeout('ebx_keepSessionAliveAjax();', EBX_Wait_KeepSessionAliveAjaxInterval);
}

var EBX_WAIT_REQUEST_TO_PROCESS = "";

function ebx_autoStart() {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_wait_page_request, EBX_Loader.states.processing);
  if (EBX_WAIT_REQUEST_TO_PROCESS != null && EBX_WAIT_REQUEST_TO_PROCESS != "") {
    self.location.href = EBX_WAIT_REQUEST_TO_PROCESS;
  }

  window.document.body.style.cursor = "wait";

  if (EBX_Wait_KeepSessionAliveAjaxInterval > 0) {
    ebx_keepSessionAliveAjax();
  }

  EBX_Loader.changeTaskState(EBX_Loader_taskId_wait_page_request, EBX_Loader.states.done);
}

/*END EBX_WAITPAGE */

/*START Input Text Wizard */

EBX_InputTextWizard = function () {
};

EBX_InputTextWizard.maskId = "ebx_InputTextWizardMask";
EBX_InputTextWizard.getMask = function () {
  var inputTextWizardMask = document.getElementById(EBX_InputTextWizard.maskId);

  if (inputTextWizardMask === null) {
    inputTextWizardMask = document.createElement("div");
    inputTextWizardMask.id = EBX_InputTextWizard.maskId;
    inputTextWizardMask.style.display = "none";

    YAHOO.util.Event.addListener(inputTextWizardMask, "click", EBX_InputTextWizard.hide);
  }

  return inputTextWizardMask;
};

// These variables are defined with the same name in the JBSWizardPropertyDeclarationHelper class.
EBX_InputTextWizard.paneSuffix = "_wizardsPane";
EBX_InputTextWizard.toggleButtonSuffix = "_toggleButtonWizard";
EBX_InputTextWizard.wizardContentSuffix = "_wizard";

EBX_InputTextWizard.panelId = "ebx_InputTextWizard";
EBX_InputTextWizard.yuiPanel = null;
EBX_InputTextWizard.getPanel = function () {
  if (EBX_InputTextWizard.yuiPanel === null) {
    EBX_InputTextWizard.yuiPanel = new YAHOO.widget.Overlay(EBX_InputTextWizard.panelId, {
      constraintoviewport: true,
      visible: false
    });
    EBX_InputTextWizard.yuiPanel.render(document.body);
    EBX_InputTextWizard.yuiPanel.showEvent.subscribe(EBX_InputTextWizard.showListener);
    EBX_InputTextWizard.yuiPanel.hideEvent.subscribe(EBX_InputTextWizard.hideListener);
  }
  return EBX_InputTextWizard.yuiPanel;
};

EBX_InputTextWizard.currentInputTextId = null;

EBX_InputTextWizard.showListener = function () {
  // toggle button state
  var buttonId = EBX_InputTextWizard.currentInputTextId + EBX_InputTextWizard.toggleButtonSuffix;
  EBX_ButtonUtils.setStateToToggleButton(document.getElementById(buttonId), true);

  // mask state
  var inputTextWizardMask = EBX_InputTextWizard.getMask();
  EBX_InputTextWizard.getPanel().element.parentNode.appendChild(inputTextWizardMask);
  inputTextWizardMask.style.display = "";

  // dummy input
  EBX_InputTextWizard.buildFeedAndPlaceDummyInput();
};
EBX_InputTextWizard.hideListener = function () {
  // toggle button state
  var buttonId = EBX_InputTextWizard.currentInputTextId + EBX_InputTextWizard.toggleButtonSuffix;
  EBX_ButtonUtils.setStateToToggleButton(document.getElementById(buttonId), false);

  // mask state
  EBX_InputTextWizard.getMask().style.display = "none";

  // dummy input
  EBX_InputTextWizard.feedInputAndHideDummyInput();
};

EBX_InputTextWizard.show = function (inputTextId, forceRefresh) {

  var refresh = EBX_InputTextWizard.currentInputTextId != inputTextId || forceRefresh;

  EBX_InputTextWizard.currentInputTextId = inputTextId;

  var yuiPanel = EBX_InputTextWizard.getPanel();

  var wizardsPane;
  var wizardsPaneClone = null;

  if (refresh) {
    wizardsPane = document.getElementById(EBX_InputTextWizard.currentInputTextId + EBX_InputTextWizard.paneSuffix);

    wizardsPaneClone = wizardsPane.cloneNode(true);

    yuiPanel.setBody(wizardsPaneClone);
    yuiPanel.cfg.setProperty('context', [EBX_InputTextWizard.currentInputTextId, 'tl', 'bl']);
  }

  yuiPanel.show();

  if (refresh) {
    // build yui trees inside cloned textWizard
    var wizardTreePaneParents = EBX_Utils.getRecursiveChildrenMatchingCSSClass(wizardsPaneClone, "ebx_wizardTreePane");
    for (var i = 0; i < wizardTreePaneParents.length; i++) {
      var wizardTreePaneParent = wizardTreePaneParents[i];
      var wizardTreePane = EBX_Utils.getFirstDirectChildMatchingTagName(wizardTreePaneParent, "div");
      ebx_initYUITree(wizardTreePane);
    }
  }
};

EBX_InputTextWizard.hide = function () {
  EBX_InputTextWizard.getPanel().hide();
};

EBX_InputTextWizard.dummyInputTextId = "ebx_InputTextWizard_DummyInputText";
EBX_InputTextWizard.dummyInput = null;
EBX_InputTextWizard.getDummyInput = function () {
  if (EBX_InputTextWizard.dummyInput === null) {
    var dummyInputText = document.createElement("INPUT");
    dummyInputText.type = "text";
    dummyInputText.id = EBX_InputTextWizard.dummyInputTextId;
    EBX_InputTextWizard.dummyInput = new YAHOO.widget.Overlay(dummyInputText, {
      visible: false
    });
    EBX_InputTextWizard.dummyInput.render(document.body);
  }
  return EBX_InputTextWizard.dummyInput;
};

EBX_InputTextWizard.buildFeedAndPlaceDummyInput = function () {
  var dummyInput = EBX_InputTextWizard.getDummyInput();

  var dummyInputText = document.getElementById(EBX_InputTextWizard.dummyInputTextId);
  var currentInputText = document.getElementById(EBX_InputTextWizard.currentInputTextId);
  dummyInputText.value = currentInputText.value;
  if (currentInputText.style.width) {
    dummyInputText.style.width = currentInputText.style.width;
  } else {
    dummyInputText.style.width = currentInputText.offsetWidth + "px";
  }

  if (EBX_LayoutManager.browser.toLowerCase() === "firefox" && EBX_LayoutManager.browserMajorVersion < 29) {
    dummyInputText.style.MozBoxSizing = "border-box";
  } else {
    dummyInputText.style.boxSizing = "border-box";
  }

  dummyInput.cfg.setProperty('context', [EBX_InputTextWizard.currentInputTextId, 'tl', 'tl']);

  dummyInput.show();
};
EBX_InputTextWizard.feedInputAndHideDummyInput = function () {
  var currentInputText = document.getElementById(EBX_InputTextWizard.currentInputTextId);
  currentInputText.value = document.getElementById(EBX_InputTextWizard.dummyInputTextId).value;

  EBX_InputTextWizard.getDummyInput().hide();

  currentInputText.focus();
};

EBX_InputTextWizard.previousWizardSelected_byInputTextId = [];

EBX_InputTextWizard.displayContent = function (inputTextId, wizardNumber) {
  var idWizard = inputTextId + EBX_InputTextWizard.wizardContentSuffix + wizardNumber;
  if (idWizard == EBX_InputTextWizard.previousWizardSelected_byInputTextId[inputTextId]) {
    return;
  }
  document.getElementById(idWizard).style.display = "";
  if (document.getElementById(EBX_InputTextWizard.previousWizardSelected_byInputTextId[inputTextId]) !== null) {
    document.getElementById(
        EBX_InputTextWizard.previousWizardSelected_byInputTextId[inputTextId]).style.display = "none";
  }
  EBX_InputTextWizard.previousWizardSelected_byInputTextId[inputTextId] = idWizard;
};

EBX_InputTextWizard.insertValueFromSelect = function (select, inputTextId, insertionMode) {
  var selectedOption = select.options[select.selectedIndex];
  if (selectedOption.value === "") {
    return;
  }
  if (insertionMode) {
    EBX_Form.insertTextAtCursorPosition(document.getElementById(EBX_InputTextWizard.dummyInputTextId),
        selectedOption.value);
    select.selectedIndex = 0;
    return;
  }
  document.getElementById(EBX_InputTextWizard.dummyInputTextId).value = selectedOption.value;
  select.selectedIndex = 0;
  EBX_InputTextWizard.hide();
};

EBX_InputTextWizard.initSelection_forWizardsPane = function (inputTextId) {
  var idFirstWizard = inputTextId + EBX_InputTextWizard.wizardContentSuffix + "0";
  EBX_InputTextWizard.previousWizardSelected_byInputTextId[inputTextId] = idFirstWizard;
};

EBX_InputTextWizard.insertValueFromTree = function (value, inputTextId, insertionMode, wizardNumber) {
  if (value === "") {
    return;
  }
  var divWizard = document.getElementById(inputTextId + EBX_InputTextWizard.wizardContentSuffix + wizardNumber);
  if (insertionMode) {
    EBX_Form.insertTextAtCursorPosition(document.getElementById(EBX_InputTextWizard.dummyInputTextId), value);
  } else {
    document.getElementById(EBX_InputTextWizard.dummyInputTextId).value = value;
    EBX_InputTextWizard.hide();
  }
  divWizard.scrollTop = 0;
};

/*END Input Text Wizard */

function ebx_selectAllCkbName(checkboxName, buttonId) {
  var button = document.getElementById(buttonId);
  if (button === null) {
    return;
  }

  var form = button.form;
  if (form === undefined) {
    return;
  }

  var ckbs = form[checkboxName];
  if (ckbs === undefined) {
    return;
  }

  var i = ckbs.length;
  if (i === undefined) {
    // case inputEls is an element, because there was only one with this name
    ckbs.checked = true;
  } else {
    while (i--) {
      ckbs[i].checked = true;
    }
  }
}

var EBX_CHECKBOX_SELECT_ALL_ID_PREFIX = "ebx_SelectAll_";

function ebx_checkboxSelectAll(checkboxAllEl) {
  var checkboxesName = checkboxAllEl.id.substring(EBX_CHECKBOX_SELECT_ALL_ID_PREFIX.length);

  var inputEls = checkboxAllEl.form.elements[checkboxesName];

  var checked = checkboxAllEl.checked;
  var i = inputEls.length;
  if (i === undefined) {
    // case inputEls is an element, because there was only one with this name
    if (inputEls.type === "checkbox") {
      inputEls.checked = checked;
    }
  } else {
    while (i--) {
      var inputEl = inputEls[i];
      if (inputEl.type === "checkbox") {
        inputEl.checked = checked;
      }
    }
  }
}

function ebx_checkboxRefreshSelectAll(checkboxEl) {
  var selectAllCheckbox = document.getElementById(EBX_CHECKBOX_SELECT_ALL_ID_PREFIX + checkboxEl.name);

  if (selectAllCheckbox === null) {
    EBX_Logger.log("Unable to found the checkbox selectAll of checkbox id: " + checkboxEl.id, EBX_Logger.error);
    return;
  }

  // optimisation: in one case on two, the checkbox clicked is
  //  not checked, so the selectAllCheckbox must be unchecked
  if (checkboxEl.checked === false) {
    selectAllCheckbox.checked = false;
    return;
  }

  var inputEls = checkboxEl.form.elements[checkboxEl.name];

  var allAreChecked = true;

  var i = inputEls.length;
  if (i === undefined) {
    // case inputEls is an element, because there was only one with this name
    if (inputEls.type === "checkbox" && inputEls.checked === false) {
      allAreChecked = false;
    }
  } else {
    while (i--) {
      var inputEl = inputEls[i];
      if (inputEl.type === "checkbox" && inputEl.checked === false) {
        allAreChecked = false;
        break;
      }
    }
  }

  selectAllCheckbox.checked = allAreChecked;
}

var EBX_CHECKBOX_MARK_FOR_PURGE_BRANCH_ID_PREFIX = "ebx_branch_";
var EBX_CHECKBOX_MARK_FOR_PURGE_CHILD_CSS_CLASS_PREFIX = "ebx_childOf_";

function ebx_checkboxMarkForPurge(checkboxEl) {

  ebx_checkboxMarkForPurgeAllChildren(checkboxEl);

  ebx_checkboxMarkForPurgeRefreshParent(checkboxEl);
}

function ebx_checkboxMarkForPurgeAllChildren(checkboxEl) {

  // do not unselect children
  if (checkboxEl.checked === false) {
    return;
  }

  var childrenAllDescendants = ebx_checkboxMarkForPurgeGetChildrenAllDescendants(checkboxEl);

  var i = childrenAllDescendants.length;
  while (i--) {
    var child = childrenAllDescendants[i];
    child.checked = checkboxEl.checked;
  }
}

function ebx_checkboxMarkForPurgeRefreshParent(checkboxEl) {
  var parentId = EBX_CHECKBOX_MARK_FOR_PURGE_BRANCH_ID_PREFIX + checkboxEl.className.substr(
      EBX_CHECKBOX_MARK_FOR_PURGE_CHILD_CSS_CLASS_PREFIX.length);
  var parentEl = document.getElementById(parentId);
  if (parentEl === null) {
    return;
  }

  if (checkboxEl.checked === false) {
    parentEl.checked = false;
    ebx_checkboxMarkForPurgeRefreshParent(parentEl);

  }

  // do not check parent
  //var childrenOfParent = ebx_checkboxMarkForPurgeGetChildren(parentEl);
  //
  //var allAreChecked = true;
  //
  //var i = childrenOfParent.length;
  //while (i--) {
  //    var child = childrenOfParent[i];
  //    if (child.checked === false) {
  //        allAreChecked = false;
  //        break;
  //    }
  //}
  //
  //parentEl.checked = allAreChecked;
  //ebx_checkboxMarkForPurgeRefreshParent(parentEl);
}

function ebx_checkboxMarkForPurgeGetChildren(checkboxEl) {
  if (checkboxEl.ebx_children === undefined) {
    var checkboxes = checkboxEl.form.elements[checkboxEl.name];

    var currentBranchId = checkboxEl.id.substr(EBX_CHECKBOX_MARK_FOR_PURGE_BRANCH_ID_PREFIX.length);

    var children = [];

    var i = checkboxes.length;
    while (i--) {
      var checkbox = checkboxes[i];
      if (checkbox.className === EBX_CHECKBOX_MARK_FOR_PURGE_CHILD_CSS_CLASS_PREFIX + currentBranchId) {
        children.push(checkbox);
      }
    }

    checkboxEl.ebx_children = children;
  }

  return checkboxEl.ebx_children;
}

function ebx_checkboxMarkForPurgeGetChildrenAllDescendants(checkboxEl) {
  var children = ebx_checkboxMarkForPurgeGetChildren(checkboxEl);

  var ret = children;

  var i = children.length;
  while (i--) {
    var child = children[i];
    var subChildren = ebx_checkboxMarkForPurgeGetChildrenAllDescendants(child);

    var j = subChildren.length;
    while (j--) {
      var subChild = subChildren[j];
      ret.push(subChild);
    }
  }

  return ret;
}

function ebx_initYUITree(treeIdOrElement) {
  var tree = new YAHOO.widget.TreeView(treeIdOrElement);
  tree.subscribe("clickEvent", EBX_Utils.returnFalse);
  tree.render();
}

/* START Filter Pane */
function ebx_initFilter() {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_workspace_filters, EBX_Loader.states.processing);

  // restore displaying
  EBX_LayoutManager.restoreFilterSize();

  EBX_Loader.changeTaskState(EBX_Loader_taskId_workspace_filters, EBX_Loader.states.done);
}

function ebx_displayFilterPane() {
  EBX_LayoutManager.workspaceLayout.getUnitByPosition(EBX_LayoutManager.workspaceUnits.filters.position).expand();
  EBX_LayoutManager.workspaceLayout.resize();
  EBX_LayoutManager.addCSSClassFilterPresent();
}

function ebx_hideFilterPane() {
  EBX_LayoutManager.workspaceLayout.getUnitByPosition(EBX_LayoutManager.workspaceUnits.filters.position).collapse();
  EBX_LayoutManager.removeCSSClassFilterPresent();
}

EBX_LayoutManager.FilterPresentCSSClass = "ebx_FilterPresent";
EBX_LayoutManager.addCSSClassFilterPresent = function () {
  EBX_Utils.addCSSClass(EBX_LayoutManager.WorkspaceContentEl, EBX_LayoutManager.FilterPresentCSSClass);
};
EBX_LayoutManager.removeCSSClassFilterPresent = function () {
  EBX_Utils.removeCSSClass(EBX_LayoutManager.WorkspaceContentEl, EBX_LayoutManager.FilterPresentCSSClass);
};

EBX_LayoutManager.saveFilterDisplayedYUIDataSource = null;
EBX_LayoutManager.saveFilterSizeYUIDataSource = null;
EBX_LayoutManager.saveFilterSize = function () {
  var filterWidth = EBX_LayoutManager.workspaceLayout.getUnitByPosition(
      EBX_LayoutManager.workspaceUnits.filters.position).get('width');
  filterWidth = Math.round(filterWidth);

  if (EBX_LayoutManager.saveFilterDisplayedYUIDataSource === null) {
    EBX_LayoutManager.saveFilterDisplayedYUIDataSource = new YAHOO.util.XHRDataSource(
        EBX_LayoutManager.filterPanelDisplayedRequest);
  }

  if (filterWidth <= 0) {
    EBX_LayoutManager.saveFilterDisplayedYUIDataSource.sendRequest(EBX_LayoutManager.displayedParameter + "false",
        null);
  } else {
    if (EBX_LayoutManager.saveFilterSizeYUIDataSource === null) {
      EBX_LayoutManager.saveFilterSizeYUIDataSource = new YAHOO.util.XHRDataSource(
          EBX_LayoutManager.filterPanelWidthRequest);
    }

    EBX_LayoutManager.saveFilterSizeYUIDataSource.sendRequest(EBX_LayoutManager.widthParameter + filterWidth, null);

    EBX_LayoutManager.saveFilterDisplayedYUIDataSource.sendRequest(EBX_LayoutManager.displayedParameter + "true", null);
  }
};

EBX_LayoutManager.isFiltersPaneDisplayed = false;
EBX_LayoutManager.restoreFilterSize = function () {
  if (EBX_LayoutManager.isFiltersPaneDisplayed && EBX_Utils.isFilterKeptOpen) {
    ebx_displayFilterPane();
  } else {
    ebx_hideFilterPane();
  }
};

var ebx_setFilterOpened_yuiDataSource = null;

function ebx_tableFilter_sendFilterIsOpened(filterIndex, isOpened) {
  if (ebx_setFilterOpened_yuiDataSource === null) {
    ebx_setFilterOpened_yuiDataSource = new YAHOO.util.XHRDataSource(EBX_Constants.table_filter_setOpened);
  }
  ebx_setFilterOpened_yuiDataSource.sendRequest(EBX_Constants.filterIndex + filterIndex + EBX_Constants.isOpened
      + isOpened, null);
}

var ebx_tableFilter_keepOpen_dataSource = null;
EBX_Utils.isFilterKeptOpen = true;

function ebx_tableFilter_sendFilterKeptOpen() {
  if (ebx_tableFilter_keepOpen_dataSource === null) {
    ebx_tableFilter_keepOpen_dataSource = new YAHOO.util.XHRDataSource(EBX_Constants.table_filter_setKeepOpen);
  }

  EBX_Utils.isFilterKeptOpen = !EBX_Utils.isFilterKeptOpen;

  EBX_ButtonUtils.setMenuItemChecked(this.parent.ebx_ElementToRelease.id, "ebx_KeepFilterOpenMenuAction",
      EBX_Utils.isFilterKeptOpen);

  ebx_tableFilter_keepOpen_dataSource.sendRequest(EBX_Constants.isKeptOpened + EBX_Utils.isFilterKeptOpen, null);
}

function ebx_tableFilter_expand(contentId, filterIndex) {
  document.getElementById(contentId).style.display = "";
  ebx_tableFilter_sendFilterIsOpened(filterIndex, true);
}

function ebx_tableFilter_collapse(contentId, filterIndex) {
  document.getElementById(contentId).style.display = "none";
  ebx_tableFilter_sendFilterIsOpened(filterIndex, false);
}

function ebx_tableFilter_sendFormByCheckbox(checkboxEl, submitValue, submitName) {
  if (EBX_LayoutManager.isIE) {
    EBX_Form.initSubmitNamesForIE(checkboxEl.form);
  }
  EBX_Form.setSubmitValue(checkboxEl.form, submitValue, submitName);
  checkboxEl.form.submit();
}

function ebx_tableFilter_applyByQuickFilterAccess(filterFormId, submitValue, submitName) {
  var filterForm = document.getElementById(filterFormId);

  if (EBX_LayoutManager.isIE) {
    EBX_Form.initSubmitNamesForIE(filterForm);
  }
  EBX_Form.setSubmitValue(filterForm, submitValue, submitName);
  filterForm.submit();
}


/* END Filter Pane */

/* START WSDL Downloader */
var EBX_HIDDEN_DIV_DOWNLOAD_ID = "ebx_WSDLDownload";

function ebx_getWSDLDownloadDiv() {
  var downloadDiv = document.getElementById(EBX_HIDDEN_DIV_DOWNLOAD_ID);
  if (downloadDiv === null) {
    downloadDiv = document.createElement("div");
    downloadDiv.id = EBX_HIDDEN_DIV_DOWNLOAD_ID;
    downloadDiv.style.display = "none";

    document.getElementsByTagName("body")[0].appendChild(downloadDiv);
  }
  return downloadDiv;
}

function ebx_getBaseUrlForWSDLConnector() {
  var url = window.location.href;
  var pos = url.indexOf("/ebx", 0);
  return url.substring(0, pos) + '/' + EBX_Constants.WSDLConnector_webapp;
}

function ebx_startWSDLDownload(downloadURL) {
  var downloadDiv = ebx_getWSDLDownloadDiv();
  downloadDiv.innerHTML = "<iframe src='" + downloadURL + ebx_getBaseUrlForWSDLConnector() + "'></iframe>";
}

/* END WSDL Downloader */

/* START Comparator */
EBX_COMPARATOR_SELECT_ALL_CHECKBOX_ID = "ebx_ComparatorDecisionCheckboxAll";
EBX_COMPARATOR_CHECKBOX_CSS_CLASS = "ebx_ComparatorDecisionCheckbox";
ebx_comparatorSelectAll = function (checkboxAllEl) {
  var comparatorTable = EBX_Utils.getFirstParentMatchingTagName(checkboxAllEl, "TABLE");
  var checkboxEls = EBX_Utils.getRecursiveChildrenMatchingCSSClass(comparatorTable, EBX_COMPARATOR_CHECKBOX_CSS_CLASS);

  var checked = checkboxAllEl.checked;
  var i = checkboxEls.length;
  while (i--) {
    checkboxEls[i].checked = checked;
  }
};
ebx_comparatorRefreshSelectAll = function (checkboxEl) {
  var comparatorTable = EBX_Utils.getFirstParentMatchingTagName(checkboxEl, "TABLE");

  var checkboxAllEl = document.getElementById(EBX_COMPARATOR_SELECT_ALL_CHECKBOX_ID);

  if (checkboxAllEl === null) {
    return;
  }

  var checkboxEls = EBX_Utils.getRecursiveChildrenMatchingCSSClass(comparatorTable, EBX_COMPARATOR_CHECKBOX_CSS_CLASS);

  var allAreChecked = true;

  var i = checkboxEls.length;
  while (i--) {
    if (checkboxEls[i].checked === false) {
      allAreChecked = false;
      break;
    }
  }

  checkboxAllEl.checked = allAreChecked;

  // refresh "Mark as reviewed" button
  var buttonMarkAsDecided = document.getElementById("ebx_MarkAsDecided");
  if (buttonMarkAsDecided !== null) {
    var formHasBeenModified = EBX_Form.hasBeenModified(document.getElementById(EBX_Form.WorkspaceFormId));
    if (formHasBeenModified === true) {
      EBX_Utils.addCSSClass(buttonMarkAsDecided, EBX_ButtonUtils.defaultButtonCSSClass);
    } else {
      EBX_Utils.removeCSSClass(buttonMarkAsDecided, EBX_ButtonUtils.defaultButtonCSSClass);
    }
  }
};
/* END Comparator */

/*START AJAX wizard */
function EBX_AJAXWizard() {
}

// Display a static wizard
EBX_AJAXWizard.displayWizard = function (targetInputTextId, url, buttonId) {
  var button = document.getElementById(buttonId);

  ebx_buttonUtils_setButtonWaitingMode(button, true);

  button.blur();

  var wizardManager = new EBX_AjaxWizardResponseManager(targetInputTextId);
  wizardManager.onExecute(url);
  wizardManager.buttonWizard = button;
};

// Display the ajax response
EBX_AjaxWizardResponseManager = function (targetInputTextId) {
  //Method which manage response document if the response code is the one expected.
  //Must return true if all happens as expected, false otherwise.
  this.onExecuteIfOK = function (responseXML, root) {
    var bodyElement = root.getElementsByTagName('responseBody')[0];
    if (!bodyElement.firstChild) {
      EBX_Logger.log("Error getting responseBody from response: " + this.getResponseText(), EBX_Logger.error);
      return false;
    }
    var wizardContent = bodyElement.firstChild.data;
    EBX_AJAXWizard.displayWizardFromAjaxResponse(wizardContent, targetInputTextId);
    ebx_buttonUtils_setButtonWaitingMode(this.buttonWizard, false);
    return true;
  };

  // Method which manage response document if the response code is not the one expected.
  this.onExecuteIfKO = function (responseXML) {
    ebx_buttonUtils_setButtonWaitingMode(this.buttonWizard, false);
    return false;
  };
};
EBX_AjaxWizardResponseManager.prototype = new EBX_AbstractAjaxResponseManager();

EBX_AJAXWizard.displayWizardFromAjaxResponse = function (responseContent, targetInputTextId) {
  var wizard = document.getElementById(targetInputTextId + "_wizardsPane");
  // Refresh content from existing wizard
  if (wizard) {
    wizard.parentNode.innerHTML = responseContent;
    EBX_InputTextWizard.show(targetInputTextId, true);
    return;
  }

  var limbo = EBX_LayoutManager.getLimbo();
  var tmpDiv = document.createElement("div");
  limbo.appendChild(tmpDiv);
  tmpDiv.innerHTML = responseContent;
  EBX_InputTextWizard.show(targetInputTextId);
  limbo.removeChild(tmpDiv);
};
/*END Ajax wizard */

/*START Ajax Predicate Editor Updater */
function EBX_PredicateEditor() {
}

EBX_PredicateEditor.treeDivId = ""; //Set by server
EBX_PredicateEditor.treeDivIsMovingClassName = ""; //Set by server

EBX_PredicateEditor.modifyPredicate = function (treeName, url) {
  var ajaxTree = ebx_getAjaxTree(treeName);
  if (ajaxTree === null) {
    return;
  }
  var updater = new EBX_AjaxPredicateEditorUpdater(ajaxTree);

  updater.onExecute(url);
};

EBX_PredicateEditor.startMoving = function () {
  var tree = document.getElementById(EBX_PredicateEditor.treeDivId);
  if (tree) {
    tree.classList.add(EBX_PredicateEditor.treeDivIsMovingClassName);
  }
};

EBX_PredicateEditor.endMoving = function () {
  var tree = document.getElementById(EBX_PredicateEditor.treeDivId);
  if (tree) {
    tree.classList.remove(EBX_PredicateEditor.treeDivIsMovingClassName);
  }
};

// Display the ajax response
EBX_AjaxPredicateEditorUpdater = function (ajaxTree) {
  this.ajaxTree = ajaxTree;

  //Method which manage response document if the response code is the one expected.
  //Must return true if all happens as expected, false otherwise.
  this.onExecuteIfOK = function (responseXML, root) {
    ajaxTree.rebuild(null);
    return true;
  };

  // Method which manage response document if the response code is not the one expected.
  this.onExecuteIfKO = function (responseXML) {
    return false;
  };
};
EBX_AjaxPredicateEditorUpdater.prototype = new EBX_AbstractAjaxResponseManager();
/*END Ajax Predicate Editor Updater */

/*START Ajax History tools */

ebx_historyTools_viewHistoryForSelectedRecords = function (url) {
  var ajaxRequest = new EBX_AjaxHistoryForSelectedRecords();

  ajaxRequest.onExecute(url);
};
// Display the ajax response
EBX_AjaxHistoryForSelectedRecords = function () {

  this.onGetExceptedResponseCode = function (callerId) {
    return this.responseCodeOK_JSONDoc;
  };

  //Method which manage response document if the response code is the one expected.
  //Must return true if all happens as expected, false otherwise.
  this.onExecuteIfOK = function (responseXML, root) {
    var bodyElement = root.getElementsByTagName('responseBody')[0];
    if (!bodyElement.firstChild) {
      EBX_Logger.log("EBX_AjaxHistoryForSelectedRecords.onExecuteIfOK: Error getting responseBody from response: "
          + this.getResponseText(),
          EBX_Logger.error);
      return false;
    }
    var jsonString = bodyElement.firstChild.data;
    var jsonObj = YAHOO.lang.JSON.parse(jsonString);
    if (!jsonObj) {
      EBX_Logger.log("EBX_AjaxHistoryForSelectedRecords.onExecuteIfOK: Error getting JSON from response: "
          + this.getResponseText(),
          EBX_Logger.error);
      return false;
    }

    EBX_Utils.openInternalPopupLargeSizeHostedClose(jsonObj.URL);
    return true;
  };

  // Method which manage response document if the response code is not the one expected.
  this.onExecuteIfKO = function (responseXML) {
    return false;
  };
};
EBX_AjaxHistoryForSelectedRecords.prototype = new EBX_AbstractAjaxResponseManager();
/*END Ajax History tools */

/*START See more component */

function EBX_SeeMore() {

}

EBX_SeeMore.yuiPanel = null;
EBX_SeeMore.panelId = "ebx_SeeMore_Panel";
EBX_SeeMore.getDocumentationPanel = function () {
  if (EBX_SeeMore.yuiPanel === null) {
    EBX_SeeMore.yuiPanel = new YAHOO.widget.Overlay(EBX_SeeMore.panelId, {
      constraintoviewport: true,
      visible: false
    });
    EBX_SeeMore.yuiPanel.render(document.body);

    YAHOO.util.Event.addListener(EBX_SeeMore.yuiPanel.element, "mouseout", EBX_SeeMore.hidePane, null, null);
  }
  return EBX_SeeMore.yuiPanel;
};

EBX_SeeMore.displayPane = function (text, buttonId) {
  var panel = EBX_SeeMore.getDocumentationPanel();

  panel.setBody(text);

  var buttonEl = document.getElementById(buttonId);
  var contextTableRefContainer = EBX_Utils.getFirstParentMatchingCSSClass(buttonEl, "ebx_OpenTableRefContainerInTable");

  panel.body.style.width = contextTableRefContainer.offsetWidth + "px";

  panel.cfg.setProperty('context', [contextTableRefContainer, 'tl', 'tl', null, [-3, -2]]);

  panel.show();

  document.getElementById(buttonId).blur();
};

EBX_SeeMore.hidePane = function () {
  EBX_SeeMore.yuiPanel.hide();
};

/*END See more component */

/*START Color picker */

function EBX_ColorPicker() {

}

EBX_ColorPicker.yuiPanel = null;
EBX_ColorPicker.panelId = "ebx_ColorPicker_Panel";
EBX_ColorPicker.yuiPicker = null;

EBX_ColorPicker.currentToggleButton = null;
EBX_ColorPicker.currentFnUpdateColor = null;

EBX_ColorPicker.currentWidgetPath = null;
EBX_ColorPicker.currentWidgetPreviewEl = null;
EBX_ColorPicker.currentWidgetCustomPreviewEvent = null;

EBX_ColorPicker.maskId = "ebx_ColorPickerMask";
EBX_ColorPicker.getMask = function () {
  var colorPickerMask = document.getElementById(EBX_ColorPicker.maskId);

  if (colorPickerMask === null) {
    colorPickerMask = document.createElement("div");
    colorPickerMask.id = EBX_ColorPicker.maskId;
    colorPickerMask.style.display = "none";

    YAHOO.util.Event.addListener(colorPickerMask, "click", EBX_ColorPicker.hide);
  }

  return colorPickerMask;
};

EBX_ColorPicker.getPanel = function () {
  if (EBX_ColorPicker.yuiPanel === null) {
    EBX_ColorPicker.yuiPanel = new YAHOO.widget.Overlay(EBX_ColorPicker.panelId, {
      constraintoviewport: true,
      visible: false
    });
    EBX_ColorPicker.yuiPanel.render(document.body);
    EBX_ColorPicker.yuiPanel.setBody("");

    EBX_ColorPicker.yuiPicker = new YAHOO.widget.ColorPicker(EBX_ColorPicker.yuiPanel.body, {
      showcontrols: false,
      images: {
        PICKER_THUMB: "",
        HUE_THUMB: ""
      }
    });
    YAHOO.util.Event.addListener(EBX_ColorPicker.yuiPanel.body, "click", function (event) {
      YAHOO.util.Event.stopEvent(event);
    });

    EBX_ColorPicker.yuiPicker.addListener("rgbChange", EBX_ColorPicker.updateColor);
  }
  return EBX_ColorPicker.yuiPanel;
};

EBX_ColorPicker.updateColor = function (p_oEvent) {
  if (typeof EBX_ColorPicker.currentFnUpdateColor === "function") {
    EBX_ColorPicker.currentFnUpdateColor.call(this, "#" + EBX_ColorPicker.yuiPicker.get("hex"));
  }
};

/* argsObj structure: (all are optionnal)
 * initialColor: String HTML hexa color well formatted 6 digits "#123456"
 * toggleButtonId: String button id
 * fnUpdateColor: Function declaration
 * fnCommitColor: Function declaration
 * context: String id or HTML Element (default is toggleButton parent node)
 */
EBX_ColorPicker.display = function (argsObj) {
  if (EBX_ColorPicker.currentToggleButton !== null) {
    EBX_ColorPicker.hide();
  }

  if (argsObj.toggleButtonId !== undefined) {
    EBX_ColorPicker.currentToggleButton = document.getElementById(argsObj.toggleButtonId);
  }
  EBX_ColorPicker.currentFnUpdateColor = argsObj.fnUpdateColor;
  EBX_ColorPicker.currentFnCommitColor = argsObj.fnCommitColor;

  var panelContext = argsObj.context;
  if (panelContext === undefined && EBX_ColorPicker.currentToggleButton !== null) {
    panelContext = EBX_ColorPicker.currentToggleButton.parentNode;
  }

  var panel = EBX_ColorPicker.getPanel();

  panel.cfg.setProperty('context', [panelContext, 'tl', 'bl', null, [0, 1]]);

  var colorPickerMask = EBX_ColorPicker.getMask();
  panel.element.parentNode.appendChild(colorPickerMask);
  colorPickerMask.style.display = "";

  if (EBX_ColorPicker.isHexColor(argsObj.initialColor)) {
    EBX_ColorPicker.yuiPicker.setValue(YAHOO.util.Color.hex2rgb(argsObj.initialColor.substr(1)), true);
  }

  panel.show();
};

EBX_ColorPicker.hide = function () {
  EBX_ColorPicker.yuiPanel.hide();

  if (EBX_ColorPicker.currentToggleButton !== null) {
    EBX_ButtonUtils.setStateToToggleButton(EBX_ColorPicker.currentToggleButton, false);
  }
  if (typeof EBX_ColorPicker.currentFnCommitColor === "function") {
    EBX_ColorPicker.currentFnCommitColor.call(this, "#" + EBX_ColorPicker.yuiPicker.get("hex"));
  }

  // erase all current variables
  EBX_ColorPicker.currentToggleButton = null;
  EBX_ColorPicker.currentFnUpdateColor = null;
  EBX_ColorPicker.currentFnCommitColor = null;

  EBX_ColorPicker.getMask().style.display = "none";
};

EBX_ColorPicker.commitForCurrentWidget = function (color) {
  ebx_form_setNodeValue(EBX_ColorPicker.currentWidgetPath, color);

  // no more useful as soon as commit function is called (the yui color picker is hidden)
  EBX_ColorPicker.currentWidgetPath = null;
  EBX_ColorPicker.currentWidgetPreviewEl = null;
  EBX_ColorPicker.currentWidgetCustomPreviewEvent = null;
};

EBX_ColorPicker.updatePreviewForCurrentWidget = function (color) {
  EBX_ColorPicker.updatePreviewForWidgetElement(color, EBX_ColorPicker.currentWidgetPreviewEl);

  if (EBX_ColorPicker.currentWidgetCustomPreviewEvent !== null) {
    EBX_FormPresenter.callComponentEvent(EBX_ColorPicker.currentWidgetCustomPreviewEvent, color);
  }
};
EBX_ColorPicker.updatePreviewForWidgetKeyUp = function (color, previewColorId, customPreviewEvent) {
  EBX_ColorPicker.updatePreviewForWidget(color, previewColorId);

  if (EBX_ColorPicker.isHexColor(color) && customPreviewEvent !== null) {
    EBX_FormPresenter.callComponentEvent(customPreviewEvent, color);
  }
};
EBX_ColorPicker.updatePreviewForWidget = function (color, previewColorId) {
  EBX_ColorPicker.updatePreviewForWidgetElement(color, document.getElementById(previewColorId));
};
EBX_ColorPicker.updatePreviewForWidgetElement = function (color, previewElement) {
  if (EBX_ColorPicker.isHexColor(color)) {
    previewElement.style.backgroundColor = color;
  }
};

EBX_ColorPicker.isHexColor = function (color) {
  return (/^#[A-F0-9]{6}$/i.test(color));
};

EBX_ColorPicker.displayFromWidget = function (argsObj) {
  EBX_ColorPicker.currentWidgetPath = argsObj.path;
  EBX_ColorPicker.currentWidgetPreviewEl = document.getElementById(argsObj.previewColorId);
  if (argsObj.customPreviewEvent !== undefined) {
    EBX_ColorPicker.currentWidgetCustomPreviewEvent = argsObj.customPreviewEvent;
  }

  var color = ebx_form_getNodeValue(EBX_ColorPicker.currentWidgetPath);

  EBX_ColorPicker.display({
    initialColor: color,
    toggleButtonId: argsObj.buttonId,
    context: argsObj.context,
    fnUpdateColor: EBX_ColorPicker.updatePreviewForCurrentWidget,
    fnCommitColor: EBX_ColorPicker.commitForCurrentWidget
  });
};

/*END Color picker */

/* JSON structure of argsObj : {
 * 
 *     previewColorId: String
 *     
 *     mainColorPath: String optionnal,
 *     defaultMainColorValue: String optionnal,
 *     
 *     brightnessPath: String optionnal,
 *     defaultBrightnessValue: String optionnal,
 *     
 *     textColorPath: String optionnal,
 *     defaultTextColorValue: String optionnal,
 *     
 *     borderColorPath: String optionnal,
 *     defaultBorderColorValue: String optionnal
 *     
 * }
 */
EBX_COLOR_PICKER_BEAN_EDITOR_PARAMETERS_MAP = {};

EBX_COLOR_PICKER_BEAN_EDITOR_DARK_TEXT_COLOR = "#000000";
EBX_COLOR_PICKER_BEAN_EDITOR_MEDIUM_TEXT_COLOR = "#808080";
EBX_COLOR_PICKER_BEAN_EDITOR_LIGHT_TEXT_COLOR = "#FFFFFF";

EBX_COLOR_PICKER_BEAN_EDITOR_BRIGHTNESS_DARK_VALUE = "0";
EBX_COLOR_PICKER_BEAN_EDITOR_BRIGHTNESS_MEDIUM_VALUE = "50";
EBX_COLOR_PICKER_BEAN_EDITOR_BRIGHTNESS_LIGHT_VALUE = "100";

ebx_colorPickerBeanEditor_updatePreview = function (value, declarationId) {
  var argsObj = EBX_COLOR_PICKER_BEAN_EDITOR_PARAMETERS_MAP[declarationId];

  if (argsObj.mainColorPath !== undefined) {
    ebx_colorPickerBeanEditor_updatePreview_backgroundColor(ebx_form_getNodeValue(argsObj.mainColorPath),
        argsObj.previewColorId);
  }

  if (argsObj.brightnessPath !== undefined) {
    var brightness = ebx_form_getNodeValue(argsObj.brightnessPath);

    var textColor = EBX_COLOR_PICKER_BEAN_EDITOR_DARK_TEXT_COLOR;

    if (brightness == EBX_COLOR_PICKER_BEAN_EDITOR_BRIGHTNESS_LIGHT_VALUE) {
      textColor = EBX_COLOR_PICKER_BEAN_EDITOR_LIGHT_TEXT_COLOR;
    } else if (brightness == EBX_COLOR_PICKER_BEAN_EDITOR_BRIGHTNESS_MEDIUM_VALUE) {
      textColor = EBX_COLOR_PICKER_BEAN_EDITOR_MEDIUM_TEXT_COLOR;
    }

    ebx_colorPickerBeanEditor_updatePreview_textColor(textColor, argsObj.previewColorId);
  }

  if (argsObj.textColorPath !== undefined) {
    ebx_colorPickerBeanEditor_updatePreview_workflowBadgeTextColor(ebx_form_getNodeValue(argsObj.textColorPath),
        argsObj.previewColorId);
  }

  if (argsObj.borderColorPath !== undefined) {
    ebx_colorPickerBeanEditor_updatePreview_borderColor(ebx_form_getNodeValue(argsObj.borderColorPath),
        argsObj.previewColorId);
  }
};

ebx_colorPickerBeanEditor_resetToDefaultValues = function (previewColorId) {
  var argsObj = EBX_COLOR_PICKER_BEAN_EDITOR_PARAMETERS_MAP[previewColorId];

  if (argsObj.mainColorPath !== undefined && argsObj.defaultMainColorValue !== undefined) {
    ebx_form_setNodeValue(argsObj.mainColorPath, argsObj.defaultMainColorValue);
  }

  if (argsObj.brightnessPath !== undefined && argsObj.defaultBrightnessValue !== undefined) {
    ebx_form_setNodeValue(argsObj.brightnessPath, argsObj.defaultBrightnessValue);
  }

  if (argsObj.textColorPath !== undefined && argsObj.defaultTextColorValue !== undefined) {
    ebx_form_setNodeValue(argsObj.textColorPath, argsObj.defaultTextColorValue);
  }

  if (argsObj.borderColorPath !== undefined && argsObj.defaultBorderColorValue !== undefined) {
    ebx_form_setNodeValue(argsObj.borderColorPath, argsObj.defaultBorderColorValue);
  }
};

ebx_colorPickerBeanEditor_updatePreview_backgroundColor = function (color, previewColorId) {
  if (!EBX_ColorPicker.isHexColor(color)) {
    return;
  }

  document.getElementById(previewColorId).style.backgroundColor = color;
};
ebx_colorPickerBeanEditor_updatePreview_textColor = function (color, previewColorId) {
  if (!EBX_ColorPicker.isHexColor(color)) {
    return;
  }

  document.getElementById(previewColorId).style.color = color;
};
ebx_colorPickerBeanEditor_updatePreview_workflowBadgeTextColor = function (color, previewColorId) {
  if (!EBX_ColorPicker.isHexColor(color)) {
    return;
  }

  var previewEl = document.getElementById(previewColorId);

  previewEl.style.color = color;
  previewEl.style.boxShadow = "0 0 0 1px " + color;
  previewEl.style.MozBoxShadow = "0 0 0 1px " + color;
  previewEl.style.borderColor = color;
};
ebx_colorPickerBeanEditor_updatePreview_borderColor = function (color, previewColorId) {
  if (!EBX_ColorPicker.isHexColor(color)) {
    return;
  }

  document.getElementById(previewColorId).style.borderColor = color;
};

/* START MDM component */
function EBX_MDMComponent() {
}

EBX_MDMComponent.yuiDataSource = new YAHOO.util.XHRDataSource();
EBX_MDMComponent.yuiDataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
EBX_MDMComponent.yuiDataSource.responseSchema = {
  resultsList: "result",
  fields: [{
    key: "openComment"
  }, {
    key: "url"
  }]
};

EBX_MDMComponent.sendRequest = function (requestURL) {
  EBX_MDMComponent.yuiDataSource.sendRequest(requestURL, {
    success: EBX_MDMComponent.receiveSuccess,
    failure: EBX_MDMComponent.receiveFailure
  });
};

EBX_MDMComponent.receiveSuccess = function (oRequest, oParsedResponse, argument) {
  var result = oParsedResponse.results;
  if (result !== undefined) {
    var openComment = result[0].openComment;
    var url = result[0].url;
    if (openComment) {
      EBX_Utils.openInternalPopup(url, 600, 370);
    } else {
      window.location.href = url;
    }
  }
};

EBX_MDMComponent.receiveFailure = function (oRequest, oParsedResponse, argument) {

};
/* END MDM component */

//[EBX_PUBLIC_API]
ebx_setWorkspaceTitle = function (workspaceTitle) {
  EBX_LayoutManager.setWorkspaceTitle(workspaceTitle);
};
ebx_getWorkspaceTitle = function () {
  return EBX_LayoutManager.getWorkspaceTitle();
};
