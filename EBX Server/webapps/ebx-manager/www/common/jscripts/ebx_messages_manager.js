/* This class is used to manage user messages for standard messages (added in context in Java classes) and AJAX messages.
 * It contains three lists; one for each message's severity (INFO, WARNING, ERROR).
 * These lists contains all messages displayed to user "between two standard event" (std event means not AJAX).
 *
 * The goal is to unify this feature for standard and AJAX messages, and allow re-display of old messages if asked.
 *
 * These messages are displayed in a div, created dynamically if needed, and filled with all (or only new) messages of a given severity.
 * In fact, there are two div, one for the background (opacity), and one for the messages themselves.
 */
function EBX_UserMessageManager() {
}

EBX_UserMessageManager.infoMsg = [];
EBX_UserMessageManager.amountOfUnreadInfoMessage = 0;
EBX_UserMessageManager.infoMessageListMustBeRefreshed = false;
EBX_UserMessageManager.warningMsg = [];
EBX_UserMessageManager.amountOfUnreadWarningMessage = 0;
EBX_UserMessageManager.warningMessageListMustBeRefreshed = false;
EBX_UserMessageManager.errorMsg = [];
EBX_UserMessageManager.amountOfUnreadErrorMessage = 0;
EBX_UserMessageManager.errorMessageListMustBeRefreshed = false;

EBX_UserMessageManager.INFO = "I";
EBX_UserMessageManager.WARNING = "W";
EBX_UserMessageManager.ERROR = "E";

// must be overwrote by the manager with default value of manager of user preference
EBX_UserMessageManager.autodisplaySeverityLevel = EBX_UserMessageManager.WARNING;

EBX_UserMessageManager.showUnreadMessages = function () {
  var displayMessageBox = false;
  switch (EBX_UserMessageManager.autodisplaySeverityLevel) {
    case EBX_UserMessageManager.INFO:
      if (EBX_UserMessageManager.amountOfUnreadInfoMessage !== 0) {
        displayMessageBox = true;
        break;
      }
    case EBX_UserMessageManager.WARNING:
      if (EBX_UserMessageManager.amountOfUnreadWarningMessage !== 0) {
        displayMessageBox = true;
        break;
      }
    case EBX_UserMessageManager.ERROR:
      if (EBX_UserMessageManager.amountOfUnreadErrorMessage !== 0) {
        displayMessageBox = true;
        break;
      }
    default:
      displayMessageBox = false;
  }

  if (displayMessageBox) {
    EBX_UserMessageManager.showMessageBox();
  }
};

/**
 * This method add the given message (String) to the proper list according to
 * the given severity.
 */
EBX_UserMessageManager.addLegacyMessage = function (message, severity) {
  var arrayToPush;
  switch (severity) {
    case EBX_UserMessageManager.INFO:
      arrayToPush = EBX_UserMessageManager.infoMsg;
      EBX_UserMessageManager.amountOfUnreadInfoMessage++;
      EBX_UserMessageManager.infoMessageListMustBeRefreshed = true;
      break;
    case EBX_UserMessageManager.WARNING:
      arrayToPush = EBX_UserMessageManager.warningMsg;
      EBX_UserMessageManager.amountOfUnreadWarningMessage++;
      EBX_UserMessageManager.warningMessageListMustBeRefreshed = true;
      break;
    case EBX_UserMessageManager.ERROR:
      arrayToPush = EBX_UserMessageManager.errorMsg;
      EBX_UserMessageManager.amountOfUnreadErrorMessage++;
      EBX_UserMessageManager.errorMessageListMustBeRefreshed = true;
      break;
    default:
      return;
  }

  arrayToPush.push(new EBX_UserMessage(message));

  EBX_UserMessageManager.refreshButton();
  EBX_UserMessageManager.refreshMessageBoxPanel();

  EBX_UserMessageManager.showUnreadMessages();
};


/**
 * This method add the given message (String) to the proper list according to
 * the given severity.
 */
