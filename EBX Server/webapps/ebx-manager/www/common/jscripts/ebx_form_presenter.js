/* START Form node public API */

/* jshint unused: false */
function ebx_form_isNodeDefined(path) {
  return EBX_FormNodeIndex.isFormNodeDefined(path);
}

function ebx_form_getValue(path) {
  return ebx_form_getNodeValue(ebx_form_formatLegacyPath(path));
}

function ebx_form_setValue(path, value) {
  return ebx_form_setNodeValue(ebx_form_formatLegacyPath(path), value);
}

function ebx_form_setMandatoryIndicator(path, isDisplayed) {
  return ebx_form_setNodeMandatoryIndicator(ebx_form_formatLegacyPath(path), isDisplayed);
}

/**
 * An object that hold a list of messages with different severities.
 */
EBX_ValidationMessage = function () {
  this.errors = undefined;
  this.warnings = undefined;
  this.infos = undefined;
};

/**
 * Display a list of messages under a form node.
 *
 * @param  {string}
 *            aPrefixedPath a prefixed path
 * @param {EBX_ValidationMessage}
 *            aMessageContainer an object containing all the messages to display.
 *            Must not be null.
 */
//[EBX_PUBLIC_API]
function ebx_form_setNodeMessage(aPrefixedPath, aMessageContainer) {
  var node = EBX_FormNodeIndex.getFormNode(aPrefixedPath);
  if (node !== null) {
    // check input type
    if (!aMessageContainer || typeof aMessageContainer !== "object") {
      aMessageContainer = {};
    }
    node.setMessage(aMessageContainer);
  }
}

/**
 * Returns the list of currently displayed messages.
 *
 * @param {string}
 *            aPrefixedPath a prefixed path
 * @return {EBX_ValidationMessage} the object containing all the messages
 *         displayed.
 *         Returns null if aPrefixedPath is invalid or node absent.
 */
//[EBX_PUBLIC_API]
function ebx_form_getNodeMessage(aPrefixedPath) {
  var node = EBX_FormNodeIndex.getFormNode(aPrefixedPath);
  if (node !== null) {
    return node.getMessage();
  }
  return null;
}

/* jshint unused: true */

/* END Form node public API */

function ebx_form_getNodeValue(prefixedPath) {
  if (EBX_FormNodeIndex.getFormNode(prefixedPath) === null) {
    throw "The node at prefixed path \"" + prefixedPath + "\" was not found in the form.";
  }

  return EBX_FormNodeIndex.getFormNode(prefixedPath).getValue();
}

function ebx_form_setNodeValue(prefixedPath, value) {
  if (EBX_FormNodeIndex.getFormNode(prefixedPath) === null) {
    throw "The node at prefixed path \"" + prefixedPath + "\" was not found in the form.";
  }

  if (EBX_FormNodeIndex.getFormNode(prefixedPath).setValue(value) === true) {
    EBX_FormPresenter.stackPathForValidation(prefixedPath);
  }
}

function ebx_form_setNodeMandatoryIndicator(prefixedPath, isDisplayed) {
  // CP-18641

  var labelId = EBX_FormNodeIndex.pathLabelId[prefixedPath];
  if (labelId === undefined) {
    return;
  }
  var labelEl = document.getElementById(labelId);
  if (labelEl === null) {
    return;
  }

  var mandatoryFlag = null;
  var mandatoryFlagContainer = null;

  var field = EBX_Utils.getFirstParentMatchingCSSClass(labelEl, "ebx_Field");
  if (field === null) {
    mandatoryFlagContainer = EBX_Utils.getFirstDirectChildMatchingCSSClass(labelEl, "ebx_RawLabel");
  } else {
    mandatoryFlagContainer = EBX_Utils.getFirstDirectChildMatchingCSSClass(field, "ebx_FieldInfos");
  }

  if (mandatoryFlagContainer !== null) {
    mandatoryFlag = EBX_Utils.getFirstDirectChildMatchingCSSClass(mandatoryFlagContainer, "ebx_MandatoryFlag");

    if (isDisplayed && mandatoryFlag === null) {
      // Must be the same as com.orchestranetworks.manager.core.utils.FormLabelSpecUtils#getMandatoryFlag
      mandatoryFlag = document.createElement("span");
      EBX_Utils.addCSSClass(mandatoryFlag, "ebx_MandatoryFlag");
      var asterisk = document.createTextNode("*");
      mandatoryFlag.appendChild(asterisk);

      mandatoryFlagContainer.appendChild(mandatoryFlag);
    }
  }

  if (mandatoryFlag !== null) {
    mandatoryFlag.style.display = isDisplayed ? "" : "none";
  }
}

function ebx_form_formatLegacyPath(path) {
  if ((path.length < 2) || (path.charAt(1) != '@')) {
    if (EBX_FormNode.pathAutoPrefix) {
      return EBX_FormNode.pathAutoPrefix + path;
    } else {
      EBX_Logger.log(path + " un-prefixed paths are not allowed in this context", EBX_Logger.error);
      return "missing prefix: " + path;
    }
  }
  return path;
}

function EBX_FormNode() {
}

// deprecated. please use ebx_form_getValue() instead
EBX_FormNode.getValue = function (path) {
  return ebx_form_getValue(path);
};

