 var express = require('express');
 var formidable = require('formidable');
 var app = express();
 const fs = require('fs');
 app.use(express.static('public'));
 app.get('/', function (req, res) {
   res.sendFile(__dirname + '/index.html');
 });
 app.post('/upload', function (req, res) {
   try {
     fs.unlinkSync(__dirname + '/' + 'non_layouted_bpmn_di_unprocessed.xml');
     //file removed
   } catch (err) {
     console.error(err);
   }
   try {
     fs.unlinkSync(__dirname + '/' + 'non_layouted_bpmn_di.xml');
     //file removed
   } catch (err) {
     console.error(err)
   }
   try {
     fs.unlinkSync(__dirname + '/' + 'auto_layouted_bpmn_di.xml');
     //file removed
   } catch (err) {
     console.error(err)
   }
   var form = new formidable.IncomingForm();
   form.maxFileSize = 20 * 1024 * 1024;
   form.on('error', function () {
     res.status(500).send("File size is too big, Please use files smaller than 20MB");
     return false;
   });
   form.parse(req);
   form.on('fileBegin', function (name, file) {
     file.path = __dirname + '/' + 'non_layouted_bpmn_di_unprocessed.xml';
   });
   form.on('file', function (name, file) {
     console.log('Uploaded ' + file.name);
   });
   form.on('end', function () {
     const exec = require('child_process').exec;
     var exectransform = exec('transform.bat',
       (error) => {
         if (error !== null) {
           console.log(`exec error: ${error}`);
         }
         var AutoLayout = require('./index');
         var aRead = require('read-file');
         var sPreprocessedXMLPath = 'non_layouted_bpmn_di.xml';
         try {
           var aXmlWithoutDi = aRead.sync(sPreprocessedXMLPath, 'utf8');
           var aAutoLayout = new AutoLayout();
           try {
             aAutoLayout.layoutProcess(aXmlWithoutDi, function (result) {
               if (result == 'error') {
                 res.redirect('/');
               }
               if (result == true) {
                 var file = __dirname + '/auto_layouted_bpmn_di.xml';
                 res.download(file);
               }
             });
           } catch (e) {
             res.redirect('/');
           }
         } catch (e) {
           res.status(500).send("cannot read file, please make sure that the file type is supported and try again later");
         }
       });
   });
 });
 process.on('uncaughtException', function (exception) {
   res.status(500).send("unhandled error occured ! please contact administrator");
 });
 app.listen(3000);