/*
 * Copyright TIBCO Software Inc. 2001-2021. All rights reserved.
 */

/** ********* START YUI JSON Ajax Tree ********** */
function EBX_AjaxTreesRegister() {}

EBX_AjaxTreesRegister.ebx_AjaxTrees = [];

/* In case of redirection page, for example, loading trees in AJAX is unwanted, non-performance and bug-risked because of changing page */
EBX_AjaxTreesRegister.cancelTreesLoading = false;

EBX_AjaxTreesRegister.buildTrees = function() {
	EBX_Loader.changeTaskState(EBX_Loader_taskId_building_trees, EBX_Loader.states.processing);

	if (EBX_AjaxTreesRegister.cancelTreesLoading === true) {
		EBX_Loader.changeTaskState(EBX_Loader_taskId_building_trees, EBX_Loader.states.done);
		return;
	}

	for ( var treeName in EBX_AjaxTreesRegister.ebx_AjaxTrees) {
		EBX_AjaxTreesRegister.ebx_AjaxTrees[treeName].init();
	}

	EBX_Loader.changeTaskState(EBX_Loader_taskId_building_trees, EBX_Loader.states.done);
};

EBX_AjaxTreesRegister.createAndRegisterTree = function (treeName, containerDivID, getExpandURLFn, getCollapseURLFn,
		isRealignEnabled, callbacks) {
	if (EBX_AjaxTreesRegister.cancelTreesLoading === true) {
		return;
	}

	if (EBX_AjaxTreesRegister.ebx_AjaxTrees[treeName] !== undefined) {
		return;
	}

	var tree = new EBX_AjaxTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, isRealignEnabled, callbacks);
	EBX_AjaxTreesRegister.ebx_AjaxTrees[treeName] = tree;

	// if the task EBX_AjaxTreesRegister.buildTrees is done, init manually the tree
	if (EBX_Loader.getTaskFromId(EBX_Loader_taskId_building_trees).state === EBX_Loader.states.done) {
		tree.init();
	}
};

// map treeName->object{service:{html:"someHTML",js:"jsCommand"},move:{html:"",js:""}, etc.}
var EBX_AJAX_TREE_BUTTONS = [];

function ebx_getAjaxTree(treeName) {
	return EBX_AjaxTreesRegister.ebx_AjaxTrees[treeName];
}

