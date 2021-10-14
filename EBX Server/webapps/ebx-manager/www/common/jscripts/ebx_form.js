/*
 * Copyright TIBCO Software Inc. 2001-2021. All rights reserved.
 */

function EBX_Form() {
}

EBX_Form.WorkspaceFormId = "ebx_WorkspaceContentForm";
/* Overwritten by UITreeForm if needed */
EBX_Form.initWorkspaceFormTreeTabview = false;
EBX_Form.WorkspaceFormTabviewId = "ebx_WorkspaceFormTabview";
EBX_Form.WorkspaceFormTabContentCSSClass = "ebx_WorkspaceFormTabContent";
EBX_Form.WorkspaceFormBottomBarWithScrollCSSClass = "ebx_WorkspaceFormFooter_with-scroll";
/* Default value. Overwritten by UIConstantsJS */
EBX_Form.inputWidth = 300;

EBX_Form.formIdsDetectionOfLostModificationDisabled = [];

EBX_Form.initWorkspaceFormTreeTask = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_workspace_form, EBX_Loader.states.processing);
  EBX_Form.initWorkspaceFormTree();
  EBX_Loader.changeTaskState(EBX_Loader_taskId_workspace_form, EBX_Loader.states.done);
};

EBX_Form.initWorkspaceFormTree = function () {
  if (EBX_Form.initWorkspaceFormTreeTabview === true) {
    EBX_Form.WorkspaceFormTabview = new YAHOO.widget.TabView(EBX_Form.WorkspaceFormTabviewId);

    EBX_Form.WorkspaceFormTabview.addListener("activeTabChange", EBX_Form.tabSelectedListener);
    EBX_Form.WorkspaceFormTabview.addListener("activeTabChange",
        EBX_Form.activeTabChangeListenerForLaunchComponentJSCmd);
    EBX_Form.isTabFormReady = true;

    YAHOO.util.Event.addListener(EBX_Form.getWorkspaceFormTabviewTabs(), "scroll", EBX_Form.handleTabviewTabsScroll);
  }

  EBX_Form.addResizeListenerToScrollContent();

  EBX_Form.initWorkspaceFormTreeComponents();
  EBX_Form.initWorkspaceFormTreeExtensions();

  if (EBX_Form.initWorkspaceFormTreeTabview === true) {
    if (EBX_Form.WorkspaceFormTabview.get("activeIndex") === null) {
      EBX_Form.WorkspaceFormTabview.selectTab(0);
      EBX_Form.activeTabChangeListenerForLaunchComponentJSCmd({
        newValue: EBX_Form.WorkspaceFormTabview.getTab(0)
      });
    } else {
      EBX_Form.activeTabChangeListenerForLaunchComponentJSCmd({
        newValue: EBX_Form.WorkspaceFormTabview.getTab(EBX_Form.WorkspaceFormTabview.get("activeIndex"))
      });
    }

    if (EBX_Form.tabViews[EBX_Form.WorkspaceFormTabviewId] === undefined) {
      EBX_Form.tabViews[EBX_Form.WorkspaceFormTabviewId] = {};
    }

    EBX_Form.tabViews[EBX_Form.WorkspaceFormTabviewId].yuiTabView = EBX_Form.WorkspaceFormTabview;
  }

  EBX_Form.initFocusEvents(EBX_Form.WorkspaceFormId);

  EBX_Form.resizeFormBody();
};

EBX_Form.addResizeListenerToScrollContent = function () {
  var watchedElementsChildren = [];
  if (EBX_Form.initWorkspaceFormTreeTabview) {
    // Watch each tab content size
    var workspaceFormTabContent = document.querySelectorAll("." + EBX_Form.WorkspaceFormTabContentCSSClass);
    for (var i = 0; workspaceFormTabContent && i < workspaceFormTabContent.length; i++) {
      var tabContentEl = workspaceFormTabContent[i];

      // If Tab includes a sub form pane with tabs, watch those sub tabs instead.
      if (EBX_Utils.matchCSSClass(tabContentEl, EBX_Form.tabContentEmbeddingTabbedPaneCSSClass)) {
        // use this feature under root tab only (for now)
        var subNavSetEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(tabContentEl, "yui-navset");
        var subContentEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(subNavSetEl, "yui-content");
        var subTabContentEl = EBX_Utils.firstElementChild(subContentEl);
        do {
          watchedElementsChildren.push(subTabContentEl);
        } while ((subTabContentEl = EBX_Utils.nextElementSibling(subTabContentEl)) !== null);
      } else {
        watchedElementsChildren.push(tabContentEl);
      }
    }
  } else {
    watchedElementsChildren.push(EBX_Form.getFormBody());
  }

  var listener = new ResizeObserver(function (entries) {
    EBX_Form.resizeFormBody();
  });

  // There is no content wrapper around datas, so have to listen to each children.
  for (var j = 0, length = watchedElementsChildren.length; j < length; j++) {
    var watchedElement = EBX_Utils.firstElementChild(watchedElementsChildren[j]);
    while (watchedElement !== null) {
      if (!watchedElement.classList.contains("ebx_form_bottom_bar_spacer") && watchedElement.id
          !== "ebx_ScrollShadow") {
        listener.observe(watchedElement);
      }
      watchedElement = EBX_Utils.nextElementSibling(watchedElement);
    }
  }

  window.addEventListener('beforeunload', function (event) {
    listener.disconnect();
  });
};

EBX_Form.initWorkspaceFormTreeComponents = function () {
// This function must be overridden by the main form in the page (script in body)
};
EBX_Form.initWorkspaceFormTreeExtensions = function () {
// This function must be overridden by the main form in the page (script in body)
};

EBX_Form.scrollShadow = null;
EBX_Form.getScrollShadow = function () {
  if (EBX_Form.scrollShadow === null) {
    EBX_Form.scrollShadow = document.getElementById("ebx_ScrollShadow");
  }
  return EBX_Form.scrollShadow;
};

EBX_Form.displayShadowOnScroll = function () {
  var scrollShadow = EBX_Form.getScrollShadow();
  if (scrollShadow === null) {
    return;
  }

  if (EBX_ModelExtensionFrame.isInExtension()) {
    scrollShadow.style.display = "none";
    return;
  }

  if (EBX_Form.getFormBody().scrollTop > 0) {
    scrollShadow.style.display = "block"
  } else {
    scrollShadow.style.display = "none";
  }
};

EBX_Form.tabSelectedListener = function (event) {
  if (EBX_Form.isCustomLayout) {
    EBX_Form.customTabSelectedListener(event, EBX_Form.WorkspaceFormTabviewId);
  } else {
    var nodeIndex = event.newValue.get("contentEl").id.substr(EBX_Form.tabIdPrefix.length);
    EBX_Form.sendSelectTabNodeIndex(nodeIndex);
  }

  // Refresh workspace form content height according if a validation report is displayed or not.
  EBX_Form.resizeFormBody();
};
EBX_Form.yuiDataSourceCustomSelectTab = null;
EBX_Form.customTabSelectedListener = function (event, formTabbedPaneId) {
  if (EBX_Form.yuiDataSourceCustomSelectTab === null) {
    EBX_Form.yuiDataSourceCustomSelectTab = new YAHOO.util.XHRDataSource(EBX_Form.customSelectTabRequest);
  }

  var tabId = event.newValue.get("contentEl").id;

  var request = [];
  request.push(EBX_Form.selectedTabbedPaneParameter, formTabbedPaneId);
  request.push(EBX_Form.selectedTabParameter, tabId);
  EBX_Form.yuiDataSourceCustomSelectTab.sendRequest(request.join(""), null);

  // Refresh workspace form content height according if a validation report is displayed or not.
  EBX_Form.resizeFormBody();
};
EBX_Form.yuiDataSourceSelectTab = null;
EBX_Form.sendSelectTabNodeIndex = function (nodeIndex) {
  if (EBX_Form.yuiDataSourceSelectTab === null) {
    EBX_Form.yuiDataSourceSelectTab = new YAHOO.util.XHRDataSource(EBX_Form.selectTabRequest);
  }
  EBX_Form.yuiDataSourceSelectTab.sendRequest(EBX_Form.selectedTabNodeIndexParameter + nodeIndex, null);
};

EBX_Form.WorkspaceFormTabviewTabsId = "ebx_WorkspaceFormTabviewTabs";
EBX_Form.tabViewScrollerId = "ebx_TabScroller";
EBX_Form.tabViewScrollLeftId = "ebx_TabScrollLeft";
EBX_Form.tabViewScrollRightId = "ebx_TabScrollRight";
EBX_Form.WorkspaceFormTabviewTabsEl = null;
EBX_Form.tabViewScrollerEl = null;
EBX_Form.tabViewScrollLeftButton = null;
EBX_Form.tabViewScrollRightButton = null;
EBX_Form.getWorkspaceFormTabviewTabs = function () {
  if (EBX_Form.WorkspaceFormTabviewTabsEl === null) {
    EBX_Form.WorkspaceFormTabviewTabsEl = document.getElementById(EBX_Form.WorkspaceFormTabviewTabsId);
  }
  return EBX_Form.WorkspaceFormTabviewTabsEl;
};
EBX_Form.getTabViewScrollLeft = function () {
  if (EBX_Form.tabViewScrollLeftButton === null) {
    EBX_Form.tabViewScrollLeftButton = document.getElementById(EBX_Form.tabViewScrollLeftId);
  }
  return EBX_Form.tabViewScrollLeftButton;
};
EBX_Form.getTabViewScrollRight = function () {
  if (EBX_Form.tabViewScrollRightButton === null) {
    EBX_Form.tabViewScrollRightButton = document.getElementById(EBX_Form.tabViewScrollRightId);
  }
  return EBX_Form.tabViewScrollRightButton;
};
EBX_Form.getTabViewScroller = function () {
  if (EBX_Form.tabViewScrollerEl === null) {
    EBX_Form.tabViewScrollerEl = document.getElementById(EBX_Form.tabViewScrollerId);
  }
  return EBX_Form.tabViewScrollerEl;
};

