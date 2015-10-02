module.exports=function(data){
var upmBuzzer = require("jsupm_buzzer");
var myBuzzer = new upmBuzzer.Buzzer(5);
myBuzzer.stopSound();

var freq = [130,138,146,155,164,174,184,195,207,220,233,246,
            261,277,293,311,329,349,369,391,415,440,466,493,
            523,554,587,622,659,698,739,783,830,880,932,987,];  //
var total = 862000;


now = 0; 
function loop(){
    if (now>data.length-1){
        myBuzzer.stopSound();
        return;
    }
    var delta=data[now+1];
    var note=data[now];
    console.log('delta:'+delta+' note:'+note);

    if (note==0)
        myBuzzer.stopSound();
    else
        myBuzzer.playSound(total/freq[note-48],0);
    setTimeout(function(){
        now = now+2;
        loop();
    },delta*200);
    
}

loop();
}
