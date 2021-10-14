function EBX_Loader() {
}

EBX_Loader.loadPage = function () {
  EBX_Loader.checkTasksConditions();
  /*
   EBX_Loader.manageTasksToExecuteDisplaying();
   */
  /*
   EBX_Loader.initProgressBar();
   */
  EBX_Loader.scheduler();

  EBX_Loader.addClickEventForBody();
};
YAHOO.util.Event.onDOMReady(EBX_Loader.loadPage);

/* the first task (loading HTML) is always done */
EBX_Loader.currentTaskIndexLaunched = 0;
EBX_Loader.scheduler = function () {
  var currentTask = EBX_Loader.tasksToExecute[EBX_Loader.currentTaskIndexLaunched];

  if (currentTask === undefined) {
    if (EBX_Utils.chronoStart !== undefined) {
      EBX_Utils.chronoStop = new Date();
      document.title += " (" + (EBX_Utils.chronoStop - EBX_Utils.chronoStart) + " ms)";
      var parentWindow = window.parent;
      // parentWindow can be null in the case of cross-domain iframes
      while (parentWindow !== null && parentWindow !== parentWindow.parent) {
        parentWindow = parentWindow.parent;
      }
      if (parentWindow !== null && EBX_LayoutManager.isEmbedded()) {
        parentWindow.document.title += " (+ " + (EBX_Utils.chronoStop - EBX_Utils.chronoStart) + " ms for iFrame)";
      }
    }

    return;
  }

  if (currentTask.state === EBX_Loader.states.done) {
    // go to next task
    EBX_Loader.currentTaskIndexLaunched++;

    EBX_Loader.scheduler();
  } else if (currentTask.state === EBX_Loader.states.onStarting) {
    /*
     EBX_Loader.progressBar.set("value", EBX_Loader.currentTaskIndexLaunched + 1);
     */
    window.setTimeout(currentTask.bind, 0);
  } else if (currentTask.state === EBX_Loader.states.processing) {
    // nothing to do
  }
};

EBX_Loader.tasks = [];

EBX_Loader.getTaskFromId = function (taskId) {
  var tasks_length = EBX_Loader.tasks.length;
  for (var i = 0; i < tasks_length; i++) {
    if (EBX_Loader.tasks[i].id === taskId) {
      return EBX_Loader.tasks[i];
    }
  }
  return null;
};
EBX_Loader.getIndexFromId = function (taskId) {
  var tasks_length = EBX_Loader.tasks.length;
  for (var i = 0; i < tasks_length; i++) {
    if (EBX_Loader.tasks[i].id === taskId) {
      return i;
    }
  }
  return -1;
};

EBX_Loader.changeTaskState = function (taskId, newState) {
  var task = EBX_Loader.getTaskFromId(taskId);
  if (task === null) {
    EBX_Logger.log("EBX_Loader.changeTaskState: unknown task with id='" + taskId + "'. Loading next tasks aborted.",
        EBX_Logger.error);
    return;
  }

  task.state = newState;

  EBX_Loader.scheduler();
  /*
   EBX_Loader.refreshLoadingLayer();
   */
};

EBX_Loader.taskLineClassName = "ebx_TaskLine";
EBX_Loader.currentTaskClassName = "ebx_CurrentTask";
EBX_Loader.refreshLoadingLayer = function () {
  var task;
  var taskLine;
  var tasksToExecute_length = EBX_Loader.tasksToExecute.length;
  for (var i = 0; i < tasksToExecute_length; i++) {
    task = EBX_Loader.tasksToExecute[i];

    if (task.messageId === null || !YAHOO.util.Dom.inDocument(task.messageId)) {
      continue;
    }

    taskLine = document.getElementById(task.messageId);

    taskLine.className = EBX_Loader.taskLineClassName;

    if (i === EBX_Loader.currentTaskIndexLaunched) {
      EBX_Utils.addCSSClass(taskLine, EBX_Loader.currentTaskClassName);
    }

    EBX_Utils.addCSSClass(taskLine, task.state.className);
  }
};

EBX_Loader.tasksToExecute = [];
EBX_Loader.tasksToNotExecute = [];
EBX_Loader.checkTasksConditions = function () {
  EBX_Loader.tasksToExecute = [];
  EBX_Loader.tasksToNotExecute = [];
  var tasks_length = EBX_Loader.tasks.length;
  var task;
  for (var i = 0; i < tasks_length; i++) {
    task = EBX_Loader.tasks[i];
    if (task.condition.call()) {
      EBX_Loader.tasksToExecute.push(task);
    } else {
      EBX_Loader.tasksToNotExecute.push(task);
    }
  }
};
EBX_Loader.manageTasksToExecuteDisplaying = function () {
  var tasksToExecute_length = EBX_Loader.tasksToExecute.length;
  for (var i = 0; i < tasksToExecute_length; i++) {
    if (EBX_Loader.tasksToExecute[i].messageId !== null && YAHOO.util.Dom.inDocument(
        EBX_Loader.tasksToExecute[i].messageId)) {
      document.getElementById(EBX_Loader.tasksToExecute[i].messageId).style.display = "block";
    }
  }

  var tasksToNotExecute_length = EBX_Loader.tasksToNotExecute.length;
  for (i = 0; i < tasksToNotExecute_length; i++) {
    if (EBX_Loader.tasksToNotExecute[i].messageId !== null && YAHOO.util.Dom.inDocument(
        EBX_Loader.tasksToNotExecute[i].messageId)) {
      document.getElementById(EBX_Loader.tasksToNotExecute[i].messageId).style.display = "none";
    }
  }
};

