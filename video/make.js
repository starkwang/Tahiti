var readline = require('readline');
var fs = require('fs');
var os = require('os');
var process = require('child_process');
var Promise = require('bluebird');

function splitVideo(index) {
    var chunkLength = 3;

    var startSS = "00" + (index * chunkLength % 60);
    var startMM = "00" + parseInt(index * chunkLength / 60);
    startSS = startSS.slice(startSS.length - 2, startSS.length);
    startMM = startMM.slice(startMM.length - 2, startMM.length);
    return new Promise(resolve => {
        var cmd = `
            ffmpeg -ss 00:${startMM}:${startSS} -i source.mp4 -c copy -t 00:00:0${chunkLength} ./chunk/q5/chunk-${index}.mp4 && 
    
            ffmpeg -i ./chunk/q5/chunk-${index}.mp4 -s 1600x900 ./chunk/q4/chunk-${index}.mp4 && 
            ffmpeg -i ./chunk/q5/chunk-${index}.mp4 -s 1280x720 ./chunk/q3/chunk-${index}.mp4 && 
            ffmpeg -i ./chunk/q5/chunk-${index}.mp4 -s 960x540 ./chunk/q2/chunk-${index}.mp4 && 
            ffmpeg -i ./chunk/q5/chunk-${index}.mp4 -s 640x360 ./chunk/q1/chunk-${index}.mp4 && 

            cd chunk &&
                cd q5 && mp4box -dash ${chunkLength}000 chunk-${index}.mp4 && cd .. &&
                cd q4 && mp4box -dash ${chunkLength}000 chunk-${index}.mp4 && cd .. && 
                cd q3 && mp4box -dash ${chunkLength}000 chunk-${index}.mp4 && cd .. && 
                cd q2 && mp4box -dash ${chunkLength}000 chunk-${index}.mp4 && cd .. && 
                cd q1 && mp4box -dash ${chunkLength}000 chunk-${index}.mp4 && cd .. &&
            cd ..
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

for (var i = 0; i < 5; i++) {
    splitVideo(i);
}