//deprecated. please use ebx_form_setValue() instead
EBX_FormNode.setValue = function (path, value) {
  ebx_form_setValue(path, value);
};

/* START Form node structure */

function EBX_FormNodeIndex() {
}

/* initialized by UITreeForm */
EBX_FormNodeIndex.pathsTree = {};
EBX_FormNodeIndex.nodes = {};
EBX_FormNodeIndex.fieldsIdPath = [];

/* initialized for form label */
EBX_FormNodeIndex.pathLabelId = [];

EBX_FormNodeIndex.TYPE_TAB = 1;
EBX_FormNodeIndex.TYPE_NOT_TERMINAL_LINE = 2;
EBX_FormNodeIndex.TYPE_TERMINAL_LINE = 3;
EBX_FormNodeIndex.TYPE_SUB_TERMINAL_LINE = 4;
EBX_FormNodeIndex.TYPE_SUB_TERMINAL_RAW = 5;

EBX_FormNodeIndex.SEVERITY_ERROR = {
  cssSuffix: "_error"
};
EBX_FormNodeIndex.SEVERITY_WARNING = {
  cssSuffix: "_warn"
};
EBX_FormNodeIndex.SEVERITY_INFO = {
  cssSuffix: "_info"
};

EBX_FormNodeIndex.isFormNodeDefined = function (prefixedPath) {
  return EBX_FormNodeIndex.nodes[prefixedPath] !== undefined;
};

EBX_FormNodeIndex.getFormNode = function (prefixedPath) {
  var formNode = EBX_FormNodeIndex.nodes[prefixedPath];
  if (formNode === undefined) {
    EBX_Logger.log("The formNode at the prefixed path \"" + prefixedPath + "\" is not defined.", EBX_Logger.warn);
    return null;
  }

  if (formNode.constructor === Object) {
    switch (formNode.type) {
      case EBX_FormNodeIndex.TYPE_TAB:
        formNode = new EBX_FormNodeTab(prefixedPath, formNode);
        break;
      case EBX_FormNodeIndex.TYPE_NOT_TERMINAL_LINE:
        formNode = new EBX_FormNotTerminalNode(prefixedPath, formNode);
        break;
      case EBX_FormNodeIndex.TYPE_TERMINAL_LINE:
        formNode = new EBX_FormTerminalNode(prefixedPath, formNode);
        break;
      case EBX_FormNodeIndex.TYPE_SUB_TERMINAL_LINE:
        formNode = new EBX_FormSubTerminalNode(prefixedPath, formNode);
        break;
      case EBX_FormNodeIndex.TYPE_SUB_TERMINAL_RAW:
        formNode = new EBX_SubTerminalRawNode(prefixedPath, formNode);
        break;
      default:
        EBX_Logger.log("EBX_FormNodeIndex.getFormNode(" + prefixedPath + "): Unknown node type " + formNode.type,
            EBX_Logger.error);
        return null;
    }
    EBX_FormNodeIndex.nodes[prefixedPath] = formNode;
  }
  return formNode;
};

/* Parent of "foo" is null.
 * Parent of "/" is "/".
 * Parent of "/foo" is "/".
 * Parent of "/foo/" is "/foo".
 * Parent of "/foo/bar" is "/foo".
 * Parent of "/foo/bar[] is "/foo/bar".
 * Parent of "/foo/bar[x] is "/foo/bar".
 * Parent of "/foo/bar] is null.
 * Parent of "/foo/bar[ is "/foo".
 */
EBX_FormNodeIndex.getParentPath = function (path) {
  var truncIndex;

  // detect the last ']' for list occurrence
  if (path.substring(path.length, path.length - 1) === "]") {
    truncIndex = path.lastIndexOf("[");
    if (truncIndex < 0) {
      return null;
    }
  } else {
    truncIndex = path.lastIndexOf("/");
    if (truncIndex < 0) {
      return null;
    }
    if (truncIndex === 0) {
      return "/";
    }
  }

  return path.substring(0, truncIndex);
};

EBX_FormNodeIndex.setMandatoryIndicator = function (isDisplayed) {
  // CP-18641

  ebx_form_setNodeMandatoryIndicator(this.path, isDisplayed);
};

/* END Form node structure */

/* START Form nodes */

function EBX_FormNodeTab(path, formNode) {
  this.path = path;
  this.tabNodeIndex = formNode.tabNodeIndex;
}

EBX_FormNodeTab.prototype = {
  constructor: EBX_FormNodeTab,

  focus: function () {
    // TODO CCH
  },

  setSeverityFlag: function (severity) {
    // TODO CCH
  }
};

function EBX_FormNodeLine() {
}

EBX_FormNodeLine.getTRElement = function () {
  if (this.trElement === undefined) {
    this.trElement = document.getElementById(this.trElementId);
  }
  return this.trElement;
};

EBX_FormNodeLine.getParent = function () {
  if (this.parent === undefined) {
    this.parent = EBX_FormNodeIndex.getFormNode(EBX_FormNodeIndex.getParentPath(this.path));
  }
  return this.parent;
};