EBX_UserMessageManager.addMessage = function (message, severity) {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    // Not in hybrid mode or if legacy header is shown
    EBX_UserMessageManager.addLegacyMessage(message, severity);
    return;
  }

  if(EBX_LayoutManager.isLegacyHeader){
    EBX_UserMessageManager.refreshHybridButton();
  }

  var callback = windowsStack[0]["EBX_HybridModeOnMessage"];
  if (!callback) {
    // No callback defined.
    EBX_UserMessageManager.addLegacyMessage(message, severity);
    return;
  }

  callback(JSON.stringify({message: message, severity: severity, fullPageId: window.EBX_PageId}));
};

/**
 * This method display the message box popup whether the severity level is reached or not.
 */
EBX_UserMessageManager.displayMessageBox = function () {
  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    // Not in hybrid mode or if legacy header is shown
    var adminBox = document.getElementById(EBX_UserMessageManager.DisplayMessageBoxButtonId);
    if (adminBox) {
      adminBox.click();
    }
    return;
  }

  var callback = windowsStack[0]["EBX_HybridModeOnDisplayMessageBox"];
  if (!callback) {
    // No callback defined.
    return;
  }

  callback(JSON.stringify({fullPageId: window.EBX_PageId}));
};

EBX_UserMessageManager.DisplayMessageBoxButtonId = "ebx_DisplayMessageBox";
EBX_UserMessageManager.refreshButton = function () {
  var button = document.getElementById(EBX_UserMessageManager.DisplayMessageBoxButtonId);

  if (button === null) {
    return;
  }

  if (EBX_UserMessageManager.infoMsg.length + EBX_UserMessageManager.warningMsg.length
      + EBX_UserMessageManager.errorMsg.length == 0) {
    button.style.display = "none";
    return;
  }
  button.style.display = "inline-block";
};

EBX_UserMessageManager.refreshHybridButton = function () {
  var button = document.getElementById(EBX_UserMessageManager.DisplayMessageBoxButtonId);
  if (button === null) {
    return;
  }
  button.style.display = "inline-block";
  button.setAttribute("onclick", "EBX_UserMessageManager.displayMessageBox()");
};

EBX_UserMessageManager.messageBoxPanel = null;

EBX_UserMessageManager.isMessageBoxDisplayed = function () {
  if (EBX_UserMessageManager.messageBoxPanel === null) {
    return false;
  }
  return EBX_UserMessageManager.messageBoxPanel.cfg.getProperty("visible");
};

EBX_UserMessageManager.showMessageBox = function () {
  // TODO send the command to newUI
  EBX_UserMessageManager.refreshMessageBoxPanel();
  EBX_UserMessageManager.messageBoxPanel.show();
};

EBX_UserMessageManager.messageBoxTabUnreadCSSClass = "ebx_MessageBoxTabUnread";
EBX_UserMessageManager.errorMessageIdPrefix = "ebx_ErrorMessage_";
EBX_UserMessageManager.warningMessageIdPrefix = "ebx_WarningMessage_";
EBX_UserMessageManager.infoMessageIdPrefix = "ebx_InfoMessage_";