function EBX_AjaxTree(ajaxTreeName, treeContainerDivID, getExpandURLFn, getCollapseURLFn, isRealignEnabled, callbacks) {
	this.treeName = ajaxTreeName;
	this.containerDivID = treeContainerDivID;
	this.getExpandURLFn = getExpandURLFn;
	this.getCollapseURLFn = getCollapseURLFn;
	this.callbacks = callbacks;
	this.previousScrollLeft = null;
	this.nodeActionDivs = null;
	this.nodeActionDivsNeedsRefresh = true;
	this.isRealignEnabled = isRealignEnabled;
	this.isTheFirstExpand = true;

	this.isCleaningChildrenWhileExpanding = false;

	this.tooltipHolder = new EBX_Utils.TooltipHolder();

	this.init = function () {
		YAHOO.util.Event.onContentReady(this.containerDivID, this.onContentReady, this, true);

		var advancedSearchPane = document.getElementById("ebx_WorkspaceAdvancedSearch");

		this.tooltipHolder.addTooltip(
        document.getElementById("ebx_AdvancedSearchQuickSearch"),
				{
					text: EBX_AjaxTree.messages.quickSearchTooltip,
					position: "bottom"
				},
				function (quickSearchInput) {
					if (advancedSearchPane == null || !EBX_Utils.matchCSSClass(advancedSearchPane,
							"ebx_AdvancedSearchPaneOpened")) {
						quickSearchInput.focus();
						return true;
					}

					return false;
				}
		);

		var advancedSearchToggleButton = document.getElementById("ebx_AdvancedSearchExpandCollapse");
		if (advancedSearchToggleButton != null) {
			this.tooltipHolder.addTooltip(advancedSearchToggleButton, {
				text: EBX_AjaxTree.messages.advancedSearchTooltip,
				position: "bottom"
			}, function (advancedSearchPane) {
				return advancedSearchPane != null && !EBX_Utils.matchCSSClass(advancedSearchPane,
						"ebx_AdvancedSearchPaneOpened");
			});
			advancedSearchToggleButton.addEventListener("click", this.tooltipHolder.hideAll);
		}
	};

	/**
	 * Display filter icon on members if a search is applied.
	 *
	 * @param {AdvancedSearch.Next} next
	 * @param {AdvancedSearch.Action} action
	 * @param {AdvancedSearchState} state
	 * @return {AdvancedSearchState}
	 */
	this.updateFilterMatchIcons = function(next,  action, state){
		var nextState = next(action, state);
		var yuiTree = this.getYuiTree();
		if(yuiTree != null) {
			var isFilterApplied = AdvancedSearchModel.isSearchApplied(nextState);
			if(isFilterApplied)
				yuiTree.getEl().classList.add("ebx_MarkMatches");
			else
				yuiTree.getEl().classList.remove("ebx_MarkMatches");
		}
		return nextState;
	}

	this.onContentReady = function() {
		this.build(null);
		AdvancedSearch.registerMiddleware(this.updateFilterMatchIcons.bind(this));

	};

	this.build = function(additionalParameters) {
		this.yuiTree = new YAHOO.widget.TreeView(this.containerDivID);

		// disable the yui click event (expand/collapse by a click on the line) to let links doing their business
		this.yuiTree.subscribe("clickEvent", EBX_Utils.returnFalse);

		this.yuiTree.subscribe("collapse", this.collapseHandler);
		this.yuiTree.subscribe("expand", this.expandHandler);

		this.yuiTree.render();

		if (this.isRealignEnabled) {
			// YAHOO.util.Event.addListener(this.yuiTree._el, "scroll", this.realignNodeActions, null, this);
		}

		var cancelId = ebx_ajaxTreeCreateAndRegisterCancelId(this.yuiTree.getRoot());

		this.expandLine(this.yuiTree.getRoot(), cancelId, true, additionalParameters);
	};

	this.collapseHandler = function(node) {
		var ajaxTree = ebx_getAjaxTree(node.data.ebx_treeName);
		if (ajaxTree === null) {
			return false;// cancel collapse
		}

		if (ajaxTree.isCleaningChildrenWhileExpanding === true) {
			return false;// cancel collapse
		}

		ajaxTree.collapseLine(node);
		return true;// allow collapse
	};

	this.expandHandler = function(node) {
		var ajaxTree = ebx_getAjaxTree(node.data.ebx_treeName);
		if (ajaxTree === null) {
			return false;// cancel expand
		}

		var cancelId = ebx_ajaxTreeCreateAndRegisterCancelId(node);

		ajaxTree.expandLine(node, cancelId, true, null);
		return true;// allow expand
	};

	this.realignNodeActions = function(scrollEvent, forceRealign) {

		var currentScrollLeft = this.yuiTree._el.scrollLeft;

		if (forceRealign !== true && this.previousScrollLeft !== null) {
			if (currentScrollLeft == this.previousScrollLeft) {
				return;
			}
		}

		var nodeActionDivs = this.getNodeActionDivs();
		var i = nodeActionDivs.length;
		while (i--) {
			nodeActionDivs[i].style.left = -currentScrollLeft + "px";
			nodeActionDivs[i].style.position = "absolute";
		}

		this.previousScrollLeft = currentScrollLeft;
	};

	this.getNodeActionDivs = function() {
		if (this.nodeActionDivsNeedsRefresh) {
			this.computeNodeActionDivs();
		}
		return this.nodeActionDivs;
	};

	this.computeNodeActionDivs = function () {
		this.nodeActionDivs = EBX_Utils.getRecursiveChildrenMatchingCSSClass(this.yuiTree._el, "ebx_NodeActions");
		this.nodeActionDivsNeedsRefresh = false;
	};

	this.getYuiTree = function () {
		return this.yuiTree;
	};

	this.expandLine = function (node, cancelId, expanding, additionalParameters) {
		if (!this.getExpandURLFn) {
			return;
		}

		var url = this.getExpandURLFn(node);
		if (url === null) {
			return;
		}

		var ajaxExpander = new EBX_AjaxTreeExpander(node, this, cancelId);
		if (expanding) {
			ajaxExpander.setExpanding();
		}

		if (additionalParameters !== null) {
			ajaxExpander.onExecute(url + additionalParameters);
		} else {
			ajaxExpander.onExecute(url);
		}
		this.nodeActionDivsNeedsRefresh = true;
	};

	this.collapseLine = function(node) {
		if (!this.getCollapseURLFn) {
			return;
		}

		var url = this.getCollapseURLFn(node);
		if (url === null) {
			return;
		}
		var ajaxExpander = new EBX_AjaxTreeExpander(node, this);
		ajaxExpander.setCollapsing();
		ajaxExpander.onExecute(url);

		return true;
	};

	this.setGetExpandURLFn = function(aFunction) {
		this.getExpandURLFn = aFunction;
	};

	this.setGetCollapseURLFn = function(aFunction) {
		this.getCollapseURLFn = aFunction;
	};

	this.getYUINodeById = function(nodeId) {
		for ( var i in this.yuiTree._nodes) {
			if (this.yuiTree._nodes[i].data.id === nodeId) {
				return this.yuiTree._nodes[i];
			}
		}
		return null;
	};

	this.rebuild = function (additionalParameters) {
		this.yuiTree.destroy();
		this.yuiTree = null;
		this.build(additionalParameters);
	};

	this.showCancelHintTooltips = function () {
		this.tooltipHolder.showAll(EBX_Utils.cancel_delayBeforeTooltipsDisappear);
	}.bind(this);
}

EBX_AjaxTree.referredNodeCssClass = "ebx_ReferredNode";
EBX_AjaxTree.messages = {};

function ebx_ajaxTreeExpanderStdFunction(node, fnLoadComplete) {
	if (node === null) {
		return;
	}

	var ajaxTree = ebx_getAjaxTree(node.data.ebx_treeName);
	if (ajaxTree === null) {
		return;
	}

	// expanding tree line is the calling action
	//	ajaxTree.expandLine(node, null);

	fnLoadComplete();
}

function ebx_ajaxTreeRebuild(treeName) {
	var ajaxTree = ebx_getAjaxTree(treeName);
	if (ajaxTree === null) {
		return;
	}

	ajaxTree.rebuild(null);
}

