 var express = require('express');
 var formidable = require('formidable');
 var app = express();

 app.get('/download', function (req, res) {
     var file = __dirname + '/auto_layouted_bpmn_di.xml';
     res.download(file); // Set disposition and send it.
 });

 app.get('/', function (req, res) {
     res.sendFile(__dirname + '/index.html');
 });

 app.post('/', function (req, res) {
     var form = new formidable.IncomingForm();
     form.parse(req);
     form.on('fileBegin', function (name, file) {
         file.path = __dirname + '/' + 'non_layouted_bpmn_di.xml';
     });
     form.on('file', function (name, file) {
         console.log('Uploaded ' + file.name);
     });
     res.sendFile(__dirname + '/index.html');
 });

 app.get('/process', function (req, res) {
     var AutoLayout = require('./index');
     var aRead = require('read-file');
     var sPreprocessedXMLPath = 'non_layouted_bpmn_di.xml';
     var aXmlWithoutDi = aRead.sync(sPreprocessedXMLPath, 'utf8');
     var aAutoLayout = new AutoLayout();
     aAutoLayout.layoutProcess(aXmlWithoutDi);
 });

 app.listen(3000);