EBX_Loader.isIE = function () {
  return YAHOO.env.ua.ie !== 0;
};
/*
 * IE does not support the DOM movings for a <select>: the selection is loss
 * see http://support.microsoft.com/kb/829907
 */
EBX_Loader.SaveFieldsStateForIE = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_save_fields_state_for_ie, EBX_Loader.states.processing);

  var selectEls = document.getElementsByTagName("SELECT");
  var i = selectEls.length;
  while (i--) {
    var selectEl = selectEls[i];
    if (selectEl.multiple === true) {
      var j = selectEl.options.length;
      while (j--) {
        var optionEl = selectEl.options[j];
        optionEl.ebx_Selected = optionEl.selected;
      }
    } else {
      selectEl.ebx_SelectedIndex = selectEl.selectedIndex;
    }
  }

  var inputEls = document.getElementsByTagName("INPUT");
  i = inputEls.length;
  while (i--) {
    var inputEl = inputEls[i];
    if (inputEl.type !== "password") {
      continue;
    }
    inputEl.ebx_Value = inputEl.value;
  }

  EBX_Loader.changeTaskState(EBX_Loader_taskId_save_fields_state_for_ie, EBX_Loader.states.done);
};
EBX_Loader.RestoreFieldsStateForIE = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_restore_fields_state_for_ie, EBX_Loader.states.processing);

  var selectEls = document.getElementsByTagName("SELECT");
  var i = selectEls.length;
  while (i--) {
    var selectEl = selectEls[i];
    if (selectEl.multiple === true) {
      var j = selectEl.options.length;
      while (j--) {
        var optionEl = selectEl.options[j];
        optionEl.selected = optionEl.ebx_Selected;
      }
    } else {
      selectEl.selectedIndex = selectEl.ebx_SelectedIndex;
    }
  }

  var inputEls = document.getElementsByTagName("INPUT");
  i = inputEls.length;
  while (i--) {
    var inputEl = inputEls[i];
    if (inputEl.type !== "password") {
      continue;
    }
    inputEl.value = inputEl.ebx_Value;
  }

  EBX_Loader.changeTaskState(EBX_Loader_taskId_restore_fields_state_for_ie, EBX_Loader.states.done);
};

EBX_Loader.PageScriptId = "ebx_PageScript";
EBX_Loader.PageScriptExtensionId = "ebx_PageScriptExtension";
EBX_Loader.isPageScriptPresent = function () {
  return document.getElementById(EBX_Loader.PageScriptId) !== null || document.getElementById(
      EBX_Loader.PageScriptExtensionId) !== null;
};
EBX_Loader.loadPageScript = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_page_script, EBX_Loader.states.processing);

  var pageScriptText = document.getElementById(EBX_Loader.PageScriptId);
  if (pageScriptText !== null) {
    var pageScriptEl = document.createElement("script");
    pageScriptEl.type = "text/javascript";

    pageScriptEl.text = pageScriptText.innerHTML;

    pageScriptText.parentNode.removeChild(pageScriptText);

    document.body.appendChild(pageScriptEl);
  }

  // Loaded script may redirect page and thus EBX_Loader may not exist anymore
  if (EBX_Loader && EBX_Loader.changeTaskState) {
    EBX_Loader.changeTaskState(EBX_Loader_taskId_page_script, EBX_Loader.states.done);
  }
};
EBX_Loader.isPageScriptExtensionPresent = function () {
  return document.getElementById(EBX_Loader.PageScriptExtensionId) !== null;
};
EBX_Loader.loadPageScriptExtension = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_page_script_extension, EBX_Loader.states.processing);

  var pageScriptExtensionText = document.getElementById(EBX_Loader.PageScriptExtensionId);
  if (pageScriptExtensionText !== null) {
    var pageScriptExtensionEl = document.createElement("script");
    pageScriptExtensionEl.type = "text/javascript";

    pageScriptExtensionEl.text = pageScriptExtensionText.innerHTML;

    pageScriptExtensionText.parentNode.removeChild(pageScriptExtensionText);

    document.body.appendChild(pageScriptExtensionEl);
  }

  EBX_Loader.changeTaskState(EBX_Loader_taskId_page_script_extension, EBX_Loader.states.done);
};