EBX_FormNodeLine.setSeverityFlag = function (severity) {
  // disabled for the moment
  return;

  //	var element = this.getTRElement();
  //
  //	// FIXME CCH list occurrences (li) does not work for the moment
  //	if (element !== null) {
  //		var cssSuffix = "";
  //		if (severity !== null) {
  //			cssSuffix = severity.cssSuffix;
  //		}
  //		element.className = EBX_FormNodeLine.replaceNeutralCssClass(element.className, this.neutralCssClass, cssSuffix);
  //	}
  //
  //	// disabled for the moment (problem of siblings with severity & parent refresh)
  //	//  for this case, it would be a childrenSeverity:map<Node,Severity> for each level
  //	//   but we have problem of initialisation
  //	/*
  //	 if (this.getParent() !== null) {
  //	 this.getParent().setSeverityFlag(severity);
  //	 }
  //	 */
};

EBX_FormNodeLine.replaceNeutralCssClass = function (cssClass, neutralCssClass, cssClassSuffixToAdd) {
  var indexNeutralBegin = cssClass.indexOf(neutralCssClass);

  if (indexNeutralBegin < 0) {
    // neutral css class not found
    return cssClass;
  }

  var indexNeutralEnds = cssClass.indexOf(" ", indexNeutralBegin);

  var newCSSClass = [];
  newCSSClass.push(cssClass.substring(0, indexNeutralBegin));
  newCSSClass.push(neutralCssClass, cssClassSuffixToAdd);
  if (indexNeutralEnds > 0) {
    // neutral css class was the last
    newCSSClass.push(cssClass.substring(indexNeutralEnds));
  }

  return newCSSClass.join("");
};

function EBX_FormNotTerminalNode(path, formNode) {
  this.path = path;
  this.trElementId = formNode.trId;
  this.neutralCssClass = formNode.neutralCssClass;
}

EBX_FormNotTerminalNode.prototype = {
  constructor: EBX_FormNotTerminalNode,

  focus: function () {
    // TODO CCH
  },

  getTRElement: EBX_FormNodeLine.getTRElement,
  getParent: EBX_FormNodeLine.getParent,
  setSeverityFlag: EBX_FormNodeLine.setSeverityFlag
};

function EBX_DecoratedField() {
}

EBX_DecoratedField.getEditor = function () {
  if (this.editorName === undefined) {
    EBX_Logger.log("The editorName for the formNode \"" + this.path + "\" is not defined.", EBX_Logger.error);
    this.editorName = "EBX_FormNodeEditor_Missing";
  }
  if (this.editor === undefined) {
    this.editor = eval("new " + this.editorName + "(this.getDecoratorElement(), this.editorArgs);");
  }
  return this.editor;
};
EBX_DecoratedField.getDecoratorElement = function () {
  if (this.decoratorEl === undefined) {
    this.decoratorEl = document.getElementById(this.decoratorId);
  }
  return this.decoratorEl;
};
EBX_DecoratedField.MessageContainerCSSClass = "ebx_MessageContainer";
EBX_DecoratedField.getMessageContainer = function () {
  if (this.messageContainer === undefined) {
    var decoratorEl = this.getDecoratorElement();
    if (decoratorEl === null) {
      return null;
    }
    this.messageContainer = EBX_Utils.getFirstDirectChildMatchingCSSClass(decoratorEl,
        EBX_DecoratedField.MessageContainerCSSClass);
  }
  if (this.messageContainer === null) {
    this.messageContainer = document.createElement("div");
    this.messageContainer.className = EBX_DecoratedField.MessageContainerCSSClass;
  }
  return this.messageContainer;
};

