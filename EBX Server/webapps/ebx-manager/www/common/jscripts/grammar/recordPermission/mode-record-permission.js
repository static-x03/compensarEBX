ace.define('ace/mode/record-permission',["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/text_highlight_rules", "ace/worker/worker_client" ], function(require, exports, module) {
    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    var RecordPermissionsHighlightRules = function() {
        var keywordMapper = this.createKeywordMapper({
            "keyword.reserved": "not|or|and|else|true|false|end|then|if|begin|return"
        }, "identifier");
        this.$rules = {
            "start": [
                {
                    token : "comment",
                    regex : "\\/\\/.*$"
                }, {
                    token : "comment.start",
                    regex : "\\/\\*",
                    next  : "comment"
                }, {
                    token : "string",
                    regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
                }, {
                    token: "string",
                    regex: "'(?:[^\\\\]|\\\\.)*?'"
                }, {
                    token : "constant.numeric",
                    regex : "0[xX][0-9a-fA-F]+\\b"
                }, {
                    token : "constant.numeric",
                    regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
                }, {
                    token : "keyword.operator",
                    regex : "!|%|\\\\|/|\\*|\\-|\\+|~=|==|<>|!=|<=|>=|=|<|>|&&|\\|\\|"
                }, {
                    token : "punctuation.operator",
                    regex : "\\?|\\:|\\,|\\;|\\."
                }, {
                    token : "paren.lparen",
                    regex : "[[({]"
                }, {
                    token : "paren.rparen",
                    regex : "[\\])}]"
                }, {
                    token : "text",
                    regex : "\\s+"
                }, {
                    token: keywordMapper,
                    regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b" }
            ],
            "comment" : [
                {
                    token : "comment.end",
                    regex : "\\*\\/",
                    next  : "start"
                }, {
                    defaultToken: "comment"
                }
            ]
        };
    };

    oop.inherits(RecordPermissionsHighlightRules, TextHighlightRules);

    var RecordPermissionsMode = function() {
        this.HighlightRules = RecordPermissionsHighlightRules;
    };

    oop.inherits(RecordPermissionsMode, TextMode);

    (function() {
        this.$id = "ace/mode/record-permission";
    }).call(RecordPermissionsMode.prototype);

    exports.Mode = RecordPermissionsMode;
});