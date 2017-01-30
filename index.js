var video = document.querySelector('video');
var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

var mediaSource = new MediaSource;
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', sourceOpen);

function sourceOpen() {
    var mediaSource = this
    var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
    var end
    mediaSource.duration = 120

    function fetchChunk(index) {
        return new Promise((resolve, reject) => {
            fetchAB(`/video/chunk-${index}_dashinit.mp4`, function(buf) {
                sourceBuffer.timestampOffset = 5 * index;
                sourceBuffer.appendBuffer(buf);
                resolve();
            })
        })
    }
    fetchChunk(1)
    fetchChunk(0)

}

function fetchAB(url, cb) {
    console.log('fetching...', url)
    var xhr = new XMLHttpRequest
    xhr.open('get', url)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function() {
        cb(xhr.response)
    }
    xhr.send()
}

function getChunk() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest
        xhr.open('get', url)
        xhr.responseType = 'arraybuffer'
        xhr.onload = function() {
            cb(xhr.response)
        }
        xhr.send()
    })
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}