EBX_DecoratedField.setMessage = function (message) {
  var messageContainer = this.getMessageContainer();
  if (messageContainer === null) {
    // case of read only form node
    return false;
  }
  var strBuf = [];
  var higherSeverity = null;
  var length, i;
  if (message.errors !== undefined) {
    higherSeverity = EBX_FormNodeIndex.SEVERITY_ERROR;
    strBuf.push("<div class=\"ebx_IconError\">");
    length = message.errors.length;
    for (i = 0; i < length; i++) {
      strBuf.push("<div class=\"ebx_Error\">", message.errors[i], "</div>");
    }
    strBuf.push("</div>");
  }
  if (message.warnings !== undefined) {
    if (higherSeverity === null) {
      higherSeverity = EBX_FormNodeIndex.SEVERITY_WARNING;
    }
    strBuf.push("<div class=\"ebx_IconWarning\">");
    length = message.warnings.length;
    for (i = 0; i < length; i++) {
      strBuf.push("<div class=\"ebx_Warning\">", message.warnings[i], "</div>");
    }
    strBuf.push("</div>");
  }
  if (message.infos !== undefined) {
    if (higherSeverity === null) {
      higherSeverity = EBX_FormNodeIndex.SEVERITY_INFO;
    }
    strBuf.push("<div class=\"ebx_IconInfo\">");
    length = message.infos.length;
    for (i = 0; i < length; i++) {
      strBuf.push("<div class=\"ebx_Info\">", message.infos[i], "</div>");
    }
    strBuf.push("</div>");
  }

  EBX_Loader.onMouseReleasedOnce(EBX_DecoratedField.setMessageDeferred, {
    content: strBuf.join("")
  }, this);

  var decoratorElement = this.getDecoratorElement();

  EBX_Utils.removeCSSClass(decoratorElement, "ebx_FieldInError");
  EBX_Utils.removeCSSClass(decoratorElement, "ebx_FieldInWarning");
  EBX_Utils.removeCSSClass(decoratorElement, "ebx_FieldInInfo");

  if (higherSeverity === EBX_FormNodeIndex.SEVERITY_ERROR) {
    EBX_Utils.addCSSClass(decoratorElement, "ebx_FieldInError");
  }
  if (higherSeverity === EBX_FormNodeIndex.SEVERITY_WARNING) {
    EBX_Utils.addCSSClass(decoratorElement, "ebx_FieldInWarning");
  }
  if (higherSeverity === EBX_FormNodeIndex.SEVERITY_INFO) {
    EBX_Utils.addCSSClass(decoratorElement, "ebx_FieldInInfo");
  }

  return higherSeverity;
};
EBX_DecoratedField.setMessageDeferred = function (args) {
  var messageContainer = this.getMessageContainer();

  // If there is no message, remove message element.
  if (args.content.length === 0) {
    if (messageContainer.parentNode) {
      messageContainer.parentNode.removeChild(this.getMessageContainer());
      messageContainer.innerHTML = "";
    }
  } else { // Else append to decorator field.
    if (!messageContainer.parentNode) {
      this.getDecoratorElement().appendChild(messageContainer);
    }
    this.getMessageContainer().innerHTML = args.content;
  }
};
EBX_DecoratedField.setWaiting = function (isWaiting) {
  if (this.isWaiting === undefined) {
    this.isWaiting = 0;
  }

  if (isWaiting === true) {
    EBX_FormPresenterStatusIndicator.incrementWaiting();
    this.isWaiting++;
  } else {
    EBX_FormPresenterStatusIndicator.decrementWaiting();
    this.isWaiting--;
  }

  // just in case...
  if (this.isWaiting < 0) {
    this.isWaiting = 0;
  }

  // this.refreshStatusFlag();
};
EBX_DecoratedField.refreshStatusFlag = function () {
  /*
   if (this.statusFlag === undefined) {
   var decoratorElement = this.getDecoratorElement();
   this.statusFlag = EBX_Utils.getFirstDirectChildMatchingCSSClass(decoratorElement, "ebx_FieldStatusFlag");
   }

   if (this.isWaiting === 1) {
   EBX_Utils.addCSSClass(this.statusFlag, "ebx_FieldStatusFlag_waiting");
   } else if (this.isWaiting === 0) {
   EBX_Utils.removeCSSClass(this.statusFlag, "ebx_FieldStatusFlag_waiting");
   }
   */
};

function EBX_FormTerminalNode(path, formNode) {
  this.path = path;
  this.trElementId = formNode.trId;
  this.editorName = formNode.editorName;
  this.editorArgs = formNode.editorArgs;
  this.neutralCssClass = formNode.neutralCssClass;
  this.decoratorId = formNode.decoId;
  this.inputName = formNode.inputName;
  // not used for the moment
  /*
   this.eventBeforeValueChanged = formNode.eventBeforeValueChanged;
   */
  this.eventAfterValueChanged = formNode.eventAfterValueChanged;
  this.isAPV = formNode.isAPV;
  this.isAjaxValueSynch = formNode.isAjaxValueSynch;
  this.messageDisplayed = {};
}

EBX_FormTerminalNode.prototype = {
  constructor: EBX_FormTerminalNode,

  focus: function () {
    // TODO CCH
  },

  getValue: function () {
    // TODO CCH complex case
    return this.getEditor().getValue();
  },

  setValue: function (value) {
    // TODO CCH complex case
    return this.getEditor().setValue(value);
  },

  setMandatory: EBX_FormNodeIndex.setMandatoryIndicator,

  serialize: function () {
    // TODO CCH complex case
    return EBX_FormPresenter.parameterName + "=" + this.inputName + "&" + this.getEditor().serialize();
  },

  setInherit: function () {
    // TODO CCH
  },

  setOverwrite: function () {
    // TODO CCH
  },

  setMessageSuper: EBX_DecoratedField.setMessage,
  setMessage: function (message) {
    this.messageDisplayed = message;
    var higherSeverity = this.setMessageSuper(message);
    this.setSeverityFlag(higherSeverity);
  },
  getMessage: function () {
    return this.messageDisplayed;
  },
  getTRElement: EBX_FormNodeLine.getTRElement,
  getParent: EBX_FormNodeLine.getParent,
  setSeverityFlag: EBX_FormNodeLine.setSeverityFlag,

  getEditor: EBX_DecoratedField.getEditor,
  getDecoratorElement: EBX_DecoratedField.getDecoratorElement,
  getMessageContainer: EBX_DecoratedField.getMessageContainer,
  setWaiting: EBX_DecoratedField.setWaiting,
  refreshStatusFlag: EBX_DecoratedField.refreshStatusFlag
};

function EBX_FormSubTerminalNode(path, formNode) {
  this.path = path;
  this.trElementId = formNode.trId;
  this.editorName = formNode.editorName;
  this.editorArgs = formNode.editorArgs;
  this.neutralCssClass = formNode.neutralCssClass;
  this.decoratorId = formNode.decoId;
  this.inputName = formNode.inputName;
  // not used for the moment
  /*
   this.eventBeforeValueChanged = formNode.eventBeforeValueChanged;
   */
  this.eventAfterValueChanged = formNode.eventAfterValueChanged;
  this.isAPV = formNode.isAPV;
  this.isAjaxValueSynch = formNode.isAjaxValueSynch;
  this.messageDisplayed = {};
}