/*
 EBX_Loader.progressBar = null;
 EBX_Loader.initProgressBar = function(){
 EBX_Loader.progressBar = new YAHOO.widget.ProgressBar({
 width: "300px",
 anim: true,
 maxValue: EBX_Loader.tasksToExecute.length - 2
 });
 EBX_Loader.progressBar.render(document.getElementById("ebx_LoadingProgressBar"));
 EBX_Loader.progressBar.set("value", 1);
 };
 */
EBX_Loader.loadingLayerId = "ebx_LoadingLayer";
EBX_Loader.destroyLoadingLayer = function () {
  EBX_Loader.changeTaskState(EBX_Loader_taskId_destroy_loading_layer, EBX_Loader.states.processing);

  /*
   EBX_Loader.progressBar.destroy();
   */
  var loadingLayer = document.getElementById(EBX_Loader.loadingLayerId);
  if (loadingLayer != null) {
    loadingLayer.parentNode.removeChild(loadingLayer);
  }

  EBX_Loader.changeTaskState(EBX_Loader_taskId_destroy_loading_layer, EBX_Loader.states.done);
};

EBX_Loader.states = function () {
};
EBX_Loader.states.onStarting = {
  className: "ebx_State_OnStarting"
};
EBX_Loader.states.processing = {
  className: "ebx_State_Processing"
};
EBX_Loader.states.done = {
  className: "ebx_State_Done"
};

EBX_Loader.initTasks = function () {
  /* the first task (loading HTML) is always done */
  EBX_Loader.addTask(EBX_Loader_taskId_raw_data, "ebx_Loader_RawData", EBX_Loader.states.done, null,
      EBX_Utils.returnTrue);

  EBX_Loader.addTask(EBX_Loader_taskId_save_url_for_doc_search, "ebx_Loader_SaveBaseURLForDocSearchInCookie",
      EBX_Loader.states.onStarting,
      EBX_LayoutManager.saveBaseURLForDocSearchInCookie, EBX_Utils.returnTrue);

  EBX_Loader.addTask(EBX_Loader_taskId_save_fields_state_for_ie, "ebx_Save_Fields_State_For_IE",
      EBX_Loader.states.onStarting,
      EBX_Loader.SaveFieldsStateForIE, EBX_Loader.isIE);

  EBX_Loader.addTask(EBX_Loader_taskId_page_script, "ebx_Loader_PageScript", EBX_Loader.states.onStarting,
      EBX_Loader.loadPageScript,
      EBX_Loader.isPageScriptPresent);

  EBX_Loader.addTask(EBX_Loader_taskId_layout, "ebx_Loader_Layout", EBX_Loader.states.onStarting,
      EBX_LayoutManager.renderBodyLayout,
      EBX_LayoutManager.renderBodyLayoutCondition);

  EBX_Loader.addTask(EBX_Loader_taskId_layout_workspace, "ebx_Loader_Layout_Workspace", EBX_Loader.states.onStarting,
      EBX_LayoutManager.renderWorkspaceLayout, EBX_LayoutManager.renderWorkspaceLayoutCondition);

  EBX_Loader.addDynamicallyTaskAfterTaskId(EBX_Loader_taskId_layout_workspace, "Workspace_AdvancedSearch", null,
      EBX_Loader.states.onStarting,
      EBX_LayoutManager.initAdvancedSearch, EBX_Utils.returnTrue);

  EBX_Loader.addTask(EBX_Loader_taskId_restore_fields_state_for_ie, "ebx_Restore_Fields_State_For_IE",
      EBX_Loader.states.onStarting,
      EBX_Loader.RestoreFieldsStateForIE, EBX_Loader.isIE);

  EBX_Loader.addTask(EBX_Loader_taskId_building_trees, "ebx_Loader_building_trees", EBX_Loader.states.onStarting,
      EBX_AjaxTreesRegister.buildTrees,
      EBX_Utils.returnTrue);

  EBX_Loader.addTask(EBX_Loader_taskId_destroy_loading_layer, "ebx_Loader_DestroyLoadingLayer",
      EBX_Loader.states.onStarting,
      EBX_Loader.destroyLoadingLayer, EBX_Utils.returnTrue);

  EBX_Loader.addTask("IFrames", "ebx_Loader_IFrames", EBX_Loader.states.onStarting, EBX_LayoutManager.initIFrames,
      EBX_Utils.returnTrue);

  EBX_Loader.addTask(EBX_Loader_taskId_page_script_extension, "ebx_Loader_PageScriptExtension",
      EBX_Loader.states.onStarting,
      EBX_Loader.loadPageScriptExtension, EBX_Loader.isPageScriptExtensionPresent);

  EBX_Loader.addTask(EBX_Loader_taskId_init_resize_workspace_listeners, "ebx_Loader_InitResizeWorkspaceListeners",
      EBX_Loader.states.onStarting,
      EBX_LayoutManager.initResizeWorkspaceListeners, EBX_Utils.returnTrue);

};

