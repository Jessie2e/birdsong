// Detection windows are approximate model spans, never isolated chirp timestamps.
export function detectionWindows(segments,matches,threshold=.35){
 const windows=[];
 for(const match of matches||[]){let previous=null;for(const segment of [...segments].sort((a,b)=>a.start-b.start)){if(!segment.detections.some(d=>d.scientificName===match.scientificName&&d.score>=threshold))continue;if(previous&&segment.start<=previous.end+.001)previous.end=Math.max(previous.end,segment.end);else{previous={scientificName:match.scientificName,start:segment.start,end:segment.end};windows.push(previous);}}}
 return windows;
}