EBX_UserMessageManager.refreshMessageBoxPanel = function () {
  if (EBX_UserMessageManager.messageBoxPanel === null) {
    EBX_UserMessageManager.buildMessageBoxPanel();
  }

  if (EBX_UserMessageManager.errorMessageListMustBeRefreshed) {
    EBX_UserMessageManager.refreshErrorTab();

    var errorMessageList = document.getElementById(EBX_UserMessageManager.messageBoxErrorListId);
    EBX_UserMessageManager.fillListWithMessages(errorMessageList, EBX_UserMessageManager.errorMsg,
        EBX_UserMessageManager.errorMessageIdPrefix);

    EBX_UserMessageManager.errorMessageListMustBeRefreshed = false;
  }

  if (EBX_UserMessageManager.warningMessageListMustBeRefreshed) {
    EBX_UserMessageManager.refreshWarningTab();

    var warningMessageList = document.getElementById(EBX_UserMessageManager.messageBoxWarningListId);
    EBX_UserMessageManager.fillListWithMessages(warningMessageList, EBX_UserMessageManager.warningMsg,
        EBX_UserMessageManager.warningMessageIdPrefix);
    EBX_UserMessageManager.warningMessageListMustBeRefreshed = false;
  }

  if (EBX_UserMessageManager.infoMessageListMustBeRefreshed) {
    EBX_UserMessageManager.refreshInfoTab();

    var infoMessageList = document.getElementById(EBX_UserMessageManager.messageBoxInfoListId);
    EBX_UserMessageManager.fillListWithMessages(infoMessageList, EBX_UserMessageManager.infoMsg,
        EBX_UserMessageManager.infoMessageIdPrefix);

    EBX_UserMessageManager.infoMessageListMustBeRefreshed = false;
  }

  // active the most severe unread tab
  var tabToActive = null;
  if (EBX_UserMessageManager.amountOfUnreadErrorMessage !== 0) {
    tabToActive = EBX_UserMessageManager.tabError;
  } else if (EBX_UserMessageManager.amountOfUnreadWarningMessage !== 0) {
    tabToActive = EBX_UserMessageManager.tabWarning;
  } else if (EBX_UserMessageManager.amountOfUnreadInfoMessage !== 0) {
    tabToActive = EBX_UserMessageManager.tabInfo;
  }
  if (tabToActive !== null) {
    EBX_UserMessageManager.tabView.selectTab(EBX_UserMessageManager.tabView.getTabIndex(tabToActive));
  }
};
/* refreshXXXTab are called only if the list of XXX is not empty */
EBX_UserMessageManager.refreshErrorTab = function () {
  if (EBX_UserMessageManager.tabError === null) {
    EBX_UserMessageManager.tabError = new YAHOO.widget.Tab({
      label: "<div class='ebx_MessageBoxWTabIcon ebx_IconError'></div><span id=\""
      + EBX_UserMessageManager.messageBoxErrorTabLabelId + "\"></span>",
      content: "<ul id=\"" + EBX_UserMessageManager.messageBoxErrorListId + "\"></ul>",
      active: true
    });
    EBX_UserMessageManager.tabView.addTab(EBX_UserMessageManager.tabError, 0);
  }

  var errorTabLabel = document.getElementById(EBX_UserMessageManager.messageBoxErrorTabLabelId);
  var errorTabLabelContent = [];
  errorTabLabelContent.push(EBX_UserMessageManager.errorMsg.length, " ");
  if (EBX_UserMessageManager.errorMsg.length === 1) {
    errorTabLabelContent.push(EBX_LocalizedMessage.messageBox_error_one);
  } else {
    errorTabLabelContent.push(EBX_LocalizedMessage.messageBox_error_several);
  }
  if (EBX_UserMessageManager.amountOfUnreadErrorMessage !== 0) {
    errorTabLabelContent.push("<br/><span class=\"", EBX_UserMessageManager.messageBoxTabUnreadCSSClass, "\">(");
    errorTabLabelContent.push(EBX_UserMessageManager.amountOfUnreadErrorMessage, " ");
    if (EBX_UserMessageManager.amountOfUnreadErrorMessage === 1) {
      errorTabLabelContent.push(EBX_LocalizedMessage.messageBox_unread_one);
    } else {
      errorTabLabelContent.push(EBX_LocalizedMessage.messageBox_unread_several);
    }
    errorTabLabelContent.push(")</span>");
  }
  errorTabLabel.innerHTML = errorTabLabelContent.join("");
};
EBX_UserMessageManager.refreshWarningTab = function () {
  if (EBX_UserMessageManager.tabWarning === null) {
    EBX_UserMessageManager.tabWarning = new YAHOO.widget.Tab({
      label: "<div class='ebx_MessageBoxWTabIcon ebx_IconWarning'></div><span id=\""
      + EBX_UserMessageManager.messageBoxWarningTabLabelId + "\"></span>",
      content: "<ul id=\"" + EBX_UserMessageManager.messageBoxWarningListId + "\"></ul>",
      active: true
    });
    EBX_UserMessageManager.tabView.addTab(EBX_UserMessageManager.tabWarning,
        EBX_UserMessageManager.tabError === null ? 0 : 1);
  }

  var warningTabLabel = document.getElementById(EBX_UserMessageManager.messageBoxWarningTabLabelId);
  var warningTabLabelContent = [];
  warningTabLabelContent.push(EBX_UserMessageManager.warningMsg.length, " ");
  if (EBX_UserMessageManager.warningMsg.length === 1) {
    warningTabLabelContent.push(EBX_LocalizedMessage.messageBox_warning_one);
  } else {
    warningTabLabelContent.push(EBX_LocalizedMessage.messageBox_warning_several);
  }
  if (EBX_UserMessageManager.amountOfUnreadWarningMessage !== 0) {
    warningTabLabelContent.push("<br/><span class=\"", EBX_UserMessageManager.messageBoxTabUnreadCSSClass, "\">(");
    warningTabLabelContent.push(EBX_UserMessageManager.amountOfUnreadWarningMessage, " ");
    if (EBX_UserMessageManager.amountOfUnreadWarningMessage === 1) {
      warningTabLabelContent.push(EBX_LocalizedMessage.messageBox_unread_one);
    } else {
      warningTabLabelContent.push(EBX_LocalizedMessage.messageBox_unread_several);
    }
    warningTabLabelContent.push(")</span>");
  }
  warningTabLabel.innerHTML = warningTabLabelContent.join("");
};
EBX_UserMessageManager.refreshInfoTab = function () {
  if (EBX_UserMessageManager.tabInfo === null) {
    EBX_UserMessageManager.tabInfo = new YAHOO.widget.Tab({
      label: "<div class='ebx_MessageBoxWTabIcon ebx_IconInfo'></div><span id=\""
      + EBX_UserMessageManager.messageBoxInfoTabLabelId + "\"></span>",
      content: "<ul id=\"" + EBX_UserMessageManager.messageBoxInfoListId + "\"></ul>",
      active: true
    });
    var index = 0;
    if (EBX_UserMessageManager.tabError !== null) {
      index++;
    }
    if (EBX_UserMessageManager.tabWarning !== null) {
      index++;
    }

    EBX_UserMessageManager.tabView.addTab(EBX_UserMessageManager.tabInfo, index);
  }

  var infoTabLabel = document.getElementById(EBX_UserMessageManager.messageBoxInfoTabLabelId);
  var infoTabLabelContent = [];
  infoTabLabelContent.push(EBX_UserMessageManager.infoMsg.length, " ");
  if (EBX_UserMessageManager.infoMsg.length === 1) {
    infoTabLabelContent.push(EBX_LocalizedMessage.messageBox_info_one);
  } else {
    infoTabLabelContent.push(EBX_LocalizedMessage.messageBox_info_several);
  }
  if (EBX_UserMessageManager.amountOfUnreadInfoMessage !== 0) {
    infoTabLabelContent.push("<br/><span class=\"", EBX_UserMessageManager.messageBoxTabUnreadCSSClass, "\">(");
    infoTabLabelContent.push(EBX_UserMessageManager.amountOfUnreadInfoMessage, " ");
    if (EBX_UserMessageManager.amountOfUnreadInfoMessage === 1) {
      infoTabLabelContent.push(EBX_LocalizedMessage.messageBox_unread_one);
    } else {
      infoTabLabelContent.push(EBX_LocalizedMessage.messageBox_unread_several);
    }
    infoTabLabelContent.push(")</span>");
  }
  infoTabLabel.innerHTML = infoTabLabelContent.join("");
};

