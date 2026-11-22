// Conservative heuristics inspired by WCAG opposing luminance transitions.
// This is not a WCAG conformance measurement or clinical detector.
const LINEAR = Float32Array.from({length:256},(_,value)=>{
  const normalized=value/255;
  return normalized<=.04045?normalized/12.92:((normalized+.055)/1.055)**2.4;
});
export class Detector {
  constructor(){this.previous=null;this.events=[];this.intervals=[];}
  push(time,rgba){
    const n=rgba.length/4, values=new Float32Array(n*2);
    if(!Number.isFinite(time) || time<0 || (this.time!==undefined && time<=this.time))throw new RangeError('Frame timestamps must increase');
    if(rgba.length!==96*54*4)throw new RangeError('Expected a 96 by 54 RGBA frame');
    this.time=time;
    let up=0,down=0,red=0,edges=0;
    for(let i=0;i<n;i++){
      const r=LINEAR[rgba[i*4]],g=LINEAR[rgba[i*4+1]],b=LINEAR[rgba[i*4+2]];
      const lum=.2126*r+.7152*g+.0722*b;
      values[i*2]=lum;values[i*2+1]=r/(r+g+b || 1)>=.8?r:0;
      if(this.previous){const before=this.previous[i*2],d=lum-before;if(Math.min(lum,before)<.8){if(d>=.1)up++;if(d<=-.1)down++;}if(Math.abs(values[i*2+1]-this.previous[i*2+1])>.2)red++;}
      if(i%96 && Math.abs(lum-values[(i-1)*2])>.5)edges++;
    }
    this.previous=values;
    const sign=up/n>.05?1:down/n>.05?-1:0;
    if(sign && sign!==this.lastSign){this.events.push({time,kind:'luminance'});this.lastSign=sign;}
    if(red/n>.05)this.events.push({time,kind:'red'});
    this.events=this.events.filter(e=>e.time>=time-1);
    if(this.events.filter(e=>e.kind==='luminance').length>=6 || this.events.filter(e=>e.kind==='red').length>=6 || edges/n>.35)this.add(Math.max(0,time-1.25),time+.5);
  }
  add(start,end){const last=this.intervals.at(-1);if(last && start<=last.end+.25)last.end=Math.max(last.end,end);else this.intervals.push({start,end});}
}
export function covered(time,intervals){
  if(!Number.isFinite(time))return false;
  let low=0,high=intervals.length-1;
  while(low<=high){const mid=(low+high)>>>1,interval=intervals[mid];if(time<interval.start)high=mid-1;else if(time>interval.end)low=mid+1;else return true;}
  return false;
}
