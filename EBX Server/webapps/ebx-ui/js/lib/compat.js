var EBX_Utils={EBX_LEGACY_COMPONENT_ID:"ebx-legacy-component"};function EBX_Utils_callParentMethod(e,r,n){var o=window.parent;if(o!==window){var t=o[e];if(t){t=t[r];if(t)return t.apply(o,n);console.error("EBX® error: Parent window has no method '"+r+"()'.")}else console.error("EBX® error: Parent window has no object '"+e+"()'.")}else console.error("EBX® error: Window has no parent.")}EBX_Utils.closeInternalPopup=function(){if(!EBX_Utils.isInternalPopup_CloseCallIsMadeByParent)return EBX_Utils_callParentMethod("EBX_Utils","closeInternalPopup",arguments);console.error("EBX® error: This method should not be called by parent.")},window.parent===window||null==window.parent.EBX_Utils?EBX_Utils.internalPopupReferrer=window:EBX_Utils.internalPopupReferrer=window.parent.EBX_Utils.internalPopupReferrer;