EBX_FormSubTerminalNode.prototype = {
  constructor: EBX_FormSubTerminalNode,

  focus: function () {
    // TODO CCH
  },

  getValue: function () {
    // TODO CCH complex case
    return this.getEditor().getValue();
  },

  setValue: function (value) {
    // TODO CCH complex case
    return this.getEditor().setValue(value);
  },

  setMandatory: EBX_FormNodeIndex.setMandatoryIndicator,

  serialize: function () {
    // TODO CCH complex case
    return EBX_FormPresenter.parameterName + "=" + this.inputName + "&" + this.getEditor().serialize();
  },

  setMessageSuper: EBX_DecoratedField.setMessage,
  setMessage: function (message) {
    this.messageDisplayed = message;
    var higherSeverity = this.setMessageSuper(message);
    this.setSeverityFlag(higherSeverity);
  },
  getMessage: function () {
    return this.messageDisplayed;
  },
  getTRElement: EBX_FormNodeLine.getTRElement,
  getParent: EBX_FormNodeLine.getParent,
  setSeverityFlag: EBX_FormNodeLine.setSeverityFlag,

  getEditor: EBX_DecoratedField.getEditor,
  getDecoratorElement: EBX_DecoratedField.getDecoratorElement,
  getMessageContainer: EBX_DecoratedField.getMessageContainer,
  setWaiting: EBX_DecoratedField.setWaiting,
  refreshStatusFlag: EBX_DecoratedField.refreshStatusFlag
};

function EBX_SubTerminalRawNode(path, formNode) {
  this.path = path;
  this.editorName = formNode.editorName;
  this.editorArgs = formNode.editorArgs;
  this.decoratorId = formNode.decoId;
  this.inputName = formNode.inputName;
  // not used for the moment
  /*
   this.eventBeforeValueChanged = formNode.eventBeforeValueChanged;
   */
  this.eventAfterValueChanged = formNode.eventAfterValueChanged;
  this.isAPV = formNode.isAPV;
  this.isAjaxValueSynch = formNode.isAjaxValueSynch;
  this.messageDisplayed = {};
}

EBX_SubTerminalRawNode.prototype = {
  constructor: EBX_FormSubTerminalNode,

  getValue: function () {
    return this.getEditor().getValue();
  },

  setValue: function (value) {
    return this.getEditor().setValue(value);
  },

  setMandatory: EBX_FormNodeIndex.setMandatoryIndicator,

  serialize: function () {
    return EBX_FormPresenter.parameterName + "=" + this.inputName + "&" + this.getEditor().serialize();
  },

  getEditor: EBX_DecoratedField.getEditor,
  getDecoratorElement: EBX_DecoratedField.getDecoratorElement,
  getMessageContainer: EBX_DecoratedField.getMessageContainer,
  setMessage: function (message) {
    this.messageDisplayed = message;
    EBX_DecoratedField.setMessage.call(this, message);
  },
  getMessage: function () {
    return this.messageDisplayed;
  },
  setWaiting: EBX_DecoratedField.setWaiting,
  refreshStatusFlag: EBX_DecoratedField.refreshStatusFlag
};

/* END Form nodes */

/* START Form presenter */

function EBX_FormPresenter() {
}

EBX_FormPresenter.addAPVElementListener = function (element) {
  if (element.tagName == "SELECT") {
    // particular case for <select>: onchange is better than blur
    YAHOO.util.Event.addListener(element, "change", EBX_FormPresenter.blurFieldListener, element);
  } else {
    YAHOO.util.Event.addListener(element, "blur", EBX_FormPresenter.blurFieldListener, element);
  }
};

EBX_FormPresenter.blurFieldListener = function (event, element) {
  EBX_FormPresenter.stackElementForValidation(element);
};

EBX_FormPresenter.callComponentEvent = function (componentEvent, value) {
  if (componentEvent === undefined) {
    return true;
  }
  try {
    var fn = eval(componentEvent.fn);
    return fn.call(window, value, componentEvent.arg);
  } catch (error) {
    EBX_UserMessageManager.addMessage(
        "JsFunctionCall on widget<br/>Error on calling <i>" + componentEvent.fn + "</i> :<br/><b>" + error.message
        + "</b>", EBX_UserMessageManager.ERROR);
    return false;
  }
};

/**
 * This method can be used by components to request the validation.
 */
