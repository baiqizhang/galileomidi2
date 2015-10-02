var recv = require('./recv');
var send = require('./send');
var reader = require('./reader');
var writer = require('./writer');
recv();
send();


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var multer = require('multer');
var upmBuzzer = require("jsupm_buzzer");
var myBuzzer = new upmBuzzer.Buzzer(5);
myBuzzer.stopSound();
var freq = [130,138,146,155,164,174,184,195,207,220,233,246,
            261,277,293,311,329,349,369,391,415,440,466,493,
            523,554,587,622,659,698,739,783,830,880,932,987,];  //
var total = 862000;


app.use(multer({dest:'./uploads/'}).single('midi'));
app.use(express.static('public'));

app.post('/api/upload',function(req,res){
    console.log(req.file.path);
    var filepath = req.file.path;
    reader(filepath);
    res.redirect('/');
});


http.listen(3000, function () {
    console.log('listening at *:3000');
})


io.on('connection', function(socket){
    console.log('a user connected');
    var data=[]; //note + time
    var time=0;
    socket.on('note', function(msg){
        console.log('server recv:' + msg);
        if (msg>=0){
            data.push(msg);
            data.push(1)
            time = 1;
            if (msg>0){
                note = total/freq[msg-48];
                myBuzzer.playSound(note,1000*200);
            }
            console.log("note"+note);
        } else if (msg==-1){  //expand
            time = time+1;
            data.pop();
            data.push(time);
            console.log('expand');
        } else if (msg==-2){  //del
            if (data.length>=2){
                data.pop();
                data.pop();
            }
            console.log('del');
            console.log(data);
        }
    });
    socket.on('play', function(msg){
        console.log('play');
        writer(data);
    });
    socket.emit('message','Hello from server!');
});
