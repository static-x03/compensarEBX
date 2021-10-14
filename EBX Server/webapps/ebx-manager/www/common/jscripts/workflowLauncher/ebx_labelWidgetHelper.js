var ebx_labelWidgetHelper = {
  buildSwitchCommand: function (itemsToHide, nextState, informationId) {
     if(!itemsToHide)
        return;

      itemsToHide.forEach(function (item) {
        var element = document.getElementById(item.id);
        if(item.hide){
          EBX_Utils.addCSSClass(element,"ebx_DisplayNone" );
          EBX_Utils.removeCSSClass(element,"ebx_DisplayInline" );
        }else{
          EBX_Utils.removeCSSClass(element,"ebx_DisplayNone" );
          EBX_Utils.addCSSClass(element,"ebx_DisplayInline" );
        }});

      var informationElement = document.getElementById(informationId);
      if(!informationElement)
        return;

    informationElement.innerText = nextState ? EBX_WorkflowLauncherLabelWidget.information.overwrittenValue
        : EBX_WorkflowLauncherLabelWidget.information.inheritedValue;
  }
};