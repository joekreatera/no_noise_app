// option 1
/*
add debug library!

use forever or pm2
use nohup
nodemon
supervisor


option 2 - or on top of option 1
Here's an upstart (http://upstart.ubuntu.com/cookbook/#run-a-job-before-another-job) solution I've been using for my personal projects:

Place it in /etc/init/node_app_daemon.conf:

description "Node.js Daemon"
author      "Adam Eberlin"

stop on shutdown

respawn
respawn limit 3 15

script
  export APP_HOME="/srv/www/MyUserAccount/server"
  cd $APP_HOME
  exec sudo -u user /usr/bin/node server.js
end script

This will also handle respawning your application in the event that it crashes. It will give up attempts to respawn your application if it crashes 3 or more times in less than 15 seconds
*/
//var firebase = require("firebase/app");

// usuario prueba: users/GANa7f8jJDzux1xotLgl

const AWS = require('aws-sdk');
const Stream = require('stream');
const Speaker = require('speaker');
const fs = require('fs');

const GENERAL_QUERY = 0;
const MORNING_ROUTINE_GET = 1;
const BEDTIME_ROUTINE_GET = 2;
const ACTIVITY_CHECK = 3;
const STORYTELLING = 4;

var firebase = require("firebase-admin");
var serviceAccount = require("../noiseapptest-ec4b1-e28db7fb0b4c.json");
var session_test = "";

var app = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://noiseapptest-ec4b1.firebaseio.com'
  });

var db = app.firestore();
var state  = GENERAL_QUERY;
var actualRoutineList = Array();

AWS.config.loadFromPath('../config_aws.json');

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-2'
});
// Create the Speaker instance

let params = {
    'Text': 'Hi there! I\'m current Noise voice! . Today is may ' + 12,
    'OutputFormat': 'pcm',
    'VoiceId': 'Kendra'
};



class GeneralComponents{
  static player = null;
  constructor(){
    GeneralComponents.player = this;
  }

  static getPlayer(){

          GeneralComponents.player =  new Speaker({
              channels: 1,
              bitDepth: 16,
              sampleRate: 16000
          });


      return GeneralComponents.player;
  }

}

class GeneralVariables{
  // month is 0 based
  static genVars = {
    config_data:"NONE"
  };

  static configFile= "";

  static initGeneralVariables(cfg){
    GeneralVariables.configFile = cfg;
    if (!fs.existsSync(GeneralVariables.configFile)){
        //file exists
        var td = new Date();
        fs.writeFileSync(GeneralVariables.configFile , JSON.stringify(GeneralVariables.genVars) );
    }

    GeneralVariables.genVars = JSON.parse ( fs.readFileSync(GeneralVariables.configFile) );
  }
  static update(key, value){
    GeneralVariables.genVars[key] = value;
    fs.writeFileSync(GeneralVariables.configFile , JSON.stringify(GeneralVariables.genVars) );
  }

  static getVariable(key){
    return GeneralVariables.genVars[key];
  }

}

GeneralVariables.initGeneralVariables("app_config.json");
var myRobot = firebase.firestore().collection('robot').doc('kftvZp7DxGPkxO9mf0U0');


Polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
        console.log(err.code)
    } else if (data) {
        if (data.AudioStream instanceof Buffer) {
            //write Audio stream to file relative to this program
            /*fs.writeFile("./speech.mp3", data.AudioStream, function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log("The file was saved!")
            });*/
            // Initiate the source
            let bufferStream = new Stream.PassThrough();
            // convert AudioStream into a readable stream
            bufferStream.end(data.AudioStream);
            // Pipe into Player
            bufferStream.pipe( GeneralComponents.getPlayer() );
        }
    }
});

/*
TODO::
4. configure voice to go faster or slower with ssml
  SSML https://developer.amazon.com/it-IT/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html

*/

function processEvent(evt){
  // event has message and code
  console.log("Taking event " + evt.code + " ("+evt.message+")");
}

function doGeneralQuery(cb){
  let query = db.collection('robot_events').where('status','==',0).where('robot','==', myRobot);

  query.get().then(querySnapshot => {
                  console.log("Getting data ... ");
                  let docs = querySnapshot.docs;
                  var doc = null;
                  for (doc of docs) {
                      console.log("doc " +  doc.id );


                      console.log("doc " +  doc.data().content.code );

                      processEvent({message:doc.data().content.message , code:doc.data().content.code });

                      /*

                      Insert code here
                      to set voluma up, down, change playlist, change song, change led mode

                      Is possible to get a lot of events at the same time, apply them in order
                      */


                      db.collection('robot_events').doc(doc.id).update("status",1).catch((err)=>{
                        console.log("Could not update! "  + err);
                      });
                  }


                  // finished process
                  cb();

                  //app.delete().then( () => { console.log( "Finished"); });
              }
  );
}


function syncData(){
  if( state == GENERAL_QUERY){
    doGeneralQuery( () => {

      setTimeout( syncData , 4000);
    } );
  }

}

function parseActualHour(){
  var dt = new Date();
  return (""+dt.getHours()).padStart(2,"0") + ":" + (""+dt.getMinutes()).padStart(2,"0");
}

function noiseSpeak(message){
  let params = {
      'Text': message ,
      'OutputFormat': 'pcm',
      'VoiceId': 'Kendra'
  };
  Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
          console.log(err.code)
      } else if (data) {
          if (data.AudioStream instanceof Buffer) {
              // Initiate the source
              let bufferStream = new Stream.PassThrough();
              // convert AudioStream into a readable stream
              bufferStream.end(data.AudioStream);
              // Pipe into Player
              bufferStream.pipe(GeneralComponents.getPlayer());
          }
      }
  });

}

setTimeout( syncData , 3000);
