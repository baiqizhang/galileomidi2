// configure jshint
/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
module.exports=function(){
// grove buzzer driver
var upmBuzzer = require("jsupm_buzzer");
var myBuzzer = new upmBuzzer.Buzzer(5);
myBuzzer.stopSound();

var net = require('net');
var midi = require('midi-node')
var fs = require('fs');
var http = require('http');

var HOST = '10.0.17.160';
var PORT = 1337;

var noteString=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C+1'];
var freq = [130,138,146,155,164,174,184,195,207,220,233,246,
            261,277,293,311,329,349,369,391,415,440,466,493,
            523,554,587,622,659,698,739,783,830,880,932,987,];  //
var total = 862000;

console.log('start..');

var playlist=new Array();

net.createServer(function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    
    // Process midi stream
    var stream = new midi.Stream(sock);
    stream.on('startTrack', function (track) {});
    stream.on('event', function (delta, message) {
        stat = message.getStatus();  
        cmd = message.getCommand(); 
        channel = message.getChannel(); 
        data=message.getData();

       
        console.log(delta,";",stat,";",channel,';', message.getCommand() ,";",message.getData()); // [0x3c, 0x00] 

        if (cmd == 'NOTE_ON'){
            var note=data[0];
            note = total/freq[note-60];
            //myBuzzer.playSound(note,0);
            playlist.push(delta);
            playlist.push(note);
        }
        if (cmd == 'NOTE_OFF'){
            //myBuzzer.stopSound();
            playlist.push(delta);
            playlist.push(-1);
        }
        
    });;
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);


post_data = '10.0.17.160:1337';
var post_options = {
    host: '10.0.13.179',
    port: '8080',
    path: '/midi/register',
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': post_data.length
    }
};

var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('Response: ' + chunk);
        connected=1;
    });
});
post_req.end(post_data);
console.log('data posted');

function loop(){

    //console.log(playlist);
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
        },delta*8);
    }
}

loop();
}