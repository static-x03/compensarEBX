function EBX_WPIH() {
}

EBX_WPIH.taskCSSClass = "ebx_wpihTask";
EBX_WPIH.currentTaskCSSClass = "ebx_wpihCurrentTask";
EBX_WPIH.hiddenTaskCSSClass = "ebx_wpihHiddenTask";

EBX_WPIH.buttonScrollAmount = 132;//px /* 100(task.width) + 32(separator.width) */

EBX_WPIH.marginForSelectionWhenAutoScroll = 50;//px

/* When the user hold a scroll button.
 * The scroll is done once, then a delay, then repeated scrolls. */
EBX_WPIH.delayToLaunchRepeatedScrolling = 400;//ms

EBX_WPIH.delayForRepeatedScrolling = 100;//ms

EBX_WPIH.buttonScrollAnimationDuration = 100;//ms
EBX_WPIH.selectionAutoScrollAnimationDuration = 500;//ms
EBX_WPIH.gotoPositionScrollAnimationDuration = 200;//ms

EBX_WPIH.taskFlowRegister = [];

EBX_WPIH.taskFlowToRemoveOnAJAXReload = [];

EBX_WPIH.createAndRegisterTaskFlow = function (taskFlowName, config) {
  if (EBX_WPIH.taskFlowRegister[taskFlowName] !== undefined) {
    return;
  }

  var taskFlow = new EBX_WPIH.taskFlow(taskFlowName, config);

  EBX_WPIH.taskFlowRegister[taskFlowName] = taskFlow;
};

EBX_WPIH.initTaskFlows = function () {
  for (var taskFlowName in EBX_WPIH.taskFlowRegister) {
    EBX_WPIH.taskFlowRegister[taskFlowName].init();
  }
};

EBX_WPIH.removeAJAXTaskFlows = function () {
  var taskFlowName;
  while ((taskFlowName = EBX_WPIH.taskFlowToRemoveOnAJAXReload.shift()) !== undefined) {
    delete EBX_WPIH.taskFlowRegister[taskFlowName];
  }
};

EBX_WPIH.refreshTaskFlowsSizeConstants = function () {
  for (var taskFlowName in EBX_WPIH.taskFlowRegister) {
    EBX_WPIH.taskFlowRegister[taskFlowName].refreshSizeConstants();
    EBX_WPIH.taskFlowRegister[taskFlowName].scrollListener();
  }
};

EBX_WPIH.workspaceResizeListenerEnabled = false;
EBX_WPIH.enableWorkspaceResizeListener = function () {

  if (EBX_WPIH.workspaceResizeListenerEnabled === true) {
    return;
  }

  EBX_LayoutManager.resizeWorkspaceListeners.push(EBX_WPIH.refreshTaskFlowsSizeConstants);
  EBX_WPIH.workspaceResizeListenerEnabled = true;

};

EBX_WPIH.showHiddenTasksCSSClass = "ebx_wpihShowHiddenTasks";

/* Will call the update of variable graphical element every x ms during the CSS transition of the show/hide hiddenTasks.
 * Set 0 to disable it.
 */
EBX_WPIH.showHiddenTasksRefreshInterval = 10;

// in ms. Must match with the CSS transition duration property set on .ebx_wpihIcon and .ebx_wpihTask
EBX_WPIH.showHiddenTasksTransitionDuration = 500;

EBX_WPIH.showHiddenTasksRefreshCurrentIntervalID = null;

EBX_WPIH.showHiddenTasksRefreshClearInterval = function () {
  if (EBX_WPIH.showHiddenTasksRefreshCurrentIntervalID === null) {
    return;
  }

  window.clearInterval(EBX_WPIH.showHiddenTasksRefreshCurrentIntervalID);
  EBX_WPIH.showHiddenTasksRefreshCurrentIntervalID = null;

  EBX_WPIH.selectIndicatorTransition(true);
};

