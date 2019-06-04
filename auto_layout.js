 const express = require('express');
 const formidable = require('formidable');
 const fs = require('fs');
 const uuidv1 = require('uuid/v1');
 const log = require('simple-node-logger').createSimpleLogger('project.log');
 const app = express();
 app.use(express.static('public'));
 nconf = require('nconf');
 nconf.argv()
   .env()
   .file({
     file: 'config.json'
   });
 app.get('/', function (req, res) {
   log.info('request recieved');
   res.sendFile(__dirname + '/index.html');
 });
 app.post('/uploadForm', function (req, res) {
   log.info('upload request recieved');
   addDiToBPMN(req, res);
 });
 addDiToBPMN = function (req, res) {
   log.info('starting upload');
   var uniqueFileName = uuidv1();
   var form = new formidable.IncomingForm();
   form.maxFileSize = 20 * 1024 * 1024;
   form.on('error', function (e) {
     log.error(e);
     res.status(409).send(e.message);
     return false;
   });
   form.parse(req);
   form.on('fileBegin', function (name, file) {
     file.path = nconf.get('bpmndi_filestorage') + '/' + 'non_layouted_bpmn_di_unprocessed_' + uniqueFileName + '.xml';
     log.info('Uploading file to: ' + file.path);
   });
   form.on('file', function (name, file) {
     log.info('Uploaded ' + file.name);
   });
   form.on('end', function () {
     const {
       spawn
     } = require('child_process');
     const exectransform = spawn('java', ['-jar', 'saxon8.jar', '-s', nconf.get('bpmndi_filestorage') + '/non_layouted_bpmn_di_unprocessed_' + uniqueFileName + '.xml', '-o', nconf.get('bpmndi_filestorage') + '/non_layouted_bpmn_di_' + uniqueFileName + '.xml', 'exp_blueWorks.xsl']);
     exectransform.stdout.on('data', (data) => {
       log.info(`stdout: ${data}`);
     });
     exectransform.stderr.on('data', (data) => {
       log.debug(`stderr: ${data}`);
     });
     exectransform.on('exit', function (code) {
       if (code === 0) {
         log.info("transform was successful");
         var AutoLayout = require('./index');
         var aRead = require('read-file');
         var sPreprocessedXMLPath = nconf.get('bpmndi_filestorage') + '/non_layouted_bpmn_di_' + uniqueFileName + '.xml';
         try {
           log.info("openning file to layout");
           var aXmlWithoutDi = aRead.sync(sPreprocessedXMLPath, 'utf8');
         } catch (e) {
           log.error(e);
           res.status(409).send("could not open transformed file");
           deletePreprocessed(uniqueFileName);
           return false;
         }
         var aAutoLayout = new AutoLayout();
         try {
           log.info("trying to layout file");
           aAutoLayout.layoutProcess(aXmlWithoutDi, uniqueFileName, function (result) {
             if (result == 'error') {
               res.status(409).send("could not layout file");
               deletePreprocessed(uniqueFileName);
               return false;
             }
             if (result == true) {
               log.info("layouting successful");
               var file = nconf.get('bpmndi_filestorage') + '/auto_layouted_bpmn_di_' + uniqueFileName + '.xml';
               res.set({
                 'Content-Type': 'application/download'
               });
               res.download(file, function () {
                 log.info("downloading file");
                 if (res.headersSent) {
                   log.info("file sent to be downloaded");
                   deleteUploaded(uniqueFileName);
                   deletePreprocessed(uniqueFileName);
                   deleteProcessed(uniqueFileName);
                 } else {
                   log.error("could not send a file to be downloaded");
                   res.status(409).send("could not send file to be downloaded");
                   deleteProcessed(uniqueFileName);
                 }
               });
             }
           });
         } catch (e) {
           log.error(e);
           res.status(409).send("could not process file");
           deletePreprocessed(uniqueFileName);
           return false;
         }
       } else {
         log.error("file transformation failed");
         deleteUploaded(uniqueFileName);
         res.status(409).send("could not transform file");
         return false;
       }
     });
   });
 };
 deleteUploaded = function (uniqueFileName) {
   try {
     fs.unlinkSync(nconf.get('bpmndi_filestorage') + '/' + 'non_layouted_bpmn_di_unprocessed_' + uniqueFileName + '.xml');
     log.info("deleted temporary uploaded file");
   } catch (err) {
     log.error(err);
   }
 };
 deletePreprocessed = function (uniqueFileName) {
   try {
     fs.unlinkSync(nconf.get('bpmndi_filestorage') + '/' + 'non_layouted_bpmn_di_' + uniqueFileName + '.xml');
     log.info("deleted temporary preprocessed file");
   } catch (err) {
     log.error(err);
   }
 };
 deleteProcessed = function (uniqueFileName) {
   try {
     fs.unlinkSync(nconf.get('bpmndi_filestorage') + '/' + 'auto_layouted_bpmn_di_' + uniqueFileName + '.xml');
     log.info("deleted temporary processed file");
   } catch (err) {
     log.error(err);
   }
 };
 app.listen(nconf.get('bpmndi_layout_port'));