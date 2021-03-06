const { deepStrictEqual, strictEqual, throws } = require('assert');
const _ = require('lodash');
const fs = require('fs');
const { decode } = require('sourcemap-codec');
const transformDwayneHtml = require('../src');

describe('transform', () => {
  const dirs = fs.readdirSync(__dirname + '/fixtures');

  _.forEach(dirs, (dirname) => {
    const root = __dirname + '/fixtures/' + dirname;

    it(dirname.replace(/_/g, ' '), () => {
      let options = _.attempt(() => (
        require(root + '/options.json')
      ));
      let sourcemap = _.attempt(() => (
        require(root + '/sourcemap.json')
      ));
      let code = _.attempt(() => (
        fs.readFileSync(root + '/source.html', 'utf8')
      ));

      if (_.isError(options)) {
        options = {};
      }

      if (_.isError(sourcemap)) {
        sourcemap = {
          names: [],
          mappings: []
        };
      }

      if (_.isError(code)) {
        code = fs.readFileSync(root + '/source.js', 'utf8');
      }

      options.filename = 'source.html';
      options.sourceContent = code;

      const generated = transformDwayneHtml(code, options);

      strictEqual(
        generated.code,
        fs.readFileSync(root + '/generated.js', 'utf8')
      );
      compareMaps(sourcemap, generated.map, code);
    });
  });

  it('should throw an error in wrong text nodes js', (done) => {
    try {
      transformDwayneHtml(`<div>
  {a + *}
</div>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unexpected token (2:7)');
        strictEqual(err.pos, 13);
        deepStrictEqual(err.loc, {
          line: 2,
          column: 7
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error in wrong text nodes js in first line', (done) => {
    try {
      transformDwayneHtml('<div>{a + *}</div>');

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unexpected token (1:10)');
        strictEqual(err.pos, 10);
        deepStrictEqual(err.loc, {
          line: 1,
          column: 10
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error with unterminated string literal in text nodes js', (done) => {
    try {
      transformDwayneHtml(`<div>
  {a + '}
</div>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unterminated string constant (2:7)');
        strictEqual(err.pos, 13);
        deepStrictEqual(err.loc, {
          line: 2,
          column: 7
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error with unexpected end of input in text nodes js', (done) => {
    try {
      transformDwayneHtml(`<div>
  {a + (1}
</div>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unexpected token, expected , (2:9)');
        strictEqual(err.pos, 15);
        deepStrictEqual(err.loc, {
          line: 2,
          column: 9
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error with unexpected end of input in text nodes js in first line', (done) => {
    try {
      transformDwayneHtml(`<div>{a + (1}</div>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unexpected token, expected , (1:12)');
        strictEqual(err.pos, 12);
        deepStrictEqual(err.loc, {
          line: 1,
          column: 12
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error in unterminated text nodes js', (done) => {
    try {
      transformDwayneHtml(`<div>
  {a + b
</div>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unterminated embedded javascript expression (2:8)');
        strictEqual(err.pos, 14);
        deepStrictEqual(err.loc, {
          line: 2,
          column: 8
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error in wrong args values js', (done) => {
    try {
      transformDwayneHtml(`<div>
  <span attr="{a + *}"/>
</div>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unexpected token (2:19)');
        strictEqual(err.pos, 25);
        deepStrictEqual(err.loc, {
          line: 2,
          column: 19
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error with wrong first script code', (done) => {
    try {
      transformDwayneHtml(`<script>
  const a = b + *;
</script>`);

      done(new Error('Not thrown'));
    } catch (err) {
      try {
        strictEqual(err.message, 'Unexpected token (2:16)');
        strictEqual(err.pos, 25);
        deepStrictEqual(err.loc, {
          line: 2,
          column: 16
        });

        done();
      } catch (err) {
        done(err);
      }
    }
  });

  it('should throw an error with wrong options.sourceType', () => {
    throws(() => {
      transformDwayneHtml('', { sourceType: 'unknown' });
    }, /options\.sourceType has to be either "module" or "embed"!/);
  });

  it('should throw an error with wrong options.exportType', () => {
    throws(() => {
      transformDwayneHtml('', { exportType: 'unknown' });
    }, /options\.exportType has to be either "es" or "cjs"!/);
  });

  it('should throw an error with wrong options.unscopables', () => {
    throws(() => {
      transformDwayneHtml('', { unscopables: 'string' });
    }, /options\.unscopables has to be an array of strings!/);

    throws(() => {
      transformDwayneHtml('', { unscopables: ['string', 1] });
    }, /options\.unscopables has to be an array of strings!/);
  });

  it('should throw an error with wrong options.indent', () => {
    throws(() => {
      transformDwayneHtml('', { indent: null });
    }, /options\.indent has to be either a string or a number!/);

    throws(() => {
      transformDwayneHtml('', { indent: 'string' });
    }, /options\.indent has to be whitespace!/);
  });

  it('should throw an error with wrong options.quotes', () => {
    throws(() => {
      transformDwayneHtml('', { quotes: 'triple' });
    }, /options\.quotes has to be either "single" or "double"!/);
  });

  it('should throw an error with wrong options.mode', () => {
    throws(() => {
      transformDwayneHtml('', { mode: 'pug' });
    }, /options\.mode has to be either "html" or "jsx"!/);
  });
});

function compareMaps(probableMap, realMap, code) {
  probableMap.version = 3;
  probableMap.sources = realMap.mappings
    ? ['source.html']
    : [];
  probableMap.sourcesContent = realMap.mappings
    ? [code]
    : [];

  const realMappings = decode(realMap.mappings);
  const probableMappings = probableMap.mappings;

  delete realMap.mappings;
  delete probableMap.mappings;

  deepStrictEqual(probableMap, realMap);

  probableMappings.forEach((lineMappings, line) => {
    const realLineMapping = realMappings[line];

    lineMappings.forEach((mapping) => {
      deepStrictEqual(
        _.find(realLineMapping, ([column]) => mapping[0] === column),
        mapping
      );
    });
  });
}
