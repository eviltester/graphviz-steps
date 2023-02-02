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
//let launchChromeUrl = 'https://google.com';
let frameTimoutMillis = 5000;

// capture the meta data for all the animation frames
let frames = [];

// folder where we are storing the frames
let uniqueFolderName="";

// if we end early then
process.on('SIGINT', () => {
    // complete the animation processing for the downloaded frames
    // TODO: mark the last frame in frames as the last frame
    // TODO: introduce a lastFrame property in the frame objects, if true then it is the last frame
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

          // have a timeout here so that if there is no frame in frameTimoutMillis then treat it as finished
          // https://advancedweb.hu/how-to-add-timeout-to-a-promise-in-javascript/
          const timeout = (prom, time) => {
            let timer;
            return Promise.race([
                prom,
                new Promise((_r, rej) => timer = setTimeout(rej, time))
            ]).catch(()=>{/* ignore timeout */}).finally(() => clearTimeout(timer));
            }

          const result = await timeout(Page.screencastFrame(),frameTimoutMillis);

        // TODO calculate an average frames per second  
        // calculate how long the previous frame was shown for
        let currentTime = Date.now();
        let timeIndex = currentTime - lastTime;
        lastTime= currentTime;

        let finishedAnim=false;

          if(result!=undefined){
            const {data, metadata, sessionId} = result;

            await Page.screencastFrameAck({sessionId: sessionId});
            //TODO: get x,y,width, height of svg at each frame
  
            // I seem get slightly more frames if I write them to memory
            // TODO: make memory or writing to file an option
          //   fs.writeFileSync("./" + uniqueFolderName + "/" + 'screen-' + 
          //                     counter.toString().padStart(10,"0") +
          //                      '.png', Buffer.from(data, 'base64'));
          // frames.push({counter: counter, previousFrameDuration: timeIndex})
            frames.push({counter: counter, previousFrameDuration: timeIndex, base64:Buffer.from(data, 'base64') });
            
            finishedAnim = await Runtime.evaluate({expression: 'window.stopping'});

            console.log(metadata?.timestamp);
  
          }else{
            console.log("exceeded time to wait for frame, ending animation");
            frames.push({counter: counter, previousFrameDuration: timeIndex, base64:""});
            finishedAnim={result:{value: true}};
          }


          counter += 1;
          console.log(finishedAnim);

          if( counter > MAX_FRAME_COUNT || finishedAnim.result.value==true){
            finished=true;
          }
        }
        
        // TODO: consider adding this into the sigterm closing process otherwise we have dangling browsers
        console.log(frames.length);
        await client.close();
        chrome.kill();

        completeOutput(frames);

    });

  });

function completeOutput(framesToProcess){

    // write or rename files for metadata
    console.log("Generating image files");
    for(frame of framesToProcess){
        let frameDuration = 0;
        if(frame.counter+1 < framesToProcess.length){
            frameDuration = framesToProcess[frame.counter+1].previousFrameDuration;
        }
        frame.frameDuration=frameDuration;

        if(frame.base64===undefined){
            // TODO: rename any files written file to include the duration in the filename
        }else{  
            // ignore the final frame that was used to stop the recording
            // TODO: unless sigterm was involved    
            if(frame.frameDuration>0){
                const filename = 'screen-' + 
                frame.counter.toString().padStart(10,"0") +
                "-" + frame.frameDuration.toString() +
                '.png';

                console.log(filename);
                fs.writeFileSync("./" + uniqueFolderName + "/" + filename, frame.base64);
                frame.filename = filename;
            }   
        }
    }
    console.log("Generated image files");

    // now generate the mp4
    console.log("Generating mp4 file");

    var input = "-pattern_type glob -i './" + uniqueFolderName + "/" + "*.png'";
    var videocodec = "-vcodec libx264";
    var outputFormat = "-f mp4";
    var picFormat = '-pix_fmt yuv420p';

    // tried fluent-ffmpeg but could never get the output file correct
    // TODO: try with -l 1 -t duration instead of filter to see if get more accurate timing
    let filterOptions = `-vf "zoompan=d=1`

    for(frame of framesToProcess){
        if(frame.frameDuration>0){
             if(millisToFrames(frame.frameDuration,30)>1){
                filterOptions=filterOptions + "+'" + millisToFrames(frame.frameDuration,30) + "*eq(in," + (frame.counter) + ")'"
            }
        }       
    }
    filterOptions = filterOptions + `"`;
    var outFps = "-r 30";
    var outputFile = "./" + uniqueFolderName + "/" + 'outputanim.mp4';
    
    var ffmpegArgs = [input, videocodec, picFormat, outputFormat, outFps, filterOptions, outputFile];

    spawnArgs = [];
    for(arg of ffmpegArgs){
        spawnArgs = spawnArgs.concat(arg.split(" "));
    }

    const { spawn } = require( 'child_process' );
const runCommand = spawn( 'ffmpeg', spawnArgs, {shell:true} );

console.log("ffmpeg " + spawnArgs.join(" "));

runCommand.stdout.on( 'data', ( data ) => {
    console.log( `stdout: ${ data }` );
} );

runCommand.stderr.on( 'data', ( data ) => {
    console.log( `stderr: ${ data }` );
} );

runCommand.on( 'close', ( code ) => {
    console.log( `child process exited with code ${ code }` );
} );
};

function millisToFrames(millis,fps){
    const millisPerFrame = 1000/fps;
    // slightly overcalculate the frames
    //return Math.ceil(millis/millisPerFrame);

    // slightly undercalculate the frames
    const frames = Math.floor(millis/millisPerFrame);
    // but at a minimum make it 1 frame
    //console.log(frames==0 ? 1 : frames);
    return frames==0 ? 1 : frames;
}

function millisToDuration(millis){
    //'[[hh:]mm:]ss[.xxx]'
    return (millis/1000).toFixed(3).toString();
}