EBX_Form.tabViewScrollIntervalTime = 50;
// ms
EBX_Form.tabViewScrollIncrementSlow = 1;
EBX_Form.tabViewScrollIncrementNormal = 10;

EBX_Form.tabViewScrollInterval = null;

EBX_Form.tabViewScrollMouseDownCSSClass = "ebx_mousedown";

EBX_Form.tabViewScrollLeftSlow = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  ul.scrollLeft -= EBX_Form.tabViewScrollIncrementSlow;
};
EBX_Form.tabViewScrollRightSlow = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  ul.scrollLeft += EBX_Form.tabViewScrollIncrementSlow;
};

EBX_Form.tabViewScrollLeft = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  ul.scrollLeft -= EBX_Form.tabViewScrollIncrementNormal;
};
EBX_Form.tabViewScrollRight = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  ul.scrollLeft += EBX_Form.tabViewScrollIncrementNormal;
};

EBX_Form.setButtonLeftMouseDownCSS = function () {
  EBX_Utils.addCSSClass(EBX_Form.getTabViewScrollLeft(), EBX_Form.tabViewScrollMouseDownCSSClass);
};
EBX_Form.setButtonRightMouseDownCSS = function () {
  EBX_Utils.addCSSClass(EBX_Form.getTabViewScrollRight(), EBX_Form.tabViewScrollMouseDownCSSClass);
};
EBX_Form.removeButtonLeftMouseDownCSS = function () {
  EBX_Utils.removeCSSClass(EBX_Form.getTabViewScrollLeft(), EBX_Form.tabViewScrollMouseDownCSSClass);
};
EBX_Form.removeButtonRightMouseDownCSS = function () {
  EBX_Utils.removeCSSClass(EBX_Form.getTabViewScrollRight(), EBX_Form.tabViewScrollMouseDownCSSClass);
};

EBX_Form.tabViewScrollLeftMouseOver = function () {
  window.clearInterval(EBX_Form.tabViewScrollInterval);

  EBX_Form.tabViewScrollInterval = window.setInterval(EBX_Form.tabViewScrollLeftSlow,
      EBX_Form.tabViewScrollIntervalTime);
};
EBX_Form.tabViewScrollRightMouseOver = function () {
  window.clearInterval(EBX_Form.tabViewScrollInterval);

  EBX_Form.tabViewScrollInterval = window.setInterval(EBX_Form.tabViewScrollRightSlow,
      EBX_Form.tabViewScrollIntervalTime);
};

EBX_Form.tabViewScrollLeftMouseDown = function () {
  EBX_Form.setButtonLeftMouseDownCSS();

  EBX_Form.tabViewScrollLeft();

  window.clearInterval(EBX_Form.tabViewScrollInterval);

  EBX_Form.tabViewScrollInterval = window.setInterval(EBX_Form.tabViewScrollLeft, EBX_Form.tabViewScrollIntervalTime);
};
EBX_Form.tabViewScrollRightMouseDown = function () {
  EBX_Form.setButtonRightMouseDownCSS();

  EBX_Form.tabViewScrollRight();

  window.clearInterval(EBX_Form.tabViewScrollInterval);

  EBX_Form.tabViewScrollInterval = window.setInterval(EBX_Form.tabViewScrollRight, EBX_Form.tabViewScrollIntervalTime);
};

EBX_Form.tabViewScrollLeftMouseUp = function () {
  EBX_Form.removeButtonLeftMouseDownCSS();
  EBX_Form.tabViewScrollLeftMouseOver();
};
EBX_Form.tabViewScrollRightMouseUp = function () {
  EBX_Form.removeButtonRightMouseDownCSS();
  EBX_Form.tabViewScrollRightMouseOver();
};

EBX_Form.tabViewScrollLeftMouseOut = function () {
  EBX_Form.removeButtonLeftMouseDownCSS();
  window.clearInterval(EBX_Form.tabViewScrollInterval);
};
EBX_Form.tabViewScrollRightMouseOut = function () {
  EBX_Form.removeButtonRightMouseDownCSS();
  window.clearInterval(EBX_Form.tabViewScrollInterval);
};

EBX_Form.handleTabviewTabsScroll = function (event) {
  EBX_Form.refreshTabViewScrollButtons();
};
EBX_Form.refreshTabViewScrollButtons = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  var tabLeft = EBX_Form.getTabViewScrollLeft();
  var tabRight = EBX_Form.getTabViewScrollRight();

  if (ul.scrollLeft === 0) {
    EBX_Utils.addCSSClass(tabLeft, EBX_ButtonUtils.disabledButtonCSSClass);
  } else {
    EBX_Utils.removeCSSClass(tabLeft, EBX_ButtonUtils.disabledButtonCSSClass);
  }

  if (ul.scrollLeft === (ul.scrollWidth - ul.clientWidth)) {
    EBX_Utils.addCSSClass(tabRight, EBX_ButtonUtils.disabledButtonCSSClass);
  } else {
    EBX_Utils.removeCSSClass(tabRight, EBX_ButtonUtils.disabledButtonCSSClass);
  }
};

EBX_Form.refreshTabViewScrollDiv = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  var scroller = EBX_Form.getTabViewScroller();

  // default is none
  scroller.style.display = "";
  ul.style.paddingRight = "";
  ul.lastElementChild.style.marginRight = "0";

  if (ul.scrollWidth > ul.clientWidth) {
    scroller.style.display = "block";
    ul.style.paddingRight = "0";
    ul.lastElementChild.style.marginRight = "56px";
    EBX_Form.refreshTabViewScrollButtons();
  }
};

/* Default value. Overwritten by UIConstantsJS */
EBX_Form.scrollTabViewMarginAroundTab = 15;
// to view a piece of the sibling tab
EBX_Form.scrollTabViewForSelectedTab = function () {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();
  var selectedTab = EBX_Utils.getFirstDirectChildMatchingCSSClass(ul, "selected");
  EBX_Form.scrollTabViewForTab(selectedTab);
};

EBX_Form.scrollTabViewForTab = function (tabEl) {
  var ul = EBX_Form.getWorkspaceFormTabviewTabs();

  var ulX = YAHOO.util.Dom.getX(ul);
  var selectedTabX = YAHOO.util.Dom.getX(tabEl);

  var cutAtLeft = selectedTabX - EBX_Form.scrollTabViewMarginAroundTab < ulX;
  var cutAtRight = selectedTabX + tabEl.offsetWidth + EBX_Form.scrollTabViewMarginAroundTab > ulX + ul.clientWidth;

  // do not scroll if the tab is entirely displayed
  if (!cutAtLeft && !cutAtRight) {
    return;
  }

  var selectedTabOffsetLeftScroll = tabEl.offsetLeft;
  if (tabEl.offsetParent != ul) {
    selectedTabOffsetLeftScroll -= ul.offsetLeft;
  }

  // 'l' left or 'c' center or 'r' right
  var align;

  // if the tab is cut at left and right at the same time (when the tab is larger than the list)
  if (cutAtLeft && cutAtRight) {
    // align left
    align = 'l';
  } else {
    if (cutAtLeft) {
      // if it is not visible at all
      if (selectedTabX + tabEl.offsetWidth < ulX) {
        // then align center
        align = 'c';
      } else {
        // align left
        align = 'l';
      }
    } else {// cut at right
      // if it is not visible at all
      if (selectedTabX > ulX + ul.clientWidth) {
        // then align center
        align = 'c';
      } else {
        // align right
        align = 'r';
      }
    }
  }

  var targetScrollLeft = 0; // just in case, to init the var
  var marginRight = EBX_Form.scrollTabViewMarginAroundTab;
  if (ul.scrollWidth > ul.clientWidth) {
    marginRight = 56;
  }
  switch (align) {
    case 'l':
      targetScrollLeft = selectedTabOffsetLeftScroll - marginRight;
      break;

    case 'c':
      targetScrollLeft = selectedTabOffsetLeftScroll - ul.clientWidth / 2 + tabEl.offsetWidth / 2;
      break;

    case 'r':
      targetScrollLeft = selectedTabOffsetLeftScroll - ul.clientWidth + tabEl.offsetWidth
          + marginRight;
      break;

    default:
  }

  ul.scrollLeft = targetScrollLeft;
};

EBX_Form.initFormBodyAutoHeight = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_workspace_form_bodyautoheight, EBX_Loader.states.processing);

  EBX_LayoutManager.bodyLayout.addListener("resize", EBX_Form.resizeFormBody, null, null);
  EBX_LayoutManager.isWorkspaceFormManageResizeWorkspaceListeners = true;

  // disable WorkspaceContent scrolls (for roll-over panes on form, like calendar)
  if (EBX_ModelExtensionFrame.isInExtension()) {
    EBX_LayoutManager.WorkspaceContentAreaEl.style.background = "transparent";
  }
  EBX_LayoutManager.WorkspaceContentEl.style.overflow = "visible";
  EBX_LayoutManager.WorkspaceContentAreaEl.style.padding = "0";

  YAHOO.util.Event.addListener(EBX_Form.getFormBody(), "scroll", EBX_Form.displayShadowOnScroll, null);

  EBX_Form.addResizeListenerToScrollContent();

  EBX_Form.resizeFormBody();

  EBX_Loader.changeTaskState(EBX_Loader_taskId_workspace_form_bodyautoheight, EBX_Loader.states.done);
};

EBX_Form.WorkspaceFormBodyEl = null;
EBX_Form.getFormBody = function () {
  var workspaceFormBodyEl = EBX_Form.WorkspaceFormBodyEl;
  if (workspaceFormBodyEl === null) {
    workspaceFormBodyEl = document.getElementById("ebx_WorkspaceFormBody");
    if (workspaceFormBodyEl === null) {
      workspaceFormBodyEl = document.getElementById("ebx_TextInWorkspace");
      if (workspaceFormBodyEl === null) {
        return null;
      } else {
        EBX_Form.WorkspaceFormBodyEl = workspaceFormBodyEl;
      }
    } else {
      EBX_Form.WorkspaceFormBodyEl = workspaceFormBodyEl;
    }
  }
  return workspaceFormBodyEl;
};