EBX_UserMessageManager.messageUnreadCSSClass = "ebx_MessageBoxMessageUnread";
EBX_UserMessageManager.messageCSSClass = "ebx_MessageBoxMessage";
EBX_UserMessageManager.fillListWithMessages = function (listEl, messages, idPrefix) {
  var listBody = [];
  var length = messages.length;
  for (var i = 0; i < length; i++) {
    listBody.push("<li>");
    listBody.push("<div");
    listBody.push(" id=\"", idPrefix, i, "\"");
    listBody.push(" class=\"", EBX_UserMessageManager.messageCSSClass);
    if (messages[i].read === false) {
      listBody.push(" ", EBX_UserMessageManager.messageUnreadCSSClass);
    }
    listBody.push("\"");
    if (messages[i].read === false) {
      listBody.push(" title=\"", EBX_LocalizedMessage.messageBox_unreadMessage_tooltip, "\"");
    }
    listBody.push(">");
    listBody.push(messages[i].msg);
    listBody.push("</div>");
    listBody.push("</li>");
  }
  listEl.innerHTML = listBody.join("");
};

EBX_UserMessageManager.messageBoxPanelId = "ebx_MessageBox";
EBX_UserMessageManager.messageBoxBodyId = "ebx_MessageBoxBody";
EBX_UserMessageManager.messageBoxTitleId = "ebx_MessageBoxTitle";

