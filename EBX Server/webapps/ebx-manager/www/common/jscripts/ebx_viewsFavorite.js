var Ebx_ViewsFavorite = (function () {
  "use strict";

  var defaultViewName;
  var buttonConfigurations = [];

// -------------------- //
// ACCESSIBLE FUNCTIONS //
// -------------------- //

  return {
    setFavoriteViewName: setFavoriteViewName,
    registerButtons: registerButtons,
    initDefaultViewButtons: initDefaultViewButtons,
    setDefaultView: setDefaultView,
    unsetDefaultView: unsetDefaultView
  };

// -------------- //
// IMPLEMENTATION //
// -------------- //

  function setFavoriteViewName(name) {
    defaultViewName = name;
  }

  function registerButtons(viewName, setButtonId, getButtonId) {
    buttonConfigurations.push({
      viewName: viewName,
      setButtonId: setButtonId,
      getButtonId: getButtonId
    });
  }

  function initDefaultViewButtons(viewName, setButtonId, getButtonId) {
    var setButton = document.getElementById(setButtonId);
    var getButton = document.getElementById(getButtonId);

    if (viewName === defaultViewName) {
      setButton.classList.add("ebx_dynamicHiddenImportant");
      getButton.classList.remove("ebx_dynamicHiddenImportant");

    } else {
      getButton.classList.add("ebx_dynamicHiddenImportant");
      setButton.classList.remove("ebx_dynamicHiddenImportant");
    }
  }

  function setDefaultView(button, event, url, viewName) {
    var cursor = button.style.cursor;

    button.style.cursor = "wait";

    ajaxCall(url, function (request, response) {
      button.style.cursor = cursor;
      setFavoriteViewName(viewName);
      refreshButtons();

      var responseJsonArray = response.results;
      if (responseJsonArray !== undefined && responseJsonArray.length > 0) {
        EBX_Utils.forEach(responseJsonArray, function (item, index) {
          EBX_UserMessageManager.addMessage(item, EBX_UserMessageManager.ERROR);
        })
      }
    });
  }

  function unsetDefaultView(button, event, url) {
    var cursor = button.style.cursor;

    button.style.cursor = "wait";

    ajaxCall(url, function (request, response) {
      button.style.cursor = cursor;
      setFavoriteViewName("");
      refreshButtons();

      var responseJsonArray = response.results;
      if (responseJsonArray !== undefined && responseJsonArray.length > 0) {
        EBX_Utils.forEach(responseJsonArray, function (item, index) {
          EBX_UserMessageManager.addMessage(item, EBX_UserMessageManager.ERROR);
        })
      }

    });
  }

  function refreshButtons() {
    EBX_Utils.forEach(buttonConfigurations, function (config) {
      initDefaultViewButtons(
          config.viewName,
          config.setButtonId,
          config.getButtonId);
    });
  }

  function ajaxCall(url, callback) {
    var handler = new YAHOO.util.XHRDataSource();
    handler.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
    handler.sendRequest(url, {
      success: callback,
      failure: callback
    });
  }

})();