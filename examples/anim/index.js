const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const fs = require('fs');

// TODO: allow a config.json file to be used for configuring params
// TODO: make chromeFlags configurable from command line
//const chromeFlags = [ '--window-size=1280,720', '--headless' ];
const chromeFlags = [ '--window-size=1280,721'];
// const chromeFlags = [];

// TODO: allow configuring of launch url from command line -url
let launchChromeUrl = 'http://localhost:8000/create-anim-file.html';

// capture the meta data for all the animation frames
let frames = [];

// folder where we are storing the frames
let uniqueFolderName="";

// if we end early then
process.on('SIGINT', () => {
    // complete the animation processing for the downloaded frames
    completeOutput(frames);
});



chromeLauncher.launch({
    startingUrl: launchChromeUrl,
    chromeFlags: chromeFlags
  }).then(chrome => {
    console.log(`Chrome debugging port running on ${chrome.port}`);

    CDP({port: chrome.port}, async (client) => {
        const {Page, Runtime} = client;

        await Page.enable();
        await Page.bringToFront();
        //console.log("opening page");
        //await Page.navigate({url: 'http://localhost:8000/output.demo.html'});
        console.log("waiting for load");
        await Page.loadEventFired();
    
        // TODO: inject the dot file here and pass to the anim url
        //console.log("sleeping");
        //const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
        //await sleep(3000);
        //console.log("starting");
        //await Page.handleJavaScriptDialog({accept: true});

        await Page.startScreencast({format: 'png', everyNthFrame: 1});
        
        uniqueFolderName = Date.now().toString();
        if (!fs.existsSync(uniqueFolderName)){
            fs.mkdirSync(uniqueFolderName);
        }

        // TODO: stop when variable stopping is true
        let finished = false;
        let counter=0;
        let MAX_FRAME_COUNT = 1000;
        let lastTime= Date.now();
 
        while(!finished){

          //TODO: have a timeout here so that if there is no frame in TIMEOUT seconds then treat it as finished
          const {data, metadata, sessionId} = await Page.screencastFrame();
          await Page.screencastFrameAck({sessionId: sessionId});

          // calculate how long the previous frame was shown for
          let currentTime = Date.now();
          let timeIndex = currentTime - lastTime;
          lastTime= currentTime;

          //todo - get x,y,width, height of svg at each frame

          // I seem get slightly more frames if I write them to memory
          // TODO: make memory or writing to file an option
        //   fs.writeFileSync("./" + uniqueFolderName + "/" + 'screen-' + 
        //                     counter.toString().padStart(10,"0") +
        //                      '.png', Buffer.from(data, 'base64'));
        // frames.push({counter: counter, previousFrameDuration: timeIndex})
          frames.push({counter: counter, previousFrameDuration: timeIndex, base64:Buffer.from(data, 'base64') })
          counter += 1;

          const finishedAnim = await Runtime.evaluate({expression: 'window.stopping'});
          console.log(finishedAnim);

          console.log(metadata.timestamp);
          if( counter > MAX_FRAME_COUNT || finishedAnim.result.value==true){
            finished=true;
          }
        }
        
        console.log(frames.length);
        await client.close();
        chrome.kill();

    });

  });

function completeOutput(framesToProcess){

    // write or rename files for metadata
    for(frame of framesToProcess){
        let frameDuration = 0;
        if(frame.counter+1 < framesToProcess.length){
            frameDuration = framesToProcess[frame.counter+1].previousFrameDuration;
        }
        frame.frameDuration=frameDuration;

        if(frame.base64===undefined){
            // TODO: rename the file to include the duration in the filename
        }else{  
            // ignore the final frame that was used to stop the recording     
            if(frame.frameDuration>0){
                fs.writeFileSync("./" + uniqueFolderName + "/" + 'screen-' + 
                            frame.counter.toString().padStart(10,"0") +
                            "-" + frame.frameDuration.toString() +
                            '.png', frame.base64);
            }   
        }
    }
    
};

//const chromeFlags = [ '--window-size=1280,720', '--headless' ];
//const chromeFlags = [ '--window-size=1280,720'];
// const chromeFlags = [];
// chromeLauncher.launch({ port: 9222, startingUrl: 'http://localhost:8000/create-anim-file.html', chromeFlags:  chromeFlags }).then(function(chrome) {
//   CDP(async (client) => {
//     const {Page} = client;

//     await Page.enable();
//     await Page.bringToFront();
//     console.log("opening page");
//     await Page.navigate({url: 'http://localhost:8000/create-anim-file.html'});
//     console.log("waiting for load");
//     //await Page.loadEventFired();

//     console.log("sleeping");
//     const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
//     await sleep(3000);
//     console.log("starting");

//     await Page.handleJavaScriptDialog({accept: true});
//     await Page.startScreencast({format: 'png', everyNthFrame: 1});
    
//     let counter = 0;
//     while(counter < 25){
//       const {data, metadata, sessionId} = await Page.screencastFrame();
//       await Page.screencastFrameAck({sessionId: sessionId});
      
//       fs.writeFileSync('screen-' + counter + '.png', Buffer.from(data, 'base64'));
//       counter += 1;

//       console.log(metadata.timestamp);
//     }
    
//     await client.close();
//     chrome.kill();
//   });
// });