ace.define('ace/mode/ebx-script',
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text",
      "ace/mode/text_highlight_rules", "ace/worker/worker_client"],
    function (require, exports, module) {
      var oop = require("ace/lib/oop");
      var TextMode = require("ace/mode/text").Mode;
      var TextHighlightRules = require(
          "ace/mode/text_highlight_rules").TextHighlightRules;

      var ScriptFunctionHighlightRules = function () {
        var keywordMapper = this.createKeywordMapper({
          "keyword.reserved": "const|for|do|while|not|unmodifiable|and|else|function|mutable|end|export|if|typeof|in|var|false|procedure|then|as|immutable|null|true|uses|begin|return"
        }, "identifier");
        this.$rules = {
          "start": [
            {
              token: "comment",
              regex: "\\/\\/.*$"
            }, {
              token: "comment.start",
              regex: "\\/\\*",
              next: "comment"
            }, {
              token: "string",
              regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
            }, {
              token: "string",
              regex: "'(?:[^\\\\]|\\\\.)*?'"
            }, {
              token: "constant.numeric",
              regex: "0[xX][0-9a-fA-F]+\\b"
            }, {
              token: "constant.numeric",
              regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
              token: "keyword.operator",
              regex: "!|%|\\\\|/|\\*|\\-|\\+|~=|==|<>|!=|<=|>=|=|<|>|&&|\\|\\|"
            }, {
              token: "punctuation.operator",
              regex: "\\?|\\:|\\,|\\;|\\."
            }, {
              token: "paren.lparen",
              regex: "[[({]"
            }, {
              token: "paren.rparen",
              regex: "[\\])}]"
            }, {
              token: "text",
              regex: "\\s+"
            }, {
              token: keywordMapper,
              regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
            }
          ],
          "comment": [
            {
              token: "comment.end",
              regex: "\\*\\/",
              next: "start"
            }, {
              defaultToken: "comment"
            }
          ]
        };
      };

      oop.inherits(ScriptFunctionHighlightRules, TextHighlightRules);

      var ScriptFunctionMode = function () {
        this.HighlightRules = ScriptFunctionHighlightRules;
      };

      oop.inherits(ScriptFunctionMode, TextMode);

      (function () {
        this.$id = "ace/mode/ebx-script";
      }).call(ScriptFunctionMode.prototype);

      exports.Mode = ScriptFunctionMode;
    });