capture_video_filename = '';

function startRecording(_capture_video_filename) {
    capture_video_filename = _capture_video_filename;
    const stream = canvas.captureStream(60);    //60 FPS
    recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 50_000_000 // high bitrate for smoothness
    });
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = saveRecording;
    recorder.start(16); // collect data frequently (~60 fps)
    recording = true;
    recordBtn.textContent = 'Stop Recording';
}

function stopRecording() {
    recorder.stop();
    recording = false;
    recordBtn.textContent = 'Start Recording';
  }

function saveRecording() {
    const blob = new Blob(chunks, { type: 'video/webm' });  //browser only support this type of video
    chunks = [];
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = capture_video_filename + '.webm';
    a.click();
}