EBX_Loader.addTask = function (id, messageId, state, bind, condition) {
  EBX_Loader.tasks.push({
    id: id,
    messageId: messageId,
    state: state,
    bind: bind,
    condition: condition
  });
};
/*
 EBX_Loader.addTaskBeforeTaskId = function(taskId, id, messageId, state, bind, condition){
 EBX_Loader.addOTaskBeforeTaskId(taskId, {
 id: id,
 messageId: messageId,
 state: state,
 bind: bind,
 condition: condition
 });
 };
 */
EBX_Loader.addOTaskBeforeTaskId = function (taskId, oTask) {
  var index = EBX_Loader.getIndexFromId(taskId);
  EBX_Loader.addTaskAtIndex(index, oTask);
};

EBX_Loader.addTaskAfterTaskId = function (taskId, id, messageId, state, bind, condition) {
  EBX_Loader.addOTaskAfterTaskId(taskId, {
    id: id,
    messageId: messageId,
    state: state,
    bind: bind,
    condition: condition
  });
};
EBX_Loader.addOTaskAfterTaskId = function (taskId, oTask) {
  var index = EBX_Loader.getIndexFromId(taskId) + 1;
  EBX_Loader.addTaskAtIndex(index, oTask);
};

EBX_Loader.addTaskAtIndex = function (index, oTask) {
  EBX_Loader.tasks.splice(index, 0, oTask);
};

EBX_Loader.getIndexFromIdAmongTasksToExecute = function (taskId) {
  var tasksToExecute_length = EBX_Loader.tasksToExecute.length;
  for (var i = 0; i < tasksToExecute_length; i++) {
    if (EBX_Loader.tasksToExecute[i].id === taskId) {
      return i;
    }
  }
  return -1;
};
/* Add a task while loader is running.
 * Not secured:
 * - the task may not be executed
 * - else, the condition will not be checked
 */
EBX_Loader.addDynamicallyTaskBeforeTaskId = function (taskId, id, messageId, state, bind, condition) {
  var oTask = {
    id: id,
    messageId: messageId,
    state: state,
    bind: bind,
    condition: condition
  };

  // anyway, add the task in the original list
  EBX_Loader.addOTaskBeforeTaskId(taskId, oTask);

  // if the execution has already started, add it in the running list
  if (EBX_Loader.tasksToExecute.length !== 0) {
    var index = EBX_Loader.getIndexFromIdAmongTasksToExecute(taskId);
    EBX_Loader.tasksToExecute.splice(index, 0, oTask);
  }
};
/* Add a task while loader is running.
 * Not secured:
 * - the task may not be executed
 * - else, the condition will not be checked
 */
EBX_Loader.addDynamicallyTaskAfterTaskId = function (taskId, id, messageId, state, bind, condition) {
  var oTask = {
    id: id,
    messageId: messageId,
    state: state,
    bind: bind,
    condition: condition
  };

  // anyway, add the task in the original list
  EBX_Loader.addOTaskAfterTaskId(taskId, oTask);

  // if the execution has already started, add it in the running list
  if (EBX_Loader.tasksToExecute.length !== 0) {
    var index = EBX_Loader.getIndexFromIdAmongTasksToExecute(taskId) + 1;
    if (index === 0) {
      index = EBX_Loader.tasksToExecute.length;
    }
    EBX_Loader.tasksToExecute.splice(index, 0, oTask);
  }
};
/* Add a task while loader is running.
 * Not secured:
 * - the task may not be executed
 * - else, the condition will not be checked
 *
 * The taskIdArray is browsed, and the first existing taskId is taken into account.
 */
EBX_Loader.addDynamicallyTaskAfterTaskIdArrayPriority = function (taskIdArray, id, messageId, state, bind, condition) {
  var taskIdArrayLength = taskIdArray.length;
  for (var i = 0; i < taskIdArrayLength; i++) {
    if (EBX_Loader.getIndexFromIdAmongTasksToExecute(taskIdArray[i]) > -1) {
      EBX_Loader.addDynamicallyTaskAfterTaskId(taskIdArray[i], id, messageId, state, bind, condition);
      return;
    }
  }
};

