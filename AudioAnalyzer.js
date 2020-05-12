var AudioContext = require('web-audio-api').AudioContext

class AudioAnalyzer{

  static getInstance(){

    if( AudioAnalyzer.instance == null)
      AudioAnalyzer.instance = new AudioAnalyzer();

    return AudioAnalyzer.instance;
  }

  constructor(){
      this.context = new AudioContext();
      this.pcmdata = [] ;
      this.sampleRate = null;
     AudioAnalyzer.instance = this;
  }

  setSound(snd, fs){
    this.decodeSoundFile(snd, fs);
  }

  decodeSoundFile(soundFile, fs){
    console.log("decoding mp3 file ", soundFile, " ..... ")
    var buf = fs.readFileSync(soundFile);
    this.context.decodeAudioData(buf , (audioBuffer)=>{
      console.log(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate, audioBuffer.duration);
      AudioAnalyzer.getInstance().pcmdata = (audioBuffer.getChannelData(0)) ;
      AudioAnalyzer.getInstance().samplerate = audioBuffer.sampleRate; // store sample rate, very important to determine the index in which we are according to the time it has passed
      //findPeaks(pcmdata, samplerate) // implement on each loop according to lights
    }, (err)=>{ console.log(err) } );
  }

  /* s in  miliseconds according to song start*/
  getDataOnTime(s){
    console.log("Tryning time " + s);
    var index = Math.floor(AudioAnalyzer.getInstance().samplerate/1000)*s;}
    console.log("Tryning index  " + index);
    if( index < AudioAnalyzer.getInstance().pcmdata.length ){
      return AudioAnalyzer.getInstance().pcmdata[index];
    }
    return AudioAnalyzer.getInstance().pcmdata[AudioAnalyzer.getInstance().pcmdata.length-1];
  }

}

module.exports = AudioAnalyzer