EBX_Form.getFormScrollingContainer = function (elementInFormScrollingContainer) {
  var widgetContainer = EBX_Utils.getFirstParentMatchingCSSClass(elementInFormScrollingContainer,
      "ebx_GridEditorWidgetContainer");
  if (widgetContainer !== null) {
    if (EBX_AjaxTable.widgetContainerTable[widgetContainer.id] !== undefined) {
      var ajaxTable = EBX_AjaxTable.widgetContainerTable[widgetContainer.id];
      if (ajaxTable.currentTdFocusedIsPlacedInCreatePart === true) {
        return ajaxTable.element.create.wrapper;
      } else if (ajaxTable.currentWidgetIsPlacedInFixedContainer === true) {
        return ajaxTable.element.update.fixed.scroll;
      } else {
        return ajaxTable.element.update.main.scroll;
      }
    }
  }

  var tabContent = EBX_Utils.getFirstParentMatchingCSSClass(elementInFormScrollingContainer,
      EBX_Form.WorkspaceFormTabContentCSSClass);
  if (tabContent !== null) {
    return tabContent;
  }

  var tableContent = EBX_Utils.getFirstParentMatchingCSSClass(elementInFormScrollingContainer,
      "ebx_renderWorkspaceLayout");
  if (tableContent !== null) {
    return tableContent;
  }

  if (EBX_Utils.hasParentMatchingId(elementInFormScrollingContainer, "ebx_FilterBlockList")) {
    return document.getElementById("ebx_FilterBlockList");
  }

  return EBX_Form.getFormBody();
};

EBX_Form.tabContentPaddingTop = 20;

EBX_Form.workspaceFormBodyPadding = 20;

EBX_Form.tabContentEmbeddingTabbedPaneCSSClass = "ebx_TabContentEmbeddingTabbedPane";

EBX_Form.resizeFormBody = function () {
  var workspaceFormBodyEl = EBX_Form.getFormBody();
  if (workspaceFormBodyEl === null) {
    return;
  }

  var takenSpace = 0;

  // Mantis #5631: In the generic form, the date picker disturbs the placement of the form's bottom bar
  // if (document.getElementById("ebx_WorkspaceFormFooter") !== null) {
  // 	takenSpace += document.getElementById("ebx_WorkspaceFormFooter").offsetHeight;
  //  takenSpace += 1; // form footer border tom
  // }

  var targetHeight = (EBX_LayoutManager.WorkspaceContentAreaEl.offsetHeight - takenSpace);
  if (targetHeight < 0) {
    targetHeight = 0;
  }

  if (EBX_ModelExtensionFrame.isInExtension()) {
    workspaceFormBodyEl.style.height = EBX_ModelExtensionFrame.getFormBodyHeightInExtension(targetHeight) + "px";
  } else {
    workspaceFormBodyEl.style.height = targetHeight + "px";
    var workspaceOffsetWidth = EBX_LayoutManager.WorkspaceContentAreaEl.offsetWidth;
    var workspaceFormBodyTargetWidth = workspaceOffsetWidth;
    workspaceFormBodyEl.style.width = workspaceFormBodyTargetWidth + "px";
  }

  var heightForResizeListener = targetHeight;

  var formContent = workspaceFormBodyEl;
  var formContentHeight = formContent.offsetHeight;
  var formContentHasPadding = EBX_Utils.matchCSSClass(formContent, "ebx_WorkspaceFormBodyWithPadding");
  var oldScrollTop = formContent.scrollTop;

  if (EBX_Form.initWorkspaceFormTreeTabview === true) {
    workspaceFormBodyEl.style.overflow = "hidden";
    workspaceFormBodyEl.style.padding = "0";

    var workspaceFormTabviewHeaderEl = document.getElementById("ebx_WorkspaceFormTabviewTabs").parentElement;

    var targetTabContentHeight = targetHeight - workspaceFormTabviewHeaderEl.offsetHeight;

    heightForResizeListener = targetTabContentHeight;

    var workspaceFormTabviewContentsEl = document.getElementById("ebx_WorkspaceFormTabviewContents");
    var tabContentEl = EBX_Utils.firstElementChild(workspaceFormTabviewContentsEl);
    do {
      tabContentEl.style.height = targetTabContentHeight + "px";
      tabContentEl.style.width = workspaceFormBodyTargetWidth + "px";
      var rootTabIsSelected = !EBX_Utils.matchCSSClass(tabContentEl, "yui-hidden");
      if (rootTabIsSelected) {
        formContent = tabContentEl;
        formContentHeight = targetTabContentHeight;
        formContentHasPadding = EBX_Utils.matchCSSClass(formContent, "ebx_WorkspaceFormTabContentWithPadding");
        oldScrollTop = formContent.scrollTop;
      }

      if (EBX_Utils.matchCSSClass(tabContentEl, EBX_Form.tabContentEmbeddingTabbedPaneCSSClass)) {
        // use this feature under root tab only (for now)
        var subNavSetEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(tabContentEl, "yui-navset");
        var subNavUlEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(subNavSetEl, "ebx_WorkspaceFormTabview_Header");

        var subContentEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(subNavSetEl, "yui-content");
        var subTabContentEl = EBX_Utils.firstElementChild(subContentEl);
        do {
          if (rootTabIsSelected && !EBX_Utils.matchCSSClass(subTabContentEl, "yui-hidden")) {
            formContent = subTabContentEl;
            oldScrollTop = formContent.scrollTop;
            formContentHasPadding = EBX_Utils.matchCSSClass(formContent, "ebx_WorkspaceFormTabContentWithPadding");
            var subTabWidth = workspaceFormBodyTargetWidth;
            var targetSubTabContentHeight = targetTabContentHeight - subNavUlEl.offsetHeight;
            if (formContentHasPadding) {
              subTabWidth -= 2 * EBX_Form.workspaceFormBodyPadding;
              targetSubTabContentHeight -= EBX_Form.workspaceFormBodyPadding;
            }
            formContentHeight = targetSubTabContentHeight;
            subTabContentEl.style.height = targetSubTabContentHeight + "px";
            subTabContentEl.style.width = subTabWidth + "px";
          }
        } while ((subTabContentEl = EBX_Utils.nextElementSibling(subTabContentEl)) !== null);
      }
    } while ((tabContentEl = EBX_Utils.nextElementSibling(tabContentEl)) !== null);

    EBX_Form.refreshTabViewScrollDiv();
    EBX_Form.scrollTabViewForSelectedTab();
  }
  //Hide all spacers
  document.body.classList.add("ebx_hide_form_bottom_bar_spacer");

  var scrollShadow = EBX_Form.getScrollShadow();
  if (scrollShadow !== null) {
    scrollShadow.style.top = workspaceFormBodyEl.offsetTop + "px";
    scrollShadow.style.width = workspaceFormBodyEl.clientWidth + "px";
  }

  var remainingWorkspaceHeight = heightForResizeListener;
  var remainingWorkspaceWidth = workspaceOffsetWidth;

  // /!\ Not always true for all tabs. An associaton node does not displayed the validation report /!\
  // Should be recomputed each time user change active tab
  var workspaceFormHeaderEl = EBX_Form.getFirstValidationReportFound(formContent);
  if (workspaceFormHeaderEl !== null) {
    remainingWorkspaceHeight -= workspaceFormHeaderEl.offsetHeight;
  }

  if (formContentHasPadding) {
    var formBodyPaddingBottom = 0;
    var workspaceFormFooter = document.getElementById("ebx_WorkspaceFormFooter");
    if (workspaceFormFooter === null) {
      formBodyPaddingBottom = EBX_Form.workspaceFormBodyPadding;
    }
    remainingWorkspaceHeight -= (EBX_Form.workspaceFormBodyPadding + formBodyPaddingBottom);
    remainingWorkspaceWidth -= 2 * EBX_Form.workspaceFormBodyPadding;
  }

  if (remainingWorkspaceHeight < 0) {
    remainingWorkspaceHeight = 0;
  }
  if (remainingWorkspaceWidth < 0) {
    remainingWorkspaceWidth = 0;
  }

  // To comply with the use case where a custom form has a div which have 100% height (it is a case where customer
  // want that its component takes the full height and is NOT hidden by the workspace form bottom bar).
  // We check if scrollbars are needed, that means if something is dispayed under the workspace form bottom bar.
  // To achieve that, we check if scrollbars are displayed even when form body height is reduced by the workspace height.

  // If yes, form body height takes the full height,
  // If no, form body height does not cover the form bottom bar, which renders the component having height 100% nicely.
  //
  // See sample FullHeight.java and PaneWithTabsFullHeight.java for a use case.
  var hasVerticalScroll = (formContent.scrollHeight > formContent.offsetHeight);
  var hasHorizontalScroll = (formContent.scrollWidth > formContent.offsetWidth);
  if (!hasVerticalScroll && !hasHorizontalScroll) {
    var workspaceFormFooterHeight = formContentHasPadding ? EBX_Form.getWorkspaceFormBottomBarHeight() : 0;
    var formContentAvailableHeight = formContentHeight - workspaceFormFooterHeight;
    formContent.style.height = formContentAvailableHeight + "px";
    EBX_Form.refreshWorkspaceFormBottomBarPosition(true);
    //Refresh has horizontal and vertical scroll
    hasVerticalScroll = (formContent.scrollHeight > formContentAvailableHeight);
    hasHorizontalScroll = (formContent.scrollWidth > formContent.offsetWidth);
    if (hasVerticalScroll || hasHorizontalScroll) {
      formContent.style.height = formContentHeight + "px";
      formContent.style.overflow = "auto";
    } else {
      formContent.style.overflow = "hidden";
    }
  } else {
    EBX_Form.refreshWorkspaceFormBottomBarPosition(true);
    formContent.style.overflow = "auto";
  }

  //note: There is a hole in this solution for the use where the component takes the full height, and width overflow form body width.
  //With this solution, as the horizontal scrollbar is displayed below the bottom bar, the component will have part under the bottom bar.
  document.body.classList.remove("ebx_hide_form_bottom_bar_spacer");
  formContent.scrollTop = oldScrollTop;

  // `remainingWorkspaceHeight` represents the available height for the form.
  // - The card height by default
  // - if there is a root pane with tabs, is equal to the tab pane content height (without the tab headers)
  // The value passed is set to `EBX_LayoutManager.lastWorkspaceSizeComputed`
  EBX_LayoutManager.callResizeWorkspaceListeners({
    h: remainingWorkspaceHeight - EBX_Form.getWorkspaceFormBottomBarHeight(),
    w: remainingWorkspaceWidth,
    vScroll: hasVerticalScroll ? EBX_Utils.getVScrollWidth() : 0
  }, {
    h: remainingWorkspaceHeight,
    w: remainingWorkspaceWidth,
    vScroll: hasVerticalScroll ? EBX_Utils.getVScrollWidth() : 0,
    hScroll: hasHorizontalScroll ? EBX_Utils.getHScrollHeight() : 0
  });
};
/**
 * @param bottomBarSpacerAlreadyHidden {boolean} Optional, set to true if the spacers hide/re-display is handled by the calling function.
 */
