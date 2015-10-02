// grove buzzer driver
//var upmBuzzer = require("jsupm_buzzer");
//var myBuzzer = new upmBuzzer.Buzzer(5);
//myBuzzer.stopSound();

var net = require('net');
var midi = require('midi-node')
var fs = require('fs');
var http = require('http');

var HOST = '10.0.16.116'//'10.0.17.160';
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
        //console.log(playlist)
        START = 1
    });
    
    // Process midi stream
    var stream = new midi.Stream(sock);
    stream.on('startTrack', function (track) {});
    stream.on('event', function (delta, message) {
        stat = message.getStatus();  
        cmd = message.getCommand(); 
        channel = message.getChannel(); 
        data=message.getData();
//        console.log(cmd,data,delta);
//        console.log(delta,";",stat,";",channel,';', message.getCommand() ,";",message.getData()); // [0x3c, 0x00] 

        if (cmd == 'NOTE_ON'){
            var note=data[0];
            note = total/freq[note-60];
            playlist.push(1);
            playlist.push(note);
            playlist.push(delta);
            //myBuzzer.playSound(note,0);
        }
        if (cmd == 'NOTE_OFF'){
            playlist.push(0);
            playlist.push(0);
            playlist.push(delta);
            //myBuzzer.stopSound();
        }
    });;
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);





var dgram = require('dgram');
var message = new Buffer(4);
var client = dgram.createSocket("udp4");

var lastTime = 0
var nowTime = 0
var syncTime = 0
var diffTime = 0
var FACTOR = 1
var SUM = 0
var AVERAGE = 0
var COUNT = 0
var INT = 0
var START = 0
var PTR = 0
function tick(){
    nowTime += 1 ;
    nowtime = nowTime%10000000;
    syncTime = nowTime + diffTime
    if (COUNT > 5){
        nowTime+=AVERAGE/50;
        INT += AVERAGE/10000;
        nowTime+=INT;
    }
}

function loop(){
    message.writeInt32LE(syncTime, 0)
    lastTime = syncTime 
    client.send(message, 0, message.length, 12345, '10.0.17.9', 
        function(err) {
            if (err)
                client.close();
        }
    );

    if (START){
        console.log('playing')
        while (PTR+2<playlist.length){
            cmd = playlist[PTR];
            note = playlist[PTR+1];
            delta = playlist[PTR+2];
            if (delta<syncTime){
                PTR+=3;
                continue;
            }
            if (delta>syncTime+100)
                break;
            //console.log([cmd,note,delta]);
            setTimeout(function(cmd,note){
                console.log(note);
                //if (cmd==1)
                //  myBuzzer.playSound(note,0);
                //else
                //  myBuzzer.stopSound();
            },(delta-syncTime)*10,cmd,note);
            PTR+=3;
        }
    }
}

setInterval(tick,10)
setInterval(loop,500);
//setInterval(loop,50);

server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
    t0 = msg.readInt32LE(0);
    t1 = msg.readInt32LE(4);
    t2 = msg.readInt32LE(8);
    t3 = syncTime;
    console.log([Math.round(t0),t1,t2,Math.round(t3)]);
    dTime=((t3-t0)-(t2-t1))/2;
    thisDiffTime = t2 + dTime - syncTime;
    //Statistics
    if (FACTOR!=1){
        COUNT += 1
        SUM += thisDiffTime;
        AVERAGE = SUM/COUNT;
    }
    console.log(''+diffTime.toFixed(1)+'\t'+thisDiffTime.toFixed(2)+'\t'+(dTime).toFixed(2)+'\t'+AVERAGE.toFixed(2))
    //console.log((dTime).toFixed(2))
    if (FACTOR==1){
        FACTOR=0.99;
        console.log('1st')
    }else{
    /*
        if (COUNT>20 && Math.abs(thisDiffTime)>10){
            console.log('throw!')
            return;
        }
        */
    }
    diffTime += thisDiffTime;

    //FACTOR *= 0.99;
});

server.on("listening", function () {
  var address = server.address();
  console.log("server listening " +
      address.address + ":" + address.port);
});

server.bind(12345);