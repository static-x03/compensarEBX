/**
 * This script is used by both legacy and New UI.
 */

//[EBX_PUBLIC_API]
ebx_getContainerWindow = function(win) {
  if(!win) {
    win = window;
  }

  while(true) {
    var winParent = win.parent;

    if(winParent == win) {
      return win;
    }

    try {
      var docParent = winParent.document; // throws a security error is on a different domain.
      if(!docParent)  {
        return win;
      }
    } catch(e) {
      return win;
    }


    var frame = docParent.getElementById("ebx-legacy-component");
    if(frame && (frame.contentWindow == win)) {
      win = winParent;
      continue;
    }

    frame = docParent.getElementById("ebx_SubSessioniFrame");
    if(frame && (frame.contentWindow == win)) {
      win = winParent;
      continue;
    }

    return win;
  }
};

//[EBX_PUBLIC_API]
ebx_getContentWindow = function(win) {
  if(!win) {
    win = window;
  }

  while(true) {
    if(win.EBX_LayoutManager) {
      // Window content is "legacy".

      var subSesssionFrame = win.document.getElementById("ebx_SubSessioniFrame");
      if (!subSesssionFrame) {
        return win;
      }

      win = subSesssionFrame.contentWindow;
      if (!win) {
        return null;
      }
    }
    else {
      // Window content is not "legacy".
      if (!win.document) {
        return null;
      }

      var legacyComponentFrame = win.document.getElementById("ebx-legacy-component");
      if (!legacyComponentFrame) {
        return null;
      }

      win = legacyComponentFrame.contentWindow;
      if (!win) {
        return null;
      }
    }
  }
}