EBX_Loader.jsCmdsToExecuteAtTheEndOfLoading = null;
EBX_Loader.executeJSCmdAtTheEndOfLoading = function (jsCmd) {
  if (EBX_Loader.jsCmdsToExecuteAtTheEndOfLoading === null) {
    EBX_Loader.jsCmdsToExecuteAtTheEndOfLoading = [];

    var lastTask = EBX_Loader.tasksToExecute[EBX_Loader.tasksToExecute.length - 1];
    EBX_Loader.addDynamicallyTaskAfterTaskId(lastTask.id, "ExecuteJSCmdAtTheEndOfLoading",
        "ebx_Loader_ExecuteJSCmdAtTheEndOfLoading",
        EBX_Loader.states.onStarting, EBX_Loader.executeJSCmds, EBX_Utils.returnTrue);
  }

  EBX_Loader.jsCmdsToExecuteAtTheEndOfLoading.push(jsCmd);
};
EBX_Loader.executeJSCmds = function () {
  var jsCmd = EBX_Loader.jsCmdsToExecuteAtTheEndOfLoading.shift();
  while (jsCmd !== undefined) {
    window.setTimeout(jsCmd, 0);
    jsCmd = EBX_Loader.jsCmdsToExecuteAtTheEndOfLoading.shift();
  }
};

EBX_Loader.initTasks();

EBX_Loader.gotoTimeoutPage = function () {
  window.location.href = EBX_Constants.getRequestLink(ebx_timeoutEvent);
};

EBX_Loader.urlLogout = null;
EBX_Loader.actionClosePopup = null;

EBX_Loader.keyListeners = [];
EBX_Loader.keyDownListeners = [];
EBX_Loader.keyUpListeners = [];

EBX_Loader.stackKeyWithModifierListenerIn = function (map, key, ctrl, shift, alt, fn, scope, args) {
  var keyStr = EBX_Loader.keyConfigToString(key, ctrl, shift, alt);
  if (map[keyStr] === undefined) {
    map[keyStr] = [];
  }

  map[keyStr].push({
    fn: fn,
    scope: scope,
    args: args
  });
};

//Capture key press/down/up
EBX_Loader.stackKeyListener = function (key, fn, scope, args) {
  EBX_Loader.stackKeyWithModifierListenerIn(EBX_Loader.keyListeners,
      key,
      key === EBX_Utils.keyCodes.CTRL, // To handle key listener on single key Ctrl or Shift or Alt
      key === EBX_Utils.keyCodes.SHIFT,
      key === EBX_Utils.keyCodes.ALT,
      fn, scope, args);
};
EBX_Loader.stackKeyWithModifierListener = function (key, ctrl, shift, alt, fn, scope, args) {
  EBX_Loader.stackKeyWithModifierListenerIn(EBX_Loader.keyListeners, key, ctrl, shift, alt, fn, scope, args);
};

//Only capture key down
EBX_Loader.stackKeyDownListener = function (key, fn, scope, args) {
  EBX_Loader.stackKeyWithModifierListenerIn(EBX_Loader.keyDownListeners,
      key,
      key === EBX_Utils.keyCodes.CTRL, // To handle key listener on single key Ctrl or Shift or Alt
      key === EBX_Utils.keyCodes.SHIFT,
      key === EBX_Utils.keyCodes.ALT,
      fn, scope, args);
};
EBX_Loader.stackKeyDownWithModifierListener = function (key, ctrl, shift, alt, fn, scope, args) {
  EBX_Loader.stackKeyWithModifierListenerIn(EBX_Loader.keyDownListeners, key, ctrl, shift, alt, fn, scope, args);
};

//Only capture key up
EBX_Loader.stackKeyUpListener = function (key, fn, scope, args) {
  EBX_Loader.stackKeyWithModifierListenerIn(EBX_Loader.keyUpListeners,
      key,
      false,
      false,
      false,
      fn, scope, args);
};
EBX_Loader.stackKeyUpWithModifierListener = function (key, ctrl, shift, alt, fn, scope, args) {
  EBX_Loader.stackKeyWithModifierListenerIn(EBX_Loader.keyUpListeners, key, ctrl, shift, alt, fn, scope, args);
};

//Remove
EBX_Loader.removeKeyWithModifierListenerIn = function (map, key, ctrl, shift, alt, fn, scope) {
  var keyStr = EBX_Loader.keyConfigToString(key, ctrl, shift, alt);
  if (map[keyStr] === undefined) {
    return;
  }

  map[keyStr] = EBX_Utils.filter(map[keyStr], function (keyListener) {
    // equivalent to !(keyListener.fn === fn && keyListener.scope === scope)
    // https://fr.wikipedia.org/wiki/Lois_de_De_Morgan
    // https://en.wikipedia.org/wiki/De_Morgan%27s_laws
    return keyListener.fn !== fn || keyListener.scope !== scope;
  });
};

//Remove a generic shortcut
EBX_Loader.removeKeyListener = function (key, fn, scope) {
  EBX_Loader.removeKeyWithModifierListenerIn(EBX_Loader.keyListeners,
      key,
      key === EBX_Utils.keyCodes.CTRL, // To handle key listener on single key Ctrl or Shift or Alt
      key === EBX_Utils.keyCodes.SHIFT,
      key === EBX_Utils.keyCodes.ALT,
      fn, scope);
};
EBX_Loader.removeKeyWithModifierListener = function (key, ctrl, shift, alt, fn, scope) {
  EBX_Loader.removeKeyWithModifierListenerIn(EBX_Loader.keyListeners, key, ctrl, shift, alt, fn, scope);
};