EBX_WPIH.showHiddenTasks = function (isInitDontSave) {

  EBX_Utils.addCSSClass(document.body, EBX_WPIH.showHiddenTasksCSSClass);

  if (!EBX_LayoutManager.doesBrowserSupportsCSSTransitions) {
    // no delay needed
    EBX_WPIH.refreshAfterToggleHiddenTasks();
    return;
  }

  if (EBX_WPIH.showHiddenTasksRefreshInterval > 0) {
    EBX_WPIH.showHiddenTasksRefreshClearInterval();

    EBX_WPIH.selectIndicatorTransition(false);

    EBX_WPIH.showHiddenTasksRefreshCurrentIntervalID = window.setInterval(EBX_WPIH.refreshAfterToggleHiddenTasks,
        EBX_WPIH.showHiddenTasksRefreshInterval);

    window.setTimeout(EBX_WPIH.showHiddenTasksRefreshClearInterval, EBX_WPIH.showHiddenTasksTransitionDuration);
  }

  // if transition or not: refresh after transition duration
  window.setTimeout(EBX_WPIH.refreshAfterToggleHiddenTasks, EBX_WPIH.showHiddenTasksTransitionDuration);

  if (isInitDontSave !== true) {
    EBX_WPIH.saveShowHiddenTasks(true);
  }
};

EBX_WPIH.hideHiddenTasks = function () {

  EBX_Utils.removeCSSClass(document.body, EBX_WPIH.showHiddenTasksCSSClass);

  var selectIndicatorTransition = false;

  // unselect the task if hidden and not current
  var mainTaskFlow = EBX_WPIH.taskFlowRegister[EBX_WPIH.mainTaskFlowId];
  if (mainTaskFlow !== undefined) {
    if (mainTaskFlow.selectedIndex >= 0 && EBX_Utils.matchCSSClass(mainTaskFlow.taskEls[mainTaskFlow.selectedIndex],
        EBX_WPIH.hiddenTaskCSSClass)
        && !EBX_Utils.matchCSSClass(mainTaskFlow.taskEls[mainTaskFlow.selectedIndex], EBX_WPIH.currentTaskCSSClass)) {
      mainTaskFlow.selectedIndex = -1;

      selectIndicatorTransition = true;

      EBX_WPIH.callbackSuccess(null, {
        results: [{
          title: "",
          infoText: "",
          preview: ""
        }]
      }, null);
    }
  }

  if (!EBX_LayoutManager.doesBrowserSupportsCSSTransitions) {
    // no delay needed
    EBX_WPIH.refreshAfterToggleHiddenTasks();
    return;
  }

  if (EBX_WPIH.showHiddenTasksRefreshInterval > 0) {
    EBX_WPIH.showHiddenTasksRefreshClearInterval();

    EBX_WPIH.selectIndicatorTransition(selectIndicatorTransition);

    EBX_WPIH.showHiddenTasksRefreshCurrentIntervalID = window.setInterval(EBX_WPIH.refreshAfterToggleHiddenTasks,
        EBX_WPIH.showHiddenTasksRefreshInterval);

    window.setTimeout(EBX_WPIH.showHiddenTasksRefreshClearInterval, EBX_WPIH.showHiddenTasksTransitionDuration);
  }

  // if transition or not: refresh after transition duration
  window.setTimeout(EBX_WPIH.refreshAfterToggleHiddenTasks, EBX_WPIH.showHiddenTasksTransitionDuration);

  EBX_WPIH.saveShowHiddenTasks(false);
};

EBX_WPIH.refreshAfterToggleHiddenTasks = function () {
  for (var taskFlowName in EBX_WPIH.taskFlowRegister) {
    EBX_WPIH.taskFlowRegister[taskFlowName].refreshAfterToggleHiddenTasks();
  }
};

EBX_WPIH.selectIndicatorTransition = function (enable) {
  for (var taskFlowName in EBX_WPIH.taskFlowRegister) {
    if (EBX_WPIH.taskFlowRegister[taskFlowName].selectIndicatorEl !== undefined) {
      if (enable === true) {
        EBX_Utils.removeCSSClass(EBX_WPIH.taskFlowRegister[taskFlowName].selectIndicatorEl, "ebx_disableTransition");
      } else {
        EBX_Utils.addCSSClass(EBX_WPIH.taskFlowRegister[taskFlowName].selectIndicatorEl, "ebx_disableTransition");
      }
    }
  }
};

EBX_WPIH.saveShowingHiddenTasksDataSource = null;
EBX_WPIH.saveShowHiddenTasks = function (isShowHiddenTasks) {
  if (EBX_WPIH.saveShowingHiddenTasksDataSource === null) {
    EBX_WPIH.saveShowingHiddenTasksDataSource = new YAHOO.util.XHRDataSource(EBX_WPIH.showingHiddenTasksRequest);
  }

  EBX_WPIH.saveShowingHiddenTasksDataSource.sendRequest(isShowHiddenTasks + "", null);
};

