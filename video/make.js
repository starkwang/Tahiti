var readline = require('readline');
var fs = require('fs');
var os = require('os');
var process = require('child_process');
var Promise = require('bluebird');

function splitVideo(index) {
    var chunkLength = 5;

    var startSS = "00" + (index * chunkLength % 60);
    var startMM = "00" + parseInt(index * chunkLength / 60);
    startSS = startSS.slice(startSS.length - 2, startSS.length);
    startMM = startMM.slice(startMM.length - 2, startMM.length);
    return new Promise(resolve => {
        var cmd = `
            ffmpeg -ss 00:${startMM}:${startSS} -i source.mp4 -c copy -t 00:00:0${chunkLength} ./chunk/h/chunk-${index}.mp4 && 
            cd chunk/h && mp4box -dash 5000 -frag 1000 chunk-${index}.mp4 && cd ../.. && 

            ffmpeg -i ./chunk/h/chunk-${index}.mp4 -s 960x540 ./chunk/m/chunk-${index}.mp4 && 
            cd chunk/m && mp4box -dash 5000 -frag 1000 chunk-${index}.mp4 && cd ../.. &&
            
            ffmpeg -i ./chunk/h/chunk-${index}.mp4 -s 640x360 ./chunk/l/chunk-${index}.mp4 && 
            cd chunk/l && mp4box -dash 5000 -frag 1000 chunk-${index}.mp4 && cd ../..
        `;
        console.log(cmd);
        process.exec(cmd, (error, stdout, stderr) => {
            console.log(`stderr: ${stderr}`);
            resolve(stderr)
        });
    }).then(_ => {
        console.log('chunk ' + index + ' compelte');
    })
}


// for (var i = 0; i < 30; i++) {
//     splitVideo(i);
// }

splitVideo(0)
splitVideo(1)