EBX_FormPresenter.stackElementForValidation = function (element) {
  var id = element.id;

  var path = EBX_FormNodeIndex.fieldsIdPath[id];
  if (path === undefined) {
    return;
  }

  EBX_FormPresenter.stackPathForValidation(path);
};
EBX_FormPresenter.pendingPathsToValidate = [];
EBX_FormPresenter.pendingValidateRequest = null;
EBX_FormPresenter.stackPathForValidation = function (path) {
  EBX_FormPresenter.pendingPathsToValidate.push(path);
  clearTimeout(EBX_FormPresenter.pendingValidateRequest);
  EBX_FormPresenter.pendingValidateRequest = setTimeout(function () {
    EBX_FormPresenter.stackListPathForValidation(EBX_FormPresenter.pendingPathsToValidate,
        EBX_FormPresenter.prevalidateRequestParameter);
    EBX_FormPresenter.pendingPathsToValidate = [];
  }, 20);
};
EBX_FormPresenter.stackListPathForValidationOnPaste = function (paths) {
  EBX_FormPresenter.stackListPathForValidation(paths, EBX_FormPresenter.prevalidateForPasteRequestParameter);
};
EBX_FormPresenter.stackListPathForValidation = function (paths, requestParameter) {
  var nodesToPrevalidate = [];
  var nodesToValueSynch = [];
  for (var i = 0, length = paths.length; i < length; i++) {
    var path = paths[i];
    var formNode = EBX_FormNodeIndex.getFormNode(path);
    if (formNode === null) {
      continue;
    }

    if (formNode.isAPV === true) {
      nodesToPrevalidate.push(formNode);
      continue;
    }

    if (formNode.isAjaxValueSynch === true) {
      nodesToValueSynch.push(formNode);
      continue;
    }

    // not used for the moment
    /*
     var canSend = EBX_FormPresenter.callComponentEvent(formNode.eventBeforeValueChanged, formNode.getValue());
     if (canSend !== true) {
     return;
     }
     */

    EBX_FormPresenter.callComponentEvent(formNode.eventAfterValueChanged, formNode.getValue());
  }
  if (nodesToPrevalidate.length > 0) {
    EBX_FormPresenter.prevalidateList(nodesToPrevalidate, requestParameter);
  }
  if (nodesToValueSynch.length > 0) {
    EBX_FormPresenter.setValueSynch(nodesToValueSynch);
  }
};

/**
 * This method can be used by components to request the update.
 */
EBX_FormPresenter.stackElementForUpdate = function (element) {
  var id = element.id;

  var path = EBX_FormNodeIndex.fieldsIdPath[id];
  if (path === undefined) {
    return;
  }

  EBX_FormPresenter.stackPathForUpdate(path, false);
};
/**
 *
 * @param path {string}
 * @param displayUpdateMessage {boolean}
 */
EBX_FormPresenter.stackPathForUpdate = function (path, displayUpdateMessage) {
  EBX_FormPresenter.stackPathListForUpdate([path], displayUpdateMessage);
};
/**
 * Ask server the updated values for given paths, a single request is sent.
 *
 * Paths not leading to an [EBX_FormNode] are ignored.
 *
 * @param pathList {string[]}
 * @param displayUpdateMessage {boolean}
 */
EBX_FormPresenter.stackPathListForUpdate = function (pathList, displayUpdateMessage) {
  var formNodeList = [];
  for (var i = 0, length = pathList.length; i < length; i++) {
    var formNode = EBX_FormNodeIndex.getFormNode(pathList[i]);
    if (formNode !== null) {
      formNodeList.push(formNode);
    }
  }
  EBX_FormPresenter.update(formNodeList, displayUpdateMessage);
};

EBX_FormPresenter.stackPathForReset = function (path, displayUpdateMessage) {
  var formNode = EBX_FormNodeIndex.getFormNode(path);
  if (formNode === null) {
    return;
  }

  EBX_FormPresenter.reset(formNode, displayUpdateMessage);
};

EBX_FormPresenter.globalAJAXResponseListeners = [];
EBX_FormPresenter.addGlobalAJAXResponseListener = function (fn, scope, additionnalArgs) {
  EBX_FormPresenter.globalAJAXResponseListeners.push({
    fn: fn,
    scope: scope,
    args: additionnalArgs
  });
};

EBX_FormPresenter.dataSource = new YAHOO.util.XHRDataSource();
EBX_FormPresenter.dataSource.responseType = YAHOO.util.DataSource.TYPE_TEXT;
EBX_FormPresenter.dataSource.connXhrMode = "queueRequests";
EBX_FormPresenter.dataSource.connMethodPost = true;
EBX_FormPresenter.dataSource.liveData = EBX_FormPresenter.baseURL;
EBX_FormPresenter.dataSource.handleResponse = function (oRequest, oRawResponse, oCallback, oCaller, tId) {
  var parsedJSONResponse = null, formNodes = oCallback.argument, formNode, i, len;

  if (EBX_Utils.isArray(formNodes) === false) {
    formNode = formNodes;
    formNodes = [];
    formNodes.push(formNode);
  }

  if (oRawResponse.responseText !== "") {
    parsedJSONResponse = YAHOO.lang.JSON.parse(oRawResponse.responseText);
    EBX_FormPresenter.receive(parsedJSONResponse);
    EBX_FormPresenter.callGlobalAJAXResponseListeners(oCallback.eventType, formNodes, parsedJSONResponse);
  }

  for (i = 0, len = formNodes.length; i < len; i++) {
    formNode = formNodes[i];
    formNode.setWaiting(false);
    EBX_FormPresenter.callComponentEvent(formNode.eventAfterValueChanged, formNode.getValue());
  }
};

