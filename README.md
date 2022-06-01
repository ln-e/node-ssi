@ln-e/node-ssi
======

[![NPM version][npm-image]][npm-url]

A server-side-include system for nodejs.

We only support parts of nginx ssi syntax:


      <!--# include file="path" -->
      <!--# include virtual="path" -->

      <!--# set var="k" value="v" -->

      <!--# echo var="n" default="default" -->

      <!--# if expr="test" -->
      <!--# elif expr="" -->
      <!--# else -->
      <!--# endif -->

Note:

* `file` includes are always relative to the baseDir provided in the options.
* `virtual` includes are relative to the current file.

usage
======

    var SSI = require('@ln-e/node-ssi');
    var ssi = new SSI({
            baseDir: './html/',
            encoding: 'utf-8',
            payload: {
                v: 5
            }
        });

    // handle a file
    ssi.compileFile('index.html', {payload:{title: 'Index'}}, function(err, content){

        });

    //handle a content
    ssi.compile('<!--# echo var="v" default="default" -->', function(err,content){

        });

test
======

`grunt test`

todo
======
better lexer

license
======

MIT

[downloads-image]: http://img.shields.io/npm/dm/@ln-e/node-ssi.svg
[npm-url]: https://npmjs.org/package/@ln-e/node-ssi
[npm-image]: http://img.shields.io/npm/v/@ln-e/node-ssi.svg
