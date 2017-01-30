var fs = require('fs');
var options = {
    key: fs.readFileSync('./tls/localhost.key'),
    cert: fs.readFileSync('./tls/localhost.crt')
};
var mp4 = fs.readFileSync('./test.mp4');
var html = fs.readFileSync('./index.html');
require('http2').createServer(options, function (req, res) {
    console.log(req.url);
    if(req.url == '/test.mp4'){
        res.write(mp4);
    }else{
        res.write(html);
    }
}).listen(8080);