function ebx_ajaxTreeReplaceChildren(treeName, lineId, additionalParameters) {
	var ajaxTree = ebx_getAjaxTree(treeName);
	if (ajaxTree === null) {
		return;
	}

	var yuiTree = ajaxTree.getYuiTree();
	var parentLine = yuiTree.getNodeByProperty('id', lineId);
	if (parentLine === null) {
		ajaxTree.rebuild(additionalParameters);
		return;
	}

	if (parentLine.isLeaf) {
		alert('parent line is leaf');
		return;
	}

	var cancelId = ebx_ajaxTreeCreateAndRegisterCancelId(parentLine);
	ajaxTree.expandLine(parentLine, cancelId, false, additionalParameters);
	parentLine.expanded = true;
}

function ebx_ajaxTreeSetReferred(event, yuiNode) {
	var tableEl = EBX_Utils.getFirstParentMatchingTagName(yuiNode.getContentEl(), "TABLE");
	EBX_Utils.addCSSClass(tableEl, EBX_AjaxTree.referredNodeCssClass);
}

function ebx_ajaxTreeUnsetReferred(event, yuiNode) {
	var tableEl = EBX_Utils.getFirstParentMatchingTagName(yuiNode.getContentEl(), "TABLE");
	EBX_Utils.removeCSSClass(tableEl, EBX_AjaxTree.referredNodeCssClass);
}

function ebx_ajaxTreeBindCycleNodeToItsParent(lineId, targetLineId, treeName) {
	var line = ebx_getAjaxTree(treeName).getYUINodeById(lineId);
	var targetLine = ebx_getAjaxTree(treeName).getYUINodeById(targetLineId);

	var tableEl = EBX_Utils.getFirstParentMatchingTagName(line.getContentEl(), "TABLE");
	YAHOO.util.Event.addListener(tableEl, "mouseover", ebx_ajaxTreeSetReferred, targetLine);
	YAHOO.util.Event.addListener(tableEl, "mouseout", ebx_ajaxTreeUnsetReferred, targetLine);
}

