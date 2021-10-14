var ebx_layoutEditor = (function () {

  var COLORS = {
    LOGIC: "#E0E0E0",
    LOGIC_1: "#D0D0D0",
    DECLARATION: "#FFF6E4",
    DECLARATION_1: "#FFE4AD",
    DECLARATION_2: "#FFD582",
    TAB: "#98E0C1",
    TAB_1: "#74E3B3",
    GRID: "#BA9EDF",
    GRID_1: "#A87DE2",
    TABLE: "#ECA0CB",
    TABLE_1: "#ED79BB",
    WIDGET: "#9EB2DF",
    WIDGET_1: "#7E9CE1",

    REFERENCE: "#FFCA5F",

    ERROR: "#E00000",
    WARNING: "#926100",
    INFO: "#436CCB"
  };

  var attributesToTest = ["type", "name"];

  var toolboxDefinition;
  var workspaceDefinition;
  var workspace;
  var initialResizeEvent;
  var validateUrl;

  var workspaceWidth;
  var workspaceHeight;

  var paths = {};

  var warningIds = 0;
  var blocksWithWarnings = [];

  return {
    init: init,
    preview: preview,
    toggleConfig: config,
    registerPath: function (name, path) {
      paths[name] = path;
    },
    validate: validate
  };

  function config() {
    var element = document.getElementById("ebx_preview-settings-overlay");
    var className = "ebx_preview-settings_is-hidden";
    if (EBX_Utils.matchCSSClass(element, className)) {
      element.parentElement.style.position = "relative";
      EBX_Utils.removeCSSClass(element, className);
    } else {
      EBX_Utils.addCSSClass(element, className);
    }
  }

  function preview(url, redirectIfWorkspace, redirectIfPopUp, path) {
    var target = ebx_form_getValue(paths["./target"]);
    var isCreatingRecord = ebx_form_getValue(paths["./isCreatingRecord"]);
    var isDuplicatingRecord = ebx_form_getValue(paths["./isDuplicatingRecord"]);
    var locale = ebx_form_getValue(paths["./locale"]).key;
    var userRoles = ebx_form_getValue(paths["./userRoles"]);
    var inputParametersString = ebx_form_getValue(paths["./inputParameters"]);

    var inputParameters = {};
    if (inputParametersString) {
      var lines = inputParametersString.split(/[\r\n]+/);
      EBX_Utils.forEach(lines, function (line) {
        var separatorIndex = line.indexOf("=");
        if (separatorIndex > 0) {
          var key = line.substring(0, separatorIndex).trim();
          var value = line.substring(separatorIndex + 1).trim();

          if (key.length > 0) {
            inputParameters[key] = value;
          }
        }
      })
    }

    var postData = {
      xml: ebx_form_getValue(paths["./xml"]),
      path: path,
      isCreatingRecord: isCreatingRecord,
      isDuplicatingRecord: isDuplicatingRecord,
      locale: locale,
      userRoles: userRoles,
      inputParameters: JSON.stringify(inputParameters)
    };

    if (target === "p") {
      window.open("about:blank", "preview",
          "width=" + workspaceWidth + ",height=" + workspaceHeight + ",toolbar=0,menubar=0,location=0");
      EBX_Utils.submitInInternalPopup("preview", url + redirectIfPopUp, postData);
    } else {
      EBX_Utils.openInternalPopup(url + redirectIfWorkspace, null, null, {
        isCloseButtonDisplayed: false,
        postData: postData
      });
    }
  }

  function init(config) {
    validateUrl = config.validateUrl;
    defineBlocks(config);

    loadToolbox(config);
    loadWorkspace(config);

    window.resizeBlockly = function resizeBlockly(e) {
      if (workspace == null) {
        initialResizeEvent = e;
        return;
      }

      workspaceWidth = e.w;
      workspaceHeight = e.h;

      var divElement = document.getElementById(config.containerDiv);
      divElement.style.width = e.w + "px";
      divElement.style.height = e.h + "px";
      Blockly.svgResize(workspace);
    };
  }

  function loadToolbox(config) {
    var requestHandler = new EBX_AJAXResponseHandler();
    requestHandler.handleAjaxResponseSuccess = function (responseContent) {
      toolboxDefinition = Blockly.Xml.textToDom(responseContent);

      if (workspaceDefinition != null) {
        doInit(config);
      }
    };

    requestHandler.sendRequest(config.toolboxUrl);
  }

  function loadWorkspace(config) {
    var requestHandler = new EBX_AJAXResponseHandler();
    requestHandler.handleAjaxResponseSuccess = function (responseContent) {
      workspaceDefinition = Blockly.Xml.textToDom(responseContent);

      if (toolboxDefinition != null) {
        doInit(config);
      }
    };

    requestHandler.sendRequest(config.workspaceUrl);
  }

  function doInit(config) {
    Blockly.Tooltip.LIMIT = 250;

    var options = {
      toolbox: toolboxDefinition,
      collapse: true,
      comments: true,
      disable: true,
      maxBlocks: Infinity,
      trashcan: true,
      horizontalLayout: false,
      toolboxPosition: 'start',
      css: true,
      media: 'https://blockly-demo.appspot.com/static/media/',
      rtl: false,
      scrollbars: true,
      sounds: false,
      oneBasedIndex: false,
      grid: {
        spacing: 20,
        length: 1,
        colour: '#888',
        snap: false
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      readOnly: config.readonly
    };

    workspace = Blockly.inject(config.containerDiv, options);

    /* Load blocks to workspace. */
    Blockly.Xml.domToWorkspace(workspaceDefinition, workspace);

    workspace.addChangeListener(Blockly.Events.disableOrphans);
    var listeners = [];
    workspace.addChangeListener(function (e) {
      listeners.push(function () {
        var dom = Blockly.Xml.workspaceToDom(workspace);

        var storedXmlString = ebx_form_getValue(paths["./xml"]);
        var storedXml = (storedXmlString) ? Blockly.Xml.textToDom(storedXmlString) : null;
        if (!layoutsEquals(getRoot(dom), getRoot(storedXml))) {
          // clean up root blocks
          var children = dom.childNodes;
          var childrenToRemove = EBX_Utils.filter(children, function (child) {
            return child.getAttribute("id") !== "root";
          });
          EBX_Utils.forEach(childrenToRemove, function (child) {
            dom.removeChild(child);
          });

          // save xml
          var xml = Blockly.Xml.domToText(dom);
          ebx_form_setValue(paths["./xml"], xml);
        }
      });
      setTimeout(function () {
        if (listeners.length === 0) {
          return;
        }

        var lastListener = listeners[listeners.length - 1];
        listeners = [];

        lastListener();
      }, 200);
    });

    if (initialResizeEvent != null) {
      window.resizeBlockly(initialResizeEvent);
    }

    if (config.validateAfterInit) {
      validate();
    }
  }

  function validate() {
    var requestHandler = new EBX_AJAXResponseHandler();
    requestHandler.handleAjaxResponseSuccess = function (responseContent) {
      var messages = JSON.parse(responseContent);

      var previousBlocksWithWarnings = blocksWithWarnings;
      EBX_Utils.forEach(blocksWithWarnings, function (item) {
        try {
          var block = item.block;
          block.setColour(item.colour);
          block.setWarningText(null, item.id);
        } catch (e) {
          // May be raised for shadows
          // Just proceed for now
        }
      });
      blocksWithWarnings = [];

      var topBlocks = workspace.getTopBlocks();
      for (var i = 0; i < topBlocks.length; i++) {
        var root = topBlocks[i];
        if (root.id !== "root") {
          continue;
        }

        for (var messageIndex = 0; messageIndex < messages.length; messageIndex++) {
          var message = messages[messageIndex];
          var target = getBlockMatching(root, message.path);
          if (target != null) {
            var warningId = "" + warningIds++;
            blocksWithWarnings.push({
              block: target,
              id: warningId,
              message: message.message,
              colour: target.getColour()
            });

            var targetColor = target.getColour();

            var icon;
            switch (message.severity) {
              case "E":
                icon = "❌";
                target.setColour(COLORS.ERROR);
                break;
              case "W":
                icon = "⚠";
                if (targetColor !== COLORS.ERROR) {
                  target.setColour(COLORS.WARNING);
                }
                break;
              default:
                icon = "🛈";
                if (targetColor !== COLORS.ERROR && targetColor !== COLORS.WARNING) {
                  target.setColour(COLORS.INFO);
                }
            }

            target.setWarningText(icon + " " + message.message, warningId);

            var hadWarning = false;
            for (var blockIndex in previousBlocksWithWarnings) {
              var item = previousBlocksWithWarnings[blockIndex];
              if (target === item.block && message.message === item.message) {
                hadWarning = true;
                break;
              }
            }

            // expand parents
            if (!hadWarning) {
              var parent = target;
              while (parent != null) {
                if (parent !== target) {
                  parent.setCollapsed(false);
                }

                var surroundingParent = parent.getSurroundParent();
                if (surroundingParent != null) {
                  parent = surroundingParent;
                } else {
                  parent = parent.getParent();
                }
              }
            }
          } else {
            console.debug("Could not find target block for message", message);
          }
        }
      }
    };

    requestHandler.sendRequest(validateUrl);
  }

  function getParameterLabel(parameterName) {
    return "[" + parameterName + "]";
  }

  function defineCustomBlock(spec) {
    var isKnown = !spec.error;
    var name = spec.name;
    var label = (isKnown) ? name : name + " (?)";
    var hasProblems = !isKnown;

    Blockly.Blocks['custom_' + name] = {
      init: function () {
        this.appendDummyInput()
            .appendField(label);

        if (spec.inputs != null) {
          for (var inputKey in spec.inputs) {
            if (!spec.inputs.hasOwnProperty(inputKey))
              continue;

            var input = spec.inputs[inputKey];

            var inputIsKnown = !input.error;
            if (!inputIsKnown) {
              hasProblems = true;
            }

            var inputName = input.name;
            var inputLabel = (inputIsKnown) ? inputName : inputName + " (?)";

            this.appendValueInput(inputName)
                .appendField(getParameterLabel(inputLabel))
                .setCheck("Expression")
                .setAlign(Blockly.ALIGN_RIGHT);
          }
        }

        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour((hasProblems) ? COLORS.ERROR : COLORS.WIDGET);
      },
      pathMappings: (spec.inputs != null)
          ? EBX_Utils.map(spec.inputs, function (input) {
            return mapInput("var:" + input.name, input.name);
          })
          : []
    };
  }

  function defineLocalizedBlock(locales, setHelpUrl) {
    Blockly.Blocks['expression_localized'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Localized");

        for (var localeKey in locales) {
          if (!locales.hasOwnProperty(localeKey)) {
            continue;
          }

          var locale = locales[localeKey];
          this.appendValueInput(locale.key)
              .setCheck("Expression")
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField(getParameterLabel(locale.label));
        }

        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Block which result depends on the user locale.");
        setHelpUrl(this, "custom_forms_block_localized")
      },
      pathMappings: EBX_Utils.map(locales, function (locale) {
        return mapInput(locale.key, locale.key);
      })
    };
    Blockly.Blocks['expression_localized_statement'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Localized");

        for (var localeKey in locales) {
          if (!locales.hasOwnProperty(localeKey)) {
            continue;
          }

          var locale = locales[localeKey];
          this.appendStatementInput(locale.key)
              .setCheck("Expression")
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField(getParameterLabel(locale.label));
        }

        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Block which result depends on the user locale.");
        setHelpUrl(this, "custom_forms_block_localized")
      },
      pathMappings: EBX_Utils.map(locales, function (locale) {
        return mapStatement(locale.key, locale.key);
      })
    };
  }

  function removeCommentMenuItem(menuOptions) {
    var commentIndex = -1;
    EBX_Utils.forEach(menuOptions, function (option, index) {
      if (option.text === "Add Comment") {
        commentIndex = index;
      }
    });

    if (commentIndex >= 0) {
      menuOptions.splice(commentIndex, 1);
    }
  }

  function defineBlocks(config) {
    if (config.custom != null) {
      for (var customKey in config.custom) {
        if (!config.custom.hasOwnProperty(customKey)) {
          continue;
        }

        defineCustomBlock(config.custom[customKey]);
      }
    }

    var setHelpUrl = function (block, id) {
      block.setHelpUrl(config.helpUrlBase + "#" + id);
      return block;
    };

    defineLocalizedBlock(config.locales, setHelpUrl);

    Blockly.Blocks['definition_layout'] = {
      init: function () {
        this.appendValueInput("def")
            .setCheck(["LogicExpression", "LayoutExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Form")
            .appendField(new Blockly.FieldTextInput("name", function () {
              return null;
            }), "name");
        this.setInputsInline(false);
        this.setColour(COLORS.DECLARATION);
        this.setTooltip(
            "This is the entry point of the form definition. It must return a 'Form definition' component.");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        function (block, path) {
          if (path === ".") {
            return this;
          }

          return getBlockMatching(block.inputList[0].connection.targetConnection.getSourceBlock(), path);
        }
      ]
    };

    Blockly.Blocks['expression_layout'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Form definition");
        this.appendValueInput("toolbar")
            .setCheck(["LogicExpression", "ToolbarExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("toolbar"));
        this.appendValueInput("actionBar")
            .setCheck(["LogicExpression", "ActionBarExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("action bar"));
        this.appendValueInput("contextualHelpUrl")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("help URL"));
        this.appendStatementInput("body")
            .setCheck(["LogicExpression", "ComponentExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setOutput(true, ["Expression", "LayoutExpression"]);
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("Actual definition of a form."
            + "\n- toolbar: Definition of the toolbar displayed on top of the form,"
            + "\n- action bar: Definition of the action bar displayed below the form,"
            + "\n- help URL: URL of the help page.");
        setHelpUrl(this, "custom_forms_block_form_definition")
      },
      pathMappings: [
        mapInput("toolbar", "toolbar"),
        mapInput("actionBar", "actionBar"),
        mapInput("helpUrl", "contextualHelpUrl"),
        mapStatement("body", "body")
      ]
    };

    Blockly.Blocks['expression_value'] = {
      init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput("value"), "value");
        this.setOutput(true, ["Expression", "StringExpression", "BooleanExpression", "NumberExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip(
            "A constant value. Depending on the context, this value may be interpreted as text, boolean or number.");
        setHelpUrl(this, "custom_forms_block_constant")
      }
    };

    Blockly.Blocks['expression_variable'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("var")
            .appendField(new Blockly.FieldTextInput("name", validateIdentifier), "name");
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip(
            "A reference to a variable declared by a 'with...declare' block. A path is also accepted if the variable is an object or a node.");
        setHelpUrl(this, "custom_forms_block_variable")
      }
    };

    Blockly.Blocks['expression_variable_statement'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("var")
            .appendField(new Blockly.FieldTextInput("name", validateIdentifier), "name");
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.REFERENCE);
        this.setTooltip(
            "A reference to a variable declared by a 'with...declare' block. A path is also accepted if the variable is an object or a node.");
        setHelpUrl(this, "custom_forms_block_variable")
      }
    };

    Blockly.Blocks['expression_component_flow'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("↝ Flow");
        this.appendValueInput("direction")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("direction"));
        this.appendValueInput("itemSpacing")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("item spacing"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "ComponentExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip(
            "Displays its content in a fluid manner. If the elements don't fit in one row or column, they will wrap to start a new one."
            + "\n- direction: 'horizontal' or 'vertical', indicates in which direction to queue its content,"
            + "\n- item spacing: The space between elements, in pixels,"
            + "\n- content: A list of elements to display either horizontally or vertically.");
        setHelpUrl(this, "custom_forms_block_flow")
      },
      pathMappings: [
        mapInput("direction", "direction"),
        mapInput("itemSpacing", "itemSpacing"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_array'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("array [");
        this.appendStatementInput("items")
            .setCheck("Expression");
        this.appendDummyInput()
            .appendField("]");
        this.setOutput(true, ["Expression", "ArrayExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("A list of items.");
        setHelpUrl(this, "custom_forms_block_array")
      },
      pathMappings: [
        mapArrayItem()
      ]
    };

    Blockly.Blocks['expression_component_form_table'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("▤ Form");
        this.appendStatementInput("NAME")
            .setCheck(["LogicExpression", "FormElementExpression"]);
        this.setInputsInline(false);
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.TABLE);
        this.setTooltip("Standard table-like layout with labels on the left side and values on the right side."
            + "\n- content: A list of 'Form row', 'Form group' or nodes. Nodes will result in model driven display, 'Form row' and 'Form group' allow to display custom content.");
        setHelpUrl(this, "custom_forms_block_form")
      },
      pathMappings: [
        mapStatement("content", "NAME")
      ]
    };

    Blockly.Blocks['expression_form_table_group'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("▭ Form group");
        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("description")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("description"));
        this.appendValueInput("open")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("open?"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "FormElementExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setInputsInline(false);
        this.setPreviousStatement(true, ["Expression", "FormElementExpression"]);
        this.setNextStatement(true, ["LogicExpression", "FormElementExpression"]);
        this.setColour(COLORS.TABLE_1);
        this.setTooltip("Inside a 'Form', displays a collapsible group of items."
            + "\n- node: If set, the group label, description and content will be model driven,"
            + "\n- label: The label of the group. May override the model driven label if a node and a label are set,"
            + "\n- description: The description of the group. May override the model driven description if a node and a description are set,"
            + "\n- open?: Indicates if the group is initially open,"
            + "\n- content: A list of 'Form row', 'Form group' or nodes. Nodes will result in model driven display, 'Form row' and 'Form group' allow to display custom content.");
        setHelpUrl(this, "custom_forms_block_form_group")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("label", "label"),
        mapInput("description", "description"),
        mapInput("open", "open"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_form_table_row'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("▭ Form row");
        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));
        this.appendValueInput("displayLabel")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("display label?"));
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("description")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("description"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "ComponentExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setInputsInline(false);
        this.setPreviousStatement(true, ["Expression", "FormElementExpression"]);
        this.setNextStatement(true, ["LogicExpression", "FormElementExpression"]);
        this.setColour(COLORS.TABLE_1);
        this.setTooltip("Inside a 'Form' or a 'Form group', displays a row, that is basically a label and a value."
            + "\n- node: If set, the label, description and content will be model driven,"
            + "\n- display label?: Indicates if the label should be displayed. If set to false in a 'Form' the content will span over both the label and content area,"
            + "\n- label: The label of the row. May override the model driven label if a node and a label are set,"
            + "\n- description: The description of the row. May override the model driven label if a node and a label are set,"
            + "\n- content: The content to be displayed next to the label.");
        setHelpUrl(this, "custom_forms_block_form_row")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("displayLabel", "displayLabel"),
        mapInput("label", "label"),
        mapInput("description", "description"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_component_grid'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("▦ Grid");
        this.appendValueInput("itemSpacing")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("item spacing"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "GridElementExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.GRID);
        this.setTooltip("A layout allowing to place components in a grid with coordinates."
            + "\n- item spacing: Space between elements, in pixels,"
            + "\n- content: A list of 'Grid element's, which specify where to display their content.");
        setHelpUrl(this, "custom_forms_block_grid")
      },
      pathMappings: [
        mapInput("itemSpacing", "itemSpacing"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_component_grid_element'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("◰ Grid element");
        this.appendValueInput("row")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("row"));
        this.appendValueInput("column")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("column"));
        this.appendValueInput("width")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("width"));
        this.appendValueInput("height")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("height"));
        this.appendValueInput("vAlign")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("vertical alignment"));
        this.appendValueInput("hAlign")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("horizontal alignment"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "ComponentExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "GridElementExpression"]);
        this.setNextStatement(true, ["LogicExpression", "GridElementExpression"]);
        this.setColour(COLORS.GRID_1);
        this.setTooltip(
            "Inside a 'Grid', specifies the location of its content."
            + "\n- row: The row where the element starts. Minimum value is 1."
            + "\n- column: The column where the element starts. Minimum value is 1."
            + "\n- width: The width of the element, in grid cells. Minimum value is 1."
            + "\n- height: The height of the element, in grid cells. Minimum value is 1."
            + "\n- vertical alignment: The vertical alignment of the element. If set, accepted values are: 'start', 'end', 'center'."
            + "\n- horizontal alignment: The horizontal alignment of the element. If set, accepted values are: 'start', 'end', 'center'.");
        setHelpUrl(this, "custom_forms_block_grid_element")
      },
      pathMappings: [
        mapInput("x", "column"),
        mapInput("y", "row"),
        mapInput("width", "width"),
        mapInput("height", "height"),
        mapInput("hAlign", "hAlign"),
        mapInput("vAlign", "vAlign"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['definition_parameter'] = {
      init: function () {
        if (config.isTypeEditionEnabled) {
          this.appendValueInput("type")
              .setCheck("Type")
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField("param")
              .appendField(new Blockly.FieldTextInput("name", validateIdentifier), "name")
              .appendField("of type");
        } else {
          this.appendDummyInput()
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField("param")
              .appendField(new Blockly.FieldTextInput("name", validateIdentifier), "name");
        }

        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("is")
            .appendField(new Blockly.FieldDropdown([["mandatory", "true"], ["optional", "false"]]), "mandatory");
        this.appendValueInput("default")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("has default value");
        this.setInputsInline(true);
        this.setPreviousStatement(true, "ParameterDeclaration");
        this.setNextStatement(true, "ParameterDeclaration");
        this.setColour(COLORS.DECLARATION_1);
        this.setTooltip("This is the declaration of a parameter of a function.");
        setHelpUrl(this, "custom_forms_block_parameter")
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        function (block, path) {
          var inputList = block.inputList;
          for (var i = 0; i < inputList.length; i++) {
            var input = inputList[i];
            if (input.name !== "default") {
              continue;
            }

            var targetConnection = input.connection.targetConnection;
            if (targetConnection == null && path.length === 0) {
              return block;
            }

            return getBlockMatching(targetConnection.getSourceBlock(), path);
          }
        }
      ]
    };

    Blockly.Blocks['expression_data_get_property'] = {
      init: function () {
        this.appendValueInput("object")
            .setCheck(["LogicExpression", "NodeExpression", "ObjectExpression"])
            .appendField("from");
        this.appendValueInput("path")
            .setCheck(["LogicExpression", "StringExpression"])
            .appendField("get");
        this.setInputsInline(true);
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Extract a value from an object or a node."
            + "\n- from: Base object or node, from which to extract data,"
            + "\n- get: Path of the data to extract, inside the object in 'from'.");
        setHelpUrl(this, "custom_forms_block_get")
      },
      pathMappings: [
        mapInput("object", "object"),
        mapInput("path", "path")
      ]
    };

    Blockly.Blocks['expression_data_array_item'] = {
      init: function () {
        this.appendValueInput("item")
            .setCheck("Expression")
            .appendField("item");
        this.setPreviousStatement(true, "ArrayItem");
        this.setNextStatement(true, "ArrayItem");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['expression_logic_foreach'] = {
      init: function () {
        this.appendValueInput("array")
            .setCheck(["LogicExpression", "ArrayExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("for each")
            .appendField(new Blockly.FieldTextInput("item", validateIdentifier), "itemName")
            .appendField("of");
        this.appendValueInput("body")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("return");
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip(
            "Returns an array that is made of the result of the 'body' function, applied on each item of the 'of' array.");
        setHelpUrl(this, "custom_forms_block_for_each")
      },
      pathMappings: [
        mapInput("array", "array"),
        mapInput("body", "body")
      ]
    };

    Blockly.Blocks['expression_logic_foreach_statement'] = {
      init: function () {
        this.appendValueInput("array")
            .setCheck(["LogicExpression", "ArrayExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("for each")
            .appendField(new Blockly.FieldTextInput("item", validateIdentifier), "itemName")
            .appendField("of");
        this.appendStatementInput("body")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.LOGIC);
        this.setTooltip(
            "Returns an array that is made of the result of the 'body' function, applied on each item of the 'of' array.");
        setHelpUrl(this, "custom_forms_block_for_each")
      },
      pathMappings: [
        mapInput("array", "array"),
        mapStatement("body", "body")
      ]
    };

    Blockly.Blocks['expression_data_object'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("object {");
        this.appendStatementInput("NAME")
            .setCheck("Property");
        this.appendDummyInput()
            .appendField("}");
        this.setOutput(true, ["Expression", "ObjectExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("An object composed of a list of (key, value) pairs.");
        setHelpUrl(this, "custom_forms_block_object")
      },
      pathMappings: [
        function (block, path) {
          if (path.length === 0 || path === ".") {
            return block;
          }

          var match = /^(?:\.?\/)?([^/[]+)([[/]?.*)$/.exec(path);
          if (match == null) {
            return null;
          }

          var step = match[1];
          var rest = match[2];

          var inputList = block.inputList;
          for (var i = 0; i < inputList.length; i++) {
            var input = inputList[i];
            if (input.name !== "NAME") {
              continue;
            }

            var targetConnection = input.connection.targetConnection;
            if (targetConnection == null && path.length === 0) {
              return null;
            }

            var property = targetConnection.getSourceBlock();
            while (property != null) {
              if (property.getFieldValue("name") !== step) {
                targetConnection = property.nextConnection.targetConnection;
                if (targetConnection == null) {
                  return null;
                }

                property = targetConnection.getSourceBlock();
              } else {
                return getBlockMatching(property, rest);
              }
            }

            return null;
          }
        }
      ]
    };

    Blockly.Blocks['expression_object_property'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck("Expression")
            .appendField(new Blockly.FieldTextInput("property", validateIdentifier), "name")
            .appendField(":");
        this.setPreviousStatement(true, "Property");
        this.setNextStatement(true, "Property");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("A property of an object.");
        setHelpUrl(this, "custom_forms_block_object_property")
      },
      pathMappings: [
        mapProperty()
      ]
    };

    Blockly.Blocks['type_object'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("object with properties {");
        this.appendStatementInput("properties")
            .setCheck("PropertyDeclaration");
        this.appendDummyInput()
            .appendField("}");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['type_object_property'] = {
      init: function () {
        this.appendValueInput("type")
            .setCheck("Type")
            .appendField(new Blockly.FieldTextInput("property", validateIdentifier), "name")
            .appendField("of type");
        this.setPreviousStatement(true, "PropertyDeclaration");
        this.setNextStatement(true, "PropertyDeclaration");
        this.setColour(COLORS.DECLARATION_1);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['type_array'] = {
      init: function () {
        this.appendValueInput("items")
            .setCheck("Type")
            .appendField("array of");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['expression_logic_if'] = {
      init: function () {
        this.appendValueInput("test")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("if");
        this.appendValueInput("then")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("then");
        this.appendValueInput("else")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("else");
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip(
            "A block returning either the content of 'then', or the content 'else', based on the result of the test."
            + "\n- if: A test determining which value to return. This must be a boolean value,"
            + "\n- then: The value returned if the test is true,"
            + "\n- else: The value returned if the test is false.");
        setHelpUrl(this, "custom_forms_block_if")
      },
      pathMappings: [
        mapInput("condition", "test"),
        mapInput("then", "then"),
        mapInput("else", "else")
      ]
    };

    Blockly.Blocks['expression_logic_if_statement'] = {
      init: function () {
        this.appendValueInput("test")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("if");
        this.appendStatementInput("then")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("then");
        this.appendStatementInput("else")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("else");
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.LOGIC);
        this.setTooltip(
            "A block returning either the content of 'then', or the content 'else', based on the result of the test."
            + "\n- if: A test determining which value to return. This must be a boolean value,"
            + "\n- then: The value returned if the test is true,"
            + "\n- else: The value returned if the test is false.");
        setHelpUrl(this, "custom_forms_block_if")
      },
      pathMappings: [
        mapStatement("condition", "test"),
        mapStatement("then", "then"),
        mapStatement("else", "else")
      ]
    };

    Blockly.Blocks['expression_logic_choose'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("choose");
        this.appendStatementInput("content")
            .setCheck("ChooseWhen");
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("A block returning the content of one of its inner 'when'/'otherwise' blocks."
            + "\n- content: A list of 'when' blocks, and optionally a final 'otherwise' block.");
        setHelpUrl(this, "custom_forms_block_choose")
      },
      pathMappings: [
        mapChooseContent
      ]
    };

    Blockly.Blocks['expression_logic_choose_when'] = {
      init: function () {
        this.appendValueInput("test")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .appendField("when");
        this.appendValueInput("content")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("then");
        this.setPreviousStatement(true, "ChooseWhen");
        this.setNextStatement(true, "ChooseWhen");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip(
            "A choice in a 'choose' block. If the test is true, the 'then' content will be returned, otherwise the next block will be tested."
            + "\n- when: A boolean test indicating if this case should be resolved."
            + "\n- then: If the test is true, this value will be returned.");
        setHelpUrl(this, "custom_forms_block_when")
      },
      pathMappings: [
        mapInput("test", "test"),
        mapInput("content", "content")
      ]
    };

    Blockly.Blocks['expression_logic_choose_otherwise'] = {
      init: function () {
        this.appendValueInput("content")
            .setCheck("Expression")
            .appendField("otherwise");
        this.setPreviousStatement(true, "ChooseWhen");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Final choice in a 'choose' block. Will be returned if no 'when' case matched."
            + "\n- content: The value to return if no 'when' case matched.");
        setHelpUrl(this, "custom_forms_block_otherwise")
      },
      pathMappings: [
        mapInput("content", "content")
      ]
    };

    Blockly.Blocks['expression_logic_choose_statement'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("choose");
        this.appendStatementInput("content")
            .setCheck("ChooseWhenStatement");
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("A block returning the content of one of its inner 'when'/'otherwise' blocks."
            + "\n- content: A list of 'when' blocks, and optionally a final 'otherwise' block.");
        setHelpUrl(this, "custom_forms_block_choose")
      },
      pathMappings: [
        mapChooseContent
      ]
    };

    Blockly.Blocks['expression_logic_choose_statement_when'] = {
      init: function () {
        this.appendValueInput("test")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .appendField("when");
        this.appendStatementInput("content")
            .setCheck("Expression");
        this.setPreviousStatement(true, "ChooseWhenStatement");
        this.setNextStatement(true, "ChooseWhenStatement");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip(
            "A choice in a 'choose' block. If the test is true, the 'then' content will be returned, otherwise the next block will be tested."
            + "\n- when: A boolean test indicating if this case should be resolved."
            + "\n- then: If the test is true, this value will be returned.");
        setHelpUrl(this, "custom_forms_block_when")
      },
      pathMappings: [
        mapInput("test", "test"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_logic_choose_statement_otherwise'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("otherwise");
        this.appendStatementInput("content")
            .setCheck("Expression");
        this.setPreviousStatement(true, "ChooseWhenStatement");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Final choice in a 'choose' block. Will be returned if no 'when' case matched."
            + "\n- content: The value to return if no 'when' case matched.");
        setHelpUrl(this, "custom_forms_block_otherwise")
      },
      pathMappings: [
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['logic_is_user_in_role'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("in role?")
            .appendField(new Blockly.FieldDropdown(config.userRoles), "role");
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip("Returns a boolean indicating if the current user has the requested role.");
        setHelpUrl(this, "custom_forms_block_is_in_role")
      }
    };

    Blockly.Blocks['logic_is_creating_record'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("creating record?");
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip(
            "Returns a boolean indicating if the form is displayed in the context of a record creation or duplication.");
        setHelpUrl(this, "custom_forms_block_is_creating_record")
      }
    };

    Blockly.Blocks['logic_is_duplicating_record'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("duplicating record?");
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip(
            "Returns a boolean indicating if the form is displayed in the context of a record duplication.");
        setHelpUrl(this, "custom_forms_block_is_duplicating_record")
      }
    };

    Blockly.Blocks['expression_get_device'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("device");
        this.setOutput(true, ["Expression", "StringExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip("Returns a string representing the device type of the user.");
        this.setHelpUrl("");
      }
    };

    Blockly.Blocks['expression_component_tab_pane'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("🗁 Tab container");
        this.appendStatementInput("tabs")
            .setCheck(["LogicExpression", "TabExpression"]);
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.TAB);
        this.setTooltip("A container of tabs, which displays a list of tab names and one active tab."
            + "\n- content: A list of 'Tab's.");
        setHelpUrl(this, "custom_forms_block_tab_container")
      },
      pathMappings: [
        mapStatement("content", "tabs")
      ]
    };

    Blockly.Blocks['expression_component_tab'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("🗀 Tab");
        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));
        this.appendValueInput("title")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("title"));
        this.appendValueInput("description")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("description"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "ComponentExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "TabExpression"]);
        this.setNextStatement(true, ["LogicExpression", "TabExpression"]);
        this.setColour(COLORS.TAB_1);
        this.setTooltip("A tab, inside a 'Tab container'."
            + "\n- node: If present, the tab title, description and content will be model driven,"
            + "\n- title: The title of the tab. May override the model driven title if a node and a title are set,"
            + "\n- description: The description of the tab. May override the model driven description if a node and a description are set,"
            + "\n- content: The content of the tab. May override the model driven content if a node and a content are set.");
        setHelpUrl(this, "custom_forms_block_tab")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("title", "title"),
        mapInput("description", "description"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_logic_with'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("with");
        this.appendStatementInput("variables")
            .setCheck("LocalVariable");
        this.appendValueInput("NAME")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("return");
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Declares variables that can be used in its 'return' statement."
            + "\n- variables: A list of 'declare' blocks,"
            + "\n- return: The value to return. The variables declared in the 'variables' statement can be used here, with 'var' blocks.");
        setHelpUrl(this, "custom_forms_block_with")
      },
      pathMappings: [
        mapWithVariables(),
        mapInput("content", "NAME")
      ]
    };

    Blockly.Blocks['expression_logic_with_statement'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("with");
        this.appendStatementInput("variables")
            .setCheck("LocalVariable");
        this.appendStatementInput("NAME")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Declares variables that can be used in its 'return' statement."
            + "\n- variables: A list of 'declare' blocks,"
            + "\n- content: The value to return. The variables declared in the 'variables' statement can be used here, with 'var' blocks.");
        setHelpUrl(this, "custom_forms_block_with")
      },
      pathMappings: [
        mapWithVariables(),
        mapStatement("content", "NAME")
      ]
    };

    Blockly.Blocks['expression_logic_with_variable'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck("Expression")
            .appendField("declare")
            .appendField(new Blockly.FieldTextInput("name", validateIdentifier), "name")
            .appendField("as");
        this.setPreviousStatement(true, "LocalVariable");
        this.setNextStatement(true, "LocalVariable");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("The declaration of a variable, in a 'with' block."
            + "\n- name: The name of the variable. Must be unique for a given 'with' block,"
            + "\n- content: The value of the variable, which will be returned by 'var' blocks referencing this.");
        setHelpUrl(this, "custom_forms_block_declare")
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        mapInput("value", "value")
      ]
    };

    Blockly.Blocks['expression_logic_with_script'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck(["LogicExpression", "StringExpression"])
            .appendField("script");
        this.setPreviousStatement(true, "LocalVariable");
        this.setNextStatement(true, "LocalVariable");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Declares a javascript file to be included in the generated page.");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        mapInput("value", "value")
      ]
    };

    Blockly.Blocks['expression_logic_with_style'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck(["LogicExpression", "StringExpression"])
            .appendField("stylesheet");
        this.setPreviousStatement(true, "LocalVariable");
        this.setNextStatement(true, "LocalVariable");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Declares a css file to be included in the generated page.");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['expression_resource_url'] = {
      init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["javascript", "jscript"], ["image", "image"]]), "type")
            .appendField("resource");
        this.appendValueInput("module")
            .setCheck(["LogicExpression", "StringExpression"])
            .appendField(getParameterLabel("module"))
            .setAlign(Blockly.ALIGN_RIGHT);
        this.appendValueInput("path")
            .setCheck(["LogicExpression", "StringExpression"])
            .appendField(getParameterLabel("path"))
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setOutput(true, ["Expression", "StringExpression"]);
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Returns the URL of a local javascript resource.");
        this.setHelpUrl("");
      },
      pathMappings: [
        mapInput("module", "module"),
        mapInput("path", "path")
      ]
    };

    Blockly.Blocks['type_node'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Node");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['type_string'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("String");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['type_number'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Number");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['type_boolean'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Boolean");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['type_component'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Component");
        this.setOutput(true, "Type");
        this.setColour(COLORS.DECLARATION);
        this.setTooltip("");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['html_tag'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("HTML")
            .appendField(new Blockly.FieldTextInput("div", validateIdentifier), "name");
        this.appendStatementInput("attributes")
            .setCheck("Attribute")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("attr"));
        this.appendStatementInput("content")
            .setCheck(["LogicExpression", "ComponentExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("A simple HTML tag.");
        this.setHelpUrl("");
      },
      pathMappings: [
        mapHtmlAttributes(),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['html_attribute'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck("Expression")
            .appendField(new Blockly.FieldTextInput("name", validateIdentifier), "name");
        this.setPreviousStatement(true, "Attribute");
        this.setNextStatement(true, "Attribute");
        this.setColour(COLORS.WIDGET_1);
        this.setTooltip("An attribute of an HTML tag.");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        mapProperty()
      ]
    };

    Blockly.Blocks['definition_component'] = {
      init: function () {
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Component")
            .appendField(new Blockly.FieldTextInput("name", function () {
              return null;
            }), "name");
        this.appendStatementInput("NAME")
            .setCheck("ParameterDeclaration")
            .appendField(getParameterLabel("parameters"));
        this.appendValueInput("body")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("content"));
        this.setInputsInline(false);
        this.setColour(COLORS.DECLARATION);
        this.setTooltip(
            "This is the entry point of the component definition. It can also define and use function parameters.");
        this.setHelpUrl("");
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        mapFunctionParameters("NAME"),
        mapInput("body", "body")
      ]
    };

    Blockly.Blocks['expression_function_definition'] = {
      init: function () {
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("Function");
        this.appendStatementInput("parameters")
            .setCheck("ParameterDeclaration")
            .appendField(getParameterLabel("parameters"));
        this.appendValueInput("body")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("body"));
        this.setInputsInline(false);
        this.setOutput(true, ["Expression", "FunctionExpression"]);
        this.setColour(COLORS.DECLARATION);
        this.setTooltip(
            "The definition of an anonymous function. A function makes use of its parameters in its body to return a result.");
        setHelpUrl(this, "custom_forms_block_function")
      },
      pathMappings: [
        mapFunctionParameters("parameters"),
        mapInput("body", "body")
      ]
    };

    Blockly.Blocks['expression_function_call'] = {
      init: function () {
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("Call");
        this.appendValueInput("callee")
            .setCheck(["LogicExpression", "FunctionExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("function"));
        this.appendStatementInput("args")
            .setCheck("CallArgument")
            .appendField(getParameterLabel("args"));
        this.setInputsInline(false);
        this.setOutput(true, ["Expression", "LogicExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Calls a function by setting actual values to its parameters.");
        setHelpUrl(this, "custom_forms_block_call")
      },
      pathMappings: [
        mapInput("callee", "callee"),
        mapFunctionCallArguments("args")
      ]
    };

    Blockly.Blocks['expression_function_call_statement'] = {
      init: function () {
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("Call");
        this.appendValueInput("callee")
            .setCheck(["LogicExpression", "FunctionExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("function"));
        this.appendStatementInput("args")
            .setCheck("CallArgument")
            .appendField(getParameterLabel("args"));
        this.setInputsInline(false);
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Calls a function by setting actual values to its parameters.");
        setHelpUrl(this, "custom_forms_block_call")
      },
      pathMappings: [
        mapInput("callee", "callee"),
        mapFunctionCallArguments("args")
      ]
    };

    Blockly.Blocks['expression_function_call_argument'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck("Expression")
            .appendField(new Blockly.FieldTextInput("argument", validateIdentifier), "name")
            .appendField(":");
        this.setPreviousStatement(true, "CallArgument");
        this.setNextStatement(true, "CallArgument");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Actual value to pass to the parameter of the called function.");
        setHelpUrl(this, "custom_forms_block_argument")
      },
      customContextMenu: removeCommentMenuItem,
      pathMappings: [
        mapProperty()
      ]
    };

    Blockly.Blocks['definition_action_bar_default'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Default action bar");
        this.setOutput(true, ["Expression", "ActionBarExpression"]);
        this.setColour(COLORS.DECLARATION_1);
        this.setTooltip("The default action bar.");
        setHelpUrl(this, "custom_forms_block_default_action_bar")
      }
    };

    Blockly.Blocks['definition_action_bar_custom'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Custom action bar");
        this.appendStatementInput("start")
            .setCheck(["LogicExpression", "ButtonExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("start"));
        this.appendStatementInput("middle")
            .setCheck(["LogicExpression", "ButtonExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("middle"));
        this.appendStatementInput("end")
            .setCheck(["LogicExpression", "ButtonExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("end"));
        this.setOutput(true, ["Expression", "ActionBarExpression"]);
        this.setColour(COLORS.DECLARATION_1);
        this.setTooltip("A custom action bar."
            + "\n- start: A list of 'Button's to display on the left of the action bar,"
            + "\n- middle: A list of 'Button's to display on the center of the action bar,"
            + "\n- end: A list of 'Button's to display on the right of the action bar.");
        setHelpUrl(this, "custom_forms_block_custom_action_bar")
      },
      pathMappings: [
        mapStatement("start", "start"),
        mapStatement("middle", "middle"),
        mapStatement("end", "end")
      ]
    };

    Blockly.Blocks['definition_button_save'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Save button");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("isDefault")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("default?"));
        this.setPreviousStatement(true, ["Expression", "ButtonExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ButtonExpression"]);
        this.setColour(COLORS.DECLARATION_2);
        this.setTooltip("Standard 'Save' button."
            + "\n- label: If set, overrides the default label,"
            + "\n- default?: Indicates if this is the action to trigger when pressing 'Enter'. Only one button should be the default one.");
        setHelpUrl(this, "custom_forms_block_button_save")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("isDefault", "isDefault")
      ]
    };

    Blockly.Blocks['definition_button_close'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Close button");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("isDefault")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("default?"));
        this.setPreviousStatement(true, ["Expression", "ButtonExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ButtonExpression"]);
        this.setColour(COLORS.DECLARATION_2);
        this.setTooltip("Standard 'Close' button."
            + "\n- label: If set, overrides the default label,"
            + "\n- default?: Indicates if this is the action to trigger when pressing 'Enter'. Only one button should be the default one.");
        setHelpUrl(this, "custom_forms_block_button_close")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("isDefault", "isDefault")
      ]
    };

    Blockly.Blocks['definition_button_save_and_close'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Save and close button");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("isDefault")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("default?"));
        this.setPreviousStatement(true, ["Expression", "ButtonExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ButtonExpression"]);
        this.setColour(COLORS.DECLARATION_2);
        this.setTooltip("Standard 'Save and close' button."
            + "\n- label: If set, overrides the default label,"
            + "\n- default?: Indicates if this is the action to trigger when pressing 'Enter'. Only one button should be the default one.");
        setHelpUrl(this, "custom_forms_block_button_save_and_close")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("isDefault", "isDefault")
      ]
    };

    Blockly.Blocks['definition_button_revert'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Revert button");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("isDefault")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("default?"));
        this.setPreviousStatement(true, ["Expression", "ButtonExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ButtonExpression"]);
        this.setColour(COLORS.DECLARATION_2);
        this.setTooltip("Standard 'Revert' button."
            + "\n- label: If set, overrides the default label,"
            + "\n- default?: Indicates if this is the action to trigger when pressing 'Enter'. Only one button should be the default one.");
        setHelpUrl(this, "custom_forms_block_button_revert")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("isDefault", "isDefault")
      ]
    };

    Blockly.Blocks['definition_button_previous'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Previous button");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("isDefault")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("default?"));
        this.setPreviousStatement(true, ["Expression", "ButtonExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ButtonExpression"]);
        this.setColour(COLORS.DECLARATION_2);
        this.setTooltip("A button which will decrement the 'current page' value by one."
            + "\n- label: If set, overrides the default label,"
            + "\n- default?: Indicates if this is the action to trigger when pressing 'Enter'. Only one button should be the default one.");
        setHelpUrl(this, "custom_forms_block_button_previous")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("isDefault", "isDefault")
      ]
    };

    Blockly.Blocks['definition_button_next'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Next button");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("isDefault")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("default?"));
        this.setPreviousStatement(true, ["Expression", "ButtonExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ButtonExpression"]);
        this.setColour(COLORS.DECLARATION_2);
        this.setTooltip("A button which will increment the 'current page' value by one."
            + "\n- label: If set, overrides the default label,"
            + "\n- default?: Indicates if this is the action to trigger when pressing 'Enter'. Only one button should be the default one.");
        setHelpUrl(this, "custom_forms_block_button_next")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("isDefault", "isDefault")
      ]
    };

    Blockly.Blocks['expression_data_form_parameter'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("form param")
            .appendField(new Blockly.FieldDropdown([["record", "record"], ["current page", "page"]]), "name");
        this.setOutput(true, ["Expression", "NodeExpression", "NumberExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip(
            "The 'record' is the node representing the displayed record. 'current page' is a number (1 by default) representing the displayed page. This value can be changed by the 'Previous' and 'Next' buttons.");
        setHelpUrl(this, "custom_forms_block_form_parameter")
      }
    };

    Blockly.Blocks['expression_logic_not'] = {
      init: function () {
        this.appendValueInput("expression")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("not");
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Returns the inverse of the given boolean.");
        setHelpUrl(this, "custom_forms_block_not")
      },
      pathMappings: [
        mapInput("expression", "expression")
      ]
    };

    Blockly.Blocks['expression_logic_boolean_operator_2'] = {
      init: function () {
        this.appendValueInput("p0")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.appendValueInput("p1")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(new Blockly.FieldDropdown([["and", "and"], ["or", "or"]]), "operator");
        this.setInputsInline(true);
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Boolean expression.");
        setHelpUrl(this, "custom_forms_block_boolean_operator")
      },
      pathMappings: [
        mapInput("left", "p0"),
        mapInput("right", "p1")
      ]
    };

    Blockly.Blocks['expression_logic_compare'] = {
      init: function () {
        this.appendValueInput("p0")
            .setCheck(["LogicExpression", "StringExpression", "BooleanExpression", "NumberExpression"]);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["=", "equals"], ["≠", "nequals"]]), "operator");
        this.appendValueInput("p1")
            .setCheck(["LogicExpression", "StringExpression", "BooleanExpression", "NumberExpression"]);
        this.setInputsInline(true);
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Compares strings, numbers or booleans.");
        setHelpUrl(this, "custom_forms_block_comparator")
      },
      pathMappings: [
        mapInput("left", "p0"),
        mapInput("right", "p1")
      ]
    };

    Blockly.Blocks['expression_logic_arithmetic_operator_2'] = {
      init: function () {
        this.appendValueInput("p0")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.appendValueInput("p1")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(
                new Blockly.FieldDropdown([
                  ["+", "+"],
                  ["-", "-"],
                  ["*", "*"],
                  ["/", "/"],
                  ["mod", "%"]
                ]),
                "operator"
            );
        this.setInputsInline(true);
        this.setOutput(true, ["Expression", "NumberExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Arithmetic expression.");
        setHelpUrl(this, "custom_forms_block_integer_operator")
      },
      pathMappings: [
        mapInput("left", "p0"),
        mapInput("right", "p1")
      ]
    };

    Blockly.Blocks['expression_logic_arithmetic_comparator'] = {
      init: function () {
        this.appendValueInput("p0")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT);
        this.appendValueInput("p1")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(
                new Blockly.FieldDropdown([
                  ["<", "<"],
                  ["≤", "<="],
                  [">", ">"],
                  ["≥", ">="]
                ]),
                "operator"
            );
        this.setInputsInline(true);
        this.setOutput(true, ["Expression", "BooleanExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Arithmetic comparison.");
        setHelpUrl(this, "custom_forms_block_integer_comparator")
      },
      pathMappings: [
        mapInput("left", "p0"),
        mapInput("right", "p1")
      ]
    };

    Blockly.Blocks['context_get_request_parameter'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("request parameter")
            .appendField(new Blockly.FieldTextInput("name"), "name");
        this.setOutput(true, ["Expression", "StringExpression", "BooleanExpression", "NumberExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Returns the raw value of a request parameter.");
        this.setHelpUrl("");
      }
    };

    Blockly.Blocks['expression_node'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("node");
        this.appendValueInput("base")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("base"));
        this.appendValueInput("mandatory")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("mandatory?"));
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("description")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("description"));
        this.appendValueInput("widget")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("widget"));
        this.setOutput(true, ["Expression", "NodeExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Overrides the definition of an existing node."
            + "\n- base: The node to override,"
            + "\n- mandatory?: If set, overrides the mandatory indicator of the base node,"
            + "\n- label: If set, overrides the label of the node,"
            + "\n- description: If set, overrides the label of the node,"
            + "\n- widget: If set, overrides the default widget of the node.");
        setHelpUrl(this, "custom_forms_block_node")
      },
      pathMappings: [
        mapInput("base", "base"),
        mapInput("mandatory", "mandatory"),
        mapInput("label", "label"),
        mapInput("description", "description"),
        mapInput("widget", "widget")
      ]
    };

    Blockly.Blocks['expression_node_children'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("children of");
        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));
        this.setOutput(true, ["Expression", "ArrayExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Returns the list of the children of the given node."
            + "\n- node: The complex node from which to extract children.");
        setHelpUrl(this, "custom_forms_block_node_children")
      },
      pathMappings: [
        mapInput("node", "node")
      ]
    };

    Blockly.Blocks['expression_concat'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("concat");
        this.appendStatementInput("arrays")
            .setCheck(["LogicExpression", "ArrayExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("arrays"));
        this.setOutput(true, ["Expression", "LogicExpression", "ArrayExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip("Returns the concatenation of the given arrays.");
        setHelpUrl(this, "custom_forms_block_array_concat")
      },
      pathMappings: [
        mapStatement("arrays", "arrays")
      ]
    };

    Blockly.Blocks['content_element'] = {
      init: function () {
        this.appendValueInput("value")
            .setCheck("Expression")
            .appendField("array item");
        this.setInputsInline(false);
        this.setPreviousStatement(true, ["Expression", "LogicExpression"]);
        this.setNextStatement(true, "Expression");
        this.setColour(COLORS.LOGIC_1);
        this.setTooltip("Converts a value-block into a list-block.");
        setHelpUrl(this, "custom_forms_block_array_item")
      },
      customContextMenu: removeCommentMenuItem
    };

    Blockly.Blocks['expression_widget'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Widget");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("readonly")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the default widget.");
        setHelpUrl(this, "custom_forms_block_widget")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("readonly", "readonly")
      ]
    };

    Blockly.Blocks['expression_widget_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Widget");

        this.appendValueInput("readonly")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the default widget with custom properties.");
        setHelpUrl(this, "custom_forms_block_widget")
      },
      pathMappings: [
        mapInput("readonly", "readonly")
      ]
    };

    Blockly.Blocks['expression_widget_datetime_input'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Date time input");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("datePickerButtonDisplayable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("date picker button displayable?"));

        this.appendValueInput("nowButtonDisplayed")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("now button displayed?"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the date/time input."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- date picker button displayable?: Indicates if the button opening the date picker is displayed (read/write mode only),"
            + "\n- now button displayed?: Indicates if the button setting the date to the current time is displayed (read/write mode only).");
        setHelpUrl(this, "custom_forms_block_date_time_input")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("datePickerButtonDisplayable", "datePickerButtonDisplayable"),
        mapInput("nowButtonDisplayed", "nowButtonDisplayed")
      ]
    };

    Blockly.Blocks['expression_widget_datetime_input_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Date time input");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("datePickerButtonDisplayable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("date picker button displayable?"));

        this.appendValueInput("nowButtonDisplayed")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("now button displayed?"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the date/time widget with custom properties."
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- date picker button displayable?: Indicates if the button opening the date picker is displayed (read/write mode only),"
            + "\n- now button displayed?: Indicates if the button setting the date to the current time is displayed (read/write mode only).");
        setHelpUrl(this, "custom_forms_block_date_time_input")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("datePickerButtonDisplayable", "datePickerButtonDisplayable"),
        mapInput("nowButtonDisplayed", "nowButtonDisplayed")
      ]
    };

    Blockly.Blocks['expression_widget_text_input'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Text input");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("height")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("height"));

        this.appendValueInput("width")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("width"));

        this.appendValueInput("isMultiLine")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("multiline?"));

        this.appendValueInput("background")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("background"));

        this.appendValueInput("foreground")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("foreground"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the text input widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- height: If set, defines the height of the widget, in pixels,"
            + "\n- width: If set, defines the width of the widget, in pixels,"
            + "\n- multiline?: If set, defines if the widget spans over multiple lines,"
            + "\n- background: If set, defines the background color, in hexadecimal format,"
            + "\n- foreground: If set, defines the foreground color, in hexadecimal format.");
        setHelpUrl(this, "custom_forms_block_text_input")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("height", "height"),
        mapInput("width", "width"),
        mapInput("isMultiLine", "isMultiLine"),
        mapInput("background", "background"),
        mapInput("foreground", "foreground")
      ]
    };

    Blockly.Blocks['expression_widget_text_input_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Text input");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("height")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("height"));

        this.appendValueInput("width")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("width"));

        this.appendValueInput("isMultiLine")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("multiline?"));

        this.appendValueInput("background")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("background"));

        this.appendValueInput("foreground")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("foreground"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the text input widget with custom properties."
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- height: If set, defines the height of the widget, in pixels,"
            + "\n- width: If set, defines the width of the widget, in pixels,"
            + "\n- multiline?: If set, defines if the widget spans over multiple lines,"
            + "\n- background: If set, defines the background color, in hexadecimal format,"
            + "\n- foreground: If set, defines the foreground color, in hexadecimal format.");
        setHelpUrl(this, "custom_forms_block_text_input")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("height", "height"),
        mapInput("width", "width"),
        mapInput("isMultiLine", "isMultiLine"),
        mapInput("background", "background"),
        mapInput("foreground", "foreground")
      ]
    };

    Blockly.Blocks['expression_widget_color_input'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Color picker");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the color picker widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode.");
        setHelpUrl(this, "custom_forms_block_color_picker")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled")
      ]
    };

    Blockly.Blocks['expression_widget_color_input_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Color picker");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the color picker widget with custom properties."
            + "\n- readonly?: Indicates if the widget should be in readonly mode.");
        setHelpUrl(this, "custom_forms_block_color_picker")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled")
      ]
    };

    Blockly.Blocks['expression_widget_password_input'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Password input");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the input password widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode.");
        setHelpUrl(this, "custom_forms_block_password")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled")
      ]
    };

    Blockly.Blocks['expression_widget_password_input_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Password input");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the input password widget with custom properties."
            + "\n- readonly?: Indicates if the widget should be in readonly mode.");
        setHelpUrl(this, "custom_forms_block_password")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled")
      ]
    };


    Blockly.Blocks['expression_widget_radio_group'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Radio button group");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("columnsNumber")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("columns number"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the radio button group widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- columns number: If set, defines the number of columns to use for the layout of the radio buttons,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_radio_button_group")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("columnsNumber", "columnsNumber"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_radio_group_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Radio button group");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("columnsNumber")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("columns number"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip(
            "Override node widget specification to use the radio button group widget with custom properties.");
        setHelpUrl(this, "custom_forms_block_radio_button_group")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("columnsNumber", "columnsNumber"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_component_content_title'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Content title");

        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("hAlign")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("horizontal alignment"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Display the workspace content title.");
        setHelpUrl(this, "custom_forms_block_content_title")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("hAlign", "hAlign")
      ]
    };

    Blockly.Blocks['expression_component_paragraph_title'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Paragraph title");

        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("hAlign")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("horizontal alignment"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Display a paragraph title.");
        setHelpUrl(this, "custom_forms_block_paragraph_title")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("hAlign", "hAlign")
      ]
    };

    Blockly.Blocks['expression_widget_combo_box'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Combo box");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("createButtonDisplayable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("create button displayable?"));

        this.appendValueInput("previewButtonDisplayable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("preview button displayable?"));

        this.appendValueInput("pageSize")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("number of entries displayed on a page"));

        this.appendValueInput("width")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("width of the combo box"));

        this.appendValueInput("advancedSelectorAvailable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("advanced selector available?"));

        this.appendValueInput("viewForAdvancedSelection")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("view name to use with the advanced selector"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the combo box widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- create button displayable?: If set, defines if the create button should be displayed when the underlying node is a foreign key,"
            + "\n- preview button displayable?: If set, defines if the preview button should be displayed when the underlying node is a foreign key,"
            + "\n- number of entries displayed on a page: If set, defines the number of entries on each page of the drop-down list,"
            + "\n- width of the combo box: If set, defines the width of the combo box,"
            + "\n- advanced selector available?: If set, defines if the advanced selector should be displayed when the underlying node is a foreign key,"
            + "\n- view name to use with the advanced selector: If set, defines the name of the published view that will be used in the combo-box selection of the associated foreign key field,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_combo_box")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("createButtonDisplayable", "createButtonDisplayable"),
        mapInput("previewButtonDisplayable", "previewButtonDisplayable"),
        mapInput("pageSize", "pageSize"),
        mapInput("width", "width"),
        mapInput("advancedSelectorAvailable", "advancedSelectorAvailable"),
        mapInput("viewForAdvancedSelection", "viewForAdvancedSelection"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_combo_box_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Combo box");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("createButtonDisplayable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("create button displayable?"));

        this.appendValueInput("previewButtonDisplayable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("preview button displayable?"));

        this.appendValueInput("pageSize")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("number of entries displayed on a page"));

        this.appendValueInput("width")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("width of the combo box"));

        this.appendValueInput("advancedSelectorAvailable")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("advanced selector available?"));

        this.appendValueInput("viewForAdvancedSelection")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("view name to use with the advanced selector"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the combo box widget with custom properties."
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- create button displayable?: If set, defines if the create button should be displayed when the underlying node is a foreign key,"
            + "\n- preview button displayable?: If set, defines if the preview button should be displayed when the underlying node is a foreign key,"
            + "\n- number of entries displayed on a page: If set, defines the number of entries on each page of the drop-down list,"
            + "\n- width of the combo box: If set, defines the width of the combo box,"
            + "\n- advanced selector available?: If set, defines if the advanced selector should be displayed when the underlying node is a foreign key,"
            + "\n- view name to use with the advanced selector: If set, defines the name of the published view that will be used in the combo-box selection of the associated foreign key field,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_combo_box")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("createButtonDisplayable", "createButtonDisplayable"),
        mapInput("previewButtonDisplayable", "previewButtonDisplayable"),
        mapInput("pageSize", "pageSize"),
        mapInput("width", "width"),
        mapInput("advancedSelectorAvailable", "advancedSelectorAvailable"),
        mapInput("viewForAdvancedSelection", "viewForAdvancedSelection"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_checkbox'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Check box");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("labelEnabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label enabled?"));

        this.appendValueInput("index")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("index"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the checkbox widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- label enabled?: If set, indicates if the item label is to be added next to the widget,"
            + "\n- index: The index for this enumeration item,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_checkbox")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("labelEnabled", "labelEnabled"),
        mapInput("index", "index"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_checkbox_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Check box");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("labelEnabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label enabled?"));

        this.appendValueInput("index")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("index"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the checkbox widget with custom properties."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- label enabled?: If set, indicates if the item label is to be added next to the widget,"
            + "\n- index: The index for this enumeration item,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_checkbox")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("labelEnabled", "labelEnabled"),
        mapInput("index", "index"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_checkbox_group'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Check box group");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("columnsNumber")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("columns number"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the checkbox group widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- columns number: If set, defines the number of columns to use for the layout of the checkboxes,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_checkbox_group")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("columnsNumber", "columnsNumber"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_checkbox_group_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Check box group");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("columnsNumber")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("columns number"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the checkbox group widget with custom properties."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- columns number: If set, defines the number of columns to use for the layout of the checkboxes,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_checkbox_group")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("columnsNumber", "columnsNumber"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_nomenclature_item'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Nomenclature item");

        this.appendValueInput("value")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("value"));

        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));

        this.setPreviousStatement(true, ["Expression", "NomenclatureExpression"]);
        this.setNextStatement(true, ["LogicExpression", "NomenclatureExpression"]);
        this.setColour(COLORS.WIDGET_1);
        this.setTooltip("A nomenclature item is a (key, label) pair.");
        setHelpUrl(this, "custom_forms_block_nomenclature_item")
      },
      pathMappings: [
        mapInput("value", "value"),
        mapInput("label", "label")
      ]
    };

    Blockly.Blocks['expression_widget_radiobutton'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Radio button");

        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("labelEnabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label enabled?"));

        this.appendValueInput("index")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("index"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays a radio button widget."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- label enabled?: If set, indicates if the item label is to be added next to the widget,"
            + "\n- index: The index for this enumeration item,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_radio_button")
      },
      pathMappings: [
        mapInput("node", "node"),
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("labelEnabled", "labelEnabled"),
        mapInput("index", "index"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_widget_radiobutton_spec'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Radio button");

        this.appendValueInput("editorDisabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("readonly?"));

        this.appendValueInput("labelEnabled")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label enabled?"));

        this.appendValueInput("index")
            .setCheck(["LogicExpression", "NumberExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("index"));

        this.appendStatementInput("specificNomenclature")
            .setCheck(["LogicExpression", "NomenclatureExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("specific nomenclature"));

        this.setOutput(true, ["Expression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Override node widget specification to use the radio button widget with custom properties."
            + "\n- node: The node for which to display the widget,"
            + "\n- readonly?: Indicates if the widget should be in readonly mode,"
            + "\n- label enabled?: If set, indicates if the item label is to be added next to the widget,"
            + "\n- index: The index for this enumeration item,"
            + "\n- specific nomenclature: If set, overrides the model-driven nomenclature.");
        setHelpUrl(this, "custom_forms_block_radio_button")
      },
      pathMappings: [
        mapInput("editorDisabled", "editorDisabled"),
        mapInput("labelEnabled", "labelEnabled"),
        mapInput("index", "index"),
        mapStatement("specificNomenclature", "specificNomenclature")
      ]
    };

    Blockly.Blocks['expression_toolbar_default'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Default toolbar");
        this.setOutput(true, ["Expression", "ToolbarExpression"]);
        this.setColour(COLORS.DECLARATION_1);
        this.setTooltip("The model-driven toolbar.");
        setHelpUrl(this, "custom_forms_block_default_toolbar")
      }
    };

    Blockly.Blocks['expression_toolbar_named'] = {
      init: function () {
        this.appendValueInput("name")
            .setCheck(["LogicExpression", "StringExpression"])
            .appendField("Toolbar named");
        this.setOutput(true, ["Expression", "ToolbarExpression"]);
        this.setColour(COLORS.DECLARATION_1);
        this.setTooltip("The toolbar having the specified name.");
        setHelpUrl(this, "custom_forms_block_toolbar_named")
      }
    };

    Blockly.Blocks['expression_input_parameter'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("input parameter")
            .appendField(new Blockly.FieldTextInput("name"), "name");
        this.setOutput(true, ["Expression", "StringExpression", "BooleanExpression", "NumberExpression"]);
        this.setColour(COLORS.REFERENCE);
        this.setTooltip("Returns the raw value of an input parameter.");
        setHelpUrl(this, "custom_forms_block_input_parameter")
      }
    };

    Blockly.Blocks['expression_message_format'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Message");
        this.appendValueInput("pattern")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("pattern"));
        this.appendStatementInput("arguments")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("arguments"));
        this.setOutput(true, ["Expression", "StringExpression"]);
        this.setColour(COLORS.LOGIC);
        this.setTooltip(
            "Formats the given text by replacing java-like {0}, {1}, etc. placeholders by the argument at the given index.");
        setHelpUrl(this, "custom_forms_block_message")
      },
      pathMappings: [
        mapInput("pattern", "pattern"),
        mapStatement("arguments", "arguments")
      ]
    };

    Blockly.Blocks['expression_expand_collapse'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("⯈ Expand/Collapse");
        this.appendValueInput("label")
            .setCheck(["LogicExpression", "StringExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("label"));
        this.appendValueInput("collapsed")
            .setCheck(["LogicExpression", "BooleanExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("collapsed?"));
        this.appendStatementInput("content")
            .setCheck("Expression")
            .setAlign(Blockly.ALIGN_RIGHT);
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays its content inside an expand/collapse block."
            + "\n- label: Label displayed next to the arrow,"
            + "\n- collapsed?: Indicates if the group is initially collapsed or not,"
            + "\n- content: A list of components to be collapsible.");
        setHelpUrl(this, "custom_forms_block_expand_collapse")
      },
      pathMappings: [
        mapInput("label", "label"),
        mapInput("collapsed", "collapsed"),
        mapStatement("content", "content")
      ]
    };

    Blockly.Blocks['expression_label'] = {
      init: function () {
        this.appendDummyInput()
            .appendField("Label");
        this.appendValueInput("node")
            .setCheck(["LogicExpression", "NodeExpression"])
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(getParameterLabel("node"));
        this.setPreviousStatement(true, ["Expression", "ComponentExpression"]);
        this.setNextStatement(true, ["LogicExpression", "ComponentExpression"]);
        this.setColour(COLORS.WIDGET);
        this.setTooltip("Displays the label of the given node.");
        setHelpUrl(this, "custom_forms_block_label")
      },
      pathMappings: [
        mapInput("node", "node")
      ]
    };
  }

  function validateIdentifier(text) {
    var trimmedText = text.trim();

    if (/^[a-zA-Z_][-a-zA-Z_0-9/]*$/.test(trimmedText)) {
      return trimmedText;
    }

    return null;
  }

  function layoutsEquals(first, second) {
    if (first === second) {
      return true;
    }

    if (first == null || second == null) {
      return false;
    }

    if (first.data !== second.data) {
      return false;
    }

    var firstChildren = first.childNodes;
    var firstChildrenLength = firstChildren && firstChildren.length;
    var secondChildren = second.childNodes;
    var secondChildrenLength = secondChildren && secondChildren.length;

    if (firstChildrenLength !== secondChildrenLength) {
      return false;
    }

    for (var attributeIndex in attributesToTest) {
      var attributeName = attributesToTest[attributeIndex];
      var firstAttribute = first.getAttribute && first.getAttribute(attributeName);
      var secondAttribute = second.getAttribute && second.getAttribute(attributeName);

      if (!attributeEquals(firstAttribute, secondAttribute)) {
        return false;
      }
    }

    for (var childIndex = 0; childIndex < firstChildrenLength; childIndex++) {
      var firstChild = firstChildren[childIndex];
      var secondChild = secondChildren[childIndex];
      if (!layoutsEquals(firstChild, secondChild)) {
        return false;
      }
    }

    return true;
  }

  function attributeEquals(first, second) {
    return first === second;
  }

  function getRoot(xml) {
    if (xml == null) {
      return null;
    }

    var children = xml.childNodes;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.getAttribute("id") === "root") {
        return child;
      }
    }

    return null;
  }

  function getBlockMatching(block, path) {
    if (block == null) {
      return null;
    }

    if (path == null || path.length === 0 || path === ".") {
      return block;
    }

    var pathMappings = block.pathMappings;
    if (pathMappings == null) {
      return null;
    }

    for (var i = 0; i < pathMappings.length; i++) {
      var mapping = pathMappings[i];
      var target = mapping(block, path);
      if (target != null) {
        return target;
      }
    }

    return null;
  }

  function mapInput(stepName, inputName) {
    var regex = new RegExp("^(?:\\.?\\/)?(?:[^:]+:)?" + stepName + "([/[]?.*)$");
    return function (block, path) {
      var match = regex.exec(path);
      if (match == null) {
        return null;
      }

      var rest = match[1];

      for (var inputIndex in block.inputList) {
        var input = block.inputList[inputIndex];
        if (input.name === inputName) {
          var targetConnection = input.connection.targetConnection;
          if (targetConnection == null) {
            return null;
          }

          var target = targetConnection.getSourceBlock();

          return getBlockMatching(target, rest);
        }
      }

      return null;
    };
  }

  function mapStatement(stepName, statementName) {
    var regex = new RegExp("^(?:\\.?\\/)?(?:[^:]+:)?" + stepName + "(?:/\\$array\\[(\\d+)])?(.*)$");
    return function (block, path) {
      var match = regex.exec(path);
      if (match == null) {
        return null;
      }

      var index = match[1] || 0;
      var rest = match[2];

      for (var inputIndex in block.inputList) {
        var input = block.inputList[inputIndex];
        if (input.name === statementName) {
          var targetConnection = input.connection.targetConnection;
          if (targetConnection == null) {
            return null;
          }

          var target = targetConnection.getSourceBlock();

          for (var i = 0; i < index; i++) {
            target = target.nextConnection.targetConnection.getSourceBlock();
          }

          if (target.type === "content_element") {
            target = target.inputList[0].connection.targetConnection.getSourceBlock();
          }

          return getBlockMatching(target, rest);
        }
      }

      return null;
    };
  }

  function mapArrayItem() {
    var regex = /^(?:\.?\/)?\$array\[(\d+)]\/?(.*)$/;

    return function (block, path) {
      var inputList = block.inputList;
      var items = null;
      for (var i = 0; i < inputList.length; i++) {
        var input = inputList[i];
        if (input.name === "items") {
          items = input;
          break;
        }
      }

      var match = regex.exec(path);
      if (match == null) {
        var targetConnection = items.connection.targetConnection;
        if (targetConnection == null) {
          return null;
        }

        return getBlockMatching(targetConnection.getSourceBlock(), path);
      }

      var index = match[1];
      var rest = match[2];

      var target = items.connection.targetConnection.getSourceBlock();

      for (var j = 0; j < index; j++) {
        target = target.nextConnection.targetConnection.getSourceBlock();
      }

      if (target.type === "content_element") {
        target = target.inputList[0].connection.targetConnection.getSourceBlock();
      }

      return getBlockMatching(target, rest);
    }
  }

  function mapProperty() {
    return function (block, path) {
      var targetConnection = block.inputList[0].connection.targetConnection;
      if (targetConnection == null) {
        if (path.length === 0 || path === ".") {
          return block;
        } else {
          return null;
        }
      }

      return getBlockMatching(targetConnection.getSourceBlock(), path);
    };
  }

  function mapWithVariables() {
    var regex = /^(?:\.?\/)?[^:]+:(var|script):([^/[]+)([/[]?.*)$/;
    return function (block, path) {
      var match = regex.exec(path);
      if (match == null) {
        return null;
      }

      var kind = match[1];
      var varName = match[2];
      var rest = match[3];

      var inputList = block.inputList;
      for (var i = 0; i < inputList.length; i++) {
        var input = inputList[i];
        if (input.name !== "variables") {
          continue;
        }

        var targetConnection = input.connection.targetConnection;
        if (targetConnection == null) {
          return null;
        }

        var target = targetConnection.getSourceBlock();
        var varIndex = 0;
        while (target != null) {
          if (kind === "var" && target.type === "expression_logic_with_variable") {
            var name = target.getFieldValue("name");
            if (name === varName) {
              return getBlockMatching(target, rest);
            }
          }

          if (kind === "script" && target.type === "expression_logic_with_script") {
            if (varIndex.toFixed() === varName) {
              return getBlockMatching(target, rest);
            }
          }

          targetConnection = target.nextConnection.targetConnection;
          target = (targetConnection != null)
              ? targetConnection.getSourceBlock()
              : null;

          varIndex++;
        }
      }

      return null;
    }
  }

  function mapHtmlAttributes() {
    var regex = /^(?:\.?\/)?[^:]+:attr:([^/[]+)([/[]?.*)$/;

    return function (block, path) {
      var match = regex.exec(path);
      if (match == null) {
        return null;
      }

      var attrName = match[1];
      var rest = match[2];

      var inputList = block.inputList;
      for (var i = 0; i < inputList.length; i++) {
        var input = inputList[i];
        if (input.name !== "attributes") {
          continue;
        }

        var targetConnection = input.connection.targetConnection;
        if (targetConnection == null) {
          return null;
        }

        var target = targetConnection.getSourceBlock();
        while (target != null) {
          if (target.getFieldValue("name") === attrName) {
            return getBlockMatching(target, rest);
          }

          targetConnection = target.nextConnection;
          target = targetConnection && targetConnection.getSourceBlock();
        }
      }

      return null;
    };
  }

  function mapFunctionParameters(statementName) {
    var regex = /^(?:\.?\/)?param:([^/[]+)([/[]?.*)$/;

    return function (block, path) {
      var match = regex.exec(path);
      if (match == null) {
        return null;
      }

      var paramName = match[1];
      var rest = match[2];

      var inputList = block.inputList;
      for (var i = 0; i < inputList.length; i++) {
        var input = inputList[i];
        if (input.name !== statementName) {
          continue;
        }

        var targetConnection = input.connection.targetConnection;
        if (targetConnection == null) {
          return null;
        }

        var target = targetConnection.getSourceBlock();
        while (target != null) {
          if (target.getFieldValue("name") === paramName) {
            return getBlockMatching(target, rest);
          }

          var nextConnection = target.nextConnection;
          targetConnection = nextConnection && nextConnection.targetConnection;
          target = targetConnection && targetConnection.getSourceBlock();
        }
      }

      return null;
    };
  }

  function mapFunctionCallArguments(statementName) {
    var regex = /^(?:\.?\/)?arg:([^/[]+)([/[]?.*)$/;

    return function (block, path) {
      var match = regex.exec(path);
      if (match == null) {
        return null;
      }

      var paramName = match[1];
      var rest = match[2];

      var inputList = block.inputList;
      for (var i = 0; i < inputList.length; i++) {
        var input = inputList[i];
        if (input.name !== statementName) {
          continue;
        }

        var targetConnection = input.connection.targetConnection;
        if (targetConnection == null) {
          return null;
        }

        var target = targetConnection.getSourceBlock();
        while (target != null) {
          if (target.getFieldValue("name") === paramName) {
            return getBlockMatching(target, rest);
          }

          targetConnection = target.nextConnection;
          target = targetConnection && targetConnection.getSourceBlock();
        }
      }

      return null;
    };
  }

  function mapChooseContent(block, path) {
    var regex = /^(?:\.?\/)?(?:[^/[]+)\[(\d+)]\/?(.*)$/;

    var inputList = block.inputList;
    var content = null;
    for (var i = 0; i < inputList.length; i++) {
      var input = inputList[i];
      if (input.name === "content") {
        content = input;
        break;
      }
    }

    var match = regex.exec(path);
    if (match == null) {
      var targetConnection = content.connection.targetConnection;
      if (targetConnection == null) {
        return null;
      }

      return getBlockMatching(targetConnection.getSourceBlock(), path);
    }

    var index = match[1];
    var rest = match[2];

    var target = content.connection.targetConnection.getSourceBlock();

    for (var j = 0; j < index; j++) {
      target = target.nextConnection.targetConnection.getSourceBlock();
    }

    return getBlockMatching(target, rest);
  }
})();