EBX_WPIH.scrollLeftTaskFlow = function (taskFlowName) {
  EBX_WPIH.taskFlowRegister[taskFlowName].scrollLeft();
};
EBX_WPIH.scrollRightTaskFlow = function (taskFlowName) {
  EBX_WPIH.taskFlowRegister[taskFlowName].scrollRight();
};

EBX_WPIH.launchScrollIntervalTaskFlow = function (taskFlowName) {
  EBX_WPIH.taskFlowRegister[taskFlowName].launchScrollInterval();
};

/**
 * A Task Flow is a component showing tasks as a chain of graphical elements,
 * linked by arrows. This component have its own scroll component.
 *
 * @param name
 *            a unique name in the page (registered by
 *            EBX_WPIH.taskFlowRegister)
 * @param config
 *            is a object containing the following attributes:
 * @param selectedIndex
 *            the current selected task index
 * @param presentTaskIndex
 *            the present task index
 * @param isPreview
 *            true if the workflow is a preview, false if it's a main (a click
 *            on a task will have a different action)
 * @param isPreviewOpenPopup
 *            true if click on a click on a workflow task or background opens a
 *            popup
 * @param workflowUrl
 *            (optionnal) base URL to use on a click on a workflow task or
 *            background
 * @returns {EBX_WPIH.ebx_taskFlow}
 */