function EBX_AjaxTreeExpander(node, ajaxTree, cancelId) {
	this.expandedNode = node;
	this.isCollapsing = null; // true => collapsing, false => expanding, null => paginating
	this.ajaxTree = ajaxTree;
	this.cancelId = cancelId;
	this.displayButtonTimeout = null;

	/**
	 * Necessary to handle the case where the overlay is destroyed before being created.
	 */
	this.creatingOverlay = false;

	this.onExecute = function (url) {
		if (this.cancelId != null) {
			url += "&cancelableID=" + encodeURIComponent(this.cancelId);
		}

		if (this.isCollapsing !== true) {
			this.createOverlay(this.expandedNode);
		}

		EBX_AjaxTreeExpander.prototype.onExecute.call(this, url);
	};

	this.onGetExceptedResponseCode = function (callerId) {
		if (this.isCollapsing === true) {
			return this.responseCodeOK_RequestResponse;
		}

		return this.responseCodeOK_JSONDoc;
	};

	this.executeCallback = function (callbackName) {
		var callbacks = this.ajaxTree.callbacks;
		if (callbacks == null) {
			return function () {
			};
		}

		var callback = callbacks[callbackName];
		if (callback == null) {
			return function () {
			};
		}

		return callback;
	};

	this.executeCallbackSuccess = this.executeCallback("onSuccess");
	this.executeCallbackError = this.executeCallback("onError");
	this.executeCallbackCancel = this.executeCallback("onCancel");

	this.onExecuteIfOK = function (responseXML, root) {
		this.removeOverlay(this.expandedNode);
		var bodyElement = root.getElementsByTagName('responseBody')[0];
		if (!bodyElement.firstChild) {
			EBX_Logger.log(
					"EBX_AjaxTreeExpander.onExecuteIfOK: Error getting responseBody from response: " + this.getResponseText(),
					EBX_Logger.error);
			this.executeCallbackError();
			return false;
		}


		if (this.isCollapsing === true) {
			// tree.removeChildren recursively collapse and remove all children, causing recursive calls to this callback.
			// Calling a second tree.removeChildren on a node already removed will throw a JS error.
			// This can be avoided by checking if node is still attached to the tree with node.tree != null
			if(this.expandedNode.tree != null) {
				this.ajaxTree.getYuiTree().removeChildren(this.expandedNode);
			}
			this.executeCallbackSuccess();
			return true;
		}

		var jsonString = bodyElement.firstChild.data;

		var jsonObj = YAHOO.lang.JSON.parse(jsonString);
		if (!jsonObj) {
			EBX_Logger.log("EBX_AjaxTreeExpander.onExecuteIfOK: Error getting JSON from response: " + this.getResponseText(),
					EBX_Logger.error);
			this.executeCallbackError();
			return false;
		}

		/* sometimes tree is void, so no more actions are to do */
		if (jsonObj.data === undefined && jsonObj[0] === undefined) {
			this.expandedNode.setNodesProperty('isLeaf', true, true);
			/* run node script (also buttons will disappear) */
			if (this.expandedNode.data.ebx_scriptToExecute !== undefined) {
				window.setTimeout(this.expandedNode.data.ebx_scriptToExecute, 0);
			}
			this.executeCallbackSuccess();
			return true;
		}

		var treeNameAtt = root.attributes.getNamedItem('treeName');
		if (treeNameAtt !== null) {
			var treeName = treeNameAtt.nodeValue;
			if (treeName != this.ajaxTree.treeName) {
				EBX_Logger.log(
						'EBX_AjaxTreeExpander.onExecuteIfOK: Received response is not for current tree [' + this.ajaxTree.treeName
						+ '] but for [' + treeName + '].', EBX_Logger.error);
				this.executeCallbackError();
				return false;
			}
		}

		var callerIdAtt = root.attributes.getNamedItem('callerId');
		if (callerIdAtt !== null) {
			var callerId = callerIdAtt.nodeValue;
			if (callerId != this.expandedNode.data.id) {
				EBX_Logger.log('EBX_AjaxTreeExpander.onExecuteIfOK: Received response is not for current element ['
						+ this.expandedNode.data.id
						+ '] but for caller [' + callerId + '].', EBX_Logger.error);
				this.executeCallbackError();
				return false;
			}
		}

		// remove children
		this.ajaxTree.isCleaningChildrenWhileExpanding = true;// to prevent collapse event during removeChildren()
		var yuiTree = this.ajaxTree.getYuiTree();
		yuiTree.removeChildren(this.expandedNode);
		this.ajaxTree.isCleaningChildrenWhileExpanding = false;// restore initial state

		if (this.expandedNode.isLeaf) {
			this.expandedNode.setNodesProperty('isLeaf', false, true);
			this.expandedNode.setNodesProperty('expanded', true, true);
		}

		var scriptToExecute = "";
		if (this.expandedNode.data.ebx_scriptToExecute !== undefined) {
			scriptToExecute += this.expandedNode.data.ebx_scriptToExecute;
		}

		if (YAHOO.lang.isArray(jsonObj)) {
			for ( var i = 0, len = jsonObj.length; i < len; i++) {
				scriptToExecute += this.ebx_recursivlyAppendNodesToParent(jsonObj[i], this.expandedNode);
			}
		} else {
			scriptToExecute += this.ebx_recursivlyAppendNodesToParent(jsonObj, this.expandedNode);
		}
		this.expandedNode.refresh();

		/* run embedded script */
		window.setTimeout(scriptToExecute, 0);

		this.expandedNode.showChildren();

		if (this.ajaxTree.isTheFirstExpand) {
			this.focusTheSelectedNode();
			this.ajaxTree.isTheFirstExpand = false;
		}

		if (this.ajaxTree.isRealignEnabled) {
			this.ajaxTree.realignNodeActions(null, true);
		}

		this.executeCallbackSuccess();
		return true;
	};

	this.ebx_recursivlyAppendNodesToParent = function(jsonNode, parentNode) {
		var newNode, i;
		var hasChildren = jsonNode.children !== undefined && jsonNode.children.length > 0;
		var data = jsonNode.data;
		var scriptToExecute = "";

		if (data.ebx_scriptToExecute !== undefined) {
			scriptToExecute += data.ebx_scriptToExecute;
		}

		if (data.label !== undefined) {
			// JSON structured tree line
			newNode = this.ebx_buildTreeLine(data, parentNode, hasChildren);
		} else {
			// raw HTML tree line
			newNode = new YAHOO.widget.HTMLNode(data, parentNode, hasChildren);
		}

		newNode.setDynamicLoad(ebx_ajaxTreeExpanderStdFunction, 0);
		if (hasChildren) {
			for (i = 0; i < jsonNode.children.length; i++) {
				scriptToExecute += this.ebx_recursivlyAppendNodesToParent(jsonNode.children[i], newNode);
			}
		}

		return scriptToExecute;
	};

	this.ebx_buildTreeLine = function(jsonNode, parentNode, hasChildren) {

		var lineContent = this.ebx_buildTree_Buttons(jsonNode);

		if (jsonNode.iconCSSClass !== undefined) {
			lineContent.push("<span class=\"", jsonNode.iconCSSClass, "\">", jsonNode.iconText, "</span>");
		}

		lineContent.push("<span class=\"ebx_RawLabel\">");
		{
			if (jsonNode.hriPath !== undefined) {
				lineContent.push("<a href=\"", EBX_Constants.selectHriNodeURL, encodeURIComponent(jsonNode.hriPath), "\">");
			} else if (jsonNode.popupLink !== undefined) {
				lineContent.push("<a href=\"javascript: ebx_openHRINodeInPopup('", jsonNode.popupLink, "');\">");
			}

			lineContent.push(jsonNode.label);

			if (jsonNode.hriPath !== undefined || jsonNode.popupLink !== undefined) {
				lineContent.push("</a>");
			}
		}
		lineContent.push("</span>");

    var className = jsonNode.className;
    if (jsonNode.buttons && jsonNode.buttons.isSelected) {
      className += " " + "ebx_treeLine_selected";
    }

		var newNode = new YAHOO.widget.HTMLNode(lineContent.join(""), parentNode, hasChildren);
		newNode.data.id = jsonNode.id;
		newNode.className = className;
		newNode.data.ebx_treeName = jsonNode.ebx_treeName;
		newNode.isLeaf = jsonNode.isLeaf;
		return newNode;
	};

	// TODO CCH use 1 field for button states
	this.ebx_buildTree_Buttons = function(jsonNode) {
		var lineContent = [];
		var buttons = jsonNode.buttons;
		var displayCheckBox = false;
		var displayMenu = false;
		var displayMove = false;
		var displayMassMove = false;
		var displayAttach = false;
		var displayMoveTo = false;
		var displayCancelMove = false;

		if (buttons !== undefined) {
			displayCheckBox = buttons.checkboxID !== undefined;
			displayMenu = buttons.displayMenuButton;
			displayMove = buttons.displayMoveButton;
			displayMassMove = buttons.displayMassMoveButton;
			displayAttach = buttons.displayAttachButton;
			displayMoveTo = buttons.displayMoveToButton;
			displayCancelMove = buttons.displayCancelMoveButton;
		}
		var displaySpecificButton = jsonNode.specificButton !== undefined;

		var displayButton = displayMassMove || displayCheckBox || displayMenu || displayMove || displayAttach || displayMoveTo || displayCancelMove
				|| displaySpecificButton;

		if (displayButton) {
			lineContent.push("<div class=\"ebx_NodeActions ebx_SmallFormButtons\">");

			if (displayMenu) {
				lineContent.push(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].service.html.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id));
				window.setTimeout(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].service.js.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id), 0);
			}
			if (displayCancelMove) {
				lineContent.push(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].cancelMove.html.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id));
				window.setTimeout(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].cancelMove.js.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id), 0);
			}
			if (displayMove) {
				lineContent.push(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].move.html.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id));
				window.setTimeout(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].move.js.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id), 0);
			}
			if (displayMassMove) {
				lineContent.push(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].massMove.html.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id));
				window.setTimeout(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].massMove.js.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id), 0);
			}
			if (displayMoveTo) {
				lineContent.push(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].moveTo.html.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id));
				window.setTimeout(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].moveTo.js.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id), 0);
			}
			if (displayAttach) {
				lineContent.push(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].attach.html.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id));
				window.setTimeout(EBX_AJAX_TREE_BUTTONS[this.ajaxTree.treeName].attach.js.replace(EBX_Constants.nodeIDFlagRegExp, jsonNode.id), 0);
			}

      if (displayCheckBox) {
        lineContent.push("<label  class=\"ebx_CheckboxButton_Label ebx_emptyLabel\">");
        lineContent.push("<input");
        lineContent.push(" type=\"checkbox\"");
        lineContent.push(" id=\"", buttons.checkboxID, "\"");
        lineContent.push(" class=\"ebx_checkboxCustom\"");
        lineContent.push(" onclick=\"onRowSelection(this, '", jsonNode.id, "')\"");

        if (buttons.isSelected) {
          lineContent.push(" title=\"", EBX_Constants.unselectCheckBox, "\" checked=\"checked\"");
        } else {
          lineContent.push(" title=\"", EBX_Constants.selectCheckBox, "\"");
        }

        lineContent.push("/>");

        lineContent.push("<i class='ebx_checkboxDisplay'>&nbsp;</i>");
        lineContent.push("</label>");
      }

			if (displaySpecificButton) {
				lineContent.push(jsonNode.specificButton);
			}

			lineContent.push("</div>");
		}
		return lineContent;
	};

	this.focusTheSelectedNode = function() {
		var containerEl = document.getElementById(this.ajaxTree.containerDivID);

		var selectedTableEl = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(containerEl, "ebx_Selected");
		if (selectedTableEl === null) {
			return;
		}

		/*
		 var layoutUnitParentEl = EBX_Utils.getFirstParentMatchingCSSClass(containerEl, "yui-layout-unit");

		 if (EBX_Utils.matchCSSClass(layoutUnitParentEl, "yui-layout-scroll") === false) {
		 return;
		 }

		 var layoutBodyParentEl = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(layoutUnitParentEl, "yui-layout-bd");

		 var scrollTop = selectedTableEl.offsetTop - layoutBodyParentEl.offsetHeight / 2 + selectedTableEl.offsetHeight / 2;

		 layoutBodyParentEl.scrollTop = scrollTop;
		 */
		var scrollingPane = EBX_Utils.getFirstParentMatchingCSSClass(containerEl, "ebx_ScrollingPane");
		if (scrollingPane === null) {
			var yuiScrollingPaneParent = EBX_Utils.getFirstParentMatchingCSSClass(containerEl, "yui-layout-scroll");
			if (yuiScrollingPaneParent === null) {
				return;
			}
			scrollingPane = EBX_Utils.getFirstRecursiveChildMatchingCSSClass(yuiScrollingPaneParent, "yui-layout-bd");
			if (scrollingPane === null) {
				return;
			}
		}

		var selectedTableOffsetParent = selectedTableEl.offsetParent;
		var scrollingPaneOffsetParent = scrollingPane.offsetParent;

		var offsetTop = selectedTableEl.offsetTop;
		if (selectedTableOffsetParent === scrollingPaneOffsetParent) {
			offsetTop -= scrollingPane.offsetTop;
		}

		var scrollTop = offsetTop - scrollingPane.offsetHeight / 2 + selectedTableEl.offsetHeight / 2;

		scrollingPane.scrollTop = scrollTop;
	};

	this.onExecuteIfKO = function (responseXML) {
		if (this.isCollapsing !== true) {
			this.removeOverlay(this.expandedNode);
		}

		this.executeCallbackError();
	};

	this.setCollapsing = function () {
		this.isCollapsing = true;
	};

	this.setExpanding = function () {
		this.isCollapsing = false;
	};

	this.createOverlay = function (node) {
		this.creatingOverlay = true;

		requestAnimationFrame(function () {
			if (!this.creatingOverlay) {
				return;
			}

			var div = EBX_Utils.createDiv;
			var button = EBX_Utils.createButton;

			var containerEl = node.getEl();
			var contentEl = node.getContentEl();
			var childrenEl = node.getChildrenEl();

			// 0. Save button states
			{
				function fillSpecificInputs(array, element, tagName) {
					var inputs = element.getElementsByTagName(tagName);
					for (var i = 0; i < inputs.length; i++) {
						array.push({
							input: inputs[i]
						});
					}
				}

				function fillInputs(array, element) {
					if (element == null) {
						return;
					}

					fillSpecificInputs(array, element, "input");
					fillSpecificInputs(array, element, "button");
					fillSpecificInputs(array, element, "a");
				}

				node.allInputs = [];

				// expand/collapse button
				node.allInputs.push({
					input: containerEl.getElementsByTagName("a")[0]
				});

				fillInputs(node.allInputs, contentEl);
				fillInputs(node.allInputs, childrenEl);

				EBX_Utils.forEach(node.allInputs, function (conf) {
					var input = conf.input;
					if (input == null) {
						return;
					}

					conf.tabIndex = input.tabIndex;
					input.tabIndex = -1;
					input.blur();
				});
			}

			// 1. Filler

			var contentHeight = 0;
			if (contentEl != null) {
				var contentRect = contentEl.getBoundingClientRect();
				contentHeight = contentRect.height;
			}

			var containerHeight = 0;
			var childrenRect = containerEl.getBoundingClientRect();
			containerHeight = childrenRect.height;

			var containerMinHeight = (EBX_Utils.isDisplayDensityCompact()) ? 102 : 132;

			if (containerHeight < containerMinHeight) {
				var filler = (
						div({"class": "ebx_TreeWaitPanel_Filler"})
				);

				containerEl.appendChild(filler);
				node.filler = filler;
			}

			// 2. Overlay

			var onCancel = function onCancel() {
				var cancelId = node.cancelId;

				if (cancelId != null) {
					this.removeOverlay(node);
					this.executeCallbackCancel();
					ajaxTree.showCancelHintTooltips();
					EBX_Utils.cancelRequest(cancelId);

					if (this.isCollapsing === false) {
						node.collapse();
					}
				}
			}.bind(this);

			var overlay = (
					div({"class": "ebx_TreeWaitPanel_Container"},
							div({
										"class": "ebx_TreeWaitPanel_Panel ebx_ValueND",
										"style": "margin-top:" + (contentHeight + 5) + "px;"
									},
									div({"class": "ebx_TreeWaitPanel_PanelContent"},
											div({"class": "ebx_TreeWaitPanel_Icon ebx_IconAnimWaitBig"}),
											div({"class": "ebx_TreeWaitPanel_Message"},
													EBX_AjaxTree.messages.loading
											),
											div({"class": "ebx_TreeWaitPanel_ButtonContainer"},
													button({
																"class": "ebx_Button ebx_TreeWaitPanel_Button",
																"type": "button",
																"tabindex": "-1",
																"onclick": onCancel
															},
															EBX_AjaxTree.messages.cancel
													)
											)
									)
							)
					)
			);

			containerEl.style.position = "relative";
			containerEl.appendChild(overlay);

			node.overlay = overlay;

			// 3. Animation

			requestAnimationFrame(function () {
				if (!this.creatingOverlay) {
					return;
				}

				var overlay = node.overlay;

				if (overlay != null) {
					overlay.style.opacity = 1;
				}

				var filler = node.filler;
				if (filler != null) {
					filler.style.height = "" + (contentHeight + containerMinHeight - containerHeight) + "px";
				}
			}.bind(this));

			this.displayButtonTimeout = setTimeout(function () {
				var overlay = node.overlay;
				if (overlay == null) {
					return;
				}

				EBX_Utils.addCSSClass(overlay, "ebx_TreeWaitPanel_Long");
			}, EBX_Utils.cancel_delayBeforeButtonAppears);

		}.bind(this));
	}.bind(this);

	this.removeOverlay = function (node) {
		this.creatingOverlay = false;

		if (node.filler != null) {
			node.filler.parentElement.removeChild(node.filler);
			node.filler = null;
		}

		if (node.overlay != null) {
			node.overlay.parentElement.removeChild(node.overlay);
			node.overlay = null;

			if (this.displayButtonTimeout != null) {
				clearTimeout(this.displayButtonTimeout);
			}
			this.displayButtonTimeout = null;
		}

		if (node.allInputs != null) {
			EBX_Utils.forEach(node.allInputs, function (conf) {
				var input = conf.input;
				if (input != null) {
					input.tabIndex = conf.tabIndex;
				}
			});
		}

		node.allInputs = [];
	}.bind(this);
}

