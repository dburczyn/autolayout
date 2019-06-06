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
   var uniqueFileName = uuidv1();
   log.info('starting upload' +' : '+ uniqueFileName );
   var form = new formidable.IncomingForm();
   form.maxFileSize = 20 * 1024 * 1024;
   form.on('error', function (e) {
     log.error(e  +' : '+ uniqueFileName );
     res.status(409).send(e.message  +' : '+ uniqueFileName );
   });
   form.parse(req);
   form.on('fileBegin', function (name, file) {
    if (fs.existsSync(nconf.get('bpmndi_filestorage'))) {
      file.path = nconf.get('bpmndi_filestorage') + '/' + 'non_layouted_bpmn_di_unprocessed_' + uniqueFileName + '.xml';
      log.info('Uploading file to: ' + file.path  +' : '+ uniqueFileName );
    }
    else {
      form._error(new Error('Could not find server path: '+  nconf.get('bpmndi_filestorage')));
   }

   });
   form.on('file', function (name, file) {
     log.info('Uploaded ' + file.name  +' : '+ uniqueFileName );
   });
   form.on('end', function () {
     const {
       spawn
     } = require('child_process');
     const exectransform = spawn('java', ['-jar', 'saxon8.jar', '-s', nconf.get('bpmndi_filestorage') + '/non_layouted_bpmn_di_unprocessed_' + uniqueFileName + '.xml', '-o', nconf.get('bpmndi_filestorage') + '/non_layouted_bpmn_di_' + uniqueFileName + '.xml', 'exp_blueWorks.xsl']);
     exectransform.stdout.on('data', (data) => {
       log.info(`stdout: ${data}`  +' : '+ uniqueFileName );
     });
     exectransform.stderr.on('data', (data) => {
       log.error(`stderr: ${data}`  +' : '+ uniqueFileName );
     });
     exectransform.on('exit', function (code) {
       if (code === 0) {
         log.info("transform was successful"  +' : '+ uniqueFileName );
         var AutoLayout = require('./index');
         var aRead = require('read-file');
         var sPreprocessedXMLPath = nconf.get('bpmndi_filestorage') + '/non_layouted_bpmn_di_' + uniqueFileName + '.xml';
         try {
           log.info("openning file to layout"  +' : '+ uniqueFileName );
           var aXmlWithoutDi = aRead.sync(sPreprocessedXMLPath, 'utf8');
         } catch (e) {
           log.error(e  +' : '+ uniqueFileName );
           res.status(409).send("could not open transformed file"  +' : '+ uniqueFileName );
           deleteUploaded(uniqueFileName);
           deletePreprocessed(uniqueFileName);
           return false;
         }
         var aAutoLayout = new AutoLayout();
         try {
           log.info("trying to layout file"  +' : '+ uniqueFileName );
           aAutoLayout.layoutProcess(aXmlWithoutDi, uniqueFileName, function (result) {
            if (result.name == 'Error') {
              log.info("layouting failed because: "+ result.message  +' : '+ uniqueFileName );
              res.status(409).send("could not layout file because " + result.message  +' : '+ uniqueFileName );
              deleteUploaded(uniqueFileName);
              deletePreprocessed(uniqueFileName);
              return false;
           }
              if (result == 'error') {
                log.info("layouting failed"  +' : '+ uniqueFileName );
                res.status(409).send("could not layout file"  +' : '+ uniqueFileName );
                deleteUploaded(uniqueFileName);
                deletePreprocessed(uniqueFileName);
                return false;
             }
             if (result == true) {
               log.info("layouting successful"  +' : '+ uniqueFileName );
               var file = nconf.get('bpmndi_filestorage') + '/auto_layouted_bpmn_di_' + uniqueFileName + '.xml';
               res.set({
                 "Content-Type": "application/download"
               });
               res.download(file, function () {
                 log.info("downloading file"  +' : '+ uniqueFileName );
                 if (res.headersSent) {
                   log.info("file sent to be downloaded"  +' : '+ uniqueFileName );
                   deleteUploaded(uniqueFileName);
                   deletePreprocessed(uniqueFileName);
                   deleteProcessed(uniqueFileName);
                 } else {
                   log.error("could not send a file to be downloaded"  +' : '+ uniqueFileName );
                   res.status(409).send("could not send file to be downloaded"  +' : '+ uniqueFileName );
                   deleteUploaded(uniqueFileName);
                   deletePreprocessed(uniqueFileName);
                   deleteProcessed(uniqueFileName);
                 }
               });
             }
           });
         } catch (e) {
           log.error(e  +' : '+ uniqueFileName );
           res.status(409).send("could not process file"  +' : '+ uniqueFileName );
           deleteUploaded(uniqueFileName);
           deletePreprocessed(uniqueFileName);
           return false;
         }
       } else {
         log.error("file transformation failed"  +' : '+ uniqueFileName );
         deleteUploaded(uniqueFileName);
         res.status(409).send("could not transform file"  +' : '+ uniqueFileName );
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
     log.info("deleted temporary processed file"  +' : '+ uniqueFileName );
   } catch (err) {
     log.error(err  +' : '+ uniqueFileName );
   }
 };
 app.listen(nconf.get('bpmndi_layout_port'));