EBX_WPIH.taskFlow = function (name, config) {
  this.name = name;
  this.taskFlowOverviewId = name;

  this.selectedIndex = config.selectedIndex;
  this.presentTaskIndex = config.presentTaskIndex;
  this.isPreview = config.isPreview === true;
  this.isPreviewOpenPopup = config.isPreviewOpenPopup === true;
  this.workflowUrl = config.workflowUrl;

  this.initDone = false;

  this.taskFlowOverviewEl;
  this.taskContainerEl;
  this.selectIndicatorEl;

  this.scrollEl;
  {
    this.scrollBGPastEl;
    this.scrollBGPresentEl;
    this.scrollBGFutureEl;

    this.scrollBtnLeftEl;
    this.scrollBtnRightEl;

    this.scrollSlideLeftEl;
    this.scrollKnobEl;
    this.scrollKnobDDEl;
    this.scrollSlideRightEl;
  }

  this.taskEls;

  this.hScrollHeight;

  this.presentTaskLeftPos;
  this.presentTaskWidth;
  this.viewWidth;
  this.scrollWidth;
  this.selectIndicatorWidth;

  this.timeLinePastEl;
  this.timeLinePresentEl;
  this.timeLineFutureEl;

  this.init = function () {
    if (this.initDone === true) {
      return;
    }
    YAHOO.util.Event.onContentReady(this.taskFlowOverviewId, this.onContentReady, this, true);
    this.initDone = true;
  };

  this.onContentReady = function () {
    this.taskFlowOverviewEl = document.getElementById(this.taskFlowOverviewId);

    this.scrollEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskFlowOverviewEl, "ebx_wpihTaskScroll");

    this.scrollBGPastEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl, "ebx_wpihTaskScrollBGPast");
    this.scrollBGPresentEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl,
        "ebx_wpihTaskScrollBGPresent");
    if (this.scrollBGPresentEl === null) {
      this.scrollBGPresentEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl,
          "ebx_wpihTaskScrollBGError");
    }
    this.scrollBGFutureEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl, "ebx_wpihTaskScrollBGFuture");

    this.scrollBtnLeftEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl, "ebx_wpihTaskScrollBtnLeft");
    this.scrollBtnRightEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl, "ebx_wpihTaskScrollBtnRight");

    this.scrollSlideLeftEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl,
        "ebx_wpihTaskScrollSlideLeft");
    this.scrollKnobEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl, "ebx_wpihTaskScrollKnob");
    this.scrollKnobDDEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl, "ebx_wpihTaskScrollKnobDD");
    this.scrollSlideRightEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.scrollEl,
        "ebx_wpihTaskScrollSlideRight");

    this.taskContainerWithTimelineEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskFlowOverviewEl,
        "ebx_wpihTaskContainerWithTimeline");
    this.taskContainerEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskContainerWithTimelineEl,
        "ebx_wpihTaskContainer");
    this.selectIndicatorEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskContainerEl,
        "ebx_wpihSelectIndicator");

    this.timeLinePastEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskContainerWithTimelineEl,
        "ebx_wpihTimeLinePast");
    this.timeLinePresentEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskContainerWithTimelineEl,
        "ebx_wpihTimeLinePresent");
    if (this.timeLinePresentEl === null) {
      this.timeLinePresentEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskContainerWithTimelineEl,
          "ebx_wpihTimeLineError");
    }
    this.timeLineFutureEl = EBX_Utils.getFirstDirectChildMatchingCSSClass(this.taskContainerWithTimelineEl,
        "ebx_wpihTimeLineFuture");

    this.taskEls = EBX_Utils.getRecursiveChildrenMatchingCSSClass(this.taskContainerEl, EBX_WPIH.taskCSSClass);

    this.hScrollHeight = EBX_Utils.getHScrollHeight();

    if (this.presentTaskIndex !== -1) {
      this.presentTaskLeftPos = this.taskEls[this.presentTaskIndex].offsetLeft;
      this.presentTaskWidth = this.taskEls[this.presentTaskIndex].offsetWidth;
    } else {
      this.presentTaskLeftPos = this.taskContainerEl.scrollWidth;
      this.presentTaskWidth = 0;
    }

    this.selectIndicatorWidth = this.selectIndicatorEl.offsetWidth;

    this.refreshSizeConstants();

    this.refreshScrollKnobPosition();

    if (!this.isPreview) {
      this.updateSelectIndicator();
    } else if (this.presentTaskIndex !== -1) {
      this.scrollToTaskIndex(this.presentTaskIndex);
    }

    YAHOO.util.Event.addListener(this.taskContainerEl, "click", this.clickListener, null, this);
    YAHOO.util.Event.addListener(this.taskContainerEl, "scroll", this.scrollListener, null, this);

    this.scrollListener();

    EBX_WPIH.enableWorkspaceResizeListener();
  };

  this.refreshAfterToggleHiddenTasks = function () {
    // sometimes, the task flow is not ready. Never mind, there is nothing to refresh
    // and the refresh will be done at first display a few milliseconds later
    if (this.taskContainerEl === undefined) {
      return;
    }

    this.scrollWidth = this.taskContainerEl.scrollWidth;
    this.isScrollEnabled = this.viewWidth < this.scrollWidth;

    if (this.presentTaskIndex !== -1) {
      this.presentTaskLeftPos = this.taskEls[this.presentTaskIndex].offsetLeft;
    } else {
      this.presentTaskLeftPos = this.taskContainerEl.scrollWidth;
    }

    if (!this.isPreview) {
      this.updateSelectIndicator();
    }

    this.initScroll();
    this.scrollListener();
  };

  this.refreshSizeConstants = function () {
    this.viewWidth = this.taskFlowOverviewEl.offsetWidth;
    this.scrollWidth = this.taskContainerEl.scrollWidth;
    this.isScrollEnabled = this.viewWidth < this.scrollWidth;

    this.initScroll();
    this.initTimeLinePositions();
  };

  this.getSelectedIndex = function () {
    return this.selectedIndex;
  };

  this.clickListener = function (event) {
    var targetEl = EBX_Utils.getTargetElement(event);

    var taskEl = targetEl;
    if (!EBX_Utils.matchCSSClass(taskEl, EBX_WPIH.taskCSSClass)) {
      taskEl = EBX_Utils.getFirstParentMatchingCSSClass(targetEl, EBX_WPIH.taskCSSClass);
    }
    if (taskEl !== null) {
      var index = EBX_Utils.indexOf(this.taskEls, taskEl);
      if (index !== -1) {
        if (this.isPreview) {
          if (this.isPreviewOpenPopup) {
            EBX_Utils.openInternalPopupLargeSizeHostedClose(this.workflowUrl + index);
          } else {
            window.location.href = this.workflowUrl + index;
          }
          return;
        } else {
          this.selectedIndex = index;
          this.updateSelectIndicator();
          EBX_WPIH.selectMainTaskListener(this);
          return;
        }
      }
    }

    if (this.isPreview) {
      if (this.isPreviewOpenPopup) {
        EBX_Utils.openInternalPopupLargeSizeHostedClose(this.workflowUrl);
      } else {
        window.location.href = this.workflowUrl;
      }
    }
  };

  this.initScroll = function () {
    if (!this.isScrollEnabled) {
      if (this.isPreview) {
        this.scrollEl.style.display = "none";
      } else {
        this.scrollEl.style.visibility = "hidden";
      }
      return;
    }
    if (this.isPreview) {
      this.scrollEl.style.display = "";
    } else {
      this.scrollEl.style.visibility = "";
    }

    this.scrollElOffsetLeft = EBX_Utils.getOffsetLeftRelativeToContainer(this.scrollEl, document.body);

    this.scrollLeftBound = this.scrollBtnLeftEl.offsetWidth;
    this.scrollRightBound = this.scrollBtnRightEl.offsetWidth;

    this.scrollAvailableWidth = this.viewWidth - this.scrollLeftBound - this.scrollRightBound;

    var pastProportion = this.presentTaskLeftPos / this.scrollWidth;
    var presentProportion = this.presentTaskWidth / this.scrollWidth;

    var presentStartPos = this.scrollLeftBound + Math.round(pastProportion * this.scrollAvailableWidth);
    var futureStartPos = presentStartPos + Math.round(presentProportion * this.scrollAvailableWidth);

    this.scrollBGPastEl.style.left = this.scrollLeftBound + "px";
    this.scrollBGPastEl.style.width = presentStartPos - this.scrollLeftBound + "px";

    this.scrollBGPresentEl.style.left = presentStartPos + "px";
    this.scrollBGPresentEl.style.width = futureStartPos - presentStartPos + "px";

    this.scrollBGFutureEl.style.left = futureStartPos + "px";
    this.scrollBGFutureEl.style.right = this.scrollRightBound + "px";

    var knobWidthProportion = this.viewWidth / this.scrollWidth;
    this.knobWidth = Math.round(knobWidthProportion * this.scrollAvailableWidth);

    this.scrollSlideLeftEl.style.left = this.scrollLeftBound + "px";
    this.scrollKnobEl.style.width = this.knobWidth + "px";
    this.scrollKnobDDEl.style.width = this.knobWidth + "px";
    this.scrollSlideRightEl.style.right = this.scrollRightBound + "px";

    /* init drag n drop */
    if (this.knobDD === undefined) {
      this.isKnobDD = false;
      this.knobDD = new YAHOO.util.DD(this.scrollKnobDDEl);
      this.knobDD.subscribe("startDragEvent", this.startDragKnobListener, null, this);
      this.knobDD.subscribe("dragEvent", this.dragKnobListener, null, this);
      this.knobDD.subscribe("endDragEvent", this.endDragKnobListener, null, this);

      YAHOO.util.Event.addListener(this.scrollEl, "mousedown", this.scrollMouseDownListener, null, this);
      YAHOO.util.Event.addListener(this.scrollEl, "mouseup", this.scrollMouseUpListener, null, this);
      YAHOO.util.Event.addListener(this.scrollEl, "mouseout", this.scrollMouseOutListener, null, this);
    }
  };

  this.startDragKnobListener = function (dragCoords) {
    this.isKnobDD = true;
    EBX_Utils.addCSSClass(document.body, "ebx_wpihTaskScrollGrabbing");
  };
  this.dragKnobListener = function (event) {
    this.scrollKnobDDEl.style.top = "";

    var offsetLeft = this.scrollKnobDDEl.offsetLeft;

    var offsetLeftInSlide = offsetLeft - this.scrollLeftBound;

    var offsetLeftProportion = offsetLeftInSlide / this.scrollAvailableWidth;

    var scrollLeftTaget = Math.round(offsetLeftProportion * this.scrollWidth);

    this.taskContainerEl.scrollLeft = scrollLeftTaget;
  };
  this.endDragKnobListener = function (event) {
    this.isKnobDD = false;
    this.scrollKnobDDEl.style.left = this.scrollKnobEl.offsetLeft + "px";
    EBX_Utils.removeCSSClass(document.body, "ebx_wpihTaskScrollGrabbing");
  };

  this.refreshScrollKnobPosition = function () {
    if (!this.isScrollEnabled) {
      return;
    }

    var scrollLeft = this.taskContainerEl.scrollLeft;

    var knobLeftProportion = scrollLeft / this.scrollWidth;

    var slideLeftWidth = Math.round(knobLeftProportion * this.scrollAvailableWidth);

    this.scrollSlideLeftEl.style.width = slideLeftWidth + 1 + "px";

    this.scrollKnobEl.style.left = this.scrollLeftBound + slideLeftWidth + "px";
    if (this.isKnobDD === false) {
      this.scrollKnobDDEl.style.left = this.scrollLeftBound + slideLeftWidth + "px";
    }

    this.scrollSlideRightEl.style.width = this.scrollAvailableWidth - (slideLeftWidth + this.knobWidth) + 1 + "px";
  };

  this.scrollMouseDownListener = function (event) {
    var targetEl = EBX_Utils.getTargetElement(event);

    if (targetEl === this.scrollSlideLeftEl || targetEl === this.scrollSlideRightEl) {

      var xCoord = event.clientX;

      var xCoordInSlide = xCoord - this.scrollElOffsetLeft - this.scrollLeftBound;

      var scrollLeftProportion = (xCoordInSlide - this.knobWidth / 2) / this.scrollAvailableWidth;

      var scrollLeftTaget = scrollLeftProportion * this.scrollWidth;

      new YAHOO.util.Scroll(this.taskContainerEl, {
        scroll: {
          to: [scrollLeftTaget, 0]
        }
      }, EBX_WPIH.gotoPositionScrollAnimationDuration / 1000, YAHOO.util.Easing.easeBoth).animate();

      // in case of YUI animation performance issues, use this
      //			this.taskContainerEl.scrollLeft = scrollLeftTaget;

      return;
    }

    var isScrollButtonLeft = false;
    var isScrollButtonRight = false;
    var targetParentEl = targetEl;
    while (targetParentEl !== this.scrollEl) {
      if (targetParentEl.parentNode === this.scrollBtnLeftEl) {
        isScrollButtonLeft = true;
        break;
      }
      if (targetParentEl.parentNode === this.scrollBtnRightEl) {
        isScrollButtonRight = true;
        break;
      }
      targetParentEl = targetParentEl.parentNode;
    }

    this.scrollIntervalCmd = null;
    if (isScrollButtonLeft) {
      this.scrollIntervalCmd = "EBX_WPIH.scrollLeftTaskFlow(\"" + this.name + "\")";
    }
    if (isScrollButtonRight) {
      this.scrollIntervalCmd = "EBX_WPIH.scrollRightTaskFlow(\"" + this.name + "\")";
    }

    if (this.scrollIntervalCmd !== null) {
      window.setTimeout(this.scrollIntervalCmd, 0);
      this.scrollTimeout = window.setTimeout("EBX_WPIH.launchScrollIntervalTaskFlow(\"" + this.name + "\")",
          EBX_WPIH.delayToLaunchRepeatedScrolling);
      return;
    }
  };

  this.launchScrollInterval = function () {
    this.scrollInterval = window.setInterval(this.scrollIntervalCmd, EBX_WPIH.delayForRepeatedScrolling);
  };

  this.scrollMouseUpListener = function (event) {
    window.clearTimeout(this.scrollTimeout);
    window.clearInterval(this.scrollInterval);
  };

  this.scrollMouseOutListener = function (event) {
    window.clearTimeout(this.scrollTimeout);
    window.clearInterval(this.scrollInterval);
  };

  this.initTimeLinePositions = function () {
    this.timeLinePastEl.style.left = 0;
    this.timeLinePresentEl.style.width = this.presentTaskWidth + "px";
  };

  this.scrollListener = function () {
    this.refreshScrollKnobPosition();
    this.updateTimeLinePositions();
  };

  this.updateTimeLinePositions = function () {

    var scrollLeft = this.taskContainerEl.scrollLeft;

    var widthPast = this.presentTaskLeftPos - scrollLeft;

    var leftPositionPresent = this.presentTaskLeftPos - scrollLeft;

    var leftPositionFuture = leftPositionPresent + this.presentTaskWidth;

    var widthFuture = this.viewWidth - leftPositionFuture;

    var isPastDisplayed = true;
    var isPresentDisplayed = true;
    var isFutureDisplayed = true;

    if (widthPast > this.viewWidth) {
      widthPast = this.viewWidth;

      isPresentDisplayed = false;
      isFutureDisplayed = false;
    }

    if (widthPast + this.presentTaskWidth > this.viewWidth) {
      isFutureDisplayed = false;
    }

    if (widthFuture > this.viewWidth) {
      widthFuture = this.viewWidth;

      isPastDisplayed = false;
      isPresentDisplayed = false;
    }

    if (leftPositionFuture < 0) {
      leftPositionFuture = 0;
    }

    if (isPastDisplayed) {
      this.timeLinePastEl.style.width = widthPast + "px";
      this.timeLinePastEl.style.display = "";
    } else {
      this.timeLinePastEl.style.display = "none";
    }

    if (isPresentDisplayed) {
      this.timeLinePresentEl.style.left = leftPositionPresent + "px";
      this.timeLinePresentEl.style.display = "";
    } else {
      this.timeLinePresentEl.style.display = "none";
    }

    if (isFutureDisplayed) {
      this.timeLineFutureEl.style.left = leftPositionFuture + "px";
      this.timeLineFutureEl.style.width = widthFuture + "px";
      this.timeLineFutureEl.style.display = "";
    } else {
      this.timeLineFutureEl.style.display = "none";
    }
  };

  this.updateSelectIndicator = function () {
    if (this.selectedIndex < 0) {
      this.selectIndicatorEl.style.left = "";//reset (apply CSS init state)
      return;
    }

    var selectedTaskOffsetLeft = this.taskEls[this.selectedIndex].offsetLeft;
    this.selectIndicatorEl.style.left = selectedTaskOffsetLeft + "px";

    this.scrollToTaskIndex(this.selectedIndex);
  };

  this.scrollToTaskIndex = function (index) {
    var selectedTaskOffsetLeft = this.taskEls[index].offsetLeft;

    var currentScrollLeft = this.taskContainerEl.scrollLeft;

    var gapForSelectorLeftMargin = -1;

    var isHiddenLeft = currentScrollLeft + EBX_WPIH.marginForSelectionWhenAutoScroll > selectedTaskOffsetLeft
        + gapForSelectorLeftMargin;

    var targetScrollLeft = null;

    if (isHiddenLeft) {
      targetScrollLeft = selectedTaskOffsetLeft + gapForSelectorLeftMargin - EBX_WPIH.marginForSelectionWhenAutoScroll;
    } else {
      var isHiddenRight = currentScrollLeft + this.viewWidth < selectedTaskOffsetLeft + gapForSelectorLeftMargin
          + this.selectIndicatorWidth
          + EBX_WPIH.marginForSelectionWhenAutoScroll;
      if (isHiddenRight) {
        targetScrollLeft = selectedTaskOffsetLeft + gapForSelectorLeftMargin + this.selectIndicatorWidth
            + EBX_WPIH.marginForSelectionWhenAutoScroll - this.viewWidth;
      }
    }

    if (targetScrollLeft !== null) {
      new YAHOO.util.Scroll(this.taskContainerEl, {
        scroll: {
          to: [targetScrollLeft, 0]
        }
      }, EBX_WPIH.selectionAutoScrollAnimationDuration / 1000, YAHOO.util.Easing.easeBoth).animate();

      // in case of YUI animation performance issues, use this
      //			this.taskContainerEl.scrollLeft = targetScrollLeft;
    }
  };

  this.scrollLeft = function () {

    new YAHOO.util.Scroll(this.taskContainerEl, {
      scroll: {
        to: [this.taskContainerEl.scrollLeft - EBX_WPIH.buttonScrollAmount, 0]
      }
    }, EBX_WPIH.buttonScrollAnimationDuration / 1000).animate();

    // in case of YUI animation performance issues, use this
    //			this.taskContainerEl.scrollLeft -= EBX_WPIH.buttonScrollAmount;
  };

  this.scrollRight = function () {

    new YAHOO.util.Scroll(this.taskContainerEl, {
      scroll: {
        to: [this.taskContainerEl.scrollLeft + EBX_WPIH.buttonScrollAmount, 0]
      }
    }, EBX_WPIH.buttonScrollAnimationDuration / 1000).animate();

    // in case of YUI animation performance issues, use this
    //			this.taskContainerEl.scrollLeft += EBX_WPIH.buttonScrollAmount;
  };

};

