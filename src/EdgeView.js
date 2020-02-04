
let views = {
    Follows: {view: { color:'orange' }, props: [{font: {align:'middle'}}]}
 
}

export const buildEdgeView = (edge) => {
   
    if (edge.edgeClass) {
        let view = views[edge.edgeClass] ? views[edge.edgeClass].view : {}
       
        let ret = {...view}
        
        let props = views[edge.edgeClass] ? views[edge.edgeClass].props : [] 
            props.forEach(p => {
              
                let prop = Object.keys(p)[0];
                console.log(prop);
               if (edge[prop] === undefined) {
                ret = {...ret, ...p}
            }
            }); 
            return ret;
        } 
    else { 
        return {} 
    }
  
} ;