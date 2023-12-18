let recording = false;
let chunks = [];
let capture;
let socket;

let canvas;
let cv;
let start = false
let loadVideo = false
let recorder, stream, recordedChunks = [];
let video;
let isRecording = false;
let isPlaying = false;

let switchTime = 0;

function setup() {
  cv = createCanvas(windowWidth, windowHeight);
  cv.hide();
  frameRate(30);

  let hiddenCanvas = document.getElementById('hiddenCanvas');
  let hiddenContext = hiddenCanvas.getContext('2d');
  hiddenCanvas.width = windowWidth;
  hiddenCanvas.height = windowHeight;

  hiddenContext.fillStyle = 'black';
  hiddenContext.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();
  background(0);
  frameRate(30);

  let stream = cv.elt.captureStream(30);
  recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm; codecs=vp9'
  });

  recorder.ondataavailable = e => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  socket = io.connect(window.location.origin);

  socket.on('reset', function() {
    window.location.reload();
    console.log('Reset by refresh page.');
  });

  socket.on('start_record', function() {
    switchState();
    console.log('Start recording signal received');
  });

  socket.on('stop_and_play', function() {
    switchState();
    console.log('Stop and play signal received');
  });

  // switch two times to avoid weird black screen bug.
  avoidBlackScreenBug();
}

function avoidBlackScreenBug() {
  switchState();
  sleep(500).then(() => {
    switchState();
  });
  sleep(500).then(() => {
    background(255);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function draw() {
  if (start) {
    if (!isPlaying) {
      capture.loadPixels();
      for (let i = 0; i < 8000; i++) {
        let getX = random(capture.width);
        let getY = random(capture.height);
        let index = (int(getY) * capture.width + int(getX)) * 4;
        let r = capture.pixels[index];
        let g = capture.pixels[index + 1];
        let b = capture.pixels[index + 2];

        // 转换为灰度
        let gray = (r + g + b) / 3;

        // 如果灰度非常低（接近黑色），替换为蓝色，否则为白色
        if (gray < 120) { // 调整这个阈值来决定何种灰度级别被视为“最黑”
          r = 10;
          g = 10;
          b =70;

        } else if (gray < 70) {
          r = 50;
          g = 50;
          b = 100;
        }

        else {
          r = 220;
          g = 220
          b = 220;
        }

        let col = color(r, g, b, 100);

        let x = map(getX, 0, 640, 0, width);
        let y = map(getY, 0, 480, 0, height);
        let length = map(brightness(col), 0, 255, 10, 120);
        let angle = map(brightness(col), 0, 255, 0, PI);
        noStroke();
        fill(col, 127);
        push();
        translate(x, y);
        rectMode(CENTER);
        rotate(angle);
        ellipse(0, 0, length, 2);
        pop();
      }

      if (recordedChunks.length > 0 ) {
        let videoBlob = new Blob(recordedChunks, {
          type: 'video/webm'
        });
        video = createVideo(URL.createObjectURL(videoBlob), videoLoaded);
        video.hide(); // 隐藏 HTML 视频元素
        isPlaying = true;
        loadVideo = false;
      }
    } else { // isPlaying
      if (video) {
        // 计算缩放比例和居中位置
        let videoAspectRatio = capture.width / capture.height;
        let canvasAspectRatio = width / height;
        let renderWidth, renderHeight;
  
        if (canvasAspectRatio > videoAspectRatio) {
          // 画布比视频宽，根据高度来缩放视频
          renderHeight = height;
          renderWidth = renderHeight * videoAspectRatio;
        } else {
          // 画布比视频高，根据宽度来缩放视频
          renderWidth = width;
          renderHeight = renderWidth / videoAspectRatio;
        }
  
        // 计算视频居中显示的坐标
        let x = (width - renderWidth) / 2;
        let y = (height - renderHeight) / 2;
        
        image(video, 0, 0, width, height);
      }
    }

    if (isRecording) {
      hiddenCanvas.style.display = 'block'; // 显示隐藏画布
      cv.hide();
    } else { // finished recording
      if (switchTime >=2) {
        hiddenCanvas.style.display = 'none'; // 显示隐藏画布
        cv.show();
      }
    }  
  } else { // not Start
    hiddenCanvas.style.display = 'block'; // 显示隐藏画布
    cv.hide()
  }
  console.log("record:"+isRecording,"playing:"+isPlaying)
}

function keyPressed() {
  if (key === '1') {
    switchState();
  }
}

function switchState() {
    if (recorder.state === 'inactive') {
      switchTime += 1;
      start = true;
      recordedChunks = []; // 清空之前的录制
      recorder.start();
      isRecording = true;
      isPlaying = false;
      console.log('Recording started');
    } else {
      recorder.stop();
      isRecording = false;
      console.log('Recording stopped');
      loadVideo = true;
    }
}

function videoLoaded() {
  video.loop(); // 设置视频循环播放
  video.volume(0); // 如果不需要音频，可以将音量设置为0
}
