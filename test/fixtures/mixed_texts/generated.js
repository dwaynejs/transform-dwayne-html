var _tmpl;

module.exports = (_tmpl = [
  {
    type: "div",
    children: [
      {
        type: Block,
        args: {
          __source: "source.html:2:4"
        },
        children: [
          {
            type: "#text",
            value: "123"
          },
          {
            type: "#text",
            value: function (_) {
              return _.text;
            }
          }
        ]
      }
    ]
  }
], _tmpl.vars = ["text"], _tmpl);