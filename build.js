var program = require('commander'),
uglify = require('uglify-js'),
Y = require('yuidocjs'),
file = require('fs');

program.command('compile')
	.description('Creates minified and source code in dist')
	.action(function(){
		compile();
	});

program.command('docs')
	.description('Complies documention in dist/docs')
	.action(function(){
		docs();
	});
	
program.command('all')
	.description('Compiles code and documentation')
	.action(function(){
		compile();
		docs();
	});

function compile(){
	console.log('Compiling and minifying...')
	license = file.readFileSync('license.js');
	src = file.readFileSync('lib/hypo.js');
	src = src.toString('ascii');
	var jsp = uglify.parser;
	var pro = uglify.uglify;
	var ast = jsp.parse(src);
	ast = pro.ast_mangle(ast, {mangle:true});
	ast = pro.ast_squeeze(ast);
	var min = license + pro.gen_code(ast);
	src = license + src;
	file.writeFileSync('dist/hypo.src.js', src);
	file.writeFileSync("dist/hypo.min.js", min);
	console.log('Compilation and minification complete!');
};

function docs(){
	console.log('Starting YUIDoc');
	var options = Y.Project.init({configfile:'./yuidoc.json'});
	var json = (new Y.YUIDoc(options)).run();
	var builder = new Y.DocBuilder(options, json);
	builder.compile();
}

program.parse(process.argv);