EBX_Form.refreshWorkspaceFormBottomBarPosition = function (bottomBarSpacerAlreadyHidden) {
  var workspaceFormFooter = document.getElementById("ebx_WorkspaceFormFooter");
  if (workspaceFormFooter !== null) {

    if (EBX_ModelExtensionFrame.isInExtension()) {
      workspaceFormFooter.style.padding = "0";
      workspaceFormFooter.style.bottom = "0";
    } else {

      if (!bottomBarSpacerAlreadyHidden) {
        document.body.classList.add("ebx_hide_form_bottom_bar_spacer");
      }

      var elemWithScrollApplied = null;
      var subNavSetInTabWithPadding = false;
      if (EBX_Form.initWorkspaceFormTreeTabview) {
        elemWithScrollApplied = document.querySelector(".ebx_WorkspaceFormTabContent:not(.yui-hidden)");

        // If Tab includes a sub form pane with tabs, watch those sub tabs instead.
        if (EBX_Utils.matchCSSClass(elemWithScrollApplied, EBX_Form.tabContentEmbeddingTabbedPaneCSSClass)) {
          subNavSetInTabWithPadding = EBX_Utils.matchCSSClass(elemWithScrollApplied,
              "ebx_WorkspaceFormTabContentWithPadding");

          // use this feature under root tab only (for now)
          var subNavSetEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(elemWithScrollApplied, "yui-navset");
          elemWithScrollApplied = subNavSetEl.querySelector(
              ".yui-content > .ebx_FormPaneWithTabs_Tab:not(.yui-hidden)");
        }
      } else {
        elemWithScrollApplied = EBX_Form.getFormBody();
      }

      var vScrollWidth = EBX_Utils.getVScrollWidth();

      var workspaceFormBodyTargetWidth = EBX_LayoutManager.WorkspaceContentAreaEl.clientWidth;
      var hasVerticalScroll = EBX_Form.letVerticalScrollbarDisplay || (elemWithScrollApplied.scrollHeight
          > elemWithScrollApplied.offsetHeight);
      var paddingRight = EBX_Form.workspaceFormBodyPadding;
      if (hasVerticalScroll) {
        workspaceFormBodyTargetWidth -= vScrollWidth;
        paddingRight -= vScrollWidth;
      }
      if (paddingRight < 0) {
        paddingRight = 0;
      }
      if (subNavSetInTabWithPadding) {
        // Include root tab padding in the footer width.
        workspaceFormBodyTargetWidth -= EBX_Form.workspaceFormBodyPadding;
      }

      workspaceFormFooter.style.paddingRight = paddingRight + "px";
      workspaceFormFooter.style.width = workspaceFormBodyTargetWidth + "px";

      var hasHorizontalScroll = EBX_Form.letHoritonztalScrollbarDisplay || (elemWithScrollApplied.scrollWidth
          > elemWithScrollApplied.offsetWidth);

      var paddingBottom = EBX_Form.workspaceFormBodyPadding;
      var bottom = EBX_LayoutManager.getWorkspaceContentMarginBottom();
      var hScrollHeight = EBX_Utils.getHScrollHeight();
      if (hasHorizontalScroll) {
        paddingBottom -= hScrollHeight;
        bottom += hScrollHeight;

        workspaceFormFooter.classList.add(EBX_Form.WorkspaceFormBottomBarWithScrollCSSClass);

        workspaceFormFooter.style.borderBottomLeftRadius = "0";
        workspaceFormFooter.style.borderBottomRightRadius = "0";
      } else {
        workspaceFormFooter.style.borderBottomLeftRadius = "";

        workspaceFormFooter.classList.remove(EBX_Form.WorkspaceFormBottomBarWithScrollCSSClass);

        workspaceFormFooter.style.borderBottomLeftRadius = "";
        if (hasVerticalScroll) {
          workspaceFormFooter.style.borderBottomRightRadius = "0";
        } else {
          workspaceFormFooter.style.borderBottomRightRadius = "";
        }
      }
      if (paddingBottom < 0) {
        paddingBottom = 0;
      }
      workspaceFormFooter.style.paddingBottom = paddingBottom + "px";

      workspaceFormFooter.style.bottom = bottom + "px";
    }
  }

  if (!EBX_Form.inlineStyle && EBX_Form.getFormBody() != null) {
    EBX_Form.inlineStyle = EBX_Form.getFormBody().appendChild(document.createElement("style"));
  }
  if (EBX_Form.inlineStyle) {
    // Change the height of the spacer placed after the content according to the footer height.
    EBX_Form.inlineStyle.innerHTML =
        ".ebx_form_bottom_bar_spacer {"
        + "  height: " + (EBX_Form.getWorkspaceFormBottomBarHeight() - (hasHorizontalScroll ? hScrollHeight : 0))
        + "px;"
        + "}";
  }

  if (!bottomBarSpacerAlreadyHidden) {
    document.body.classList.remove("ebx_hide_form_bottom_bar_spacer");
  }
};

EBX_Form.letScrollbarDisplay = function (scrollH, scrollV) {
  EBX_Form.letHoritonztalScrollbarDisplay = scrollH;
  EBX_Form.letVerticalScrollbarDisplay = scrollV;

  EBX_Form.refreshWorkspaceFormBottomBarPosition();
};

EBX_Form.getWorkspaceFormBottomBarHeight = function () {
  var formBottomBarHeight = 0;
  var formBottomBarElement = document.getElementById("ebx_WorkspaceFormFooter");
  if (formBottomBarElement) {
    formBottomBarHeight = formBottomBarElement.offsetHeight;
    if (formBottomBarElement.classList.contains(EBX_Form.WorkspaceFormBottomBarWithScrollCSSClass)) {
      formBottomBarHeight += EBX_Utils.getHScrollHeight();
    }
  }

  return formBottomBarHeight;
};

EBX_Form.placeFormFooter = function () {
  EBX_Logger.log("EBX_Form.placeFormFooter() is deprecated. The placement of the form footer is automatic now.",
      EBX_Logger.info);
};

EBX_Form.confirmMessages = [];
EBX_Form.setConfirmMessage = function (submitButtonId, message) {
  EBX_Form.confirmMessages[submitButtonId] = message;
};

/**
 * Callback for custom JS validation executed on form submit.
 *
 * If method returns false, form submit is cancelled.
 *
 * @callback customCheckBeforeSubmit
 * @return {boolean} False to block form submit.
 */

/**
 * Add a custom check to execute before form submit.
 * @param customCheck {customCheckBeforeSubmit}
 */
EBX_Form.addCustomCheckBeforeSubmit = function (customCheck) {
  EBX_Form.customChecksBeforeSubmit.push(customCheck);
};

/**
 *
 * @type {customCheckBeforeSubmit[]}
 */
EBX_Form.customChecksBeforeSubmit = [];

