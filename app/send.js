// configure jshint
/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

module.exports=function(){
// lcd driver
var mraa = require('mraa');
var lcd = require('jsupm_i2clcd');
var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);

// grove driver
var upm_grove = require('jsupm_grove');
var groveRotary = new upm_grove.GroveRotary(1);
var button = new upm_grove.GroveButton(2);

// grove buzzer driver
var upmBuzzer = require("jsupm_buzzer");
var myBuzzer = new upmBuzzer.Buzzer(5);
myBuzzer.stopSound();

console.log('start..');

var net = require('net');
var midi = require('midi-node')

var HOST = '10.0.13.179';
var PORT = 1337;

var client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    writer.startFile(0, 1, 128);
    writer.startTrack();
});

client.on('close', function() {
    console.log('Connection closed');
});

var writer = new midi.Writer(client);

function show(note) {
    display.setColor(64, 65, 192);
    display.setCursor(0,0);
    display.write('Note:');
    display.setCursor(1,0);
    display.write(note+'  '); 
}

var noteString=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C+1'];
var freq = [261,277,293,311,329,349,369,391,415,440,466,493,
            523,554,587,622,659,698,739,783,830,880,932,987,];  //
var total = 862000;

var lastBtn=0;

function loop()
{
    var abs = groveRotary.abs_value();
    var btn = button.value();
    var note= Math.floor(abs/80);
    var rise = 0;
    var fall = 0;
    
    if (btn==1 && lastBtn==0)
        rise=1;
    if (btn==0 && lastBtn==1)
        fall=1;
    lastBtn=btn;
    
    //console.log("Abs:" + abs+'\trise:'+rise+'\tfall:'+fall+'\tnote:'+note);
    show(noteString[note]);
    
    if (rise==1) {
        writer.noteOn(0, 0, abs/128+60, 50); // Channel 0, middle C4, 100 velocity
        var period = total/freq[note];
        myBuzzer.playSound(period,0);
    }
    if (fall==1) {
        writer.noteOff(0, 0, abs/128+60, 50); // Channel 0, middle C4, 100 velocity
        myBuzzer.stopSound();
    }
    setTimeout(loop, 100);
}

loop();

}