EBX_WPIH.selectMainTaskListener = function (taskFlow) {
  var selectedIndex = taskFlow.getSelectedIndex();

  if (selectedIndex < 0) {
    return;
  }

  EBX_WPIH.dataSource.sendRequest(selectedIndex, {
    success: EBX_WPIH.callbackSuccess,
    failure: EBX_WPIH.callbackFailure
  });
};

EBX_WPIH.dataSourceResponseSchema = {
  resultsList: "infoPane"
};

EBX_WPIH.getCallbackObject = function () {
  return {
    success: EBX_WPIH.callbackSuccess,
    failure: EBX_WPIH.callbackFailure
  };
};

EBX_WPIH.mainTaskFlowId = "ebx_wpihMainTaskFlow";
EBX_WPIH.infoTitleId = "ebx_wpihInfoTitle";
EBX_WPIH.infoBodyId = "ebx_wpihInfoBody";
EBX_WPIH.infoTextId = "ebx_wpihInfoText";
EBX_WPIH.infoPreviewId = "ebx_wpihInfoPreview";
EBX_WPIH.dataContextId = "ebx_wpihDataContext";

EBX_WPIH.callbackSuccess = function (oRequest, oParsedResponse, argument) {
  var infoPane;

  // remove the documentation pane, just in case it was open
  EBX_NodeDocumentation.hideCurrentDocumentationNow();

  // remove previous task flows get with AJAX
  EBX_WPIH.removeAJAXTaskFlows();

  infoPane = oParsedResponse.results[0];

  document.getElementById(EBX_WPIH.infoTitleId).innerHTML = infoPane.title;

  document.getElementById(EBX_WPIH.infoTextId).innerHTML = infoPane.infoText;

  document.getElementById(EBX_WPIH.infoPreviewId).innerHTML = infoPane.preview;

  var dataContextContainer = document.getElementById(EBX_WPIH.dataContextId);
  if (dataContextContainer !== null) {
    if (infoPane.dataContext !== undefined) {
      dataContextContainer.innerHTML = infoPane.dataContext;
    } else {
      dataContextContainer.innerHTML = "";
    }
  }

  // execute script from current response
  window.setTimeout(infoPane.scriptToExecute, 0);
};