EBX_Form.AskBeforeLeavingModifiedFormCSSFlag = "ebx_AskBeforeLeavingModifiedForm";
EBX_Form.ConfirmSystem = function (p_oEvent) {

  var formConcerned = EBX_Utils.getTargetElement(p_oEvent);

  for (var i = 0, length = EBX_Form.customChecksBeforeSubmit.length; i < length; i++) {
    var customConditionEvaluation = EBX_Form.customChecksBeforeSubmit[i]();
    //Function must explicitly returns false.
    if (customConditionEvaluation === false) {
      YAHOO.util.Event.preventDefault(p_oEvent);
      return false;
    }
  }

  // TODO tlu : migrate to customChecksBeforeSubmit
  if (!EBX_Form.checkCustomConditions(formConcerned)) {
    YAHOO.util.Event.preventDefault(p_oEvent);
    return false;
  }
  // checkTechnicalConditions includes the UIFormSpec.jsFnNameToCallBeforeSubmit
  if (formConcerned.checkTechnicalConditions !== undefined && !formConcerned.checkTechnicalConditions(formConcerned)) {
    YAHOO.util.Event.preventDefault(p_oEvent);
    return false;
  }

  // confirm system is called:
  // - from a submit button when a click or a keyboard validation fires on it
  // - from a field when the ENTER key is pressed on it
  // all form submit buttons are <button> (<input type="button/submit/..."> is deprecated for many internal reasons)

  var message;
  var defaultSubmitButton;
  if (formConcerned.ebx_defaultSubmitButtonId !== null) {
    defaultSubmitButton = document.getElementById(formConcerned.ebx_defaultSubmitButtonId);
  }
  var lastSubmitFocused = formConcerned.ebx_lastSubmitFocused;
  var messageIsFromDefaultButton = false;

  if (EBX_LayoutManager.isIE) {
    EBX_Form.initSubmitNamesForIE(formConcerned);
  }
  if (lastSubmitFocused === null || lastSubmitFocused === undefined) {
    if (defaultSubmitButton !== null) {
      EBX_Utils.addCSSClass(defaultSubmitButton, EBX_ButtonUtils.buttonPushedCSSClass);
      if (EBX_LayoutManager.isIE) {
        EBX_Form.setSubmitValue(formConcerned, defaultSubmitButton.attributes.getNamedItem("value").value,
            defaultSubmitButton.ebx_name);
      }
      message = EBX_Form.confirmMessages[defaultSubmitButton.id];
      messageIsFromDefaultButton = true;
    }
  } else if (lastSubmitFocused.tagName == "BUTTON") {
    message = EBX_Form.confirmMessages[lastSubmitFocused.id];

    if (EBX_LayoutManager.isIE && lastSubmitFocused.type == "submit") {
      EBX_Form.setSubmitValue(formConcerned, lastSubmitFocused.attributes.getNamedItem("value").value,
          lastSubmitFocused.ebx_name);
    }

  }

  var _onConfigureSubmit = function () {
    // by default, considers that the submit is voluntary
    formConcerned.ebx_isVoluntarySubmit = true;

    var submitButton = null;
    if (lastSubmitFocused === null || lastSubmitFocused === undefined) {
      submitButton = defaultSubmitButton;
    } else if (lastSubmitFocused.tagName == "BUTTON") {
      submitButton = lastSubmitFocused;
    }

    // see UIButtonSpecSubmit#askBeforeLeavingModifiedForm
    if (EBX_Form.hasBeenModified(formConcerned)) {
      if (submitButton !== null && EBX_Utils.matchCSSClass(submitButton,
          EBX_Form.AskBeforeLeavingModifiedFormCSSFlag)) {
        formConcerned.ebx_isVoluntarySubmit = false;
      }
    }

    if (formConcerned.appendSerializeInActionBeforeSubmit === true) {
      var actionBuf = [];
      actionBuf.push(wbpForm.originalAction);
      actionBuf.push("?");
      actionBuf.push(EBX_Form.serialize(formConcerned));
      if (submitButton !== null) {
        var requestParameterName = submitButton.name;

        // Mantis #14593
        if (requestParameterName === "") {
          requestParameterName = wbpForm.requestParameterName;
        }

        actionBuf.push("&", requestParameterName, "=", submitButton.value);
      }
      formConcerned.action = actionBuf.join("");

      ebx_keepSessionAliveAjax();
      window.document.body.style.cursor = "wait";
    }

    if (formConcerned.hideOnSubmitId !== undefined) {
      document.getElementById(formConcerned.hideOnSubmitId).style.display = "none";
    }
    if (formConcerned.showOnSubmitId !== undefined) {
      document.getElementById(formConcerned.showOnSubmitId).style.display = "block";
    }
  };

  if (message !== undefined) { // If we need to ask user confirmation prior to submit ...
    // callack : on user confirm
    var _onConfirmSubmit = function () {
      _onConfigureSubmit();
      var submitButton = null;
      if (lastSubmitFocused === null || lastSubmitFocused === undefined) {
        submitButton = defaultSubmitButton;
      } else if (lastSubmitFocused.tagName == "BUTTON") {
        submitButton = lastSubmitFocused;
      }

      //async submit, we have to inject previous hidden submit button properties
      if (submitButton !== null) {
        var hiddenRef = document.createElement("input");
        hiddenRef.type = "hidden";
        hiddenRef.name = submitButton.name;
        hiddenRef.value = submitButton.value;
        formConcerned.insertBefore(hiddenRef, formConcerned.firstChild);
      }
      formConcerned.submit();
    };
    // callback : on user abort
    var _onAbortSubmit = function () {
      if (messageIsFromDefaultButton) {
        EBX_Utils.removeCSSClass(defaultSubmitButton, EBX_ButtonUtils.buttonPushedCSSClass);
      }
    };

    //create confirmation popup content
    var content = {};
    content.question = message;
    content.jsCommandYes = _onConfirmSubmit;
    content.jsCommandNo = _onAbortSubmit;
    content.jsCommandClose = _onAbortSubmit;
    ebx_confirm(content);

    // we stop the event, because we will submit the form later, on user confirm
    YAHOO.util.Event.preventDefault(p_oEvent);

    return false;
  } else {
    _onConfigureSubmit(); // will be submit right after
    return true;
  }
};

EBX_Form.setParentFormDiscardModifications = function (element) {
  var parentForm = EBX_Utils.getFirstParentMatchingTagName(element, 'FORM');

  if (parentForm === null) {
    return;
  }

  parentForm.ebx_isVoluntarySubmit = true;
};

// <button type="submit"/>...</button> is badly supported sometimes by IE8&9 (don't know why)
// only <input type="submit"/> is supported
// see http://msdn.microsoft.com/en-us/library/ms535123 > Community Content
EBX_Form.setSubmitValue = function (form, value, name) {
  // create an hidden field containing the right values
  var hiddenFieldSubmit = document.getElementById("ebx_HiddenFieldSubmit");
  if (hiddenFieldSubmit === null) {
    hiddenFieldSubmit = document.createElement("input");
    hiddenFieldSubmit.id = "ebx_HiddenFieldSubmit";
    hiddenFieldSubmit.type = "hidden";
  }
  form.appendChild(hiddenFieldSubmit);

  hiddenFieldSubmit.name = name;
  hiddenFieldSubmit.value = value;
};

/* This function can be overridden by the form in the page (script in body) */
EBX_Form.checkCustomConditions = function (formEl) {
  return true;
};

EBX_Form.initSubmitNamesForIE = function (form) {

  if (form.ebx_initSubmitForIEDone === true) {
    return;
  }

  var formButtons = form.getElementsByTagName("BUTTON");
  var i = formButtons.length;
  while (i) {
    var button = formButtons[--i];
    if (button.type == "submit") {
      button.ebx_name = button.name;
      button.name = "";
    }
  }
  var hiddenDefaultSubmitButton = EBX_ButtonUtils.getHiddenDefaultSubmitButton(form);
  hiddenDefaultSubmitButton.ebx_name = hiddenDefaultSubmitButton.name;
  hiddenDefaultSubmitButton.name = "";

  form.ebx_initSubmitForIEDone = true;
};

EBX_Form.initFocusTaskId = "EBX_Form_InitFocus";
EBX_Form.formIdsToInitFocus = [];
/**
 * Creates a task executed at the end of treatments
 */
EBX_Form.initFocusEvents = function (formId) {
  if (EBX_Utils.arrayContains(EBX_Form.formIdsToInitFocus, formId)) {
    return;
  }

  EBX_Form.formIdsToInitFocus.push(formId);

  // if EBX_Form.formIdsToInitFocus is already defined, don't create an other task
  if (EBX_Form.formIdsToInitFocus.length > 1) {
    return;
  }

  EBX_Loader.addDynamicallyTaskAfterTaskId(EBX_Loader_taskId_destroy_loading_layer, EBX_Form.initFocusTaskId,
      EBX_Form.initFocusTaskId,
      EBX_Loader.states.onStarting, EBX_Form.initFocusEventsAsTask, EBX_Utils.returnTrue);
};

EBX_Form.WorkspaceFormFooterId = "ebx_WorkspaceFormFooter";
EBX_Form.APVElementCSSClass = "ebx_APV";
// overwrote by FormUtils.java
EBX_Form.initialPathFocused = null;
EBX_Form.initFocusEventsAsTask = function () {
  EBX_Loader.changeTaskState(EBX_Form.initFocusTaskId, EBX_Loader.states.processing);

  var j = EBX_Form.formIdsToInitFocus.length, i, form = null;

  while (j) {
    form = document.getElementById(EBX_Form.formIdsToInitFocus[--j]);
    if (!form) {
      EBX_Loader.changeTaskState(EBX_Form.initFocusTaskId, EBX_Loader.states.done);
      return;
    }

    YAHOO.util.Event.addListener(form.elements, "focus", EBX_Form.focusField);
    YAHOO.util.Event.addListener(form.elements, "blur", EBX_Form.blurField);
    if (YAHOO.env.ua.webkit !== 0) {
      // webkit does not give the focus to a button when it is clicked
      // see http://www.quirksmode.org/dom/events/blurfocus.html#t03
      var formButtons = form.getElementsByTagName("BUTTON");
      i = formButtons.length;
      while (i) {
        var button = formButtons[--i];
        if (button.type == "submit") {
          YAHOO.util.Event.addListener(button, "click", EBX_Form.focusSubmitOnClickForWebkit);
        }
      }
    }

    i = form.elements.length;
    while (i) {
      var element = form.elements[--i];
      if (EBX_Utils.matchCSSClass(element, EBX_Form.APVElementCSSClass)) {
        EBX_FormPresenter.addAPVElementListener(element);
      }
    }

    form.ebx_lastSubmitFocused = null;
    form.ebx_initialSerialize = EBX_Form.serialize(form);
  }

  var keepScrollTop = EBX_Form.formHasAValidationReport(form);
  var elementToFocus = null;
  if ((document.activeElement === document.body) && (form !== null)) {
    if (EBX_Form.initialPathFocused != null) {
      elementToFocus = EBX_Form.findInitialInputToFocus(form);
      if (elementToFocus !== null) {
        EBX_Form.focusElementAfterContentReady(elementToFocus);
      }
    }

    // search for the first element to focus
    // if nothing is focused
    if (elementToFocus === null && EBX_Form.elementIsVisibleInWindowStack(form)) {
      var len = form.elements.length;
      var element;
      var focusSuccessful;

      for (i = 0; i < len; i++) {
        element = form.elements[i];

        //Special treatment for script editor widget
        if (EBX_Form.isHiddenInputForScriptEditor(element)) {
          var editor = EBX_Form.getScriptEditorFromHiddenInput(element);
          if (EBX_Form.elementIsVisibleInWindowStack(editor)) {
            editor.classList.add("_ebx-script-editor_widget-is-focused-init");
            break;
          }
        }

        // invisible elements have width=0
        if (element.offsetWidth <= 0) {
          continue;
        }
        if (element.disabled === true) {
          continue;
        }
        if (element.tabIndex === -1) {
          continue;
        }
        if (element.className === EBX_ButtonUtils.hiddenDefaultSubmitButtonCSSClass) {
          continue;
        }
        if (!EBX_Form.elementIsVisibleInWindowStack(element)) {
          continue;
        }

        elementToFocus = element;
        // if the form contains no fields but just a formFooter
        //  (and so the first visible element of the form is inside the formFooter)
        // then focus the default button if any
        if (EBX_Utils.hasParentMatchingId(element, EBX_Form.WorkspaceFormFooterId) === true
            && form.ebx_defaultSubmitButtonId !== undefined) {
          elementToFocus = document.getElementById(form.ebx_defaultSubmitButtonId);
          keepScrollTop = true;
        }

        focusSuccessful = EBX_Form.focusElementIfStillVisible(elementToFocus);

        // check if the element is focused
        if (focusSuccessful === false || elementToFocus !== document.activeElement) {
          continue;
        }

        break;
      }
    }
  }

  // disable the auto-scroll: keep the scroll top after focus (a key hit in a field will automatically scroll)
  if (keepScrollTop === true && elementToFocus !== null) {
    EBX_Form.getFormScrollingContainer(elementToFocus).scrollTop = 0;
  }
  EBX_Loader.changeTaskState(EBX_Form.initFocusTaskId, EBX_Loader.states.done);
};