EBX_AjaxTreeExpander.prototype = new EBX_AbstractAjaxResponseManager();

function ebx_defaultEndLoadingFn() {

}

function ebx_ajaxTreeCreateAndRegisterCancelId(node) {
	var id = node.data.id || "";
	var cancelCounter = node.cancelCounter || 0;

	var cancelId = EBX_PageId + "_c" + id + "$" + (cancelCounter++).toFixed();

	node.cancelCounter = cancelCounter;
	node.cancelId = cancelId;

	return cancelId;
}

/** ********* END YUI JSON Ajax Tree ********** */

/** ********* START Specifics implementations ********* */

/** ********** START InstanceContentTree *************** */
function ebx_startNewInstanceContentTree(treeName, containerDivID) {
	var getExpandURLFn = function (node) {
		var url = EBX_Constants.getRequestLink(EBX_Constants.instanceContentTreeExpandEvent);
		if (node !== null) {
			if (node.data.isHriNode !== undefined && node.data.isHriNode === true) {
				url += "&" + EBX_Constants.hierarchyNodePath + "=" + node.data.id;
			} else {
				url += "&" + EBX_Constants.nodePath + "=";
				if (!node.isRoot()) {
					url += node.data.id;
				}
			}
		}
		return url;
	};

	var getCollapseURLFn = null;
	EBX_AjaxTreesRegister.createAndRegisterTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, false);
}

