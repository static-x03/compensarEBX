var ebx_CtbBeanServiceWidget = (function() {
  return {
    onAfterLauncherChanged: onAfterLauncherChanged,
    onAfterServiceChanged: onAfterServiceChanged
  };

  function onAfterLauncherChanged(selection, any) {
    var json = JSON.parse(any);
    ebx_workflowLauncher_Documentation.update(selection, json);
  }

  function onAfterServiceChanged(selection, any) {
    var json = JSON.parse(any);
    ebx_workflowLauncher_Documentation.update(selection, json.documentation);
    refreshParameters(selection, json.parameters);
  }

  function refreshParameters(selection, paramObj) {
    var url = paramObj.url;
    var id = paramObj.id;

    var params = "__WIDGET_NAME__=" + encodeURIComponent(id);
    if (selection != null) {
      params += "&__KEY__=" + encodeURIComponent(selection.key);
    }

    var serviceParamsObject = {};
    var form = document.forms[EBX_Form.WorkspaceFormId];
    var paramPrefix = id + "_param_";
    if (form != null) {
      for (var i = 0; i < form.length; ++i) {
        var elem = form.elements[i];

        if (elem.name.indexOf(paramPrefix) === 0) {
          serviceParamsObject[elem.name.substr(paramPrefix.length)] = elem.value;
        }
      }
    }
    params += "&__PARAMETERS__=" + encodeURIComponent(JSON.stringify(serviceParamsObject));

    var ajaxHandler = new EBX_AJAXResponseHandler();

    ajaxHandler.handleAjaxResponseSuccess = function (responseContent) {
      var targetId = id + "_parameters";
      var target = document.getElementById(targetId);

      if (target) {
        target.innerHTML = responseContent;

        var dynamicDisplay = window["ebx_" + id + "_dynamicDisplay"];
        dynamicDisplay.refresh();
      }
    };

    ajaxHandler.sendRequest(url + "&" + params);
  }
})();