/**
 * Check if given element is visible in this frame and also in parent frames (on same domain).
 * Added due to handle autofocus on child frames openings.
 *
 * @param testedElement {HTMLElement}
 * @return {boolean}
 */
EBX_Form.elementIsVisibleInWindowStack = function (testedElement) {
  var currentElem = testedElement;
  var currentWindow = window;
  var isHidden = false;

  while (currentElem != null && !isHidden) {
    isHidden = currentElem.classList.contains("ebx_HidingContainerHidden")
        || currentElem.classList.contains("yui-hidden");

    if (!isHidden) {
      var elemStyle = window.getComputedStyle(currentElem);
      isHidden = (elemStyle.getPropertyValue('display') === "none")
          || (elemStyle.getPropertyValue('visibility') === "hidden");
    }
    if (currentElem.parentElement != null) {
      currentElem = currentElem.parentElement;
    } else {
      var currentWindowDocument;
      try {
        currentWindowDocument = currentWindow.document; // throws a security error when it is on a different domain.
      } catch (e) {
        return true;
      }
      // Continue to check the parent frames...
      // Not-attached element have a null parentElement, but are not attached to the window.
      if (currentElem.parentNode === currentWindowDocument && currentWindow !== window.top) {
        currentElem = currentWindow.frameElement; // frameElement is null if parent is located on a different domain.
                                                  // Stop search at this step in that case.
        currentWindow = currentWindow.parent;
      } else {
        currentElem = null;
      }
    }
  }
  return !isHidden;
};

EBX_Form.findInitialInputToFocus = function (form) {
  if (EBX_FormNodeIndex.isFormNodeDefined(EBX_Form.initialPathFocused) === false) {
    return null;
  }

  var formNode = EBX_FormNodeIndex.getFormNode(EBX_Form.initialPathFocused);
  if (formNode === null) {
    return null;
  }

  // can return null if the input is not present in the form
  // it occurs for groups for example
  return document.getElementById(formNode.inputName);
};

EBX_Form.getFirstValidationReportFound = function (validationReportParentElement) {
  return EBX_Utils.getFirstRecursiveChildMatchingCSSClass(validationReportParentElement,
      EBX_LayoutManager.WorkspaceFormHeaderCSSClass);
};

EBX_Form.formHasAValidationReport = function (formElement) {
  return EBX_Form.getFirstValidationReportFound(formElement) !== null;
};
/**
 * @param formElement {HTMLInputElement}
 * @return {boolean}
 */
EBX_Form.isHiddenInputForScriptEditor = function (formElement) {
  var valueContainer = EBX_Utils.getFirstParentMatchingCSSClass(formElement, "_ebx-script-editor_value");
  return (valueContainer != null);
};
/**
 *
 * @param hiddenInputForScriptEditor {HTMLInputElement}
 * @return {HTMLElement}
 */
EBX_Form.getScriptEditorFromHiddenInput = function (hiddenInputForScriptEditor) {
  return document.getElementById(hiddenInputForScriptEditor.name + "_editor");
};

// Returns false if the focus has failed for many reasons.
// Returns true if the focus has maybe worked, but not sure.
EBX_Form.focusElementIfStillVisible = function (elementToFocus) {

  // case of fieldset (focusable on IE)
  if (elementToFocus.type === undefined) {
    return false;
  }

  // invisible elements have width=0
  if (elementToFocus.offsetWidth <= 0) {
    return false;
  }

  // if it is hidden, the offsetWidth <= 0 may not work
  // this case occurs when the first focusable element is in an hidden form tab
  try {
    elementToFocus.focus();
    return true;
  } catch (e) {
    return false;
  }
};
/**
 * Delays the set of the focus of the element which must be focused. More
 * precisely, wait for certains parent element to have finished theirs
 * rendering.
 *
 * @param {HTMLElement}
 *            elementToFocus Element which will be focused
 */
EBX_Form.focusElementAfterContentReady = function (elementToFocus) {
  EBX_Form.awaitedElementToFocus = elementToFocus;
  EBX_Form.awaitedElementRenderings = [];
  var tabbedPaneElement = EBX_Utils.getFirstParentMatchingCSSClass(elementToFocus, "yui-navset");
  while (tabbedPaneElement !== null) {
    if (tabbedPaneElement.id !== EBX_Form.WorkspaceFormTabviewId) {

      //DMA contains tabViews which are not yet initialized in EBX_Form.tabViews before content is loaded
      // TODO any: how to detect that all form pane with tabs have been initialized ?
      var tabView = EBX_Form.tabViews[tabbedPaneElement.id];
      if (tabView != null) {
        var tabbedPane = tabView.yuiTabView;
        if (tabbedPane.ebx_data_contentReady !== true) {
          EBX_Form.awaitedElementRenderings.push(tabbedPaneElement.id);
          (function (tabbedPane, id) {
            var handler = function (e) {
              var index = EBX_Utils.indexOf(EBX_Form.awaitedElementRenderings, id);
              if (index !== -1) {
                EBX_Form.awaitedElementRenderings.splice(index, 1);
                tabbedPane.unsubscribe("contentReady", handler);
                if (EBX_Form.awaitedElementRenderings.length === 0) {
                  EBX_Form.focusElementIfStillVisible(EBX_Form.awaitedElementToFocus);
                }
              }
            };
            tabbedPane.addListener("contentReady", handler);
          })(tabbedPane, tabbedPaneElement.id);
        }
      }

      tabbedPaneElement = EBX_Utils.getFirstParentMatchingCSSClass(tabbedPaneElement, "yui-navset");
    } else {
      tabbedPaneElement = null;
    }
  }

  if (EBX_Form.awaitedElementRenderings.length === 0) {
    EBX_Form.focusElementIfStillVisible(elementToFocus);
  }
};
// Returns false if the focus has failed for many reasons.
// Returns true if the focus has maybe worked, but not sure.
EBX_Form.focus = function (id) {
  var element = document.getElementById(id);
  if (element !== null) {
    return EBX_Form.focusElementIfStillVisible(element);
  }
  return false;
};

EBX_Form.IgnoreFormCheckCSSClassName = "ebx_IgnoreFormCheck";
EBX_Form.TextareaForHTMLCSSClassName = "ebx_TextareaForHTML";

EBX_Form.serialize = function (formOrContainer) {
  return EBX_Form.serialize(formOrContainer, false);
};
/* from "JavaScript for Web Developpers 2nd Edition"
 * by N.C. Zakas
 * editor Wrox
 * page 457
 */
EBX_Form.serialize = function (formOrContainer, ignoreVoidValues) {
  var elements,
      parts = [],
      field = null;

  if (formOrContainer.tagName === "FORM") {
    elements = formOrContainer.elements;
  } else {
    elements = EBX_Utils.getAllChildFormElements(formOrContainer);
  }

  for (var i = 0, len = elements.length; i < len; i++) {
    field = elements[i];

    if (field.name === "" || field.id === "ebx_HiddenFieldSubmit" || EBX_Utils.matchCSSClass(field,
        EBX_Form.IgnoreFormCheckCSSClassName)) {
      continue;
    }

    switch (field.type) {
      case "select-one":
      case "select-multiple":
        for (var j = 0, optLen = field.options.length; j < optLen; j++) {
          var option = field.options[j];
          if (option.selected) {
            var optValue = "";
            if (option.hasAttribute) {
              optValue = (option.hasAttribute("value") ? option.value : option.text);
            } else {
              optValue = (option.attributes["value"].specified ? option.value : option.text);
            }
            /* if ignoreVoidValues is true and the value equals "", don't add the value */
            if (!ignoreVoidValues || field.value !== "") {
              parts.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(optValue));
            }
          }
        }
        break;

      case undefined:
        //fieldset
      case "file":
        //file input
      case "submit":
        //submit button
      case "reset":
        //reset button
      case "button":
        //custom button
        break;

      case "radio":
        //radio button
      case "checkbox":
        //checkbox
        if (!field.checked) {
          break;
        }
        /* falls through */

      case "textarea":
        // for the case of HTML editor:
        // if the initial value parsed by the HTML editor is the same than the current value (parsed),
        // then take the initial value (it is better for detecting form modifications)
        if (EBX_Utils.matchCSSClass(field, EBX_Form.TextareaForHTMLCSSClassName)) {
          // is textarea with an HTML editor
          if (EBX_Form.TextareaIdEditor[field.id] !== undefined) {
            // is the HTML editor builded
            var editor = EBX_Form.TextareaIdEditor[field.id];
            if (editor.status == "ready") {
              // is the HTML editor ready

              // If the HTML editor is in source mode,
              //  dataProcessor.toHtml does not work because it uses CKEDITOR.dom.document to resolve the HTML
              //  and CKEDITOR.dom.document is undefined (and is hard to create it correctly -- I tried for hours).
              //  It's normal, because there is no reason to enable the wysiwyg feature and then reduce memory cost.
              // So, it is impossible to convert the initial value to the CKEDITOR HTML parsed version.
              // It does not matter, because the user has enabled the source mode, and then he masters HTML.
              // So it is probabely better to NOT convert the initial value to the CKEDITOR HTML parsed version.

              // If the HTML editor is in wysiwyg mode,
              //  the user is not aware of HTML and parse differencies,
              //  so it is better to compare parsed versions,
              //  because he sees the resolved version only.

              var initialParsedHTML;
              if (editor.mode == "source") {
                // don't parse
                initialParsedHTML = field.value;
              } else {
                // parse to compare
                initialParsedHTML = editor.dataProcessor.toHtml(field.value);
              }

              var currentValue = editor.getData();

              // if HTML value has changed, then use the current parsed version of HTML value
              if (initialParsedHTML != currentValue) {
                parts.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(currentValue));
                break;
              }
              // else let the algo do its original job (it will uses the initial value field.value)
            }
          }
        }

      default:
        /* if ignoreVoidValues is true and the value equals "", don't add the value */
        if (!ignoreVoidValues || field.value !== "") {
          parts.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
        }
    }
  }
  return parts.join("&");
};