function ebx_navigationTreeReplaceNodeChildrenBy(treeName, parentLineId, selectedNodeIndexInTree) {
	var tree = ebx_getAjaxTree(treeName);
	if (tree === null) {
		return;
	}
	var yuiTree = tree.getYuiTree();
	var parentLine = yuiTree.getNodeByProperty('id', parentLineId);
	if (parentLine === null) {
		return;
	}
	if (!parentLine.isLeaf) {
		yuiTree.removeChildren(parentLine);
	}
	parentLine.setNodesProperty("selectedNodeIndexInTree", selectedNodeIndexInTree);
	if (EBX_Utils.matchCSSClass(parentLine, 'ebx_Selected')) {
		EBX_Utils.removeCSSClass(parentLine, 'ebx_Selected');
		if (EBX_Utils.matchCSSClass(parentLine, 'ebx_DarkBackground')) {
			EBX_Utils.removeCSSClass(parentLine, 'ebx_DarkBackground');
		}

		parentLine.refresh();
		yuiTree.render();
	}
	var cancelId = ebx_ajaxTreeCreateAndRegisterCancelId(parentLine);
	tree.expandLine(parentLine, cancelId, false, null);
	parentLine.expanded = true;
}

/** ********** END InstanceContentTree *************** */

/** ********** START Hierarchy *************** */
function ebx_startNewHierarchyTree(treeName, containerDivID) {
	var getExpandURLFn = function(node) {
		if (node === null || node.data.id === undefined) {
			return EBX_Constants.getRequestLink(EBX_Constants.hierarchyExpandEvent);
		}

		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.hierarchyExpandEvent, params);
	};

	var getCollapseURLFn = function (node) {
		if (node === null || node.data.id === undefined) {
			return null;
		}

		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.hierarchyCollapseEvent, params);
	};

	var callbacks = {
		onSuccess: function () {
			AdvancedSearchActions.setFetchingData_success();
		},
		onError: function () {
			AdvancedSearchActions.setFetchingData_uncertain();
		},
		onCancel: function () {
			AdvancedSearchActions.setFetchingData_uncertain();
		}
	};

	EBX_AjaxTreesRegister.createAndRegisterTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, true,
			callbacks);
}

