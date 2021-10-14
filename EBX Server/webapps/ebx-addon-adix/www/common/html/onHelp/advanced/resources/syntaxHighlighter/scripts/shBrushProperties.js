/**
 * SyntaxHighlighter brush for .properties file
 * 
 * @copyright
 * Copyright TIBCO Software Inc. 2001-2021. All rights reserved.
 */
;(function()
{
	// CommonJS
	typeof(require) != 'undefined' ? SyntaxHighlighter = require('shCore').SyntaxHighlighter : null;

	function Brush()
	{
		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLinePerlComments,		css: 'comments' },
			{ regex: /\./gm,												css: 'keyword' },
			{ regex: /=/gm,													css: 'keyword' },
			{ regex: /[^#=]*\n/g,											css: 'string' }
			];
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['properties'];

	SyntaxHighlighter.brushes.Properties = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