EBX_Form.hasBeenModified = function (form) {
  if (form.ebx_alwaysReportAsModified == true) {
    return true;
  }

  if (form.ebx_initialSerialize === undefined) {
    return false;
  }

  return form.ebx_initialSerialize != EBX_Form.serialize(form);
};

EBX_Form.FieldClassName = "ebx_Field";
EBX_Form.FieldFocusedClassName = "ebx_Focused";
EBX_Form.FieldAncestorFocusedClassName = "ebx_FocusedAncestor";

//initialized by UITreeForm.java
EBX_Form.trParentIds = [];

EBX_Form.focusField = function (event) {
  EBX_Form.focusOrBlurField(event, true);
};
EBX_Form.blurField = function (event) {
  EBX_Form.focusOrBlurField(event, false);
};
EBX_Form.focusOrBlurField = function (event, isFocus) {
  var formElementFocused, fieldElement, firstFoundElement, parentIds, i, len;

  formElementFocused = event.target;

  fieldElement = EBX_Utils.getFirstParentMatchingCSSClass(formElementFocused, EBX_Form.FieldClassName);
  firstFoundElement = fieldElement;
  while (fieldElement !== null) {
    if (isFocus === true) {
      EBX_Utils.addCSSClass(fieldElement, EBX_Form.FieldFocusedClassName);
    } else {
      EBX_Utils.removeCSSClass(fieldElement, EBX_Form.FieldFocusedClassName);
    }
    fieldElement = EBX_Utils.getFirstParentMatchingCSSClass(fieldElement, EBX_Form.FieldClassName);
  }

  if (firstFoundElement !== null) {
    parentIds = EBX_Form.trParentIds[firstFoundElement.id];
    if (parentIds !== undefined) {
      for (i = 0, len = parentIds.length; i < len; i++) {
        if (isFocus === true) {
          EBX_Utils.addCSSClass(document.getElementById(parentIds[i]), EBX_Form.FieldAncestorFocusedClassName);
        } else {
          EBX_Utils.removeCSSClass(document.getElementById(parentIds[i]), EBX_Form.FieldAncestorFocusedClassName);
        }
      }
    }
  }

  if (isFocus === true) {
    EBX_Form.sendFormFocusChange(formElementFocused.id);
  }
};

//rolling delay between focus an element and send the path to the server (for an auto-focus for the next page)
EBX_Form.sendFocusDelay = 300;
EBX_Form.sendAJAXFocusChangedTimeoutId = null;
EBX_Form.sendFormFocusChange = function (formElementId) {
  if (EBX_Form.saveLastElemFocusedRequest !== undefined) {
    var path = EBX_FormNodeIndex.fieldsIdPath[formElementId];
    if (path === undefined) {
      return;
    }

    if (EBX_Form.sendAJAXFocusChangedTimeoutId !== null) {
      window.clearTimeout(EBX_Form.sendAJAXFocusChangedTimeoutId);
    }

    EBX_Form.sendAJAXFocusChangedTimeoutId = window.setTimeout(function () {
      EBX_Form.sendFormFocusPathChangeImmediately(path);
      EBX_Form.sendAJAXFocusChangedTimeoutId = null;
    }, EBX_Form.sendFocusDelay);
  }
};

EBX_Form.lastPathFocusedSend = null;
EBX_Form.saveLastElemFocusedRequester = null;
EBX_Form.sendFormFocusPathChangeImmediately = function (path) {
  if (EBX_Form.saveLastElemFocusedRequest === undefined) {
    return;
  }
  if (EBX_Form.lastPathFocusedSend === path) {
    return;
  }

  if (EBX_Form.saveLastElemFocusedRequester === null) {
    EBX_Form.saveLastElemFocusedRequester = new YAHOO.util.XHRDataSource(EBX_Form.saveLastElemFocusedRequest);
  }

  EBX_Form.saveLastElemFocusedRequester.sendRequest(encodeURIComponent(path));

  EBX_Form.lastPathFocusedSend = path;
};

EBX_Form.focusSubmitOnClickForWebkit = function (event) {
  var buttonEl = event.target;
  // if the submit button has an icon and if the user clicks on it,
  //  event.target will be the icon, and not the button
  if (buttonEl.tagName != "BUTTON") {
    buttonEl = EBX_Utils.getFirstParentMatchingTagName(buttonEl, "BUTTON");
  }
  EBX_Form.focusSubmit(buttonEl);
};

EBX_Form.focusSubmit = function (buttonSubmitEl) {
  buttonSubmitEl.form.ebx_lastSubmitFocused = buttonSubmitEl;
};
EBX_Form.blurSubmit = function (buttonSubmitEl) {
  buttonSubmitEl.form.ebx_lastSubmitFocused = null;
};

EBX_Form.InputClassName = "ebx_Input";
/* Default value. Overwritten by UIConstantsJS */
EBX_Form.InputPadding = 5;

EBX_Form.OverwrittenValueClassName = "ebx_OverwrittenValue";

EBX_Form.lastTabViewTaskIdSuffix = 0;
EBX_Form.currentTabViewTaskProcessing = -1;
// Map <tabViewId, { tabIds[], yuiTabView: YUITabView}>
EBX_Form.tabViews = {};
EBX_Form.tabTitleIdPrefix = "ebx_TabTitle_";
EBX_Form.hiddenTabTitleCSSClass = "ebx_HiddenTab";
EBX_Form.initYUITabView = function (tabViewId) {
  var tabView = new YAHOO.widget.TabView(tabViewId);
  if (tabView.get("activeIndex") === null) {
    tabView.selectTab(0);
  }
  tabView.addListener('activeTabChange', function (e) {
    EBX_Form.customTabSelectedListener(e, tabViewId);
  });
  tabView.addListener('contentReady', function (e) {
    tabView.ebx_data_contentReady = true;
  });

  // force the redraw of the tab for Webkit (width is not elastic)
  if (YAHOO.env.ua.webkit !== 0) {
    tabView.addListener("activeTabChange", EBX_Form.refreshWidthOfYUITab);
  }

  EBX_Form.activeTabChangeListenerForLaunchComponentJSCmd({
    newValue: tabView.getTab(tabView.get("activeIndex"))
  });

  tabView.addListener("activeTabChange", EBX_Form.activeTabChangeListenerForLaunchComponentJSCmd);

  if (EBX_Form.tabViews[tabViewId] === undefined) {
    EBX_Form.tabViews[tabViewId] = {};
  }

  EBX_Form.tabViews[tabViewId].yuiTabView = tabView;
};
EBX_Form.currentYUITabParentNode = null;
EBX_Form.refreshWidthOfYUITab = function () {
  EBX_Form.currentYUITabParentNode = this._contentParent.parentNode.parentNode;

  EBX_Form.currentYUITabParentNode.style.display = "block";

  window.setTimeout(EBX_Form.restoreStyleDisplayForCurrentYUITabParentNode, 0);
};
EBX_Form.restoreStyleDisplayForCurrentYUITabParentNode = function () {
  if (EBX_Form.currentYUITabParentNode === null) {
    return;
  }

  EBX_Form.currentYUITabParentNode.style.display = "";

  EBX_Form.currentYUITabParentNode = null;
};

EBX_Form.hideTab = function (tabId) {
  var tabTitleEl = document.getElementById(EBX_Form.tabTitleIdPrefix + tabId);

  if (tabTitleEl === null) {
    EBX_Logger.log("EBX_Form.hideTab(\"" + tabId + "\"): tab with id=" + tabId + " not found.", EBX_Logger.error);
  }

  if (EBX_Utils.matchCSSClass(tabTitleEl, "selected")) {
    // TODO CCH select next visible, or previous visible if not found
    // if all hidden: hide the whole pane
  }

  EBX_Utils.addCSSClass(tabTitleEl, EBX_Form.hiddenTabTitleCSSClass);
};

EBX_Form.showTab = function (tabId) {
  var tabTitleEl = document.getElementById(EBX_Form.tabTitleIdPrefix + tabId);

  if (tabTitleEl === null) {
    EBX_Logger.log("EBX_Form.showTab(\"" + tabId + "\"): tab with id=\"" + tabId + "\" not found.", EBX_Logger.error);
  }

  // TODO CCH if tabTitleEl is the only displayed (if the others are hidden), select it

  EBX_Utils.removeCSSClass(tabTitleEl, EBX_Form.hiddenTabTitleCSSClass);
};

