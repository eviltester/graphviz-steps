!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("GraphvizSteps",[],t):"object"==typeof exports?exports.GraphvizSteps=t():e.GraphvizSteps=t()}(self,(()=>(()=>{"use strict";var e={864:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.GraphvizStepParser=t.GraphvizStep=t.DirectiveInstance=t.getStartStepsEnd=t.getDirective=t.getDirectiveFromLine=t.dotLineSplit=void 0;const n=[{name:"STEP",regex:/^(\s)*STEP([\s-]*)([\w \d]*)?(\s)*$/},{name:"END",regex:/^(\s)*END([\s-]*)?([\w \d]*)?(\s)*$/},{name:"DIRECTIVE",regex:/^(\s)*DIRECTIVE([\s-]*)?([\w \d]*)?(\s)*$/},{name:"UNCOMMENT_//",regex:/^(\s)*UNCOMMENT_\/\/(\s)*$/},{name:"DISABLE_STEP",regex:/^(\s)*DISABLE_STEP([\s-]*)([\w \d]*)?(\s)*$/},{name:"ENABLE_STEP",regex:/^(\s)*ENABLE_STEP([\s-]*)([\w \d]*)?(\s)*$/}];function s(e){return e.split("\n")}function r(e){const t=e.trim();return t.startsWith("#")?o(t.substring(1).trim()):p}function o(e){for(const t of n){const n=e.match(t.regex);if(null!=n)return new a(t.name,e,n)}return p}function i(e){let t="",n=[],s="",o="START",i="",a=new c;return e.forEach((e=>{if(function(e){return r(e)!=p}(e)){const s=r(e);switch(s.name){case"STEP":"STEP"==o&&(a.content=i,n.push(a),a=new c,a.name=s.getContent(),i="",o="STEP"),"START"==o&&(t=i,i="",o="STEP",a=new c,a.name=s.getContent());break;case"DIRECTIVE":"STEP"==o&&(a.content=i,n.push(a),a=new c,a.name=s.getContent(),a.type="DIRECTIVE",i="",o="STEP"),"START"==o&&(t=i,i="",o="STEP",a=new c,a.type="DIRECTIVE",a.name=s.getContent());break;case"END":"STEP"==o&&(a.content=i,n.push(a),a=new c,a.name=s.getContent(),i="",o="END"),"START"==o&&(t=i,i="",o="END");break;default:a.directives.push(s)}}else i=i+e+"\n"})),i.length>0&&("START"==o&&(t=i),"END"==o&&(s=i),"STEP"==o&&(console.log("graph has steps but no END so likely to be malformed output, last STEP will default to END"),s=i)),{start:t,steps:n,end:s}}t.dotLineSplit=s,t.getDirectiveFromLine=r,t.getDirective=o,t.getStartStepsEnd=i;class a{constructor(e,t,n){this.name=e,this.unparsed=t,this.parsed=n}getContent(){var e;return this.parsed&&this.parsed.length>=4&&null!==(e=this.parsed.at(3))&&void 0!==e?e:""}}t.DirectiveInstance=a;const p=new a("","");class c{constructor(){this.type="STEP",this.name="",this.content="",this.directives=[],this.enabled=!0}getProcessedContent(){let e=this.content;for(const t of this.directives)if("UNCOMMENT_//"==t.name){let t=e.split("\n");t=t.map((e=>e.trim().startsWith("//")?e.replace("//",""):e)),e=t.join("\n")}return e}}t.GraphvizStep=c,t.GraphvizStepParser=class{constructor(){this.dotVersions=[]}parse(e){const t=s(e),{start:n,steps:r,end:o}=i(t);this.dotVersions.push(n+o);let a=0;r.forEach((e=>{let t=0,s="";for("DIRECTIVE"==r[a].type&&function(e,t,n){for(let s=0;s<=n;s++){const n=t[s];for(const t of e)"DISABLE_STEP"==t.name&&"STEP"==n.type&&n.name==t.getContent()&&(n.enabled=!1),"ENABLE_STEP"==t.name&&"STEP"==n.type&&n.name==t.getContent()&&(n.enabled=!0)}}(r[a].directives,r,a);t<=a;)"STEP"==r[t].type&&r[t].enabled&&(s+=r[t].getProcessedContent()),t++;"STEP"==e.type&&this.dotVersions.push(n+s+o),a++}))}}}},t={};function n(s){var r=t[s];if(void 0!==r)return r.exports;var o=t[s]={exports:{}};return e[s](o,o.exports,n),o.exports}var s={};return(()=>{var e=s;Object.defineProperty(e,"__esModule",{value:!0}),e.GraphvizStepParser=void 0;const t=n(864);Object.defineProperty(e,"GraphvizStepParser",{enumerable:!0,get:function(){return t.GraphvizStepParser}})})(),s})()));