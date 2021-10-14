/*
 * Copyright TIBCO Software Inc. 2001-2021. All rights reserved.
 */

/*
 */

'use strict';
(function (go) {
  if (window.ebxWorkflowViewer != null) {
    console.log(lang.warn_diagram_alreadylaunched);
    return;
  }
  /*
 * All public methods are defined here.
 */
  window.ebxWorkflowViewer = {
    callDisplay: callDisplay,
    refresh: refresh,
    getSvg: getSvg,
    getFormat: getFormat,
    saveDiagram: saveDiagram,
    saveImageAs: saveImageAs,
    saveAsPdf: saveAsPdf,
    applyDefaultLayout: applyDefaultLayout,
    showHideGrid: showHideGrid,
    quitDiagram: quitDiagram,
    updateConstraint: updateConstraint,
    zoomIn: zoomIn,
    zoomOut: zoomOut
  };

  if (!go.GraphObject.prototype.getDocumentBounds) {
    go.GraphObject.prototype.getDocumentBounds = function () {
      var topLeftPoint = this.getDocumentPoint(go.Spot.TopLeft);
      var bottomRightPoint = this.getDocumentPoint(go.Spot.BottomRight);
      return new go.Rect(topLeftPoint, bottomRightPoint);
    }
  }
  go.Shape.defineArrowheadGeometry("EBXWorkflowTriangle", "m 0,0 l 6,6 -6,6");

  var $ = go.GraphObject.make;
  var diagram;
  var myOverview;
  var nodeHoverAdornment;
  var initialScale;
  var currentZoomFactor = 0;

  var URL_VAR = '{toDefine}';
  var lang;
  var genericUrl;
  var url;
  var createStepUrl;
  var relinkUrl;
  var targetId;
  var editEnabled;
  var addStepEnabled;

  var editGenericUrl;

  var objectsSize = 60;
  var EventNodeSize = objectsSize;
  var GatewayDiamondSize = objectsSize;
  var GatewayCrossSize = 24;
  var EventNodeInnerSize = EventNodeSize - 6;
  var EventNodeSymbolSize = EventNodeInnerSize - 14;
  var labelWidth = 125;
  var labelHeight = 50;
  var ADD_NODE_DISPLACEMENT = 16;

  // Link var
  var endSegmentLength = 20;
  var linkBoxGap = 1;

  var EBX_STYLE = {
    COLOR_FOCUS: ebx_color_focus
  }

  var STYLE = {
    STEPS_STROKE_WIDTH: 1,
    STEPS_STROKE: "#C0C0C0",
    STEPS_FILL: "#F0F0F0",
    BUTTONS_FILL: "rgba(255, 255, 255, .9)",
    BUTTONS_FILLOVER: "rgba(0, 0, 0, .15)",
    START_FILL: "#7CAF74",
    END_FILL: "#E76965",
    GATEWAY_FILL: "#FFFFFF",
    CROSS_FILL: "#A0A0A0",
    WAIT_TASK_FILL: "#FFFFFF",
    TOOLTIP_FILL: "#FFFFCC",
    TRANSPARENT_BLACK_BORDER: "rgba(0,0,0,.6)",
    GRID_LINE_COLOR: "#E0E0E0",
    EBX_TEXT_COLOR: "#505050",
    EBX_OUTLINE_COLOR: "#505050"
  }

  var ICON = {
    USER: "userIcon",
    SCRIPT: "scriptIcon",
    REMOVE: "removeIcon",
    EDIT: "editIcon",
    DUPLICATION: "duplicateIcon",
    PLUS: "plusIcon",
    SHOW: "showIcon",
    HIDE: "hideIcon",
    REDIRECT: "redirectIcon"
  };

  var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      dd;

  // var ebx_overview_region = 'ebx_WorkspaceContentForm';
  var ebx_overview_region = 'ebx_WorkflowModelDiagram';

  YAHOO.example.DDRegion = function (id, sGroup, config) {
    this.cont = config.cont;
    YAHOO.example.DDRegion.superclass.constructor.apply(this, arguments);
  };

  YAHOO.extend(YAHOO.example.DDRegion, YAHOO.util.DD, {
    cont: null,
    init: function () {
      //Call the parent's init method
      YAHOO.example.DDRegion.superclass.init.apply(this, arguments);
      this.initConstraints();

      Event.on(window, 'resize', function () {
        this.initConstraints();
      }, this, true);
    },
    initConstraints: function () {
      //Get the top, right, bottom and left positions of the container ref for spatial constraint
      var region = Dom.getRegion(this.cont);
      var el = this.getEl();
      var xy = Dom.getXY(el);

      var panel = {
        x: xy[0],
        y: xy[1],
        width: parseInt(Dom.getStyle(el, 'width'), 10),
        height: parseInt(Dom.getStyle(el, 'height'), 10)
      };

      // take into account the dimension of the handler element for the spatial constraint
      var constraint = {
        left: panel.x - region.left + 20,
        right: region.right - panel.x - panel.width + 20,
        top: panel.y - region.top + 20,
        bottom: region.bottom - panel.y - panel.height
      };

      //Set the constraints based on the above calculations
      this.setXConstraint(constraint.left, constraint.right);
      this.setYConstraint(constraint.top, constraint.bottom);
    },
    setXConstraint: function (iLeft, iRight, iTickSize) {
      this.leftConstraint = parseInt(iLeft, 10);
      this.rightConstraint = parseInt(iRight, 10);

      var el = this.getEl();
      var xy = Dom.getXY(el);

      this.minX = xy[0] - this.leftConstraint;
      this.maxX = xy[0] + this.rightConstraint;
      if (iTickSize) {
        this.setXTicks(xy[0], iTickSize);
      }
      this.constrainX = true;
    },
    setYConstraint: function (iUp, iDown, iTickSize) {
      this.topConstraint = parseInt(iUp, 10);
      this.bottomConstraint = parseInt(iDown, 10);
      var el = this.getEl();
      var xy = Dom.getXY(el);

      this.minY = xy[1] - this.topConstraint;
      this.maxY = xy[1] + this.bottomConstraint;
      if (iTickSize) {
        this.setYTicks(xy[1], iTickSize);
      }
      this.constrainY = true;
    }
  });

  function isUndefined(value) {
    // Obtain `undefined` value that's
    // guaranteed to not have been re-assigned
    var undefined = void (0);
    return value === undefined;
  }

  function updateConstraint() {
    if (dd) {
      setTimeout(function () {
        dd.initConstraints();
      }, 150);
    }

  }

  function applyScale() {
    var x = currentZoomFactor;
    var A = initialScale;
    var B = diagram.commandHandler.zoomFactor;
    diagram.scale = A * Math.pow(B, x);
  }

  function zoomIn() {
    if (diagram) {
      currentZoomFactor += 5;
      applyScale();
    }
  }

  function zoomOut() {
    if (diagram) {
      currentZoomFactor -= 5;
      applyScale();
    }
  }

  function updateOnViewportBoundsChanged(e) {
    var A = initialScale;
    var B = diagram.commandHandler.zoomFactor;
    var y1 = diagram.scale;
    currentZoomFactor = Math.round(Math.log(y1 / A) / Math.log(B));
  }

  function textStyle() {
    return {font: "13px ebx_font_text", stroke: STYLE.EBX_TEXT_COLOR};
  }

  function quitDiagram(closeUrl) {
    if (diagram.isModified) {
      ebx_confirm({
        question: lang.warn,
        message: lang.warn_diagram_modified,
        jsCommandYes: function () {
          window.location.href = closeUrl;
        },
        jsCommandNo: function () {
        }
      });
    } else {
      window.location.href = closeUrl;
    }
  }

  // a function that produces the content of the diagram tooltip
  function diagramInfo(node) {
    return lang.tooltip_identifier + " : " + toServerPK(node.key) + "\n"
        + lang.tooltip_stepname + " : " + node.title + "\n"
        + lang.tooltip_description + " : " + node.description + "\n"
        + lang.tooltip_hidden + " : " + node.hidden;
  }

  function buttonsOnMouseHover(e, obj) {
    var node = obj.part;
    if (!node.isSelected) {
      nodeHoverAdornment.adornedObject = node;
      node.addAdornment("mouseHover", nodeHoverAdornment);
    }
  }

  function applyDefaultLayout(enabled) {
    var transactionName = "change Layout";
    try {
      diagram.startTransaction(transactionName);
      if (enabled) {
        diagram.layout = DiagramBuilder.getDefaultLayout();
      } else {
        diagram.layout = $(go.Layout);
      }
      diagram.commitTransaction(transactionName);
    } catch (err) {
      ebx_alert(lang.err_occured, err);
      diagram.rollbackTransaction();
    }
  }

  /* =================================================================
  **                     Diagram Export Definitions
  ** ================================================================= */

  function createImage(type, zoom) {
    if (!zoom || typeof zoom != "number") {
      zoom = 1.;
    }
    if (type === 'svg') {
      return diagram.makeSvg({
        scale: zoom,
        background: "rgba(255, 255, 255, 1)"
      });
    } else {
      return diagram.makeImage({
        scale: 1,
        maxSize: new go.Size(Infinity, Infinity),
        type: "image/png",
        background: "rgba(255, 255, 255, 1)"
      });
    }
  }

  function getSvg(zoom) {
    return createImage("svg", zoom);
  }

  function processImageBuffer(image) {
    var datas = atob(image.split(",")[1]);
    var buffer = new ArrayBuffer(datas.length);
    var bytes = new Uint8Array(buffer);
    for (var i = 0; i < datas.length; i++) {
      bytes[i] = datas.charCodeAt(i);
    }
    return buffer;
  }

  function linkDownloadBlob(blob, name) {
    if (!blob) {
      return;
    }
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = name || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadSvg(svg) {
    var isIE = !!document.documentMode;
    var nameFile = diagram.model.modelName || 'workflow-diagram';
    if (svg.outerHTML) {
      var svgBlob = new Blob([svg.outerHTML],
          {type: "image/svg+xml;charset=utf-8"});
      linkDownloadBlob(svgBlob, nameFile + ".svg");
    } else if (isIE) {
      var div = document.createElement("div");
      div.appendChild(svg);
      var blob = new Blob([div.innerHTML],
          {type: "image/svg+xml;charset=utf-8"});
      navigator.msSaveBlob(blob, nameFile + ".svg");
    }
  }

  function downloadPng(image) {
    var buffer = processImageBuffer(image);
    var pngBlob = new Blob([buffer], {type: "image/png"});
    var isIE = !!document.documentMode;

    var nameFile = diagram.model.modelName || 'workflow-diagram';
    if (!isIE) {
      linkDownloadBlob(pngBlob, nameFile + ".png");
    } else {
      navigator.msSaveBlob(pngBlob, nameFile + ".png");
    }
  }

  function saveImageAs(type) {
    var imgOrURL = createImage(type);
    if (type === 'svg' || type === 'png') {
      if (type === 'svg') {
        downloadSvg(imgOrURL);
      } else {
        downloadPng(imgOrURL.src);
      }
      return;
    } else if (typeof imgOrURL === "object") {
      imgOrURL = imgOrURL.src;
    }
    window.win = open(imgOrURL);
    setTimeout('win.document.execCommand("SaveAs")', 500);
  }

  function generateImages(width, height, zoom) {
    var listImg = [];
    width = parseInt(width);
    height = parseInt(height);
    if (isNaN(width)) {
      width = 100;
    }
    if (isNaN(height)) {
      height = 100;
    }
    width = Math.max(width, 50);
    height = Math.max(height, 50);

    var db = diagram.documentBounds.copy();
    var boundsWidth = Math.floor(db.width);
    var boundsHeight = Math.floor(db.height);
    var imgWidth = width;
    var imgHeight = height;
    var p = db.position.copy();

    for (var j = 0; j < boundsWidth; j += imgWidth) {

      for (var i = 0; i < boundsHeight; i += imgHeight) {

        listImg.push(diagram.makeSvg({
          scale: 1,
          position: new go.Point(p.x + j, p.y + i),
          size: new go.Size(imgWidth, imgHeight)
        }));
      }
    }
    return listImg;
  }

  var ORIENTATION = {
    LANDSCAPE: "landscape",
    PORTRAIT: "portrait"
  }

  function DocumentDimension(width, height) {
    this.width = width;
    this.height = height;
  }

  // the document must be in pt or the result will be falsy, support only 'pt' -> 'anUnit'
  DocumentDimension.prototype.convertDimensionTo = function (unitTo) {
    var w = convertPointTo(unitTo, this.width);
    var h = convertPointTo(unitTo, this.height);
    return {width: w, height: h};
  }
  DocumentDimension.prototype.toLandscape = function () {
    return this;
  }
  DocumentDimension.prototype.toPortrait = function () {
    return this;
  }

  function LandscapeDocument(width, height) {
    DocumentDimension.call(this, width, height);
  }

  LandscapeDocument.prototype = Object.create(DocumentDimension.prototype);
  LandscapeDocument.prototype.convertDimensionTo = function (unitTo) {
    var dim = DocumentDimension.prototype.convertDimensionTo.call(this, unitTo);
    return new LandscapeDocument(dim.width, dim.height);
  }
  LandscapeDocument.prototype.toPortrait = function () {
    return new PortraitDocument(this.height, this.width);
  }

  function PortraitDocument(width, height) {
    DocumentDimension.call(this, width, height);
  }

  PortraitDocument.prototype = Object.create(DocumentDimension.prototype);
  PortraitDocument.prototype.convertDimensionTo = function (unitTo) {
    var dim = DocumentDimension.prototype.convertDimensionTo.call(this, unitTo);
    return new PortraitDocument(dim.width, dim.height);
  }
  PortraitDocument.prototype.toLandscape = function () {
    return new LandscapeDocument(this.height, this.width);
  }

  // dimensions are written in point(pt) & default landscape format
  var DIMENSIONS = {
    '4A0': new LandscapeDocument(6740.79, 4767.87),
    '2A0': new LandscapeDocument(4767.87, 3370.39),
    'A0': new LandscapeDocument(3370.39, 2383.94),
    'A1': new LandscapeDocument(2383.94, 1683.78),
    'A2': new LandscapeDocument(1683.78, 1190.55),
    'A3': new LandscapeDocument(1190.55, 841.89),
    'A4': new LandscapeDocument(841.89, 595.28),
    'A5': new LandscapeDocument(595.28, 419.53),
    'A6': new LandscapeDocument(419.53, 297.64),
    'A7': new LandscapeDocument(297.64, 209.76),
    'A8': new LandscapeDocument(209.76, 147.40),
    'A9': new LandscapeDocument(147.40, 104.88),
    'A10': new LandscapeDocument(104.88, 73.70),
    'B0': new LandscapeDocument(4008.19, 2834.65),
    'B1': new LandscapeDocument(2834.65, 2004.09),
    'B2': new LandscapeDocument(2004.09, 1417.32),
    'B3': new LandscapeDocument(1417.32, 1000.63),
    'B4': new LandscapeDocument(1000.63, 708.66),
    'B5': new LandscapeDocument(708.66, 498.90),
    'B6': new LandscapeDocument(498.90, 354.33),
    'B7': new LandscapeDocument(354.33, 249.45),
    'B8': new LandscapeDocument(249.45, 175.75),
    'B9': new LandscapeDocument(175.75, 124.72),
    'B10': new LandscapeDocument(124.72, 87.87),
    'C0': new LandscapeDocument(3676.54, 2599.37),
    'C1': new LandscapeDocument(2599.37, 1836.85),
    'C2': new LandscapeDocument(1836.85, 1298.27),
    'C3': new LandscapeDocument(1298.27, 918.43),
    'C4': new LandscapeDocument(918.43, 649.13),
    'C5': new LandscapeDocument(649.13, 459.21),
    'C6': new LandscapeDocument(459.21, 323.15),
    'C7': new LandscapeDocument(323.15, 229.61),
    'C8': new LandscapeDocument(229.61, 161.57),
    'C9': new LandscapeDocument(161.57, 113.39),
    'C10': new LandscapeDocument(113.39, 79.37),
    'RA0': new LandscapeDocument(3458.27, 2437.80),
    'RA1': new LandscapeDocument(2437.80, 1729.13),
    'RA2': new LandscapeDocument(1729.13, 1218.90),
    'RA3': new LandscapeDocument(1218.90, 864.57),
    'RA4': new LandscapeDocument(864.57, 609.45),
    'SRA0': new LandscapeDocument(3628.35, 2551.18),
    'SRA1': new LandscapeDocument(2551.18, 1814.17),
    'SRA2': new LandscapeDocument(1814.17, 1275.59),
    'SRA3': new LandscapeDocument(1275.59, 907.09),
    'SRA4': new LandscapeDocument(907.09, 637.80),
    'EXECUTIVE': new LandscapeDocument(756.00, 521.86),
    'FOLIO': new LandscapeDocument(936.00, 612.00),
    'LEGAL': new LandscapeDocument(1008.00, 612.00),
    'LETTER': new LandscapeDocument(792.00, 612.00),
    'TABLOID': new LandscapeDocument(1224.0, 792.00)
  };

  function getFormat(orientation, format) {
    if (typeof orientation === 'undefined' || !format) {
      return null;
    }
    orientation = orientation ? ORIENTATION.LANDSCAPE : ORIENTATION.PORTRAIT;
    var dim = DIMENSIONS[format.toUpperCase()];
    dim = orientation === ORIENTATION.PORTRAIT ? dim.toPortrait() : dim;
    return dim.convertDimensionTo('px');
  }

  function saveAsPdf(format, isOnePage, isLandscape, zoom) {
    if (!zoom || !parseFloat(zoom)) {
      zoom = 1;
    } else {
      zoom = parseFloat(zoom);
    }
    zoom = 1;
    if (format && typeof format !== 'string') {
      console.error("[SaveAsPdf] Invalid format '", format, "'");
      return;
    }
    if (!format || !DIMENSIONS[format]) {
      console.warn("[SaveAsPdf] Unknown format '", format,
          "' using default A3");
      format = "A3";
    }
    var pdfDim = DIMENSIONS[format];
    var dimToPx = getFormat(isLandscape, format);
    var db = diagram.documentBounds.copy();
    var pdfOptions = {
      size: [pdfDim.width, pdfDim.height]
    };
    var pdf = new PDFDocument(pdfOptions);
    var stream = pdf.pipe(blobStream());

    var heightMax = Math.min(db.height, dimToPx.height);
    isOnePage
        ? generateOnePagePdf(pdf, dimToPx, heightMax)
        : generateMultiPagePdf(pdf, dimToPx, heightMax, zoom, pdfOptions);

    pdf.end();

    savePdfAndDownload(stream);
  }

  function generateOnePagePdf(pdfDoc, dimToPx, heightMax) {
    var svg = diagram.makeSvg({
      size: new go.Size(dimToPx.width, heightMax),
      background: "rgba(255, 255, 255, 1)"
    });
    if (typeof img === "object") {
      pdfDoc.addSVG(svg.src, 0, 0);
    } else {
      pdfDoc.addSVG(svg, 0, 0);
    }
  }

  function generateMultiPagePdf(pdfDoc, dimToPx, heightMax, zoom, pdfOptions) {
    generateImages(dimToPx.width, heightMax, zoom).forEach(
        function (el, i, array) {

          if (typeof img === "object") {
            pdfDoc.addSVG(el.src, 0, 0);
          } else {
            pdfDoc.addSVG(el, 0, 0);
          }

          if (i < array.length - 1) {
            pdfDoc.addPage(pdfOptions);
          }

        });
  }

  function savePdfAndDownload(pdfStream) {
    var nameFile = diagram.model.modelName || 'workflow-diagram';
    pdfStream.on('finish', function () {
      var blob = this.toBlob();
      FileSaver.saveAs(blob, nameFile + ".pdf");
    });
  }

  function convertPointTo(unitTo, value) {
    var k = 1;
    switch (unitTo) {
      case 'pt':
        k = 1;
        break;
      case 'mm':
        k = 72 / 25.4;
        break;
      case 'cm':
        k = 72 / 2.54;
        break;
      case 'in':
        k = 72;
        break;
      case 'px':
        k = 96 / 72;
        break;
      case 'pc':
        k = 12;
        break;
      case 'em':
        k = 12;
        break;
      case 'ex':
        k = 6;
        break;
    }
    return value * k;
  }

  /* =================================================================
  **                     REST Call Definitions
  ** ================================================================= */

  function ajax(url) {
    var builder = {};
    var xhttp = new XMLHttpRequest();
    var successCallback;
    var failureCallback;
    var afterCallback;
    var successPredicate = 200;
    builder.setSuccessCallback = function (aCallback, aSuccessPredicate) {
      successCallback = aCallback;
      successPredicate = aSuccessPredicate;
      return builder;
    };
    builder.setFailureCallback = function (aCallback) {
      failureCallback = aCallback;
      return builder;
    };
    builder.setAfterCallback = function (aCallback) {
      afterCallback = aCallback;
      return builder;
    };
    builder.get = function () {
      xhttp.open("GET", url, true);
      return builder;
    };
    builder.post = function () {
      xhttp.open("POST", url, true);
      return builder;
    };
    builder.put = function () {
      xhttp.open("PUT", url, true);
      return builder;
    };
    builder.delete = function () {
      xhttp.open("DELETE", url, true);
      return builder;
    };
    builder.send = function (params) {
      xhttp.setRequestHeader("Content-Type", "application/json");
      //TODO maa require the locale otherwise the EBX® default locale is used from Java server
      //  xhttp.setRequestHeader("Accept-Language", "<locale>");
      isUndefined(params) ? xhttp.send() : xhttp.send(params);
    };
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4) {
        var predicateType = typeof successPredicate;
        var proceedSuccess = true;
        if (predicateType !== "number" && predicateType !== "function") {
          proceedSuccess = false;
          console.error(
              "Ajax request success code value should be a number or predicate :",
              successPredicate);
        }

        if (proceedSuccess
            && (xhttp.status === successPredicate
                || (predicateType === "function" && successPredicate(
                    xhttp.status))
            )) {
          successCallback(xhttp);
        } else {
          failureCallback && failureCallback(xhttp);
        }

        afterCallback && afterCallback(proceedSuccess, xhttp);
      }
    }
    return builder;
  }

  function requestRelinkRESTSuccessCallback(transactionName) {
    return function () {
      ebx_alert(lang.success_title, lang.success_description);
      diagram.commitTransaction(transactionName);
    }
  }

  function requestRelinkRESTFailureCallback(xhttp) {
    var response = xhttp.responseText;
    var jsonResponse = JSON.parse(response);
    ebx_alert(lang.err_occured, jsonResponse.messages);
    diagram.rollbackTransaction();
  }

  function requestRelinkREST(fromNode, toNode, role, transactionName) {
    var apiUrl = UrlGenerator.relink(fromNode, toNode, role);
    ajax(apiUrl)
        .post()
        .setSuccessCallback(requestRelinkRESTSuccessCallback(transactionName),
            204)
        .setFailureCallback(requestRelinkRESTFailureCallback)
        .send();
  }

  function requestRemoveRESTSuccessCallback(callback) {
    return function () {
      ebx_alert(lang.success_title, lang.success_description);
      callback();
    }
  }

  function requestRemoveRESTFailureCallback(xhttp) {
    var response = xhttp.responseText;
    var jsonResponse = JSON.parse(response);
    ebx_alert(lang.err_occured, jsonResponse.localizedMessage);
  }

  function requestRemoveREST(aNode, callback) {
    var apiUrl = UrlGenerator.remove(aNode);
    ajax(apiUrl)
        .post()
        .setSuccessCallback(requestRemoveRESTSuccessCallback(callback), 204)
        .setFailureCallback(requestRemoveRESTFailureCallback)
        .send();
  }

  function requestDuplicateRESTSuccessCallback(callback) {
    return function (xhttp) {
      var response = xhttp.responseText;
      callback(response);
    }
  }

  function requestDuplicateRESTFailureCallback(xhttp) {
    var response = xhttp.responseText;
    var jsonResponse = JSON.parse(response);
    ebx_alert(lang.err_occured, jsonResponse.localizedMessage);
  }

  function requestDuplicateREST(selectedNode, location, callback) {
    var apiUrl = UrlGenerator.duplicate(selectedNode, location);
    ajax(apiUrl)
        .post()
        .setSuccessCallback(requestDuplicateRESTSuccessCallback(callback), 200)
        .setFailureCallback(requestDuplicateRESTFailureCallback)
        .send();
  }

  function requestShowHideRESTSuccessCallback(callback) {
    return function () {
      ebx_alert(lang.success_title, lang.success_description);
      callback();
    };
  }

  function requestShowHideRESTFailureCallback(xhttp) {
    var response = xhttp.responseText;
    var jsonResponse = JSON.parse(response);
    ebx_alert(lang.err_occured, jsonResponse.localizedMessage);
  }

  function requestShowHideREST(selectedNode, callback) {
    var apiUrl = UrlGenerator.showHideNode(selectedNode);
    ajax(apiUrl)
        .post()
        .setSuccessCallback(requestShowHideRESTSuccessCallback(callback), 204)
        .setFailureCallback(requestShowHideRESTFailureCallback)
        .send();
  }

  function saveDiagramAfterHook(urlClose) {
    return function () {
      ebx_alert_replyOK = function () {
        ebx_dialogBox_hide();
        window.location.href = urlClose;
      };
    }
  }

  function saveDiagramSuccessCallback() {
    ebx_alert(lang.success_title, lang.success_description);
  }

  function saveDiagramFailureCallback(xhttp) {
    var response = xhttp.responseText;
    var jsonResponse = JSON.parse(response);
    ebx_alert(lang.err_occured, jsonResponse.localizedMessage);
  }

  // saves floor plan to local storage with a new name
  function saveDiagram(urlClose) {
    var json = diagram.model.toJson();
    // Stringify JSON structure
    json = addModelNameToJSon(json);
    diagram.isModified = false;
    var req = ajax(url)
        .post()
        .setSuccessCallback(saveDiagramSuccessCallback, 204)
        .setFailureCallback(saveDiagramFailureCallback);
    if (urlClose !== '') {
      req.setAfterCallback(saveDiagramAfterHook(urlClose));
    }
    req.send(json);
  }

  function showHideGrid() {
    var enabled = diagram.grid.visible;
    diagram.grid.visible = !enabled;
  }

  /*
   *  Refresh diagram
   */
  function refresh(newlyCreatedNodeKey) {
    callDisplay(null, null, null, null, null, null, null, newlyCreatedNodeKey);
  }

  var UrlGenerator = {};
  UrlGenerator.model = function (restRelativeUrl) {
    return genericUrl.replace(URL_VAR, restRelativeUrl);
  };
  UrlGenerator.relink = function (fromNode, toNode, role) {
    var modelName = diagram.model.modelName;
    return genericUrl.replace(URL_VAR,
        'link/' + modelName + '/' + fromNode + '/' + toNode + '/' + role);
  };
  UrlGenerator.remove = function (selectionNode) {
    var modelName = diagram.model.modelName;
    return genericUrl.replace(URL_VAR,
        'link/' + modelName + '/' + selectionNode + ':remove');
  };
  UrlGenerator.duplicate = function (selectionNode, location) {
    var modelName = diagram.model.modelName;
    return genericUrl.replace(URL_VAR,
        'node/' + modelName + '/' + selectionNode + '/' + location
        + ':duplicate');
  };
  UrlGenerator.showHideNode = function (selectionNode) {
    var modelName = diagram.model.modelName;
    return genericUrl.replace(URL_VAR,
        'node/' + modelName + '/' + selectionNode + ':showhide');
  };
  UrlGenerator.editForKey = function (nodePk) {
    var aNodePk = toServerPK(nodePk);
    return editGenericUrl.replace('-99', aNodePk);
  };

  function editNode(nodeKey, checkEdit) {
    var doEdit = function () {
      execStr(UrlGenerator.editForKey(nodeKey), 100);
    };

    if ((checkEdit === true) && diagram.isModified) {
      ebx_confirm({
        question: lang.warn,
        message: lang.warn_diagram_modified,
        jsCommandYes: function () {
          doEdit();
        }
      });
    } else {
      doEdit();
    }
  }

  function resetRESTUris(aGenericUrl, relativeModelUrl, aEditGenericUrl,
      aCreateStepGenericUrl, aRelinkGenericUrl) {
    if (aGenericUrl != null) {
      genericUrl = aGenericUrl;
    }

    if (relativeModelUrl != null) {
      url = UrlGenerator.model(relativeModelUrl);
    }

    if (aEditGenericUrl != null) {
      editGenericUrl = aEditGenericUrl;
    }

    if (aCreateStepGenericUrl != null) {
      createStepUrl = aCreateStepGenericUrl;
    }

    if (aRelinkGenericUrl != null) {
      relinkUrl = aRelinkGenericUrl;
    }
  }

  function callDisplaySuccessfulCallback(aEditGenericUrl, accessMode,
      newlyCreatedNodeKey) {
    return function (xhttp) {
      var jsonResponse = JSON.parse(xhttp.responseText);
      // re-init diagram
      if (diagram != null && diagram.div != null) {
        diagram.div = null;
      }

      lang = jsonResponse.lang;

      //TODO FTH ask MAA: Why this variable is updated a second time ?
      if (aEditGenericUrl != null) {
        editGenericUrl = aEditGenericUrl;
      }

      display(targetId, accessMode, jsonResponse.firstDisplay,
          jsonResponse);

      if (!isUndefined(newlyCreatedNodeKey)) {
        editNode(newlyCreatedNodeKey, false);
      }
    };
  }

  function callDisplayFailureCallback(xhttp) {
    var jsonResponse = JSON.parse(xhttp.responseText);
    if (lang != null) {
      ebx_alert(lang.err_occured, jsonResponse.localizedMessage);
    } else {
      ebx_alert(jsonResponse.localizedMessage);
    }
  }

  function callDisplay(aGenericUrl, relativeModelUrl, aTargetId, accessMode,
      aEditGenericUrl, aCreateStepGenericUrl, aRelinkGenericUrl,
      newlyCreatedNodeKey) {

    resetRESTUris(aGenericUrl, relativeModelUrl, aEditGenericUrl,
        aCreateStepGenericUrl, aRelinkGenericUrl);
    if (aTargetId != null) {
      targetId = aTargetId;
    }
    ajax(url)
        .get()
        .setSuccessCallback(
            callDisplaySuccessfulCallback(aEditGenericUrl, accessMode,
                newlyCreatedNodeKey), 200)
        .setFailureCallback(callDisplayFailureCallback)
        .send();
  }

  function jsonToLinkPoints(listOfPoints) {
    if (isUndefined(listOfPoints)) {
      return;
    }
    return JSON.parse(listOfPoints);
  }

  function linkPointsToJson(listOfPoints) {
    var json;

    if (isUndefined(listOfPoints)) {
      return;
    }

    // we have to read the goJs.List
    // from goJs.Link.points in order to serialize it
    var it = listOfPoints.iterator;
    json = "[";
    var currentSeparator = "";
    while (it.next()) {
      json += currentSeparator;
      currentSeparator = ",";
      json += it.value.x;
      json += currentSeparator;
      json += it.value.y;
    }
    json += "]";
    return json;
  }

  function addModelNameToJSon(jsonString) {
    var json = JSON.parse(jsonString);
    json.modelName = diagram.model.modelName;
    return JSON.stringify(json);
  }

  function jsonToPoint(location) {
    if (isUndefined(location)) {
      return;
    }
    var json = JSON.parse(location);
    return new go.Point(Number(json.x), Number(json.y));
  }

  function pointToJson(point) {
    return "{ \"x\" :" + point.x + ", \"y\" :" +
        point.y + "} ";
  }

  function toServerPK(nodeGojsPk) {
    if (nodeGojsPk === 'start') {
      return -1;
    }
    if (nodeGojsPk !== "end") {
      return nodeGojsPk.substring(1);
    }
    return nodeGojsPk;
  }

  function execStr(cmd, InterVal) {
    try {
      setTimeout(function () {
        var F = new Function(cmd);
        return (F());
      }, InterVal);
    } catch (e) {
    }
  }

  // when the plus button is double-clicked
  function addStepInLinkDoubleClick(e, obj) {
    var link = obj.part;
    var finalUrl = createStepUrl;
    finalUrl = finalUrl.replace(encodeURIComponent('{from}'), link.data.from);
    finalUrl = finalUrl.replace(encodeURIComponent('{to}'), link.data.to);
    finalUrl = finalUrl.replace(encodeURIComponent('{role}'),
        link.data.fromPortId);
    finalUrl = finalUrl.replace(encodeURIComponent('{modelName}'),
        diagram.model.modelName);
    finalUrl = finalUrl.replace(encodeURIComponent('{location}'),
        e.documentPoint.x + '_' + e.documentPoint.y);
    diagram.addNodeEBX && removeAddNodeEBXAdornment();
    execStr(finalUrl, 100);
  }

  function mouseEnterLinkPerimeter(e, link) {
    var projectedPoint = getProjectedEventPointOnLink(
        e.documentPoint, link);
    if (diagram.addNodeEBX && diagram.addNodeEBX.adornedObject
        !== link) {
      removeAddNodeEBXAdornment();
    }
    var linkPoints = link.points;
    var sp = Vector.fromPoints(linkPoints.get(0), projectedPoint);
    var pe = Vector.fromPoints(projectedPoint,
        linkPoints.get(linkPoints.count - 1));

    if (sp.norm() < ADD_NODE_DISPLACEMENT) {
      if (linkPoints.count > 3 && segmentIsLongEnough(
          linkPoints.get(0), linkPoints.get(1))) {
        projectedPoint = linkPoints.get(1);
      } else {
        projectedPoint = getPointFromVectorTransformation(
            sp.normalize(), linkPoints.get(0));
      }
    }
    if (pe.norm() < ADD_NODE_DISPLACEMENT * 2) {
      var pointsCount = linkPoints.count;
      if (linkPoints.count > 3 && segmentIsLongEnough(
          linkPoints.get(pointsCount - 1),
          linkPoints.get(pointsCount - 2), 4)) {
        projectedPoint = linkPoints.get(pointsCount - 2);
      } else {
        projectedPoint = getPointFromVectorTransformation(
            pe.revDir().normalize(),
            linkPoints.get(pointsCount - 1), 2);
      }
    }
    if (!diagram.addNodeEBX) {
      var addNodeEBX = $(go.Adornment, "Vertical",
          {
            location: new go.Point(projectedPoint.x,
                projectedPoint.y),
            locationSpot: go.Spot.Center
          },
          DiagramBuilder.createEbxButton("plusIcon", 10, 1, true,
              addStepInLinkDoubleClick)
      );
      addNodeEBX.adornedObject = link;
      diagram.addNodeEBX = addNodeEBX;
      link.addAdornment("addNode", addNodeEBX);
    }
  }

  function mouseLeaveLinkPerimeter(e, link) {
    var addNodeExist = diagram.addNodeEBX && link.findAdornment(
        "addNode");
    var isHoverAddNode = addNodeExist
        && diagram.addNodeEBX.getDocumentBounds().containsPoint(
            e.documentPoint);
    if (addNodeExist && !isHoverAddNode) {
      removeAddNodeEBXAdornment();
    }
  }

  function relink(e, obj) {
    var part = obj.part;
    var finalUrl = relinkUrl;
    finalUrl = finalUrl.replace(encodeURIComponent('{modelName}'),
        diagram.model.modelName);
    finalUrl = finalUrl.replace(encodeURIComponent('{key}'), part.data.key);
    finalUrl = finalUrl.replace(encodeURIComponent('{type}'), part.data.type);
    execStr(finalUrl, 100);
  }

  // when a node is double-clicked, launch edit service if enabled
  function nodeDoubleClick(e, obj) {
    if (editEnabled) {
      var clicked = obj.part;

      if (clicked !== null) {
        var nodePk = clicked.data.key;
        editNode(nodePk, true);
      }
    }
  }

  function handleAccessMode(anAccessMode) {
    editEnabled = true;
    addStepEnabled = true;
    diagram.isReadOnly = false;

    switch (anAccessMode) {
      case "R":
        diagram.isReadOnly = true;
        addStepEnabled = false;
        break;
      case "P":
        diagram.isReadOnly = true;
        editEnabled = false;
        addStepEnabled = false;
        break;
    }
  }

  function diagramRegisterCommands(aDiagram) {
    aDiagram.commandHandler.doKeyDown = function () {
      var e = aDiagram.lastInput;
      var selection = aDiagram.selection;
      var it = selection.iterator;
      if (e.event.key === "Enter") {

        if (it.count === 1 && it.next() && it.value.data.type
            && it.value.data.type
            !== "end") {
          nodeDoubleClick(null, it.value);
        }
      }
      if (e.event.key === "Backspace" || e.event.key === "Delete") {

        if (it.count === 1 && it.next()
            && it.value.data.type
            && it.value.data.type !== "start"
            && it.value.data.type !== "end") {
          removeNodeEvent(null, it.value);
        }
      }
      go.CommandHandler.prototype.doKeyDown.call(this);
    };
  }

  function relinkingToolReconnect(relinkTool) {
    return function (existingLink, newNode, newPort, toEnd) {
      ebx_confirm({
        question: 'Confirmation',
        message: 'Do you want to change the link ?',
        jsCommandYes: function () {
          try {
            var transactionName = "relink";
            diagram.startTransaction(transactionName);
            console.log("to end:", newPort);
            go.RelinkingTool.prototype.reconnectLink.call(
                relinkTool,
                existingLink, newNode, newPort, toEnd);
            var fromNode = existingLink.data.from;
            var toNode = newNode.data.key;
            var role = existingLink.data.fromPortId;
            requestRelinkREST(fromNode, toNode, role, transactionName);
          } catch (err) {
            ebx_alert(lang.err_occured, err);
            diagram.rollbackTransaction();
          }
        }
      });
    };
  }

  function setupOverview(aDiagram) {
    var overview =
        $(go.Overview, "ebx_WorkflowDiagramOverview",
            {
              // box: $(go.Part, "Horizontal", $(go.Shape, "Rectangle", {fill:"transparent",stroke: EBX_STYLE.COLOR_FOCUS})),
              observed: aDiagram,
              maxScale: 0.5,
              contentAlignment: go.Spot.Center
            });
    overview.box.elt(0).stroke = EBX_STYLE.COLOR_FOCUS;
    // Hide the overview box at t=0
    setTimeout(function () {
      var bt = document.querySelector('#ebx_overview_handle > button');
      bt.click();
      setTimeout(function () {
        bt.parentElement.parentElement.style.visibility = "";
      }, 200);
    }, 200);

    if (!dd) {
      dd = new YAHOO.example.DDRegion('ebx_overview_box', '',
          {cont: ebx_overview_region});
      dd.setHandleElId("ebx_overview_handle");
      dd.initConstraints();
    }
    return overview;
  }

  function nodeHoverButtonAdornmentConfig() {
    return $(go.Adornment, "Spot",
        {
          background: "transparent",
          // hide the Adornment when the mouse leaves it
          mouseLeave: function (e, obj) {
            var ad = obj.part;
            ad.adornedPart.removeAdornment("mouseHover");
          }
        },
        $(go.Placeholder),
        DiagramBuilder.createButtonTemplate()
    );
  }

  function setupLinkingToolTemporaryNodesAndLink(tool /* : go.LinkingBaseTool */) {
    // LinkingTool.temporaryLink
    var link = new go.Link();
    var path = new go.Shape();
    path.isPanelMain = true;
    path.stroke = EBX_STYLE.COLOR_FOCUS;
    link.add(path);
    var arrow = new go.Shape();
    arrow.toArrow = 'Standard';
    arrow.fill = EBX_STYLE.COLOR_FOCUS;
    arrow.stroke = EBX_STYLE.COLOR_FOCUS;
    link.add(arrow);
    link.layerName = 'Tool';

    tool.temporaryLink = link;

    var setupTemporaryNodeAndPort = function () {
      var node = new go.Node();
      var port = new go.Shape();
      port.portId = '';
      port.figure = 'Rectangle';
      port.fill = null;
      port.stroke = EBX_STYLE.COLOR_FOCUS;
      port.strokeWidth = 2;
      port.desiredSize = new go.Size(1, 1);
      node.add(port);
      node.selectable = false;
      node.layerName = 'Tool';
      return {node: node, port: port};
    }
    // LinkingTool.temporaryFromNode and .temporaryFromPort

    var temporaryFrom = setupTemporaryNodeAndPort();
    tool.temporaryFromNode = temporaryFrom.node;
    tool.temporaryFromPort = temporaryFrom.port;

    // LinkingTool.temporaryToNode and .temporaryToPort
    var temporaryTo = setupTemporaryNodeAndPort();

    tool.temporaryToNode = temporaryTo.node;
    tool.temporaryToPort = temporaryTo.port;
  }

  function setupDiagramTools(aDiagram) {
    // Snap to grid links
    aDiagram.toolManager.linkReshapingTool = $(SnapLinkReshapingTool);

    // Link points style
    aDiagram.toolManager.linkReshapingTool.handleArchetype =
        $(go.Shape, "square",
            {width: 5, height: 5, stroke: "grey", fill: EBX_STYLE.COLOR_FOCUS});
    aDiagram.toolManager.linkReshapingTool.midHandleArchetype =
        $(go.Shape, "circle",
            {width: 4, height: 4, stroke: "grey", fill: EBX_STYLE.COLOR_FOCUS});

    // Selection style
    aDiagram.toolManager.dragSelectingTool.isPartialInclusion = true;
    aDiagram.toolManager.dragSelectingTool.box =
        $(go.Part,
            {layerName: "Tool"},
            $(go.Shape, "Rectangle",
                {
                  name: "SHAPE",
                  fill: null,
                  background: EBX_STYLE.COLOR_FOCUS,
                  opacity: 0.2,
                  stroke: EBX_STYLE.COLOR_FOCUS,
                  strokeWidth: 2,
                  strokeDashArray: [4, 4]
                })
        );
    diagram.toolManager.linkingTool.direction = go.LinkingTool.ForwardsOnly;

    diagram.toolManager.relinkingTool.toHandleArchetype =
        $(go.Panel, "Spot",
            {segmentIndex: -1},
            $(go.Shape, "diamond",
                {width: 9, height: 9, fill: EBX_STYLE.COLOR_FOCUS})
            ,
            $(go.Shape, "rectangle",
                {
                  width: 12,
                  height: 17,
                  fill: "transparent",
                  stroke: "transparent",
                  cursor: "grab"
                })
        );

    var relinkTool = diagram.toolManager.relinkingTool;
    setupLinkingToolTemporaryNodesAndLink(relinkTool);

    // Relink method overridden in order to introduce persistence to links
    relinkTool.reconnectLink = relinkingToolReconnect(relinkTool);
    relinkTool.doActivate = function () {
      go.RelinkingTool.prototype.doActivate.call(this);
      diagram.currentCursor = "grabbing";
    };

    // Grid
    var draggingTool = diagram.toolManager.draggingTool;
    draggingTool.doActivate = function () {
      go.DraggingTool.prototype.doActivate.call(this);
      diagram.currentCursor = "grabbing";
    };

    draggingTool.isGridSnapEnabled = true;
    diagram.grid =
        $(go.Panel, "Grid",
            {
              name: "GRID",
              visible: false,
              gridCellSize: new go.Size(10, 10),
              gridOrigin: new go.Point(0.5, 0.5)
            },
            $(go.Shape, "LineH",
                {stroke: STYLE.GRID_LINE_COLOR, strokeWidth: 0.5, interval: 1}),
            $(go.Shape, "LineV",
                {stroke: STYLE.GRID_LINE_COLOR, strokeWidth: 0.5, interval: 1}) /*,*/
        );
  }

  function titleNodeBinding() {
    return new go.Binding("text", "title", function (title) {
      return title;
    });
  }

  function setupNodesTemplating(aDiagram) {

    // Default node template. Usually not used for display but specifies the "location" binding.
    aDiagram.nodeTemplate =
        $(go.Node, "Vertical",
            {doubleClick: nodeDoubleClick},
            new go.Binding("location", "location", jsonToPoint).makeTwoWay(
                pointToJson), // make it two way to save position back to the model
            $(go.TextBlock, textStyle(),
                {
                  alignment: go.Spot.Center,
                  textAlign: "center",
                  margin: 5
                },
                titleNodeBinding().makeTwoWay() // two way for title edition,
            )
        );

    // Node template mapping.
    aDiagram.nodeTemplateMap.set("start",
        DiagramBuilder.createBoundaryNodeTemplate("start"));
    aDiagram.nodeTemplateMap.set("end",
        DiagramBuilder.createBoundaryNodeTemplate("end"));
    aDiagram.nodeTemplateMap.set("script",
        DiagramBuilder.createActivityTemplate(ICON.SCRIPT));
    aDiagram.nodeTemplateMap.set("userTask",
        DiagramBuilder.createActivityTemplate(ICON.USER));
    aDiagram.nodeTemplateMap.set("wait",
        DiagramBuilder.createWaitMessageTemplate());
    aDiagram.nodeTemplateMap.set("subworkflow",
        DiagramBuilder.createActivityTemplate("PlusLine"));
    aDiagram.nodeTemplateMap.set("condition",
        DiagramBuilder.createLogicalGateTemplate());
  }

  function getLinkSelectionAdornmentTemplate() {
    return $(go.Adornment,
        $(go.Shape,
            {
              isPanelMain: true,
              stroke: EBX_STYLE.COLOR_FOCUS,
              strokeCap: "round",
              strokeWidth: 3
            }),
        $(go.Shape,
            {
              toArrow: "EBXWorkflowTriangle",
              // segmentOffset: new go.Point(-linkBoxGap + 1, 0),
              stroke: EBX_STYLE.COLOR_FOCUS,
              strokeCap: "round",
              strokeWidth: 3
            }),
        DiagramBuilder.createEbxButton("plusIcon", 10, 1, true,
            addStepInLinkDoubleClick)
    );
  }

  function getProjectedEventPointOnLink(point, link) {
    var closestSegmentIndex = link.findClosestSegment(point);
    var startSegmentPoint = link.points.get(closestSegmentIndex);
    var endSegmentPoint = link.points.get(closestSegmentIndex + 1);
    return point.copy().projectOntoLineSegmentPoint(startSegmentPoint,
        endSegmentPoint);
  }

  function removeAddNodeEBXAdornment() {
    diagram.addNodeEBX.adornedObject.removeAdornment("addNode");
    diagram.addNodeEBX.adornedObject = null;
    diagram.addNodeEBX = null;
  }

  function Vector(x, y) {
    this.x = x;
    this.y = y;
  }

  Vector.fromPoints = function (p1, p2) {
    var x = p2.x - p1.x;
    var y = p2.y - p1.y;
    return new Vector(x, y);
  }
  Vector.prototype.revDir = function () {
    return new Vector(-this.x, -this.y);
  }
  Vector.prototype.norm = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  Vector.prototype.normalize = function () {
    var norm = this.norm();
    return new Vector(this.x / norm, this.y / norm);
  }

  function segmentIsLongEnough(startPoint, endPoint, time) {
    time = time && typeof time === "number" ? time : 2;
    return startPoint.distanceSquaredPoint(endPoint) < ADD_NODE_DISPLACEMENT
        * time;
  }

  function getPointFromVectorTransformation(unitaryVector, originPoint, time) {
    time = time && typeof time === "number" ? time : 1;
    return new go.Point(
        originPoint.x + unitaryVector.x * ADD_NODE_DISPLACEMENT * time,
        originPoint.y + unitaryVector.y * ADD_NODE_DISPLACEMENT * time
    );
  }

  function setupLinkTemplate(aDiagram) {
    aDiagram.linkTemplate =
        $(go.Link,
            {
              mouseEnter: function (e, link) {
                if (!link.isSelected) {
                  mouseEnterLinkPerimeter(e, link);
                }
              },
              mouseLeave: function (e, link) {
                if (!link.isSelected) {
                  mouseLeaveLinkPerimeter(e, link);
                }

              },
              selectionChanged: function (link) {
                if (link.isSelected && diagram.addNodeEBX && link.findAdornment(
                    "addNode")) {
                  removeAddNodeEBXAdornment();
                }
              }
            },
            {
              routing: go.Link.AvoidsNodes,
              curve: go.Link.JumpOver,
              reshapable: true,
              resegmentable: true,
              toEndSegmentLength: endSegmentLength,
              fromEndSegmentLength: endSegmentLength,
              fromShortLength: linkBoxGap - 0.5,
              toShortLength: linkBoxGap,
              corner: 3,
              adjusting: go.Link.None,
              relinkableTo: true,
              relinkableFrom: false
            },
            $(go.Shape, {
              isPanelMain: true,
              stroke: "rgba(0,0,0,0.0)",
              strokeWidth: 24
            }),
            $(go.Shape,
                {isPanelMain: true, stroke: STYLE.TRANSPARENT_BLACK_BORDER}),
            $(go.Shape,
                {
                  toArrow: "EBXWorkflowTriangle",
                  stroke: STYLE.TRANSPARENT_BLACK_BORDER,
                  segmentOffset: new go.Point(-linkBoxGap, 0)
                }),
            $(go.Panel, "Auto",
                $(go.Shape,  // the label background, which becomes transparent around the edges
                    {
                      fill: $(go.Brush, "Radial", {
                        0: "rgb(255,255,255)",
                        0.3: "rgb(255,255,255)",
                        0.7: "rgba(255,255,255,0)",
                        1: "rgba(255,255,255, 0)"
                      }),
                      stroke: null
                    }),
                $(go.TextBlock, textStyle(),
                    {
                      textAlign: "center",
                      margin: 8,
                      visible: false,
                      segmentIndex: 10
                    },
                    new go.Binding("text", "label"),
                    new go.Binding("visible", "label", function (label) {
                      return (label != null);
                    })
                )
            ),
            new go.Binding("points", "points", jsonToLinkPoints).makeTwoWay(
                linkPointsToJson), // two way
            {
              selectionAdornmentTemplate: getLinkSelectionAdornmentTemplate()
            }
        );
  }

  /*
   *  Displays the BPMN diagram.
   */
  function display(containerDivId, accessMode, isFirstDisplay,
      getWorkflowModel) {

    DiagramBuilder.registerIcons();
    diagram = $(go.Diagram, containerDivId,
        {
          initialContentAlignment: go.Spot.Center, // center Diagram contents
          "undoManager.isEnabled": true,
          layout: isFirstDisplay ? DiagramBuilder.getDefaultLayout() : $(
              go.Layout),
          hoverDelay: 100,

          //animation on startup
          "animationManager.isEnabled": false
        }
    );

    diagramRegisterCommands(diagram);
    handleAccessMode(accessMode);

    if (myOverview) {
      myOverview.observed = diagram;
    } else {
      myOverview = setupOverview(diagram);
    }

    nodeHoverAdornment = nodeHoverButtonAdornmentConfig();

    diagram.autoScrollRegion = 128;
    diagram.moveParts(diagram.nodes, new go.Point(), false);
    diagram.allowCopy = false;
    diagram.allowDelete = false;
    diagram.mouseOver = function (event) {
      if (diagram.addNodeEBX) {
        var mousePos = event.documentPoint;
        var projectedPoint = getProjectedEventPointOnLink(
            mousePos, diagram.addNodeEBX.adornedObject);
        var distanceBetween = projectedPoint.distanceSquaredPoint(mousePos);
        if (distanceBetween > 24) {
          removeAddNodeEBXAdornment();
        }

      }
    }
    // Disable link creation
    diagram.allowLink = false;
    initialScale = diagram.scale;
    diagram.addDiagramListener('ViewportBoundsChanged',
        updateOnViewportBoundsChanged);

    setupNodesTemplating(diagram);
    setupLinkTemplate(diagram);

    // Model definition.
    var workflow = getWorkflowModel;

    diagram.model = new go.GraphLinksModel(workflow.nodes, workflow.links);
    diagram.model.nodeCategoryProperty = "type";
    diagram.model.linkFromPortIdProperty = "fromPortId";
    diagram.model.linkToPortIdProperty = "toPortId";
    diagram.model.modelName = workflow.modelName;

    setupDiagramTools(diagram);
  }

  function removeNodeEvent(e, obj) {
    ebx_confirm({
      question: lang.warn,
      //TODO MAA - to implement localized message
      message: 'Do you really want to remove this step ?',
      jsCommandYes: function () {
        requestRemoveREST(obj.part.data.key, refresh);
      }
    });
  }

  var DiagramBuilder = {};
  DiagramBuilder.registerIcons = function () {
    var setGeo = function (path, filled) {
      var geo = go.Geometry.parse(path, !!filled);
      geo.normalize();
      return geo;
    };
    // User Icon
    var gearGeo = setGeo(
        "F m 8,0.5 c -2.4,0 -2.5,2 -2.5,3 0,1 0.3,2.2 1,3.1 0,0.4 -0.3,0.8 -0.5,1.2 0,0 -2.5,0.5 -3.3,0.7 -0.8,0.3 -1.2,6 -1.2,6 2.5,1.3 10.5,1.3 13,0 C 14.3,12.5 13.8,8.8 13,8.5 12.1,8.2 10,7.8 10,7.8 v 0 L 9.5,6.7 c 0.8,-0.9 1,-2.2 1,-3.2 0,-1 -0.1,-3 -2.5,-3 z M 6,8 C 6,8 6.5,9.5 8,9.5 9.5,9.5 10,8 10,8");
    // Script icon
    var scriptGeo = setGeo(
        "F M 0.5,2 C 0.5,2.8 1.2,3.5 2,3.5 2.8,3.5 3.5,2.8 3.5,2 3.5,1.2 2.8,0.5 2,0.5 1.2,0.5 0.5,1.2 0.5,2 c 0,6 3,6 3,12 0,-0.8 -0.7,-1.5 -1.5,-1.5 -0.8,0 -1.5,0.7 -1.5,1.5 0,0.8 0.7,1.5 1.5,1.5 0.8,0 1.5,-0.7 1.5,-1.5 v 0 C 3.5,14.8 3,15.5 2,15.5 h 12 c 0.8,-4.35e-4 1.5,-0.7 1.5,-1.5 0,-5.5 -2.5,-6 -3,-10.5 H 2 14 C 14.8,3.5 15.5,2.8 15.5,2 15.5,1 14.8,0.5 14,0.5 H 2 m 1.5,6 h 7 M 5,9.5 h 7 m -6.5,3 h 7");
    var removeIconGeo = setGeo(
        "M10 2.35V3h2.5a.5.5 0 0 1 .5.41V5.5a.5.5 0 0 1-.41.5H12v7c0 1.22-.66 1.93-1.83 2H5c-1.22 0-1.93-.66-2-1.83V6h-.5a.5.5 0 0 1-.5-.41V3.5a.5.5 0 0 1 .41-.5H5v-.5C5 .38 9.77.33 10 2.35zM11 6H4v7c0 .68.24 .96.86 1H10c.68 0 .96-.24 1-.86V6zM5.5 7a.5.5 0 0 1 .5.41v5.09a.5.5 0 0 1-1 .09V7.5c0-.28.22-.5.5-.5zm4 0a.5.5 0 0 1 .5.41v5.09a.5.5 0 0 1-1 .09V7.5c0-.28.22-.5.5-.5zm-2 0c.28 0 .5.22 .5.5v5a.5.5 0 1 1-1 0v-5c0-.28.22-.5.5-.5zM12 4H3v1h9V4zM6.01 2.41 6 2.5V3h3v-.5c0-.8-2.78-.83-2.99-.09z",
        true);
    var editIconGeo = setGeo(
        "M2 12.04l1 1-1.5.5 .5-1.5zm8-9.5c1.28 0 2.5 1.23 2.5 2.5h-1c0-.18-.05-.37-.13-.55l-7.14 7.13a2.31 2.31 0 0 0-.3-.4l7.15-7.15A1.54 1.54 0 0 0 10 3.54zm3.48-.99c.76.76 .76 1.95-.12 2.83l-8.59 8.59-3.19 1.06H14v1H1v-.8l-.29.1 1.36-4.07 8.58-8.58c.88-.89 2.07-.89 2.83-.13zm-2.12.83L2.94 10.8l-.65 1.94 1.94-.65 8.42-8.41c.5-.5.5-1.05.13-1.42-.37-.37-.93-.37-1.42.12z",
        true);
    var duplicateIconGeo = setGeo(
        "M12.5 4c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-7C4 4.7 4.7 4 5.5 4h7zm0 1h-7c-.3 0-.5.2-.5.5v7c0 .3.2 .5.5 .5h7c.3 0 .5-.2.5-.5v-7c0-.3-.2-.5-.5-.5zm-3-4c.8 0 1.5.7 1.5 1.5V3h-1v-.5c0-.3-.2-.5-.5-.5h-7c-.3 0-.5.2-.5.5v7c0 .3.2 .5.5 .5H3v1h-.5C1.7 11 1 10.3 1 9.5v-7C1 1.7 1.7 1 2.5 1h7z",
        true);
    var plusIconGeo = setGeo("M9 4v3h3v2H9v3H7V9H4V7h3V4z", true);
    var hideIconGeo = setGeo(
        "M17.4,11c0.7-1,1.1-2.2,1.1-3.4c0-0.3,0-0.7-0.1-1.1l-3.7,6.7C15.8,12.8,16.7,12.1,17.4,11z M18,1.8c0,0,0-0.1,0-0.1c0-0.2-0.1-0.3-0.2-0.4c0,0-0.1-0.1-0.3-0.2c-0.1-0.1-0.3-0.2-0.4-0.2c-0.1-0.1-0.3-0.2-0.4-0.2 c-0.2-0.1-0.3-0.2-0.4-0.2C16.1,0.4,16,0.4,16,0.4c-0.2,0-0.3,0.1-0.4,0.2l-0.7,1.3c-0.8-0.2-1.6-0.2-2.4-0.2 c-2.4,0-4.6,0.6-6.6,1.8c-2,1.2-3.7,2.9-5.1,5C0.6,8.7,0.5,9,0.5,9.4c0,0.3,0.1,0.6,0.3,0.9c0.8,1.2,1.7,2.3,2.8,3.3 c1.1,1,2.3,1.7,3.5,2.3c-0.4,0.7-0.6,1.1-0.6,1.2c0,0.2,0.1,0.3,0.2,0.4c1.1,0.6,1.7,0.9,1.8,0.9c0.2,0,0.3-0.1,0.4-0.2l0.7-1.2 c0.9-1.7,2.4-4.2,4.2-7.6C15.6,6,17,3.4,18,1.8z M7.9,14.4c-2.3-1-4.2-2.7-5.7-5c1.4-2.1,3.1-3.7,5.1-4.7c-0.5,0.9-0.8,1.9-0.8,3 c0,1,0.2,1.9,0.7,2.7c0.4,0.9,1,1.6,1.8,2.1L7.9,14.4z M12.9,4.7c-0.1,0.1-0.3,0.2-0.5,0.2c-0.8,0-1.4,0.3-2,0.8 c-0.5,0.5-0.8,1.2-0.8,2c0,0.2-0.1,0.3-0.2,0.5C9.4,8.2,9.2,8.3,9,8.3c-0.2,0-0.3-0.1-0.5-0.2C8.5,8,8.4,7.8,8.4,7.6 c0-1.1,0.4-2.1,1.2-2.9c0.8-0.8,1.8-1.2,2.9-1.2c0.2,0,0.3,0.1,0.5,0.2C13,3.9,13.1,4,13.1,4.2C13.1,4.4,13,4.5,12.9,4.7z M24.2,8.4C23.7,7.6,23,6.8,22.3,6c-0.8-0.8-1.6-1.5-2.4-2L19,5.4c1.5,1,2.8,2.3,3.8,3.9c-1.1,1.7-2.4,3-4,4.1 c-1.6,1.1-3.4,1.7-5.3,1.8l-1,1.8c2,0,3.9-0.4,5.6-1.3c1.8-0.8,3.3-2,4.7-3.6c0.6-0.7,1.1-1.4,1.5-1.9c0.2-0.3,0.3-0.6,0.3-0.9 C24.5,9,24.4,8.7,24.2,8.4z",
        true);
    var showIconGeo = setGeo(
        "M12,5C7,5,2.6,8.1,0.9,12.6C2.6,17,7,20.1,12,20.1s9.4-3.1,11.1-7.6C21.4,8.1,17,5,12,5z M12,17.6c-2.8,0-5-2.2-5-5 s2.2-5,5-5s5,2.2,5,5S14.8,17.6,12,17.6z M12,9.5c-1.7,0-3,1.3-3,3s1.3,3,3,3s3-1.3,3-3S13.7,9.5,12,9.5z",
        true);
    var redirectIconGeo = setGeo(
        "M9.182 6.818c.248.248 .444.53 .587.83l-.123.12a.998.998 0 0 1-.792.289 2 2 0 0 0-3.208-.532l-2.12 2.121a2 2 0 1 0 2.828 2.829l1.555-1.554c.42.112 .854.155 1.284.129L7.06 13.182a3 3 0 1 1-4.243-4.243l2.121-2.121a3 3 0 0 1 4.243 0zm4-4a3 3 0 0 1 0 4.243L11.06 9.183a3 3 0 0 1-4.83-.83l.123-.12a.998.998 0 0 1 .792-.29 2 2 0 0 0 3.208.532l2.121-2.12a2 2 0 1 0-2.828-2.83L8.09 5.08a4.02 4.02 0 0 0-1.284-.13L8.938 2.82a3 3 0 0 1 4.243 0z",
        true);

    var addFigureGenerator = function (name, geometry) {
      go.Shape.defineFigureGenerator(name, function (shape, w, h) {
        var geo = geometry.copy();
        // calculate how much to scale the Geometry so that it fits in w x h
        var bounds = geo.bounds;
        var scale = Math.min(w / bounds.width, h / bounds.height);
        geo.scale(scale, scale);
        // text should go in the hand
        geo.spot1 = new go.Spot(0, 0.6, 10, 0);
        geo.spot2 = new go.Spot(1, 1);
        return geo;
      });
    };

    addFigureGenerator(ICON.USER, gearGeo);
    addFigureGenerator(ICON.SCRIPT, scriptGeo);
    addFigureGenerator(ICON.REMOVE, removeIconGeo);
    addFigureGenerator(ICON.EDIT, editIconGeo);
    addFigureGenerator(ICON.DUPLICATION, duplicateIconGeo);
    addFigureGenerator(ICON.PLUS, plusIconGeo);
    addFigureGenerator(ICON.SHOW, showIconGeo);
    addFigureGenerator(ICON.HIDE, hideIconGeo);
    addFigureGenerator(ICON.REDIRECT, redirectIconGeo);
  };
  DiagramBuilder.createButtonTemplate = function () {
    return $(go.Panel, "Horizontal",
        {alignment: go.Spot.Top, alignmentFocus: go.Spot.Bottom},
        this.createEbxButton(ICON.EDIT, 13, 0, false, function (e, obj) {
          editNode(obj.part.data.key, true);
        }),
        this.createEbxButton(ICON.REMOVE, 13, 0, false, removeNodeEvent),
        this.createEbxButton(ICON.DUPLICATION, 13, 0, false, function (e, obj) {
          requestDuplicateREST(obj.part.data.key,
              obj.part.location.x + '_' + obj.part.location.y, refresh);
        }),
        this.createEbxButton(ICON.REDIRECT, 13, 0, false, relink),
        this.createEbxButton(ICON.HIDE, 13, 0, false, function (e, obj) {
          requestShowHideREST(obj.part.data.key, refresh);
        }),
        this.createEbxButton(ICON.SHOW, 13, 0, false, function (e, obj) {
          requestShowHideREST(obj.part.data.key, refresh);
        })
    );
  };
  DiagramBuilder.createEbxButton = function (iconStyle, size, strokeWidth,
      paneBorderEnabled, clickCallback, hoverCallback) {
    return $("Button",
        {
          visible: addStepEnabled,
          "ButtonBorder.fill": STYLE.BUTTONS_FILL,
          "ButtonBorder.figure": "RoundedRectangle",
          "ButtonBorder.stroke": paneBorderEnabled ? STYLE.EBX_OUTLINE_COLOR
              : null,
          "_buttonFillOver": !paneBorderEnabled ? STYLE.BUTTONS_FILLOVER
              : STYLE.STEPS_FILL,
          //"_buttonFillNormal": "#E0E0E0",
          "_buttonStrokeOver": paneBorderEnabled ? STYLE.EBX_OUTLINE_COLOR
              : null,
          "_buttonStrokeNormal": "#808080",
          cursor: "pointer",
          mouseHover: hoverCallback ? hoverCallback : function () {
          }
        },
        {click: clickCallback},
        $(go.Shape, iconStyle,
            {
              margin: 3,
              fill: STYLE.EBX_OUTLINE_COLOR,
              stroke: STYLE.EBX_OUTLINE_COLOR,
              strokeWidth: strokeWidth,
              width: size,
              height: size
            }
        ),
        new go.Binding("visible", "hidden", function (isHidden) {

          var isButtonHidden = iconStyle === ICON.HIDE
              ? !isHidden
              : iconStyle === ICON.SHOW
                  ? isHidden
                  : true;

          if (diagram.isReadOnly) {
            return false;
          }

          return isButtonHidden;
        })
    )
  };
  DiagramBuilder.getDefaultLayout = function () {
    return $(go.LayeredDigraphLayout, {
      aggressiveOption: go.LayeredDigraphLayout.AggressiveNone,
      setsPortSpots: false,
      isRouting: false,
      packOption: go.LayeredDigraphLayout.PackAll,
      layeringOption: go.LayeredDigraphLayout.LayerOptimalLinkLength,
      initializeOption: go.LayeredDigraphLayout.InitDepthFirstIn,
      cycleRemoveOption: go.LayeredDigraphLayout.CycleDepthFirst,
      iterations: 10,
      columnSpacing: 25,
      layerSpacing: 40
    });
  };
  DiagramBuilder.createBoundaryNodeTemplate = function (type) {
    return $(go.Node, "Vertical",
        {
          doubleClick: type !== 'end' ? nodeDoubleClick : function (s) {
          }
        },
        {
          locationObjectName: "SHAPE",
          locationSpot: go.Spot.Center
        },
        $(go.Shape, "Circle",
            {
              portId: type === "start" ? "" : "other", // Links are set relatively to this shape.
              name: "SHAPE",
              desiredSize: new go.Size(40, 40),
              cursor: "pointer",
              strokeWidth: type === "start" ? STYLE.STEPS_STROKE_WIDTH
                  : STYLE.STEPS_STROKE_WIDTH
                  + 2,
              stroke: STYLE.STEPS_STROKE,
              fill: type === "start" ? STYLE.START_FILL : STYLE.END_FILL,
              toSpot: go.Spot.Left,
              fromSpot: go.Spot.Right,
              fromLinkable: type === "start",
              toLinkable: type === "end"
            }
        ),
        $(go.TextBlock, textStyle(),
            {
              alignment: go.Spot.Center,
              textAlign: "center",
              margin: 5,
              width: labelWidth
            },
            titleNodeBinding()
        ),
        new go.Binding("location", "location", jsonToPoint).makeTwoWay(
            pointToJson), // make it two way to save position back to the model
        {
          selectionAdornmentTemplate:
              $(go.Adornment, "Spot",
                  $(go.Panel, "Position",
                      $(go.Shape, "Circle",
                          {
                            fill: null,
                            stroke: EBX_STYLE.COLOR_FOCUS,
                            strokeWidth: type === "start"
                                ? STYLE.STEPS_STROKE_WIDTH + 1
                                : STYLE.STEPS_STROKE_WIDTH + 4,
                            desiredSize: new go.Size(40 + 1, 40 + 1),
                            position: type === "start" ? new go.Point(
                                (labelWidth
                                    / 2) - (40 / 2) + 3.5, -1)
                                : new go.Point((labelWidth / 2) - (40 / 2) + 2,
                                    -1.5)
                          }),
                      $(go.Placeholder)
                  )
              ),
          toolTip: this.createTooltip()
        }
    );
  };
  DiagramBuilder.createActivityTemplate = function (iconName) {
    var iconIsPlusLine = "PlusLine" === iconName;
    return $(go.Node, "Spot",
        {doubleClick: nodeDoubleClick},
        {
          locationObjectName: "SHAPE",
          locationSpot: go.Spot.Center
        },
        $(go.Panel, "Auto",
            {
              name: "PANEL",
              desiredSize: new go.Size(120, 80 + 1) // +1 to have an odd value, which will center horizontal arrow lines on a whole pixel
            },
            $(go.Shape, "RoundedRectangle",
                {
                  portId: "other",
                  toSpot: go.Spot.NotRightSide,
                  fromSpot: go.Spot.NotLeftSide,
                  name: "SHAPE",
                  strokeWidth: STYLE.STEPS_STROKE_WIDTH,
                  stroke: STYLE.STEPS_STROKE,
                  fill: STYLE.STEPS_FILL,
                  parameter1: 5, // corner size
                  cursor: "pointer",
                  fromLinkable: true,
                  toLinkable: true
                },
                new go.Binding("strokeDashArray", "hidden",
                    function (isHidden) {
                      return isHidden ? [4, 4] : null;
                    })
            ),
            $(go.Shape, "RoundedRectangle",
                {
                  alignment: !iconIsPlusLine ? new go.Spot(0, 0, 2, 2)
                      : new go.Spot(0.5, 1, 0, 0.1),
                  alignmentFocus: !iconIsPlusLine ? go.Spot.TopLeft
                      : go.Spot.Top,
                  fill: "rgba(255,255,255,0.8)",
                  stroke: STYLE.STEPS_STROKE,
                  width: 15,
                  height: 15,
                  parameter1: 2, // corner size
                  visible: iconIsPlusLine
                }
            ),
            $(go.Shape, iconName,
                {
                  alignment: !iconIsPlusLine ? new go.Spot(0, 0, 2, 2)
                      : new go.Spot(0.5, 1, 0, -2),
                  alignmentFocus: !iconIsPlusLine ? go.Spot.TopLeft
                      : go.Spot.Top,
                  fill: "white",
                  stroke: STYLE.EBX_OUTLINE_COLOR,
                  strokeWidth: !iconIsPlusLine ? 1 : 2,
                  width: !iconIsPlusLine ? 22 : 10,
                  height: !iconIsPlusLine ? 22 : 10
                }
            ),
            $(go.TextBlock, textStyle(),
                {
                  alignment: !iconIsPlusLine ? new go.Spot(0.5, 0.5, 0, 5) :
                      new go.Spot(0.5, 0.1, 0, 5),
                  textAlign: "center",
                  margin: 12
                },
                titleNodeBinding()
            )
        ),
        new go.Binding("location", "location", jsonToPoint).makeTwoWay(
            pointToJson), // make it two way to save position back to the model
        {
          selectionAdornmentTemplate:
              $(go.Adornment, "Spot",
                  $(go.Panel, "Position",
                      $(go.Shape, "RoundedRectangle",
                          {
                            fill: null,
                            stroke: EBX_STYLE.COLOR_FOCUS,
                            strokeWidth: 2,
                            desiredSize: new go.Size(120, 80 + 1) // +1 to have an odd value, which will center horizontal arrow lines on a whole pixel */
                          }),
                      $(go.Placeholder)
                  ),
                  DiagramBuilder.createButtonTemplate()
              ),
          toolTip: this.createTooltip()
          ,// show the Adornment when a mouseHover event occurs
          mouseHover: buttonsOnMouseHover,
          click: function (e, obj) {
            var node = obj.part;
            node.removeAdornment("mouseHover");
          }
        }
    );
  };
  DiagramBuilder.createLogicalGateTemplate = function () {
    return $(go.Node, "Vertical",
        {doubleClick: nodeDoubleClick},
        {
          locationObjectName: "SHAPE",
          locationSpot: go.Spot.Center
        },
        new go.Binding("location", "location", jsonToPoint).makeTwoWay(
            pointToJson), // make it two way to save position back to the model
        $(go.Panel, "Spot",
            $(go.Shape, "Diamond",
                {
                  portId: "other",
                  toSpot: go.Spot.Left,
                  fromSpot: go.Spot.Right,
                  name: "SHAPE",
                  strokeWidth: STYLE.STEPS_STROKE_WIDTH,
                  stroke: STYLE.TRANSPARENT_BLACK_BORDER,
                  fill: STYLE.GATEWAY_FILL,
                  desiredSize: new go.Size(GatewayDiamondSize,
                      GatewayDiamondSize),
                  cursor: "pointer",
                  fromLinkable: true,
                  toLinkable: true
                },
                new go.Binding("strokeDashArray", "hidden",
                    function (isHidden) {
                      return isHidden ? [4, 4] : null;
                    })
            ),
            $(go.Shape, "xline",
                {
                  alignment: go.Spot.Center,
                  strokeWidth: 4,
                  stroke: STYLE.TRANSPARENT_BLACK_BORDER,
                  fill: STYLE.TRANSPARENT_BLACK_BORDER,
                  desiredSize: new go.Size(GatewayCrossSize, GatewayCrossSize)
                }
            ),
            // Manual Port defined
            $(go.Shape, "None",
                {
                  portId: "ifFalse",
                  fromSpot: go.Spot.TopBottomSides,
                  desiredSize: new go.Size(GatewayDiamondSize,
                      GatewayDiamondSize),
                  strokeWidth: 0,
                  fill: "transparent",
                  fromLinkable: true,
                  toLinkable: false
                }
            ),
            $(go.Shape, "None",
                {
                  portId: "ifTrue",
                  toSpot: go.Spot.Left,
                  fromSpot: go.Spot.Right,
                  desiredSize: new go.Size(GatewayDiamondSize,
                      GatewayDiamondSize),
                  strokeWidth: 0,
                  fill: "transparent",
                  fromLinkable: true,
                  toLinkable: false
                }
            )
        ),
        $(go.TextBlock, textStyle(),
            {
              alignment: go.Spot.Center,
              textAlign: "center",
              margin: 5,
              width: labelWidth,
              height: labelHeight
            },
            titleNodeBinding()
        ),
        {
          selectionAdornmentTemplate: $(go.Adornment, "Spot",
              $(go.Panel, "Position",
                  $(go.Shape, "Diamond",
                      {
                        fill: null,
                        stroke: EBX_STYLE.COLOR_FOCUS,
                        strokeWidth: 2,
                        desiredSize: new go.Size(objectsSize + 1,
                            objectsSize + 1),
                        position: new go.Point(
                            (labelWidth / 2) - (objectsSize / 2) + 3.5,
                            -1)
                      }),
                  $(go.Placeholder)
              ),
              DiagramBuilder.createButtonTemplate()
          ),
          toolTip: this.createTooltip()
          ,// show the Adornment when a mouseHover event occurs
          mouseHover: buttonsOnMouseHover,
          click: function (e, obj) {
            var ad = obj.part;
            ad.removeAdornment("mouseHover");
          }
        }
    );
  };
  DiagramBuilder.createWaitMessageTemplate = function () {
    return $(go.Node, "Vertical",
        {doubleClick: nodeDoubleClick},
        {
          locationObjectName: "SHAPE",
          locationSpot: go.Spot.Center
        },
        new go.Binding("location", "location", jsonToPoint).makeTwoWay(
            pointToJson), // make it two way to save position back to the model
        // move a selected part into the Foreground layer, so it isn't obscured by any non-selected parts
        new go.Binding("layerName", "isSelected", function (s) {
          return s ? "Foreground" : "";
        }).ofObject(),
        // can be resided according to the user's desires
        {resizable: false, resizeObjectName: "SHAPE"},
        $(go.Panel, "Spot",
            $(go.Shape, "Circle",  // Outer circle
                {
                  name: "SHAPE",
                  desiredSize: new go.Size(EventNodeSize, EventNodeSize),
                  portId: "other",
                  cursor: "pointer",
                  fromSpot: go.Spot.Right,
                  toSpot: go.Spot.Left,
                  strokeWidth: STYLE.STEPS_STROKE_WIDTH,
                  stroke: STYLE.STEPS_STROKE,
                  fill: STYLE.STEPS_FILL,
                  fromLinkable: true,
                  toLinkable: true
                },
                new go.Binding("strokeDashArray", "hidden",
                    function (isHidden) {
                      return isHidden ? [4, 4] : null;
                    })
            ),  // end main shape
            $(go.Shape, "Circle",  // Inner circle
                {
                  alignment: go.Spot.Center,
                  desiredSize: new go.Size(EventNodeInnerSize,
                      EventNodeInnerSize),
                  fill: null,
                  stroke: STYLE.STEPS_STROKE,
                  visible: true
                },
                new go.Binding("strokeDashArray", "hidden",
                    function (isHidden) {
                      return isHidden ? [4, 4] : null;
                    })
            ),
            $(go.Shape, "Triangle",
                {
                  alignment: new go.Spot(.5, .5, 0, -4.5),
                  desiredSize: new go.Size(EventNodeSymbolSize,
                      EventNodeSymbolSize),
                  // figure: "Triangle",
                  stroke: STYLE.CROSS_FILL,
                  fill: STYLE.WAIT_TASK_FILL
                }
            )
        ),  // end Auto Panel
        $(go.TextBlock, textStyle(),
            {
              alignment: go.Spot.Center,
              textAlign: "center",
              margin: 5,
              width: labelWidth,
              height: labelHeight
            },
            titleNodeBinding()
        ),
        {
          selectionAdornmentTemplate:
              $(go.Adornment, "Spot",
                  $(go.Panel, "Position",
                      $(go.Shape, "Circle",
                          {
                            fill: null,
                            stroke: EBX_STYLE.COLOR_FOCUS,
                            strokeWidth: 2,
                            desiredSize: new go.Size(EventNodeSize
                                + 1, EventNodeSize + 1),
                            position: new go.Point(
                                (labelWidth / 2) - (EventNodeSize
                                / 2) + 3.5, -1)

                          }),
                      $(go.Placeholder)
                  ),
                  DiagramBuilder.createButtonTemplate()
              ),
          toolTip: this.createTooltip()
          ,// show the Adornment when a mouseHover event occurs
          mouseHover: buttonsOnMouseHover,
          click: function (e, obj) {
            var ad = obj.part;
            ad.removeAdornment("mouseHover");
          }
        }
    );
  };
  DiagramBuilder.createTooltip = function () {
    return $(go.Adornment, "Auto",
        $(go.Shape, {fill: STYLE.TOOLTIP_FILL}),
        $(go.TextBlock, {margin: 4},
            new go.Binding("text", "", diagramInfo))
    )  // end of Adornment
  };

  //
  // var SelectionAdornmentBuilder = function (shapeType, nodeSize,
  //     addButtonTemplate) {
  //   this.shape = shapeType;
  //   this.addButtonTemplate = addButtonTemplate;
  //   this.nodeSize = nodeSize;
  //   this.labelWidth = labelWidth;
  //   this.baseStrokeWidth = STYLE.STEPS_STROKE_WIDTH;
  //   this.addPosition = true;
  // };
  // SelectionAdornmentBuilder.prototype.getStrokeWidth = function () {
  //   return 2;
  // };
  // SelectionAdornmentBuilder.prototype.getDesiredSize = function () {
  //   return new go.Size(this.nodeSize + 1, this.nodeSize + 1);
  // };
  // SelectionAdornmentBuilder.prototype.getPosition = function () {
  //   return new go.Point((this.labelWidth / 2) - (this.nodeSize / 2) + 3.5,
  //       -1);
  // };
  // SelectionAdornmentBuilder.prototype.getShapeConfig = function () {
  //   var config = {
  //     fill: null,
  //     stroke: EBX_STYLE.COLOR_FOCUS,
  //     strokeWidth: this.getStrokeWidth(),
  //     desiredSize: this.getDesiredSize(),
  //   };
  //   if (this.addPosition) {
  //     config.position = this.getPosition();
  //   }
  //   return config;
  // };
  // SelectionAdornmentBuilder.prototype.build = function () {
  //   return $(go.Adornment, "Spot",
  //       $(go.Panel, "Position",
  //           $(go.Shape, this.shape,
  //               this.getShapeConfig()
  //           ),
  //           $(go.Placeholder)
  //       ),
  //       this.addButtonTemplate ? DiagramBuilder.createButtonTemplate() : {}
  //   )
  // };
  //
  // var ActivityAdornmentBuilder = new SelectionAdornmentBuilder(
  //     "RoundedRectangle", null, true);
  // ActivityAdornmentBuilder.addPosition = false;
  // ActivityAdornmentBuilder.getDesiredSize = function () {
  //   return new go.Size(120, 80 + 1);
  // };
  // var BoundaryAdornmentBuilder = new SelectionAdornmentBuilder("Circle", 40,
  //     false);
  // BoundaryAdornmentBuilder.getStrokeWidth = function () {
  //   return this.type === "start" ? this.baseStrokeWidth + 1
  //       : this.baseStrokeWidth + 4;
  // };
  // BoundaryAdornmentBuilder.getPosition = function () {
  //   return this.type === "start" ? new go.Point((labelWidth
  //       / 2) - (40 / 2) + 3.5, -1)
  //       : new go.Point((this.labelWidth / 2) - (40 / 2) + 2,
  //           -1.5)
  // };
  // var LogicalGateAdornmentBuilder = new SelectionAdornmentBuilder("Diamond",
  //     objectsSize, true);
  // var EventMessageAdornmentBuilder = new SelectionAdornmentBuilder("Circle",
  //     EventNodeSize, true);
  //

  // function LandscapeDocument(width, height) {
  //   DocumentDimension.call(this, width, height);
  // }
  //
  // LandscapeDocument.prototype = Object.create(DocumentDimension.prototype);

})(go); // //Must be last line.