//Remove a key down shortcut
EBX_Loader.removeKeyDownListener = function (key, fn, scope) {
  EBX_Loader.removeKeyWithModifierListenerIn(EBX_Loader.keyDownListeners,
      key,
      key === EBX_Utils.keyCodes.CTRL, // To handle key listener on single key Ctrl or Shift or Alt
      key === EBX_Utils.keyCodes.SHIFT,
      key === EBX_Utils.keyCodes.ALT,
      fn, scope);
};
EBX_Loader.removeKeyDownWithModifierListener = function (key, ctrl, shift, alt, fn, scope) {
  EBX_Loader.removeKeyWithModifierListenerIn(EBX_Loader.keyDownListeners, key, ctrl, shift, alt, fn, scope);
};

//Remove a key up shortcut
EBX_Loader.removeKeyUpListener = function (key, fn, scope) {
  //
  EBX_Loader.removeKeyWithModifierListenerIn(EBX_Loader.keyUpListeners,
      key,
      false,
      false,
      false,
      fn, scope);
};
EBX_Loader.removeKeyUpWithModifierListener = function (key, ctrl, shift, alt, fn, scope) {
  EBX_Loader.removeKeyWithModifierListenerIn(EBX_Loader.keyUpListeners, key, ctrl, shift, alt, fn, scope);
};

EBX_Loader.keyConfigToString = function (keyCode, ctrl, shift, alt) {
  var keyStr = "";
  if (ctrl) {
    keyStr += "#CTRL";
  }
  if (shift) {
    keyStr += "#SHIFT";
  }
  if (alt) {
    keyStr += "#ALT";
  }
  keyStr += keyCode;
  return keyStr;
};
EBX_Loader.keyEventToString = function (event) {
  var keyStr = "";
  if (event.ctrlKey) {
    keyStr += "#CTRL";
  }
  if (event.shiftKey) {
    keyStr += "#SHIFT";
  }
  if (event.altKey) {
    keyStr += "#ALT";
  }
  keyStr += event.keyCode;
  return keyStr;
};

EBX_Loader.handleKeyEvent = function (mapListeners, event) {
  var keyEventStr = EBX_Loader.keyEventToString(event);
  var listeners = mapListeners[keyEventStr];
  if (listeners === undefined) {
    return null;
  }

  if (listeners.length === 0) {
    return null;
  }

  var listenerObj = listeners[listeners.length - 1];
  var fn = eval(listenerObj.fn);
  return fn.call(listenerObj.scope, listenerObj.args);
};

// close this window (internal popup) when Escape button is pressed
try {
  var containerWindow = ebx_getContainerWindow(window);
  var parentWindow = containerWindow.parent;
  if (containerWindow !== parentWindow && parentWindow.EBX_Utils !== undefined && EBX_Utils.isWindowOnSameDomain(parentWindow)) {
    EBX_Loader.stackKeyListener(EBX_Utils.keyCodes.ESCAPE, parent.EBX_Utils.closeInternalPopup);
  }
} catch (error) {
  // nothing to do: EBX® is inside an third party iFrame
}

// escape, del, arrow keys and function keys only works with onkeyup and onkeydown in Chrome, so do the same thing for all browsers
// escape and function keys key should be pressed once, so listen only onkeyup
// del and arrow keys are intended to stay pressed, so listen only onkeydown
// Key with modifier (ctrl, alt, shift, etc) does not fire keyPress on chrome
document.onkeydown = function (event) {
  // IE case
  if (event === undefined) {
    event = window.event;
  }

  // listen only del and arrow keys
  if (event.keyCode !== EBX_Utils.keyCodes.DELETE && EBX_Utils.isArrowKey(event.keyCode) === false
      && !event.ctrlKey && !event.altKey && !event.shiftKey) {
    return;
  }
  var result = EBX_Loader.handleKeyEvent(EBX_Loader.keyDownListeners, event);
  if (result == null) {
    return EBX_Loader.handleKeyEvent(EBX_Loader.keyListeners, event);
  }
  return result;
};

document.onkeypress = function (event) {
  // IE case
  if (event === undefined) {
    event = window.event;
  }

  // onkeypress: don't listen escape nor arrow keys nor functions keys
  if (event.keyCode === EBX_Utils.keyCodes.ESCAPE || event.keyCode === EBX_Utils.keyCodes.DELETE
      || EBX_Utils.isArrowKey(event.keyCode) === true
      || EBX_Utils.isFunctionKey(event.keyCode) === true) {
    return;
  }
  return EBX_Loader.handleKeyEvent(EBX_Loader.keyListeners, event);
};

