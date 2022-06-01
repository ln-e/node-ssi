"use strict";

import fs from 'fs';
import fsPromise from 'fs/promises';
import path from 'path';


var syntaxReg = /<!--#([^\r\n]+?)-->/mg;
var includeFileReg = /<!--#\s*include\s+(file|virtual)=(['"])([^\r\n\s]+?)\2\s*(.*?)-->/;
var setVarReg = /<!--#\s*set\s+var=(['"])([^\r\n]+?)\1\s+value=(['"])([^\r\n]*?)\3\s*-->/;
var echoReg = /<!--#\s*echo\s+var=(['"])([^\r\n]+?)\1(\s+default=(['"])([^\r\n]+?)\4)?\s*-->/;
var ifReg = /<!--#\s*if\s+expr=(['"])([^\r\n]+?)\1\s*-->/;
var elifReg = /<!--#\s*elif\s+expr=(['"])([^\r\n]+?)\1\s*-->/;
var elseReg = /<!--#\s*else\s*-->/;
var endifReg = /<!--#\s*endif\s*-->/;


/**
 * Resolve source
 *
 * @param  {String} tpl Source
 * @return {Function}
 */
function resolve(tpl) {
    //resolve set/echo/if
    var fnStr = 'var _r="";\nwith(__data){\n';
    var matches, key, val, pat, eq;

    var start = 0,
        lastMatches;

    var resolveLine = function(str) {
        //This is stupid but works for "\r\b\f\u\v\n".
        //Here we assume line break is "\n"
        return str.replace(/\r/mg, '').replace(/\\/mg, '\\\\').replace(/"/mg, '\\"').replace(/\n/mg, '\\n\\\n');
    };

    while (!!(matches = syntaxReg.exec(tpl))) {
        fnStr += '_r += "' + resolveLine(tpl.slice(start, matches.index)) + '";\n';
        start = matches[0].length + matches.index;
        lastMatches = matches;

        switch (true) {
            case setVarReg.test(matches[0]):
                key = RegExp.$2;
                val = RegExp.$4;
                fnStr += 'var ' + key + ' = "' + val + '";\n';
                break;
            case echoReg.test(matches[0]):
                key = RegExp.$2;
                val = RegExp.$5 || "";
                fnStr += '_r += "undefined" !== typeof(' + key + ') ? ' + key + ' : "' + val + '";\n';
                break;
            case ifReg.test(matches[0]):
                pat = String.prototype.trim.call(RegExp.$2 || "");
                if (/([\w\$\.-]+)\s*(!)?=\s*([\w\.-]+)/.test(pat)) {
                    val = RegExp.$3;
                    eq = RegExp.$2;
                    key = RegExp.$1.replace(/^\$/, '');
                    fnStr += 'if(' + key + (eq ? '!=' : '==') + '"' + val + '"){\n';
                } else {
                    fnStr += 'if(' + pat.replace(/^\$/, '') + '){\n';
                }
                break;
            case elifReg.test(matches[0]):
                pat = String.prototype.trim.call(RegExp.$2 || "");
                if (/([\w\$\.-]+)\s*(!)?=\s*([\w\.-]+)/.test(pat)) {
                    val = RegExp.$3;
                    eq = RegExp.$2;
                    key = RegExp.$1.replace(/^\$/, '');
                    fnStr += '}else if(' + key + (eq ? '!=' : '==') + '"' + val + '"){\n';
                } else {
                    fnStr += '}else if(' + pat.replace(/^\$/, '') + '){\n';
                }
                break;
            case elseReg.test(matches[0]):
                fnStr += '}else{\n';
                break;
            case endifReg.test(matches[0]):
                fnStr += '}\n';
                break;
        }
    }

    if (lastMatches) {
        fnStr += '_r+="' + resolveLine(tpl.slice(lastMatches.index + lastMatches[0].length)) + '";';
    } else {
        fnStr += '_r+="' + resolveLine(tpl) + '";';
    }

    fnStr += '};\nreturn _r;';

    return new Function('__data', fnStr);
}

/**
 * SSI is a tool to resolve ssi syntax.
 *
 * @param {Object} initOptions
 */
export class SSI {
    regExps = {
        includeFileReg: includeFileReg,
        setVarReg: setVarReg,
        echoReg: echoReg,
        ifReg: ifReg,
        elifReg: elifReg,
        elseReg: elseReg,
        endifReg: endifReg
    };

    constructor(initOptions) {
        this.options = Object.assign({
            baseDir: '.',
            encoding: 'utf-8',
            payload: {}
        }, initOptions || {});
    };

    /**
     * @param {Object} config
     */
    setDefaultOptions (options) {
        return Object.assign(this.options, options || {});
    };
    /**
     *
     * <!--# include file="../path/relative/to/current/file" -->
     * <!--# include virtual="/path/relative/to/options.baseDir" -->
     *
     * <!--# set var="k" value="v" -->
     *
     * <!--# echo var="n" default="default" -->
     *
     * <!--# if expr="test" -->
     * <!--# elif expr="" -->
     * <!--# else -->
     * <!--# endif -->
     *
     * @param  {String}   content
     * @param  {Object}   options
     * @param  {Function} callback
     */
    compile(content, options, callback) {
        var func;

        if (arguments.length < 3) {
            callback = options;
            options = {};
        }

        options = Object.assign({}, this.options, options || {});

        this.resolveIncludes(content, options).then(function(content) {
            func = resolve(content);
            try {
                return callback(null, func(options.payload || {}));
            } catch (ex) {
                return callback(ex);
            }
        }, function(err, content) {
            if(err) {
                return callback(err);
            }
        });
    };

    /**
     *
     * @param  {String}   filepath
     * @param  {Object}   options
     * @param  {Function} callback
     */
    compileFile(filepath, options, callback) {

        if (arguments.length < 3) {
            callback = options;
            options = {};
        }

        options = Object.assign({}, this.options, options || {});
        options.dirname = path.dirname(filepath);

        var ssi = this;

        return fs.readFile(filepath, {
            encoding: options.encoding
        }, function(err, content) {
            if (err) {
                return callback(err);
            } else return ssi.compile(content, options, callback);
        });
    }

    /**
     * Rsolves all file includes.
     *
     * @param content
     * @param options
     * @returns Promise<string>
     */
    async resolveIncludes(content, options) {
        var matches, seg, isVirtual, basePath, tpath, subOptions, ssi = this;

        matches = includeFileReg.exec(content);
        while (matches) {
            seg = matches[0];
            isVirtual = RegExp.$1 == 'virtual';
            basePath = (isVirtual && options.dirname && RegExp.$3.charAt(0) !== '/')? options.dirname : options.baseDir;
            tpath = path.join(basePath, RegExp.$3);
            const stats = await fsPromise.lstat(tpath);
            if (stats.isDirectory()) {
                tpath = tpath.replace(/(\/)?$/, '/index.html');
            }
            const innerContentRaw = await fsPromise.readFile(tpath, {encoding: options.encoding});
            // ensure that included files can include other files with relative paths
            subOptions = Object.assign({}, options, {dirname: path.dirname(tpath)});
            const innerContent = await ssi.resolveIncludes(innerContentRaw, subOptions);
            content = content.slice(0, matches.index) + innerContent + content.slice(matches.index + seg.length);
            matches = includeFileReg.exec(content);
        }

        return content;
    };
}
