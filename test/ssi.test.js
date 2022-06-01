import { SSI } from '../index';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

describe('ssi', () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    it('ssi', (done) => {
        var ssi = new SSI({
            baseDir: path.join(__dirname, './mock')
        });

        ssi.compile(fs.readFileSync(path.join(__dirname, './mock/index.html'), { encoding: 'utf-8' }), {
            payload: {
                title: 'Kitty',
                mqtt: 10
            }
        }, function(err, output) {
            expect(!err).toBeTruthy();
            expect(!!~output.indexOf('Kitty')).toBeTruthy(); //from payload
            expect(!!~output.indexOf('<nav>')).toBeTruthy(); //from header.html
            expect(!!~output.indexOf('Download')).toBeTruthy(); //from menu.html
            expect(!!~output.indexOf('MQTT')).toBeTruthy(); //from payload not equal
            //check a series of special chars
            expect(!!~output.indexOf('\\v')).toBeTruthy();
            expect(!!~output.indexOf('\\r')).toBeTruthy();
            expect(!!~output.indexOf('\\f')).toBeTruthy();
            expect(!!~output.indexOf('\\t')).toBeTruthy();
            expect(!!~output.indexOf('\\b')).toBeTruthy();
            expect(!!~output.indexOf('\\n')).toBeTruthy();
            expect(!!~output.indexOf('\\u')).toBeTruthy();
            expect(!!~output.indexOf('&#8226;')).toBeTruthy();
            expect(!!~output.indexOf('&amp;')).toBeTruthy();
            expect(!!~output.indexOf('noop')).toBeTruthy();
            //check left syntax
            for (var reg in SSI.prototype.regExps) {
                expect(!SSI.prototype.regExps[reg].test(output)).toBeTruthy();
            }
            done();
        });

    });

    it('compileFile', (done) => {
        var ssi = new SSI({
            baseDir: path.join(__dirname, './mock')
        });

        ssi.compileFile(path.join(__dirname, './mock/index.html'), {
            payload: {
                title: 'Kitty',
                mqtt: 10
            }
        }, function(err, output) {
            expect(!err).toBeTruthy();
            expect(!!~output.indexOf('Kitty')).toBeTruthy(); //from payload
            expect(!!~output.indexOf('<nav>')).toBeTruthy(); //from header.html
            expect(!!~output.indexOf('Download')).toBeTruthy(); //from menu.html
            expect(!!~output.indexOf('MQTT')).toBeTruthy(); //from payload not equal
            //check a series of special chars
            expect(!!~output.indexOf('\\v')).toBeTruthy();
            expect(!!~output.indexOf('\\r')).toBeTruthy();
            expect(!!~output.indexOf('\\f')).toBeTruthy();
            expect(!!~output.indexOf('\\t')).toBeTruthy();
            expect(!!~output.indexOf('\\b')).toBeTruthy();
            expect(!!~output.indexOf('\\n')).toBeTruthy();
            expect(!!~output.indexOf('\\u')).toBeTruthy();
            expect(!!~output.indexOf('&#8226;')).toBeTruthy();
            expect(!!~output.indexOf('&amp;')).toBeTruthy();
            expect(!!~output.indexOf('noop')).toBeTruthy();
            //check left syntax
            for (var reg in SSI.prototype.regExps) {
                expect(!SSI.prototype.regExps[reg].test(output)).toBeTruthy();
            }
            done();
        });
    });

    it('empty', (done) => {
        var ssi = new SSI({
            baseDir: path.join(__dirname, './mock')
        });

        ssi.compile(fs.readFileSync(path.join(__dirname, './mock/empty.html'), {encoding: 'utf-8'}), function(err, output) {
            expect(!!output).toBeTruthy();
            done();
        });
    });

    it('empty_var', (done) => {
        var ssi = new SSI({
            baseDir: path.join(__dirname, './mock')
        });

        ssi.compile(fs.readFileSync(path.join(__dirname, './mock/empty-var.html'), {encoding: 'utf-8'}), function(err, output) {
            expect(!!output).toBeTruthy();
            done();
        });
    });

    it('file_include', (done) => {
        var ssi = new SSI({
            baseDir: path.join(__dirname, './mock')
        });

        ssi.compileFile(path.join(__dirname, './mock/subdir/file-include.html'), function(err, output) {
            expect(!err).toBeTruthy();
            expect(!!~output.indexOf('<nav>')).toBeTruthy(); //from header.html
            done();
        });
    });

    it('virtual_include', (done) => {
        var ssi = new SSI({
            baseDir: path.join(__dirname, './mock')
        });

        ssi.compileFile(path.join(__dirname, './mock/subdir/virtual-include.html'), function(err, output) {
            expect(!err).toBeTruthy();
            expect(output).toBeTruthy(); // 'output sent'
            expect(!!~output.indexOf('<nav>')).toBeTruthy(); //from header.html
            done();
        });
    });

    it('virtual_include_with_directory', (done) => {
      var ssi = new SSI({
          baseDir: path.join(__dirname, './mock')
      });

      ssi.compileFile(path.join(__dirname, './mock/subdir/virtual-include-with-directory.html'), function(err, output) {
          expect(!err).toBeTruthy();
          expect(output).toBeTruthy(); // '<div>NESTED</div>'
          done();
      });
    });

    it('virtual_include_with_extra_attr', (done) => {
      var ssi = new SSI({
          baseDir: path.join(__dirname, './mock')
      });

      ssi.compileFile(path.join(__dirname, './mock/subdir/virtual-include-with-extra-attr.html'), function(err, output) {
          expect(!err).toBeTruthy();
          expect(output).toBeTruthy(); // '<div>NESTED</div>'
          done();
      });
    });
});
