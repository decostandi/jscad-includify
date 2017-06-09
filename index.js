'use strict';

const recast = require(`recast`);
const fs = require(`fs`);
const path = require(`path`);

function run(script) {
    const includedFiles = [];
    const ast = recast.parse(script);
    recast.visit(ast, {
        visitExpressionStatement: function(p) {
            if (
                p.node.expression &&
                p.node.expression.callee &&
                p.node.expression.callee.name === 'include'
            ) {
                const filePath = `${path.dirname(process.argv[2])}/${p.node.expression.arguments[0].value}`;

                includedFiles.push(filePath)

                try {
                    const file = fs.readFileSync(filePath, `utf8`);
                } catch(err) {
                    throw new Error(`Error when including ${p.node.expression.arguments[0].value}. Error given: ${err}`);
                }

                const includeAst = recast.parse(file);

                p.replace(...includeAst.program.body);
            }

            this.traverse(p);
        }
    });

    return {
        code: recast.print(ast).code,
        includes: includedFiles
    };
}

function runFile(path, options, callback) {
    fs.readFile(path, `utf8`, function(err, script) {
        if (err) {
            return callback(new Error(`Error when reading ${path}. Error given: ${err}`));
        }

        try {
            const {code, includes} = run(script);

            callback(null, code, includes);
        } catch(err) {
            return callback(err);
        }
    });
}

module.exports = {
    run,
    runFile
}