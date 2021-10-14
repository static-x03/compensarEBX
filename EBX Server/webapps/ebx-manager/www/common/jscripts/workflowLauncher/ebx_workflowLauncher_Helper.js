var ebx_workflowLauncher_Helper = {

  //======= Start Common =======//
  hideShowElementById: function (anIdToHide, hide) {
    var elementToHide = document.getElementById(anIdToHide);
    if (elementToHide == null) {
      return;
    }

    if (hide) {
      EBX_Utils.addCSSClass(elementToHide, "ebx_DisplayNone");
    } else {
      EBX_Utils.removeCSSClass(elementToHide, "ebx_DisplayNone");
    }
  },

  // Replace an html element by HTML. The new inserted HTML should keep the same position as the old element in
  // the tree structure of its parent.
  replaceElementByHTMLAndKeepOrder: function (elementId, newHTML) {

    // 1. Retrieve the html element to be replaced.
    var element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    // 2. Look for the previous sibling and the parent of the element to be replaced.
    var previousElement = element.previousElementSibling;
    var parentElement = element.parentElement;

    // 3. Remove the element.
    element.remove();

    //4. Insert the new html after the sibling of the element to be replaced.
    //   Otherwise, insert the new html as the first child of the parent the element to be replaced.
    if (!previousElement) {
      parentElement.insertAdjacentHTML("afterbegin", newHTML);
    } else {
      previousElement.insertAdjacentHTML("afterend", newHTML)
    }
  },

  //======= End Common =======//

  //======= Start Documentation =======//

  /**
   * It displays a documentation widget without the switch button, information and default value.
   * @param widgetName. Identifier used to build identifiers of documentation's components
   */
  displayStandardDocumentation: function (widgetName) {
    //1. Display Overwritten Values
    ebx_workflowLauncher_Helper.hideShowElementById(widgetName + "_" + "overwrittenValue", false);

    //2. Hide Inherited Values
    ebx_workflowLauncher_Helper.hideShowElementById(widgetName + "_" + "inheritedValue", true);

    //3. Hide Switch Button
    ebx_workflowLauncher_Helper.hideShowElementById(widgetName + "_" + "switch", true);

    //4. Hide Information bloc
    ebx_workflowLauncher_Helper.hideShowElementById(widgetName + "_" + "information", true);
  },
  //======= End Documentation =======//

  //======= Start Helper for DataContext =======//
  /**
   * It switches the state of custom form field. It is used when displaying DataContext Items of workflowlauncher.launcher
   * @param aSwitchId. Identifier of the switch element
   * @param defaultId. Identifier of the element which contains the default value
   * @param editId.  Identifier of the element which contains the editable value
   * @param defaultTooltip. The tooltip to display when the state of the switch element is Edit
   * @param editTooltip. The tooltip to display when the state of the switch element is Default
   */
  switchBetweenEditAndDefaultDisplay: function (aSwitchId, defaultId, editId, defaultTooltip, editTooltip) {
    // The button that toggles between default and editable value and vice versa.
    // It has two states : default and edit.
    // A click on a button in default state, apply and displays the default value for the corresponding parameter
    // A click on a button in edit state, displays an input and allows the user to edit the value of the corresponding parameter
    var button = document.getElementById(aSwitchId);
    var defaultElement = document.getElementById(defaultId);
    var editElement = document.getElementById(editId);
    var toggle = document.getElementById(aSwitchId + "_toggle");

    var switchStateToEdit = function (element) {
      EBX_Utils.removeCSSClass(element, "ebx_ValueNull");
      EBX_Utils.addCSSClass(element, "ebx_ValueEditable");
      element.setAttribute('title', editTooltip);
    };

    var switchStateToDefault = function (element) {
      EBX_Utils.removeCSSClass(element, "ebx_ValueEditable");
      EBX_Utils.addCSSClass(element, "ebx_ValueNull");
      element.setAttribute('title', defaultTooltip);
    };

    var displayDefaultValue = function (defaultElement, editElement) {
      EBX_Utils.removeCSSClass(defaultElement, "ebx_dynamicHidden");
      EBX_Utils.addCSSClass(editElement, "ebx_dynamicHidden");
      EBX_Utils.removeCSSClass(editElement, "ebx_OverwrittenValue");
    };

    var displayEditableValue = function (defaultElement, editElement) {
      EBX_Utils.addCSSClass(defaultElement, "ebx_dynamicHidden");
      EBX_Utils.removeCSSClass(editElement, "ebx_dynamicHidden");
      EBX_Utils.addCSSClass(editElement, "ebx_OverwrittenValue");
    };

    if (button) {
      var isCurrentStateDefault = EBX_Utils.matchCSSClass(button, "ebx_ValueNull");

      if (isCurrentStateDefault) {
        switchStateToEdit(button);
        displayDefaultValue(defaultElement, editElement);
        if (toggle) {
          toggle.checked = true;
        }
      } else {
        switchStateToDefault(button);
        displayEditableValue(defaultElement, editElement);
        if (toggle) {
          toggle.checked = false;
        }
      }
    }
  },

  updateDataContext: function (newDataContextHTML, dataContextGroupId, isHidden) {
    //1. Looks for the first raw of the Data Context Group (the raw that displays the expand/collapse button
    var dataContextMainRaw = document.getElementById(dataContextGroupId);

    //2. Hide or Show Data context widget
    ebx_workflowLauncher_Helper.hideShowElementById(dataContextGroupId, isHidden);

    //2. Remove Current Data Context Items and Keep the first raw.
    this.removeDataContextContent(dataContextMainRaw);

    //3. If new data context is empty.
    if (!newDataContextHTML) {
      return;
    }

    //4. creates Temporary Element (TableRawForm ) with the new DataContext HTMl: it has the following structure :
    //Table/FormRow/Border/Table/dataContext Rows
    var temporaryDataContextContainer = document.createElement("div");
    temporaryDataContextContainer.innerHTML = newDataContextHTML;

    //5. retrieves and replace the new data context items from the table content. The new content starts at the "border" element
    var dataContextTableContent = temporaryDataContextContainer.getElementsByTagName("table")[0].children[0];
    this.replaceDataContextContent(dataContextMainRaw, dataContextTableContent.getElementsByClassName("ebx_Input")[0]);

  },

  removeDataContextContent: function (dataContextMainRaw) {
    if (!dataContextMainRaw) {
      return;
    }

    var contentElement = dataContextMainRaw.getElementsByClassName("ebx_Input");
    if (!contentElement) {
      return;
    }
    contentElement[0].innerHTML = "";
  },

  replaceDataContextContent: function (dataContextMainRaw, newContent) {
    var contentElement = dataContextMainRaw.getElementsByClassName("ebx_Input");
    if (!contentElement) {
      return;
    }

    contentElement[0].parentNode.replaceChild(newContent, contentElement[0]);
  }
  //======= End Helper for DataContext =======//
};