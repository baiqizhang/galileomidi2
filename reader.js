module.exports=function(filename){
var fs = require('fs');
var input = fs.createReadStream(filename);
var midi = require('midi-node')
var stream = new midi.Stream(input);
var upmBuzzer = require("jsupm_buzzer");
var myBuzzer = new upmBuzzer.Buzzer(5);
myBuzzer.stopSound();

var noteString=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C+'];
var freq = [130,138,146,155,164,174,184,195,207,220,233,246,
            261,277,293,311,329,349,369,391,415,440,466,493,
            523,554,587,622,659,698,739,783,830,880,932,987];  //
var total = 862000;
var playlist=new Array();

stream.on('startTrack', function (track) {
});
 
stream.on('event', function (delta, message) {
    stat = message.getStatus();  
    cmd = message.getCommand(); 
    channel = message.getChannel(); 
    data=message.getData();
        console.log(delta,";",stat,";",channel,';', message.getCommand() ,";",message.getData()); // [0x3c, 0x00] 
    if (cmd === 'META_MESSAGE' && data[0] === 81){
        console.log(data[2]*256*256+data[3]*256+data[4]);
    }
    if (cmd == 'NOTE_ON'){
         var note=data[0];
         note = total/freq[note-60];
         playlist.push(delta);
         playlist.push(note);
     }
     if (cmd == 'NOTE_OFF'){
         playlist.push(delta);
         playlist.push(-1);
     }
});;

function loop(){
    if (playlist.length<2)
        setTimeout(loop,100);
    else {
        var delta=playlist.shift();
        var note=playlist.shift();
        console.log('delta:'+delta+' note:'+note);

        setTimeout(function(){
            if (note==-1)
                myBuzzer.stopSound();
            else
                myBuzzer.playSound(note,0);
            loop();
        },delta*2);
    }
}

loop();
}