EBX_UserMessageManager.messageBoxErrorListId = "ebx_MessageBoxErrorList";
EBX_UserMessageManager.messageBoxWarningListId = "ebx_MessageBoxWarningList";
EBX_UserMessageManager.messageBoxInfoListId = "ebx_MessageBoxInfoList";

EBX_UserMessageManager.messageBoxErrorTabLabelId = "ebx_MessageBoxErrorTabLabel";
EBX_UserMessageManager.messageBoxWarningTabLabelId = "ebx_MessageBoxWarningTabLabel";
EBX_UserMessageManager.messageBoxInfoTabLabelId = "ebx_MessageBoxInfoTabLabel";

EBX_UserMessageManager.tabView = null;
EBX_UserMessageManager.tabError = null;
EBX_UserMessageManager.tabWarning = null;
EBX_UserMessageManager.tabInfo = null;

EBX_UserMessageManager.buildMessageBoxPanel = function () {
  EBX_UserMessageManager.messageBoxPanel = new YAHOO.widget.Panel(EBX_UserMessageManager.messageBoxPanelId, {
    close: false,
    draggable: false,
    modal: true,
    visible: false,
    fixedcenter: true
  });

  var messageBoxBody = [];
  messageBoxBody.push("<div");
  messageBoxBody.push(" id=\"", EBX_UserMessageManager.messageBoxBodyId, "\"");
  messageBoxBody.push(">");

  var closeLabel = EBX_LocalizedMessage.UICommon_button_close;
  messageBoxBody.push("<div class='" + EBX_UserMessageManager.messageBoxBodyId + "_footer'>");
  messageBoxBody.push("<button id='" + EBX_UserMessageManager.messageBoxBodyId
      + "_close' type='button' class='ebx_Button'>");
  messageBoxBody.push(closeLabel);
  messageBoxBody.push("</button>");
  messageBoxBody.push("</div>");
  messageBoxBody.push("</div>");

  YAHOO.util.Event.on(EBX_UserMessageManager.messageBoxBodyId + "_close", "click", function () {
    EBX_UserMessageManager.messageBoxPanel.hide();
  });

  EBX_UserMessageManager.messageBoxPanel.setBody(messageBoxBody.join(""));
  EBX_UserMessageManager.messageBoxPanel.render(document.body);
  YAHOO.util.Event.on(EBX_UserMessageManager.messageBoxPanelId + "_mask", "click", function () {
    EBX_UserMessageManager.messageBoxPanel.hide();
  });

  YAHOO.util.Event.addListener(EBX_UserMessageManager.messageBoxBodyId, "click",
      EBX_UserMessageManager.clickOnMessageBoxListener);

  EBX_UserMessageManager.tabView = new YAHOO.widget.TabView({
    orientation: "left"
  });

  var container = document.getElementById(EBX_UserMessageManager.messageBoxBodyId);
  EBX_UserMessageManager.tabView.appendTo(
      container,
      container.querySelector("." + EBX_UserMessageManager.messageBoxBodyId + "_footer")
  );

};

