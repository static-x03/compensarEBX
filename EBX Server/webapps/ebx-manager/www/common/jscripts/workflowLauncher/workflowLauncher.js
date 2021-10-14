var ebx_workflowLauncher_Documentation = {

  update: function (inputParameter, requestDocumentation) {

    var url = requestDocumentation.url;
    var predicate = requestDocumentation.predicate;
    var documentationWidgetName = requestDocumentation.documentationWidgetName;
    var targetNode = requestDocumentation.targetNode; // targetNode is the node which is required by AjaxComponent to build a response.
    var displayInformationPredicate = requestDocumentation.displayInformationPredicate;

    // Predicate is used to decide whether or not to display the standard documentation widget
    if (eval(predicate)) {
      ebx_workflowLauncher_Helper.displayStandardDocumentation(documentationWidgetName);
      return;
    }

    // If the documentation is displayed, send a request to an Ajax component to compute and update documentation components.
    var updateDocumentationAjax = new EBX_AJAXResponseHandler();

    // Each time the current input changes or a service is set to workflow launcher, the
    updateDocumentationAjax.handleAjaxResponseSuccess = function (response) {
      var json = JSON.parse(response);

      // Replace old documentation elements with new ones.
      json.forEach(function (item) {
        ebx_workflowLauncher_Helper.replaceElementByHTMLAndKeepOrder(item.id, item.innerHTML);
      });
    };
    // The request url, contains the following parameters targetNodeValue, documentationWidgetName, and displayInformation.
    // 1. targetNodeValue is the Path of the node which is required to build documentation component. For example in the case of
    //    launcher definition record form, the documentation depends on the value of the node workflow publication.
    // 2. documentationWidgetName, identifier of the widget, it is used to build identifiers of the new documentation component.
    // 3. displayInformation is used to decide whether or not to display/update the information component of the documentation widget.
    //    Because, the information is optional.
    var targetNodeValue = ebx_form_getNodeValue(targetNode);
    url += targetNodeValue ? "&targetNodeValue=" + targetNodeValue.key : "";
    url += documentationWidgetName ? "&documentationWidgetName=" + documentationWidgetName : "";

    if (eval(displayInformationPredicate)) {
      url += "&displayInformation=" + EBX_WorkflowLauncherLabelWidget.on;
    }

    updateDocumentationAjax.sendRequest(url);
  }
};

var ebx_workflowLauncher_DataContext = {
  update: function (inputParameter, requestDataContext) {

    var url = requestDataContext.url;
    var targetNode = requestDataContext.targetNode; // targetNode is the node which is required by AjaxComponent to build a response.

    // If the documentation is displayed, send a request to an Ajax component to compute and update documentation components.
    var updateDataContextAjax = new EBX_AJAXResponseHandler();

    // Each time the current input changes or a service is set to workflow launcher, the
    updateDataContextAjax.handleAjaxResponseSuccess = function (response) {
      var json = JSON.parse(response);
      ebx_workflowLauncher_Helper.updateDataContext(json.newDataContextHTML, json.dataContextGroupId, json.isHidden)
    };
    // The request url, contains the following parameters targetNodeValue, documentationWidgetName, and displayInformation.
    // 1. targetNodeValue is the Path of the node which is required to build documentation component. For example in the case of
    //    launcher definition record form, the documentation depends on the value of the node workflow publication.
    // 2. documentationWidgetName, identifier of the widget, it is used to build identifiers of the new documentation component.
    // 3. displayInformation is used to decide whether or not to display/update the information component of the documentation widget.
    //    Because, the information is optional.
    var targetNodeValue = ebx_form_getNodeValue(targetNode);
    url += targetNodeValue ? "&targetNodeValue=" + targetNodeValue.key : "";
    updateDataContextAjax.sendRequest(url);
  }
};

var ebx_workflowLauncher = (function () {
  return {
    onPublicationChanged: onPublicationChanged,
    onLauncherChanged: onLauncherChanged
  };

  function onPublicationChanged(selection, any) {
    var json = JSON.parse(any);
    ebx_workflowLauncher_Documentation.update(selection, json.documentation);
    ebx_workflowLauncher_DataContext.update(selection, json.dataContext);
  }

  function onLauncherChanged(selection, any) {
    var jsonParams = JSON.parse(any);
    ebx_workflowLauncher_Documentation.update(selection, jsonParams);
  }
})();