// This request only set the user input in the value context if it is valid according to the defined data type.
EBX_FormPresenter.setValueSynch = function (formNodeOrList) {
  EBX_FormPresenter.dataSource.liveData = EBX_FormPresenter.baseURL;
  var request = "";
  if (EBX_Utils.isArray(formNodeOrList) === true) {
    for (i = 0, len = formNodeOrList.length; i < len; i++) {
      formNodeOrList[i].setWaiting(true);
      request += "&" + formNodeOrList[i].serialize();
    }
  } else {
    request = formNodeOrList.serialize();
  }

  EBX_FormPresenter.dataSource.sendRequest(request + EBX_FormPresenter.setValueSynchRequestParameter, {
    failure: EBX_FormPresenter.receiveFailure,
    argument: formNodeOrList,
    eventType: "setValueSynch"
  });
};

//This request set the user input in the value context if it is valid according to the
// defined data type and, then check the defined constraints.
EBX_FormPresenter.prevalidateList = function (formNodes, requestParameter) {
  EBX_FormPresenter.dataSource.liveData = EBX_FormPresenter.baseURL;

  var request = "";
  if (EBX_Utils.isArray(formNodes) === true) {
    for (i = 0, len = formNodes.length; i < len; i++) {
      formNodes[i].setWaiting(true);
      request += "&" + formNodes[i].serialize();
    }
  }

  EBX_FormPresenter.dataSource.sendRequest(request + requestParameter, {
    failure: EBX_FormPresenter.receiveFailure,
    argument: formNodes,
    eventType: "prevalidate"
  });
};

/**
 * This request ask the up to date value of the given form node to the value context.
 * @param formNodeList {EBX_FormNode<Object>[]}
 * @param displayUpdateMessage {boolean}
 */
EBX_FormPresenter.update = function (formNodeList, displayUpdateMessage) {
  EBX_FormPresenter.dataSource.liveData = EBX_FormPresenter.baseURL;

  var request = EBX_FormPresenter.displayUpdateMessage + "=" + displayUpdateMessage;
  for (var i = 0, length = formNodeList.length; i < length; i++) {
    var formNode = formNodeList[i];
    formNode.setWaiting(true);
    request += "&" + EBX_FormPresenter.parameterName + "=" + formNode.inputName;
  }

  EBX_FormPresenter.dataSource.sendRequest(request + EBX_FormPresenter.updateRequestParameter, {
    failure: EBX_FormPresenter.receiveFailure,
    argument: formNodeList,
    eventType: "update"
  });
};

// This request sets and returns the persisted value of the given form node to the value context.
EBX_FormPresenter.reset = function (formNode, displayUpdateMessage) {
  EBX_FormPresenter.dataSource.liveData = EBX_FormPresenter.baseURL;
  formNode.setWaiting(true);
  var request = EBX_FormPresenter.parameterName + "=" + formNode.inputName;
  request += "&" + EBX_FormPresenter.displayUpdateMessage + "=" + displayUpdateMessage;
  EBX_FormPresenter.dataSource.sendRequest(request + EBX_FormPresenter.resetRequestParameter, {
    failure: EBX_FormPresenter.receiveFailure,
    argument: formNode,
    eventType: "reset"
  });
};
EBX_FormPresenter.resetRecord = function (recordId, formNodesToUpdate) {
  var request, i, len;

  EBX_FormPresenter.dataSource.liveData = EBX_FormPresenter.baseURL;

  request = EBX_FormPresenter.reset_recordId_pName + "=" + recordId;

  if (EBX_Utils.isArray(formNodesToUpdate) === true) {
    for (i = 0, len = formNodesToUpdate.length; i < len; i++) {
      formNodesToUpdate[i].setWaiting(true);
      request += "&" + EBX_FormPresenter.parameterName + "=" + formNodesToUpdate[i].inputName;
    }
  }

  EBX_FormPresenter.dataSource.sendRequest(request + EBX_FormPresenter.resetRequestParameter, {
    failure: EBX_FormPresenter.receiveFailure,
    argument: formNodesToUpdate,
    eventType: "resetRecord"
  });
};

EBX_FormPresenter.updateDataSource = new YAHOO.util.XHRDataSource();
EBX_FormPresenter.updateDataSource.responseType = YAHOO.util.DataSource.TYPE_TEXT;
EBX_FormPresenter.updateDataSource.connXhrMode = "queueRequests";
EBX_FormPresenter.updateDataSource.connMethodPost = true;
EBX_FormPresenter.updateDataSource.handleResponse = function (oRequest, oRawResponse, oCallback, oCaller, tId) {
  var json = YAHOO.lang.JSON.parse(oRawResponse.responseText), i, len;

  if (json.length === 0) {
    return;
  }

  if (json[0].messages !== "") {
    ebx_alert(json[0].messages);
  }

  var pathsToUpdate = json[1].map(function (item) {
    return item.path
  });
  EBX_FormPresenter.stackPathListForUpdate(pathsToUpdate, true);
};

//This request ask the up to date value of the given form node to the value context.
EBX_FormPresenter.updateFromSubSession = function () {
  EBX_FormPresenter.updateDataSource.liveData = EBX_FormPresenter.updateRequestFromSubSession;
  EBX_FormPresenter.updateDataSource.sendRequest("");
};