EBX_WPIH.callbackFailure = function (oRequest, oParsedResponse, argument) {

  if (oParsedResponse.status == 401) {
    EBX_Loader.gotoTimeoutPage();
    return;
  }

};

EBX_WPIH.init = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_workflow_process_instance_history, EBX_Loader.states.processing);

  // disable WorkspaceContent scrolls
  EBX_LayoutManager.WorkspaceContentEl.style.overflow = "hidden";

  EBX_LayoutManager.WorkspaceContentAreaEl.style.overflow = "hidden";
  EBX_LayoutManager.WorkspaceContentAreaEl.style.padding = "0";

  EBX_LayoutManager.bodyLayout.addListener("resize", EBX_WPIH.resizeInfoBody, null, null);
  EBX_WPIH.resizeInfoBody();

  EBX_WPIH.initTaskFlows();

  YAHOO.util.Event.addListener(EBX_WPIH.getInfoBody(), "scroll", EBX_WPIH.displayShadowOnScroll, null);

  EBX_WPIH.dataSource = new YAHOO.util.XHRDataSource(EBX_WPIH.infoPaneContentRequest);
  EBX_WPIH.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
  EBX_WPIH.dataSource.responseSchema = EBX_WPIH.dataSourceResponseSchema;

  EBX_Loader.changeTaskState(EBX_Loader_taskId_workflow_process_instance_history, EBX_Loader.states.done);
};