document.onkeyup = function (event) {
  // IE case
  if (event === undefined) {
    event = window.event;
  }

  // onkeyup: listen only ESCAPE key and function keys
  if (event.keyCode !== EBX_Utils.keyCodes.ESCAPE && EBX_Utils.isFunctionKey(event.keyCode) === false
      && (event.keyCode !== EBX_Utils.keyCodes.CTRL) && (event.keyCode !== EBX_Utils.keyCodes.SHIFT) && (event.keyCode
          !== EBX_Utils.keyCodes.ALT)) {
    return;
  }
  var result = EBX_Loader.handleKeyEvent(EBX_Loader.keyUpListeners, event);
  if (result == null) {
    return EBX_Loader.handleKeyEvent(EBX_Loader.keyListeners, event);
  }
  return result;
};

EBX_Loader.isMouseDown = false;
EBX_Loader.onMouseReleasedStack = [];
EBX_Loader.onMouseReleasedOnce = function (fn, arg, scope) {
  //CP-18659: When iframe src change/refresh/unmount, onmouseup listener of this document is removed
  // and oumouseup event is never caught.
  //
  // In order to avoid that some callbacks stacked [EBX_Loader.onMouseReleasedOnce] to be never called,
  // store this param in top EBX frame.

  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    return;
  }
  var callback = windowsStack[0]["EBX_ExecuteOnMouseReleasedOnce"];
  if (!callback) {
    return;
  }
  callback(fn, arg, scope);
};

EBX_Loader.onbeforeunload = function () {
  if (EBX_Utils.isForcedClose) {
    return;
  }

  var formId = EBX_Form.WorkspaceFormId;

  if (EBX_Utils.arrayContains(EBX_Form.formIdsDetectionOfLostModificationDisabled, formId)) {
    return;
  }

  var form = document.getElementById(formId);

  /* do not search for forms in sub-session, because the iFrame will raise the onbeforeunload itself
   if (form === null) {
   form = EBX_Utils.getElementByIdInSubSessionIFrameRecursively(formId);
   }
   */

  if (form !== null) {
    if (form.ebx_isVoluntarySubmit === undefined) {
      form.ebx_isVoluntarySubmit = false;
    }

    if (form.ebx_isVoluntarySubmit === false && EBX_Form.hasBeenModified(form)) {
      form.ebx_isVoluntarySubmit = false;

      var workspaceHeaderH2 = EBX_LayoutManager.getWorkspaceTitleH2();
      var workspaceTitle = "";
      if (workspaceHeaderH2 !== null) {
        if (workspaceHeaderH2.textContent !== undefined) {
          workspaceTitle = workspaceHeaderH2.textContent;
        } else if (workspaceHeaderH2.innerText !== undefined) {
          // for IE8 and other non-compatible
          workspaceTitle = workspaceHeaderH2.innerText;
        }
      }

      if (workspaceTitle == "") {
        return EBX_LocalizedMessage.confirmLosingFormModifications;
      }

      return EBX_LocalizedMessage.confirmLosingFormModificationsTitle.replace("{0}", workspaceTitle);
    }
    form.ebx_isVoluntarySubmit = false;
  }
};

EBX_Loader.DESCENDING_MOUSE_EVENTS = -112;
EBX_Loader.ASCENDING_MOUSE_EVENTS = -113;
/* Mouse events sent to parent Legacy or newUI. other events (such as "mouseup" etc.) can be added if needed */
EBX_Loader.ascendingMouseEvents = ["mousedown", "mouseup"];
/* Mouse events sent to child Legacy. other events (such as "mouseup" etc.) can be added if needed */
EBX_Loader.descendingMouseEvents = ["mousedown", "mouseup", "click"];