EBX_Form.createHTMLEditorWhenReady = function (textAreaId, htmlEditorSpellcheckEnabled) {
  EBX_Form.launchCmdWhenAllParentHidingContainersAreVisible(
      document.getElementById(textAreaId), "EBX_Form.createHTMLEditor(\"" + textAreaId
      + "\"," + htmlEditorSpellcheckEnabled + ")");
};
EBX_Form.isTabFormReady = false;
EBX_Form.activeTabChangeListenerForLaunchComponentJSCmd = function (event) {
  if (event.prevValue !== undefined) {
    EBX_Form.setHidingContainerState(event.prevValue.get("contentEl"), true);
  }

  EBX_Form.setHidingContainerState(event.newValue.get("contentEl"), false);
};

EBX_Form.hidingContainerCSSClass = "ebx_HidingContainer";
EBX_Form.hidingContainerHiddenCSSClass = "ebx_HidingContainerHidden";

/* Map<id<HTMLElement>, HidingContainer>
 * HidingContainer: {
 * id: String, // HTML element
 * isHidden: boolean,
 * jsCmds: String [],
 * children: HidingContainer [],
 * parent: HidingContainer // null if root
 * }
 *
 * all HidingContainers in the page are not saved in the map, only the HidingContainers tree nodes leading to a jsCmd through children or not
 * the tree stays simple and clean (automatically)
 */
EBX_Form.HidingContainers = {};

EBX_Form.getFirstParentBeingAHidingContainer = function (element) {
  return EBX_Utils.getFirstParentMatchingCSSClass(element, EBX_Form.hidingContainerCSSClass);
};
EBX_Form.isElementHiddenByAHidingContainer = function (element) {
  return EBX_Utils.getFirstParentMatchingCSSClass(element, EBX_Form.hidingContainerHiddenCSSClass) !== null;
};

EBX_Form.launchCmdWhenAllParentHidingContainersAreVisible = function (element, jsCmd) {

  // the element is not in a HidingContainer which is hide state
  if (!EBX_Form.isElementHiddenByAHidingContainer(element)) {
    // launch jsCmd immediately
    window.setTimeout(jsCmd, 0);
    // nothing else to do
    return;
  }

  var firstParentBeingAHidingContainer = EBX_Form.getFirstParentBeingAHidingContainer(element);

  // the element is not in a HidingContainer at all
  if (firstParentBeingAHidingContainer === null) {
    // launch jsCmd immediately
    window.setTimeout(jsCmd, 0);
    // nothing else to do
    return;
  }

  //// the element is in a HidingContainer, and at least one of its HidingContainers is in hidden state
  // so, element is hidden and must wait that all of its HidingContainer and ancestors turns into visibe state

  var hidingContainerObj = EBX_Form.getHidingContainerObj(firstParentBeingAHidingContainer);

  hidingContainerObj.jsCmds.push(jsCmd);
};

// builds and save HidingContainer and parents if needed
EBX_Form.getHidingContainerObj = function (hidingContainerElement) {
  var hidingContainerObj = EBX_Form.HidingContainers[hidingContainerElement.id];

  if (hidingContainerObj !== undefined) {
    return hidingContainerObj;
  }

  var parentHidingContainerElement = EBX_Form.getFirstParentBeingAHidingContainer(hidingContainerElement);
  var parentHidingContainerObj = null;

  if (parentHidingContainerElement !== null) {
    parentHidingContainerObj = EBX_Form.getHidingContainerObj(parentHidingContainerElement);
  }

  var hidingContainerObj = {
    id: hidingContainerElement.id,
    isHidden: EBX_Utils.matchCSSClass(hidingContainerElement, EBX_Form.hidingContainerHiddenCSSClass),
    jsCmds: [],
    children: [],
    parent: parentHidingContainerObj
  };

  if (parentHidingContainerObj !== null) {
    parentHidingContainerObj.children.push(hidingContainerObj);
  }

  EBX_Form.HidingContainers[hidingContainerElement.id] = hidingContainerObj;

  return hidingContainerObj;
};

EBX_Form.isContainerOrOneOfParentsHidden = function (hidingContainerObj) {
  if (hidingContainerObj.isHidden === true) {
    return true;
  }
  // hidingContainerObj is not hidden

  if (hidingContainerObj.parent === null) {
    return false;
  }

  // hidingContainerObj is not hidden and have a parent
  return EBX_Form.isContainerOrOneOfParentsHidden(hidingContainerObj.parent);
};

EBX_Form.setHidingContainerState = function (hidingContainerElement, isHidden) {
  if (EBX_Form.HidingContainers[hidingContainerElement.id] === undefined) {
    // not (or not yet) referenced hidingContainerElement, so no jsCmd and no children to impact
    return;
  }

  var hidingContainerObj = EBX_Form.getHidingContainerObj(hidingContainerElement);

  if (isHidden === true) {
    hidingContainerObj.isHidden = true;
    return;
  }

  hidingContainerObj.isHidden = false;

  if (EBX_Form.isContainerOrOneOfParentsHidden(hidingContainerObj)) {
    return;
  }
  // hidingContainerObj and all parents are not hidden

  // launch jsCmds for this hidingContainerObj and all NotHidden descendants, and clean tree if necessary
  EBX_Form.launchAllJSCmdsCurrentAndNotHiddenDescendantsAndCleanTree(hidingContainerObj);
};

EBX_Form.launchAllJSCmdsCurrentAndNotHiddenDescendantsAndCleanTree = function (hidingContainerObj) {
  var i, len, children, child;

  // current hidingContainerObj
  EBX_Form.launchJSCmdsAndCleanTree(hidingContainerObj);

  children = hidingContainerObj.children.slice();// get a copy

  for (i = 0, len = children.length; i < len; i++) {
    child = children[i];
    if (child.isHidden === false) {
      // recursive call
      EBX_Form.launchAllJSCmdsCurrentAndNotHiddenDescendantsAndCleanTree(child);
    }
  }
};

EBX_Form.launchJSCmdsAndCleanTree = function (hidingContainerObj) {
  var jsCmds, jsCmd;

  jsCmds = hidingContainerObj.jsCmds;

  // use shift to remove each jsCmd launched
  jsCmd = jsCmds.shift();
  while (jsCmd !== undefined) {
    window.setTimeout(jsCmd, 0);
    // use shift to remove each jsCmd launched
    jsCmd = jsCmds.shift();
  }

  EBX_Form.cleanTree(hidingContainerObj);
};

// clean hidingContainerObj if empty, then do the same thing for parents
EBX_Form.cleanTree = function (hidingContainerObj) {
  // abort if a jsCmd is present
  if (hidingContainerObj.jsCmds.length > 0) {
    return;
  }
  // abort if a chid is present
  if (hidingContainerObj.children.length > 0) {
    return;
  }

  // remove from map
  delete EBX_Form.HidingContainers[hidingContainerObj.id];

  // remove from parent
  var parentHidingContainerObj = hidingContainerObj.parent;
  if (parentHidingContainerObj !== null) {
    var siblings = parentHidingContainerObj.children;
    var indexOfCurrentAmongSiblings = EBX_Utils.indexOf(siblings, hidingContainerObj);
    if (indexOfCurrentAmongSiblings >= 0) {
      siblings.splice(indexOfCurrentAmongSiblings, 1);
    }
    // recursive call to clean parents too
    EBX_Form.cleanTree(parentHidingContainerObj);
  }
};

/* map id -> ckEditor or null if not init */
EBX_Form.APVHTMLEditorIdEditor = [];

/* map id -> ckEditor or undefined if not init */
EBX_Form.TextareaIdEditor = [];
EBX_Form.HTMLEditorWidth = null;
EBX_Form.HTMLEditorHeight = null;
EBX_Form.CKEDITORSizesInitialized = false;

/**
 *
 * @param textAreaId {string}
 * @param htmlEditorSpellcheckEnabled {boolean}
 */
EBX_Form.createHTMLEditor = function (textAreaId, htmlEditorSpellcheckEnabled) {
  if (EBX_Form.TextareaIdEditor[textAreaId] !== undefined) {
    return;
  }

  // init CKEditor sizes once
  if (EBX_Form.CKEDITORSizesInitialized === false && EBX_Form.HTMLEditorWidth !== null && EBX_Form.HTMLEditorHeight
      !== null) {
    CKEDITOR.config.width = EBX_Form.HTMLEditorWidth;
    CKEDITOR.config.height = EBX_Form.HTMLEditorHeight;
    EBX_Form.CKEDITORSizesInitialized = true;
  }

  var editor = CKEDITOR.replace(textAreaId, {
    disableNativeSpellChecker: !htmlEditorSpellcheckEnabled
  });

  EBX_Form.TextareaIdEditor[textAreaId] = editor;

  if (EBX_Form.APVHTMLEditorIdEditor[textAreaId] !== undefined) {
    EBX_Form.APVHTMLEditorIdEditor[textAreaId] = editor;
    editor.on("blur", EBX_Form.stackHTMLEditorForValidation, null, textAreaId);
  }

  // Mantis #11012: [On Chrome] User interface problem after clicking into maximize button in HTML field.
  // When CKEditor turns into the maximized mode, all its ancestors' style is set to
  // position: fixed; z-index: 9995; width: 0px; height: 0px;
  // and CSS classes are removed
  // I don't know why, it's weird, but it works, it's brutal, but effective, except for Chrome who don't refresh the UI
  if (EBX_LayoutManager.browser === "Chrome" || EBX_LayoutManager.browser === "Safari") {
    editor.on('afterCommandExec', function (event) {
      if (event.data.name == 'maximize') {
        // if CKEditor is maximized
        if (editor.commands.maximize.state === 1) {
          // move the style of the HTML tag, to force Chrome to refresh the UI
          document.body.parentNode.style.position = "static";
        }
        // for the case un-maximized, the style of element is already restored by CKEditor
      }
    });
  }

};

EBX_Form.stackHTMLEditorForValidation = function (ckEventInfo) {
  EBX_FormPresenter.stackPathForValidation(EBX_FormNodeIndex.fieldsIdPath[ckEventInfo.listenerData]);
  if (EBX_LayoutManager.browser == "Firefox" && EBX_LayoutManager.browserVersion.indexOf("3.6") === 0) {
    // FIXME find why the first blur make the caret dissapear and the controls weird on ckEditor when the user focus it
  }
};