/** ********** END Hierarchy *************** */

/** ********** START DMA navigation tree *************** */
function ebx_startNewDataModelTree(treeName, containerDivID) {
	var getExpandURLFn = function(node) {
		if (node === null || node.data.id === undefined) {
			return EBX_Constants.getRequestLink(EBX_Constants.dmaTreeExpandEvent);
		}

		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.dmaTreeExpandEvent, params);
	};

	var getCollapseURLFn = function(node) {
		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.dmaTreeCollapseEvent, params);
	};

	EBX_AjaxTreesRegister.createAndRegisterTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, false);
}

/** ********** END DMA tree *************** */

/** ********** START Predicate editor tree *************** */
function ebx_startNewPredicateTree(treeName, containerDivID) {
	var getExpandURLFn = function(node) {
		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeName, this.treeName);
		params.put(EBX_Constants.ajaxTreeContainer, this.containerDivID);

		if (node === null || node.data.id === undefined) {
			return EBX_Constants.getRequestLink(EBX_Constants.predicateTreeExpandEvent, params);
		}

		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.predicateTreeExpandEvent, params);
	};

	var getCollapseURLFn = null;

	EBX_AjaxTreesRegister.createAndRegisterTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, false);
}

/** ********** END Predicate editor tree *************** */

/** ********** START tabular view column configuration tree *************** */
function ebx_startNewTabularViewColumnConfigurator(treeName, containerDivID) {
	var getExpandURLFn = function(node) {
		if (node === null || node.data.id === undefined) {
			return EBX_Constants.getRequestLink(EBX_Constants.tabularViewColumnConfiguratorExpandEvent);
		}

		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.tabularViewColumnConfiguratorExpandEvent, params);
	};

	var getCollapseURLFn = function(node) {
		if (node === null || node.data.id === undefined) {
			return null;
		}

		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.tabularViewColumnConfiguratorCollapseEvent, params);
	};

	EBX_AjaxTreesRegister.createAndRegisterTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, false);
}