EBX_WPIH.infoBodyEl = null;

EBX_WPIH.getInfoBody = function () {
  if (EBX_WPIH.infoBodyEl === null) {
    EBX_WPIH.infoBodyEl = document.getElementById(EBX_WPIH.infoBodyId);
  }
  return EBX_WPIH.infoBodyEl;
};

EBX_WPIH.resizeInfoBody = function () {
  var targetHeight = EBX_LayoutManager.WorkspaceContentAreaEl.offsetHeight;
  targetHeight -= document.getElementById(EBX_WPIH.mainTaskFlowId).offsetHeight;
  targetHeight -= document.getElementById(EBX_WPIH.infoTitleId).offsetHeight;

  EBX_WPIH.getInfoBody().style.height = targetHeight + "px";

  var scrollShadow = EBX_WPIH.getScrollShadow();
  if (scrollShadow !== null) {
    scrollShadow.style.top = EBX_WPIH.getInfoBody().offsetTop + "px";
    scrollShadow.style.width = EBX_WPIH.getInfoBody().clientWidth + "px";
    scrollShadow.style.borderTopLeftRadius = "0";
  }
};

EBX_WPIH.scrollShadow = null;
EBX_WPIH.getScrollShadow = function () {
  if (EBX_WPIH.scrollShadow === null) {
    EBX_WPIH.scrollShadow = document.getElementById("ebx_ScrollShadow");
  }
  return EBX_WPIH.scrollShadow;
};

EBX_WPIH.displayShadowOnScroll = function () {
  if (EBX_WPIH.getInfoBody().scrollTop > 0) {
    EBX_WPIH.getScrollShadow().style.display = "block";
  } else {
    EBX_WPIH.getScrollShadow().style.display = "none";
  }
};

EBX_WPIH.displayWorkItemInfo = function (buttonId, workitemId) {
  EBX_LabelTooltip.reinitCurrentToggleButton();
  EBX_LabelTooltip.currentLabelDocButtonId = buttonId;
  var workitemEl = document.getElementById(workitemId);
  EBX_NodeDocumentation.displayDocumentation(workitemEl);
};