EBX_UserMessageManager.clickOnMessageBoxListener = function (e) {
  var targetId = YAHOO.util.Event.getTarget(e).id;

  if (targetId === "") {
    return;
  }

  // found at position 0
  if (targetId.search(EBX_UserMessageManager.errorMessageIdPrefix) === 0) {
    EBX_UserMessageManager.setErrorMessageRead(targetId.substr(EBX_UserMessageManager.errorMessageIdPrefix.length));
  }
  if (targetId.search(EBX_UserMessageManager.warningMessageIdPrefix) === 0) {
    EBX_UserMessageManager.setWarningMessageRead(targetId.substr(EBX_UserMessageManager.warningMessageIdPrefix.length));
  }
  if (targetId.search(EBX_UserMessageManager.infoMessageIdPrefix) === 0) {
    EBX_UserMessageManager.setInfoMessageRead(targetId.substr(EBX_UserMessageManager.infoMessageIdPrefix.length));
  }
};

EBX_UserMessageManager.setErrorMessageRead = function (messageIndex) {
  if (EBX_UserMessageManager.errorMsg[messageIndex].read === true) {
    return;
  }

  EBX_UserMessageManager.errorMsg[messageIndex].read = true;
  EBX_UserMessageManager.amountOfUnreadErrorMessage--;
  EBX_UserMessageManager.refreshButton();
  EBX_UserMessageManager.refreshErrorTab();
  var message = document.getElementById(EBX_UserMessageManager.errorMessageIdPrefix + messageIndex);
  message.className = EBX_UserMessageManager.messageCSSClass;
  message.title = "";
};
EBX_UserMessageManager.setWarningMessageRead = function (messageIndex) {
  if (EBX_UserMessageManager.warningMsg[messageIndex].read === true) {
    return;
  }

  EBX_UserMessageManager.warningMsg[messageIndex].read = true;
  EBX_UserMessageManager.amountOfUnreadWarningMessage--;
  EBX_UserMessageManager.refreshButton();
  EBX_UserMessageManager.refreshWarningTab();
  var message = document.getElementById(EBX_UserMessageManager.warningMessageIdPrefix + messageIndex);
  message.className = EBX_UserMessageManager.messageCSSClass;
  message.title = "";
};
EBX_UserMessageManager.setInfoMessageRead = function (messageIndex) {
  if (EBX_UserMessageManager.infoMsg[messageIndex].read === true) {
    return;
  }

  EBX_UserMessageManager.infoMsg[messageIndex].read = true;
  EBX_UserMessageManager.amountOfUnreadInfoMessage--;
  EBX_UserMessageManager.refreshButton();
  EBX_UserMessageManager.refreshInfoTab();
  var message = document.getElementById(EBX_UserMessageManager.infoMessageIdPrefix + messageIndex);
  message.className = EBX_UserMessageManager.messageCSSClass;
  message.title = "";
};

EBX_UserMessageManager.copyMessagesTo = function (anotherMessageManager) {

  if (anotherMessageManager === EBX_UserMessageManager) {
    return;
  }

  for (var i = 0, len = this.errorMsg.length; i < len; i++) {
    anotherMessageManager.addMessage(this.errorMsg[i].msg, EBX_UserMessageManager.ERROR);
  }
  for (var i = 0, len = this.warningMsg.length; i < len; i++) {
    anotherMessageManager.addMessage(this.warningMsg[i].msg, EBX_UserMessageManager.WARNING);
  }
  for (var i = 0, len = this.infoMsg.length; i < len; i++) {
    anotherMessageManager.addMessage(this.infoMsg[i].msg, EBX_UserMessageManager.INFO);
  }
};

/* Technical object which encapsulate messages.
 * Contains the message itself (as String) and a flag used to know if this message has already been displayed.
 */
function EBX_UserMessage(userMessages) {
  this.msg = userMessages;
  this.read = false;
}

//@EBXAddonAPI
function ebx_messageBox_addError(errorMessage) {
  EBX_UserMessageManager.addMessage(errorMessage, EBX_UserMessageManager.ERROR);
}

//@EBXAddonAPI
function ebx_messageBox_addWarning(warningMessage) {
  EBX_UserMessageManager.addMessage(warningMessage, EBX_UserMessageManager.WARNING);
}

//@EBXAddonAPI
function ebx_messageBox_addInfo(infoMessage) {
  EBX_UserMessageManager.addMessage(infoMessage, EBX_UserMessageManager.INFO);
}