/** ********** END tabular view column configuration tree *************** */

/** ********** START hierarchy dimension tree *************** */
function ebx_startNewHierarchyDimensionTree(treeName, containerDivID) {
	var getExpandURLFn = function(node) {
		if (node === null || node.data.id === undefined) {
			return EBX_Constants.getRequestLink(EBX_Constants.dimensionTreeExpand);
		}

		var params = new EBX_Map();
		params.put(EBX_Constants.ajaxTreeLineIndex, node.data.id);

		return EBX_Constants.getRequestLink(EBX_Constants.dimensionTreeExpand, params);
	};

	var getCollapseURLFn = null;

	EBX_AjaxTreesRegister.createAndRegisterTree(treeName, containerDivID, getExpandURLFn, getCollapseURLFn, false);
}

/** ********** END hierarchy dimension tree *************** */

/** ********** START Modal selector tree *************** */

function ebx_displayYUITreeFromMarkup(callerFn, arg, obj) {
	var treeEl = document.getElementById(obj.treeDivId);
	if (treeEl) {
		var tree = new YAHOO.widget.TreeView(treeEl.id);
		tree.subscribe("clickEvent", EBX_Utils.returnFalse);
		tree.render();
	}
	if (obj.fn !== undefined) {
		obj.fn.call();
	}
}

function ebx_DisplaySelectorPanelTree() {
	ebx_displayYUITreeFromMarkup(null, null, {
		treeDivId: "ebx_SelectorPanelTree"
	});
}

var EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ = null;
function ebx_getSelectorPanel() {
	if (EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ === null) {
		EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ = new YAHOO.widget.Panel("ebx_SelectorPanel", {
			draggable: false,
			visible: false,
			modal: true
		});
		EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ.innerElement.innerHTML = "<div id=\"ebx_SelectorPanelContent\" class=\"bd\"></div><div class=\"ebx_Knob\"></div>";
		EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ.render(document.body);
		YAHOO.util.Event.on("ebx_SelectorPanel_mask", "click", function() {
			EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ.hide();
		});
		EBX_LayoutManager.bodyLayout.addListener("resize", EBX_LayoutManager.autoresizeSelectorPanelTree);
		EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ.showEvent.subscribe(EBX_LayoutManager.autoresizeSelectorPanelTree, null);
	}
	return EBX_NAVIGATION_HEADER_SELECTOR_PANEL_LZ;
}

function EBX_AjaxSelectorObject() {
	this.onExecuteIfOK = function(responseXML, root) {
		var responseBody = root.getElementsByTagName('responseBody')[0];
		var targetName = responseBody.attributes.getNamedItem('targetName').nodeValue;
		var responseContent = responseBody.firstChild.data;
		if (document.getElementById(targetName)) {
			document.getElementById(targetName).innerHTML = responseContent;
			var contextButton = document.getElementById(this.contextButtonId);
			var parentNavigationHeader = EBX_Utils.getFirstParentMatchingTagName(contextButton, 'H2');
			var selectorPanel = ebx_getSelectorPanel();
			selectorPanel.cfg.setProperty('context', [ parentNavigationHeader, 'tl', 'bl' ]);
			selectorPanel.show();
			if (EBX_LayoutManager.isHeaderPaneDisplayed() === true) {
				document.getElementById("ebx_SelectorPanel_mask").style.marginTop = "40px";
			} else {
				document.getElementById("ebx_SelectorPanel_mask").style.marginTop = "0";
			}
			ebx_DisplaySelectorPanelTree();
		}
		return true;
	};

	this.onExecuteIfKO = function(responseXML) {
		return;
	};

	this.onGetExceptedResponseCode = function(callerId) {
		return this.responseCodeOK_RequestResponse;
	};

	this.onSetContextButtonId = function(buttonId) {
		// load Selector pane
		ebx_getSelectorPanel();
		this.contextButtonId = buttonId;
	};
}

EBX_AjaxSelectorObject.prototype = new EBX_AbstractAjaxResponseManager();

/** ********** END Modal selector tree *************** */

/** ********** DMA navigation tree ******************* */
function ebx_DMANavigationTree_expandAll(treeName, nodeId) {
	ebx_ajaxTreeReplaceChildren(treeName, nodeId, '&navigationTree_expandAll=true');
}

function ebx_DMANavigationTree_collapseAll(treeName, nodeId) {
	var tree = ebx_getAjaxTree(treeName);
	var yuiTree = tree.getYuiTree();
	var node = yuiTree.getNodeByProperty('id', nodeId);
	ebx_DMANavigationTree_collapseRecursively(node);
}

function ebx_DMANavigationTree_collapseRecursively(node) {
	var hasChildren = node.children !== undefined && node.children.length > 0;
	if (!hasChildren) {
		return;
	} else {
		for ( var i = 0; i < node.children.length; i++) {
			ebx_DMANavigationTree_collapseRecursively(node.children[i]);
		}
	}
	node.collapse();
}
/** ********* END Specifics implementations ********* */