EBX_Loader.sendEventToParent = function (event) {
  /* simulate an mouse event in NewUI */
  if (event.clientX == EBX_Loader.DESCENDING_MOUSE_EVENTS) {
    // avoid infinit loop
    return;
  }

  var windowsStack = EBX_Utils.getWindowStackToHybridParentFrame();
  if (!windowsStack) {
    return;
  }

  var stackLength = windowsStack.length;
  var i = stackLength - 2;
  if (i >= 0) {
    var callback = windowsStack[i]["EBX_HybridModeOnEvent"];
    if (callback) {
      if (event instanceof MouseEvent) {
        callback(JSON.stringify({
          type: "MouseEvent",
          params: {
            typeArg: event.type,
            canBubbleArg: true,
            cancelableArg: event.cancelable,
            viewArg: null,
            detailArg: event.detail,
            screenXArg: 0,
            screenYArg: 0,
            clientXArg: EBX_Loader.ASCENDING_MOUSE_EVENTS,
            clientYArg: 0,
            ctrlKeyArg: event.ctrlKey,
            altKeyArg: event.altKey,
            shiftKeyArg: event.shiftKey,
            metaKeyArg: event.metaKey,
            buttonArg: event.button,
            relatedTargetArg: null
          }
        }));
      }
    } else {
      callback = windowsStack[i].EBX_Utils.processSynchronizedEvent;
      if (callback) {
        if (event instanceof MouseEvent) {
          callback("MouseEvent", {
            typeArg: event.type,
            canBubbleArg: true,
            cancelableArg: event.cancelable,
            viewArg: null,
            detailArg: event.detail,
            screenXArg: 0,
            screenYArg: 0,
            clientXArg: EBX_Loader.ASCENDING_MOUSE_EVENTS,
            clientYArg: 0,
            ctrlKeyArg: event.ctrlKey,
            altKeyArg: event.altKey,
            shiftKeyArg: event.shiftKey,
            metaKeyArg: event.metaKey,
            buttonArg: event.button,
            relatedTargetArg: null
          });
        }
      }
    }
  }
};
EBX_Loader.sendEventToChild = function (event) {

  /* simulate an mouse event in child */
  if (event.clientX == EBX_Loader.ASCENDING_MOUSE_EVENTS) {
    // avoid infinit loop
    return;
  }

  var iframeEl = document.getElementById("ebx_SubSessioniFrame"); // iframe can be legacy or New UI.
  if (iframeEl && iframeEl.contentWindow && iframeEl.contentWindow.EBX_Utils) { // EBX_Utils is defined for legacy or New UI iframes.
    // Check if legacy iFrame is surrounded by a New UI iFrame.
    //var legacyComponentId = iframeEl.contentWindow.EBX_Utils.EBX_LEGACY_COMPONENT_ID;

    var callback = iframeEl.contentWindow.EBX_Utils.processSynchronizedEvent;
    if (callback) {
      if (event instanceof MouseEvent) {
        callback("MouseEvent", {
          typeArg: event.type,
          canBubbleArg: true,
          cancelableArg: event.cancelable,
          viewArg: null,
          detailArg: event.detail,
          screenXArg: 0,
          screenYArg: 0,
          clientXArg: EBX_Loader.DESCENDING_MOUSE_EVENTS,
          clientYArg: 0,
          ctrlKeyArg: event.ctrlKey,
          altKeyArg: event.altKey,
          shiftKeyArg: event.shiftKey,
          metaKeyArg: event.metaKey,
          buttonArg: event.button,
          relatedTargetArg: null
        });
      }
    }
  }
  if(EBX_Utils.currentInternalPopup && EBX_Utils.currentInternalPopup.ebx_iframeId){
    iframeEl = document.getElementById(EBX_Utils.currentInternalPopup.ebx_iframeId); // iframe can be legacy or New UI.
    if (iframeEl && iframeEl.contentWindow && iframeEl.contentWindow.EBX_Utils) { // EBX_Utils is defined for legacy or New UI iframes.
      // Check if legacy iFrame is surrounded by a New UI iFrame.
      //var legacyComponentId = iframeEl.contentWindow.EBX_Utils.EBX_LEGACY_COMPONENT_ID;

      var callback = iframeEl.contentWindow.EBX_Utils.processSynchronizedEvent;
      if (callback) {
        if (event instanceof MouseEvent) {
          callback("MouseEvent", {
            typeArg: event.type,
            canBubbleArg: true,
            cancelableArg: event.cancelable,
            viewArg: null,
            detailArg: event.detail,
            screenXArg: 0,
            screenYArg: 0,
            clientXArg: EBX_Loader.DESCENDING_MOUSE_EVENTS,
            clientYArg: 0,
            ctrlKeyArg: event.ctrlKey,
            altKeyArg: event.altKey,
            shiftKeyArg: event.shiftKey,
            metaKeyArg: event.metaKey,
            buttonArg: event.button,
            relatedTargetArg: null
          });
        }
      }
    }
  }
};

EBX_Loader.addClickEventForBody = function () {
  var ascending_events_length = EBX_Loader.ascendingMouseEvents.length;
  var descending_events_length = EBX_Loader.descendingMouseEvents.length;
  if (document.body.addEventListener) {
    /* Firefox and modern browsers */
    for (var i = 0; i < ascending_events_length; i++) {
      document.body.addEventListener(EBX_Loader.ascendingMouseEvents[i], EBX_Loader.sendEventToParent, true);
    }
    for (var i = 0; i < descending_events_length; i++) {
      document.body.addEventListener(EBX_Loader.descendingMouseEvents[i], EBX_Loader.sendEventToChild, true);
    }
  } else if (document.body.attachEvent) {
    /* IE */
    for (var i = 0; i < ascending_events_length; i++) {
      document.body.attachEvent(EBX_Loader.ascendingMouseEvents[i], EBX_Loader.sendEventToParent);
    }
    for (var i = 0; i < descending_events_length; i++) {
      document.body.attachEvent(EBX_Loader.descendingMouseEvents[i], EBX_Loader.sendEventToChild);
    }
  }
};

//@EBXAddonAPI
ebx_getFormLostChangesWarning = EBX_Loader.onbeforeunload;

window.onbeforeunload = EBX_Loader.onbeforeunload;