EBX_FormPresenter.receiveFailure = function (oRequest, oParsedResponse, singleFormNodeOrList) {
  if (oParsedResponse.status == 401) {
    EBX_Loader.gotoTimeoutPage();
  } else {
    // TODO CCH it could be beautiful to add an iFrame with the result of the page (whole HTML content)
    // oParsedResponse.responseText
    // TODO CCH Filter the response code so that user is not annoyed by error messages which he do not bother.
    // EBX_UserMessageManager.addMessage("Error #" + oParsedResponse.status + ": " + oParsedResponse.statusText, EBX_UserMessageManager.ERROR);
  }
  if (EBX_Utils.isArray(singleFormNodeOrList)) {
    singleFormNodeOrList.forEach(function (formNode) {
      formNode.setWaiting(false)
    });
  } else {
    singleFormNodeOrList.setWaiting(false);
  }

};

EBX_FormPresenter.receive = function (response) {
  if (response.update !== undefined) {
    var update = response.update, i;
    var length = update.length;
    for (i = 0; i < length; i++) {
      var updateItem = update[i];
      var nodePath = updateItem.path;
      var formNode = EBX_FormNodeIndex.getFormNode(nodePath);

      // can happen if this method is called from the grid edit
      // the grid edit didn't load the widgets, but had generate an APV document that contains info
      if (formNode === null) {
        continue;
      }

      // message
      if (updateItem.message !== undefined) {
        formNode.setMessage(updateItem.message);
      } else {
        formNode.setMessage({});
      }

      // value
      if (updateItem.value !== undefined) {
        formNode.setValue(updateItem.value);
      }
    }
  }
};

EBX_FormPresenter.callGlobalAJAXResponseListeners = function (eventType, widgetFormNodesEventSource,
    parsedJSONResponse) {
  var i, len, listener, fn;

  for (i = 0, len = EBX_FormPresenter.globalAJAXResponseListeners.length; i < len; i++) {
    listener = EBX_FormPresenter.globalAJAXResponseListeners[i];
    fn = eval(listener.fn);
    fn.call(listener.scope, eventType, widgetFormNodesEventSource, parsedJSONResponse, listener.args);
  }
};

/* END Form presenter */

/* START Form Presenter Status Indicator */

function EBX_FormPresenterStatusIndicator() {
}

EBX_FormPresenterStatusIndicator.waiting = 0;

EBX_FormPresenterStatusIndicator.incrementWaiting = function () {
  var refreshNeeded = false;
  if (EBX_FormPresenterStatusIndicator.waiting === 0) {
    refreshNeeded = true;
  }

  EBX_FormPresenterStatusIndicator.waiting++;

  if (refreshNeeded) {
    EBX_FormPresenterStatusIndicator.refreshContent();
  }
};

EBX_FormPresenterStatusIndicator.decrementWaiting = function () {
  var refreshNeeded = false;
  if (EBX_FormPresenterStatusIndicator.waiting === 1) {
    refreshNeeded = true;
  }

  EBX_FormPresenterStatusIndicator.waiting--;
  // just in case...
  if (EBX_FormPresenterStatusIndicator.waiting < 0) {
    EBX_FormPresenterStatusIndicator.waiting = 0;
  }

  if (refreshNeeded) {
    EBX_FormPresenterStatusIndicator.refreshContent();
    EBX_FormPresenterStatusIndicator.callListener();
  }
};

EBX_FormPresenterStatusIndicator.isWaiting = function () {
  return EBX_FormPresenterStatusIndicator.waiting > 0;
};

EBX_FormPresenterStatusIndicator.elementId = "ebx_FormStatusFlag";
EBX_FormPresenterStatusIndicator.element = null;
EBX_FormPresenterStatusIndicator.elementEnabledCSSClass = "ebx_FormStatusFlagEnabled";

EBX_FormPresenterStatusIndicator.refreshContent = function () {
  if (EBX_FormPresenterStatusIndicator.element === null) {
    EBX_FormPresenterStatusIndicator.element = document.getElementById(EBX_FormPresenterStatusIndicator.elementId);
    if (EBX_FormPresenterStatusIndicator.element === null) {
      return;
    }
  }

  if (EBX_FormPresenterStatusIndicator.isWaiting()) {
    EBX_Utils.addCSSClass(EBX_FormPresenterStatusIndicator.element,
        EBX_FormPresenterStatusIndicator.elementEnabledCSSClass);
  } else {
    EBX_Utils.removeCSSClass(EBX_FormPresenterStatusIndicator.element,
        EBX_FormPresenterStatusIndicator.elementEnabledCSSClass);
  }
};

EBX_FormPresenterStatusIndicator.listenerToCallOnWaitingEnd = null;

EBX_FormPresenterStatusIndicator.setListenerOnWaitingEnd = function (listener) {
  if (EBX_FormPresenterStatusIndicator.isWaiting()) {
    EBX_FormPresenterStatusIndicator.listenerToCallOnWaitingEnd = listener;
  } else {
    window.setTimeout(listener, 0);
  }
};

EBX_FormPresenterStatusIndicator.callListener = function () {
  if (EBX_FormPresenterStatusIndicator.listenerToCallOnWaitingEnd !== null) {
    window.setTimeout(EBX_FormPresenterStatusIndicator.listenerToCallOnWaitingEnd, 0);
    EBX_FormPresenterStatusIndicator.listenerToCallOnWaitingEnd = null;
  }
};

/* END Form Presenter Status Indicator */
