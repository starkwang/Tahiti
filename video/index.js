var readline = require('readline');
var fs = require('fs');
var os = require('os');
var process = require('child_process');
var Promise = require('bluebird');

function splitVideo(index) {

    var startSS = "00" + (index * 5 % 60);
    var startMM = "00" + parseInt(index * 5 / 60);
    startSS = startSS.slice(startSS.length - 2, startSS.length);
    startMM = startMM.slice(startMM.length - 2, startMM.length);
    return new Promise(resolve => {
        var cmd = `
            ffmpeg -ss 00:${startMM}:${startSS} -i source.mp4 -c copy -t 00:00:05 /chunk/h/chunk-${index}.mp4 && 
            mp4box -dash 10000 -frag 1000 -rap /chunk/h/chunk-${index}.mp4 && 

            ffmpeg -ss 00:${startMM}:${startSS} -i source.mp4 -t 00:00:05 /chunk/m/chunk-${index}.mp4 -s 960x540 && 
            mp4box -dash 10000 -frag 1000 -rap /chunk/m/chunk-${index}.mp4 && 
            
            ffmpeg -ss 00:${startMM}:${startSS} -i source.mp4 -t 00:00:05 /chunk/l/chunk-${index}.mp4 -s 640x360 && 
            mp4box -dash 10000 -frag 1000 -rap /chunk/l/chunk-${index}.mp4
        `;
        console.log(cmd);
        process.exec(cmd, (error, stdout, stderr) => {
            console.log(`stderr: ${stderr}`);
            resolve(stderr)
        });
    })
}


// for (var i = 0; i < 30; i++) {
//     splitVideo(i);
// }

splitVideo(0)
splitVideo(1)