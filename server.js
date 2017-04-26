var fs = require('fs');
var spdy = require('spdy');
var http2 = require('http2')
var express = require('express')
var path = require('path')
var WebSocket = require('ws')
var options = {
    key: fs.readFileSync('./tls/localhost.key'),
    cert: fs.readFileSync('./tls/localhost.crt')
};
var html = fs.readFileSync('./index.html');

wss = new WebSocket.Server({
    perMessageDeflate: false,
    port: 3000
});

var chunk = []
for (var i = 0; i < 40; i++){
    chunk.push(fs.readFileSync(`./video/chunk/q1/chunk-${i}_dashinit.mp4`))
}
wss.on('connection', function open(ws) {
    console.log('connection')
    ws.on('message', function incoming(data, flags) {
        if (chunk[data]) {
            console.log('send' + data)
            var startTime = (new Date()).getDate()
            ws.send(chunk[data], () => {
                var endTime = (new Date()).getDate()
                console.log('send complete', endTime - startTime)
            })
        }
    });
});





// require('http2').createServer(options, function (req, res) {
//     console.log(req.url);
//     if(req.url == '/test.mp4'){
//         res.write(mp4);
//     }else{
//         res.write(html);
//     }
// }).listen(8080);

// http2.createServer(options, function(req, res) {
//     var stream = res
//         .push({
//             path: '/test.mp4',
//             protocol: 'https:',
//             request: {
//                 accept: '*/*'
//             },
//             response: {
//                 'content-type': 'video/mp4'
//             }
//         }, (err, duplex) => {
//         })
//     stream.writeHead(200, {
//         'Content-Type': 'video/mp4'
//     })
//     stream.end(mp4)
//     res.writeHead(200);
//     res.write(html)
//     res.end()
// }).listen(3000);