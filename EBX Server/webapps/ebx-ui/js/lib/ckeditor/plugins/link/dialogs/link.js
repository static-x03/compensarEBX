/*
 Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
*/
!function(){function d(){var e=this.getDialog(),t=(l=e._.editor).config.linkPhoneRegExp,i=l.config.linkPhoneMsg,l=CKEDITOR.dialog.validate.notEmpty(l.lang.link.noTel).apply(this);return!e.getContentElement("info","linkType")||"tel"!=e.getValueOf("info","linkType")||(!0!==l?l:t?CKEDITOR.dialog.validate.regex(t,i).call(this):void 0)}CKEDITOR.dialog.add("link",function(u){function t(){var e=(t=this.getDialog()).getContentElement("target","popupFeatures"),t=t.getContentElement("target","linkTargetName"),i=this.getValue();if(e&&t)switch(e=e.getElement(),e.hide(),t.setValue(""),i){case"frame":t.setLabel(u.lang.link.targetFrameName),t.getElement().show();break;case"popup":e.show(),t.setLabel(u.lang.link.targetPopupName),t.getElement().show();break;default:t.setValue(i),t.getElement().hide()}}function e(e){e.target&&this.setValue(e.target[this.id]||"")}function i(e){e.advanced&&this.setValue(e.advanced[this.id]||"")}function l(e){e.target||(e.target={}),e.target[this.id]=this.getValue()||""}function n(e){e.advanced||(e.advanced={}),e.advanced[this.id]=this.getValue()||""}var p,a,c=CKEDITOR.plugins.link,o=u.lang.common,s=u.lang.link;return{title:s.title,minWidth:"moono-lisa"==(CKEDITOR.skinName||u.config.skin)?450:350,minHeight:240,getModel:function(e){return c.getSelectedLink(e,!0)[0]||null},contents:[{id:"info",label:s.info,title:s.info,elements:[{type:"text",id:"linkDisplayText",label:s.displayText,setup:function(){this.enable(),this.setValue(u.getSelection().getSelectedText()),p=this.getValue()},commit:function(e){e.linkText=this.isEnabled()?this.getValue():""}},{id:"linkType",type:"select",label:s.type,default:"url",items:[[s.toUrl,"url"],[s.toAnchor,"anchor"],[s.toEmail,"email"],[s.toPhone,"tel"]],onChange:function(){var e=this.getDialog(),t=["urlOptions","anchorOptions","emailOptions","telOptions"],i=this.getValue(),l=(l=e.definition.getContents("upload"))&&l.hidden;for("url"==i?(u.config.linkShowTargetTab&&e.showPage("target"),l||e.showPage("upload")):(e.hidePage("target"),l||e.hidePage("upload")),l=0;l<t.length;l++){var n=e.getContentElement("info",t[l]);n&&(n=n.getElement().getParent().getParent(),t[l]==i+"Options"?n.show():n.hide())}e.layout()},setup:function(e){this.setValue(e.type||"url")},commit:function(e){e.type=this.getValue()}},{type:"vbox",id:"urlOptions",children:[{type:"hbox",widths:["25%","75%"],children:[{id:"protocol",type:"select",label:o.protocol,items:[["http://‎","http://"],["https://‎","https://"],["ftp://‎","ftp://"],["news://‎","news://"],[s.other,""]],default:u.config.linkDefaultProtocol,setup:function(e){e.url&&this.setValue(e.url.protocol||"")},commit:function(e){e.url||(e.url={}),e.url.protocol=this.getValue()}},{type:"text",id:"url",label:o.url,required:!0,onLoad:function(){this.allowOnChange=!0},onKeyUp:function(){this.allowOnChange=!1;var e=this.getDialog().getContentElement("info","protocol"),t=this.getValue(),i=/^(http|https|ftp|news):\/\/(?=.)/i.exec(t);i?(this.setValue(t.substr(i[0].length)),e.setValue(i[0].toLowerCase())):/^((javascript:)|[#\/\.\?])/i.test(t)&&e.setValue(""),this.allowOnChange=!0},onChange:function(){this.allowOnChange&&this.onKeyUp()},validate:function(){var e=this.getDialog();return!(!e.getContentElement("info","linkType")||"url"==e.getValueOf("info","linkType"))||(!u.config.linkJavaScriptLinksAllowed&&/javascript\:/.test(this.getValue())?(alert(o.invalidValue),!1):!!this.getDialog().fakeObj||CKEDITOR.dialog.validate.notEmpty(s.noUrl).apply(this))},setup:function(e){this.allowOnChange=!1,e.url&&this.setValue(e.url.url),this.allowOnChange=!0},commit:function(e){this.onChange(),e.url||(e.url={}),e.url.url=this.getValue(),this.allowOnChange=!1}}],setup:function(){this.getDialog().getContentElement("info","linkType")||this.getElement().show()}},{type:"button",id:"browse",hidden:"true",filebrowser:"info:url",label:o.browseServer}]},{type:"vbox",id:"anchorOptions",width:260,align:"center",padding:0,children:[{type:"fieldset",id:"selectAnchorText",label:s.selectAnchor,setup:function(){a=c.getEditorAnchors(u),this.getElement()[a&&a.length?"show":"hide"]()},children:[{type:"hbox",id:"selectAnchor",children:[{type:"select",id:"anchorName",default:"",label:s.anchorName,style:"width: 100%;",items:[[""]],setup:function(e){if(this.clear(),this.add(""),a)for(var t=0;t<a.length;t++)a[t].name&&this.add(a[t].name);e.anchor&&this.setValue(e.anchor.name),(e=this.getDialog().getContentElement("info","linkType"))&&"email"==e.getValue()&&this.focus()},commit:function(e){e.anchor||(e.anchor={}),e.anchor.name=this.getValue()}},{type:"select",id:"anchorId",default:"",label:s.anchorId,style:"width: 100%;",items:[[""]],setup:function(e){if(this.clear(),this.add(""),a)for(var t=0;t<a.length;t++)a[t].id&&this.add(a[t].id);e.anchor&&this.setValue(e.anchor.id)},commit:function(e){e.anchor||(e.anchor={}),e.anchor.id=this.getValue()}}],setup:function(){this.getElement()[a&&a.length?"show":"hide"]()}}]},{type:"html",id:"noAnchors",style:"text-align: center;",html:'<div role="note" tabIndex="-1">'+CKEDITOR.tools.htmlEncode(s.noAnchors)+"</div>",focus:!0,setup:function(){this.getElement()[a&&a.length?"hide":"show"]()}}],setup:function(){this.getDialog().getContentElement("info","linkType")||this.getElement().hide()}},{type:"vbox",id:"emailOptions",padding:1,children:[{type:"text",id:"emailAddress",label:s.emailAddress,required:!0,validate:function(){var e=this.getDialog();return!e.getContentElement("info","linkType")||"email"!=e.getValueOf("info","linkType")||CKEDITOR.dialog.validate.notEmpty(s.noEmail).apply(this)},setup:function(e){e.email&&this.setValue(e.email.address),(e=this.getDialog().getContentElement("info","linkType"))&&"email"==e.getValue()&&this.select()},commit:function(e){e.email||(e.email={}),e.email.address=this.getValue()}},{type:"text",id:"emailSubject",label:s.emailSubject,setup:function(e){e.email&&this.setValue(e.email.subject)},commit:function(e){e.email||(e.email={}),e.email.subject=this.getValue()}},{type:"textarea",id:"emailBody",label:s.emailBody,rows:3,default:"",setup:function(e){e.email&&this.setValue(e.email.body)},commit:function(e){e.email||(e.email={}),e.email.body=this.getValue()}}],setup:function(){this.getDialog().getContentElement("info","linkType")||this.getElement().hide()}},{type:"vbox",id:"telOptions",padding:1,children:[{type:"tel",id:"telNumber",label:s.phoneNumber,required:!0,validate:d,setup:function(e){e.tel&&this.setValue(e.tel),(e=this.getDialog().getContentElement("info","linkType"))&&"tel"==e.getValue()&&this.select()},commit:function(e){e.tel=this.getValue()}}],setup:function(){this.getDialog().getContentElement("info","linkType")||this.getElement().hide()}}]},{id:"target",requiredContent:"a[target]",label:s.target,title:s.target,elements:[{type:"hbox",widths:["50%","50%"],children:[{type:"select",id:"linkTargetType",label:o.target,default:"notSet",style:"width : 100%;",items:[[o.notSet,"notSet"],[s.targetFrame,"frame"],[s.targetPopup,"popup"],[o.targetNew,"_blank"],[o.targetTop,"_top"],[o.targetSelf,"_self"],[o.targetParent,"_parent"]],onChange:t,setup:function(e){e.target&&this.setValue(e.target.type||"notSet"),t.call(this)},commit:function(e){e.target||(e.target={}),e.target.type=this.getValue()}},{type:"text",id:"linkTargetName",label:s.targetFrameName,default:"",setup:function(e){e.target&&this.setValue(e.target.name)},commit:function(e){e.target||(e.target={}),e.target.name=this.getValue().replace(/([^\x00-\x7F]|\s)/gi,"")}}]},{type:"vbox",width:"100%",align:"center",padding:2,id:"popupFeatures",children:[{type:"fieldset",label:s.popupFeatures,children:[{type:"hbox",children:[{type:"checkbox",id:"resizable",label:s.popupResizable,setup:e,commit:l},{type:"checkbox",id:"status",label:s.popupStatusBar,setup:e,commit:l}]},{type:"hbox",children:[{type:"checkbox",id:"location",label:s.popupLocationBar,setup:e,commit:l},{type:"checkbox",id:"toolbar",label:s.popupToolbar,setup:e,commit:l}]},{type:"hbox",children:[{type:"checkbox",id:"menubar",label:s.popupMenuBar,setup:e,commit:l},{type:"checkbox",id:"fullscreen",label:s.popupFullScreen,setup:e,commit:l}]},{type:"hbox",children:[{type:"checkbox",id:"scrollbars",label:s.popupScrollBars,setup:e,commit:l},{type:"checkbox",id:"dependent",label:s.popupDependent,setup:e,commit:l}]},{type:"hbox",children:[{type:"text",widths:["50%","50%"],labelLayout:"horizontal",label:o.width,id:"width",setup:e,commit:l},{type:"text",labelLayout:"horizontal",widths:["50%","50%"],label:s.popupLeft,id:"left",setup:e,commit:l}]},{type:"hbox",children:[{type:"text",labelLayout:"horizontal",widths:["50%","50%"],label:o.height,id:"height",setup:e,commit:l},{type:"text",labelLayout:"horizontal",label:s.popupTop,widths:["50%","50%"],id:"top",setup:e,commit:l}]}]}]}]},{id:"upload",label:s.upload,title:s.upload,hidden:!0,filebrowser:"uploadButton",elements:[{type:"file",id:"upload",label:o.upload,style:"height:40px",size:29},{type:"fileButton",id:"uploadButton",label:o.uploadSubmit,filebrowser:"info:url",for:["upload","upload"]}]},{id:"advanced",label:s.advanced,title:s.advanced,elements:[{type:"vbox",padding:1,children:[{type:"hbox",widths:["45%","35%","20%"],children:[{type:"text",id:"advId",requiredContent:"a[id]",label:s.id,setup:i,commit:n},{type:"select",id:"advLangDir",requiredContent:"a[dir]",label:s.langDir,default:"",style:"width:110px",items:[[o.notSet,""],[s.langDirLTR,"ltr"],[s.langDirRTL,"rtl"]],setup:i,commit:n},{type:"text",id:"advAccessKey",requiredContent:"a[accesskey]",width:"80px",label:s.acccessKey,maxLength:1,setup:i,commit:n}]},{type:"hbox",widths:["45%","35%","20%"],children:[{type:"text",label:s.name,id:"advName",requiredContent:"a[name]",setup:i,commit:n},{type:"text",label:s.langCode,id:"advLangCode",requiredContent:"a[lang]",width:"110px",default:"",setup:i,commit:n},{type:"text",label:s.tabIndex,id:"advTabIndex",requiredContent:"a[tabindex]",width:"80px",maxLength:5,setup:i,commit:n}]}]},{type:"vbox",padding:1,children:[{type:"hbox",widths:["45%","55%"],children:[{type:"text",label:s.advisoryTitle,requiredContent:"a[title]",default:"",id:"advTitle",setup:i,commit:n},{type:"text",label:s.advisoryContentType,requiredContent:"a[type]",default:"",id:"advContentType",setup:i,commit:n}]},{type:"hbox",widths:["45%","55%"],children:[{type:"text",label:s.cssClasses,requiredContent:"a(cke-xyz)",default:"",id:"advCSSClasses",setup:i,commit:n},{type:"text",label:s.charset,requiredContent:"a[charset]",default:"",id:"advCharset",setup:i,commit:n}]},{type:"hbox",widths:["45%","55%"],children:[{type:"text",label:s.rel,requiredContent:"a[rel]",default:"",id:"advRel",setup:i,commit:n},{type:"text",label:s.styles,requiredContent:"a{cke-xyz}",default:"",id:"advStyles",validate:CKEDITOR.dialog.validate.inlineStyle(u.lang.common.invalidInlineStyle),setup:i,commit:n}]},{type:"hbox",widths:["45%","55%"],children:[{type:"checkbox",id:"download",requiredContent:"a[download]",label:s.download,setup:function(e){void 0!==e.download&&this.setValue("checked","checked")},commit:function(e){this.getValue()&&(e.download=this.getValue())}}]}]}]}],onShow:function(){var e=this.getParentEditor(),t=e.getSelection(),i=this.getContentElement("info","linkDisplayText").getElement().getParent().getParent(),l=c.getSelectedLink(e,!0),n=l[0]||null;n&&n.hasAttribute("href")&&(t.getSelectedElement()||t.isInTable()||t.selectElement(n)),t=c.parseLinkAttributes(e,n),l.length<=1&&c.showDisplayTextForElement(n,e)?i.show():i.hide(),this._.selectedElements=l,this.setupContent(t)},onOk:function(){var e,t={};if(this.commitContent(t),this._.selectedElements.length){for(var i,l,n,a,o,s=this._.selectedElements,d=c.getLinkAttributes(u,t),r=[],h=0;h<s.length;h++)l=(a=s[h]).data("cke-saved-href"),i=t.linkText&&p!=t.linkText,n=l==p,l="email"==t.type&&l=="mailto:"+p,a.setAttributes(d.set),a.removeAttributes(d.removed),i?o=t.linkText:(n||l)&&(o="email"==t.type?t.email.address:d.set["data-cke-saved-href"]),o&&a.setText(o),r.push((e=a,(l=(l=u).createRange()).setStartBefore(e),l.setEndAfter(e),l));u.getSelection().selectRanges(r),delete this._.selectedElements}else{for(s=c.getLinkAttributes(u,t),d=u.getSelection().getRanges(),i=[],(r=new CKEDITOR.style({element:"a",attributes:s.set})).type=CKEDITOR.STYLE_INLINE,a=0;a<d.length;a++){for((n=d[a]).collapsed?(o=new CKEDITOR.dom.text(t.linkText||("email"==t.type?t.email.address:s.set["data-cke-saved-href"]),u.document),n.insertNode(o),n.selectNodeContents(o)):p!==t.linkText&&(o=new CKEDITOR.dom.text(t.linkText,u.document),n.shrink(CKEDITOR.SHRINK_TEXT),u.editable().extractHtmlFromRange(n),n.insertNode(o)),o=n._find("a"),h=0;h<o.length;h++)o[h].remove(!0);r.applyToRange(n,u),i.push(n)}u.getSelection().selectRanges(i)}},onLoad:function(){u.config.linkShowAdvancedTab||this.hidePage("advanced"),u.config.linkShowTargetTab||this.hidePage("target")},onFocus:function(){var e=this.getContentElement("info","linkType");e&&"url"==e.getValue()&&(e=this.getContentElement("info","url")).select()}}})}();