
let views = {
    Document: {view: { shape:'image' }, props: [{image:'./example-document.jpg'}, { size:45}]}
  // , Validator: {view: { shape:'image' }, props: [{image:'./contract-signing.png'}, { size:45}]}
    
}

export const buildNodeView = (node) => {
    if (node.nodeClass) {
        let view = views[node.nodeClass] ? views[node.nodeClass].view : {}
       
        let ret = {...view}
        
        let props = views[node.nodeClass] ? views[node.nodeClass].props : [] 
            props.forEach(p => {
              
                let prop = Object.keys(p)[0];
                console.log(prop);
               if (node[prop] === undefined) {
                ret = {...ret, ...p}
            }
            }); 
            return ret;
        } 
    else { 
        return {} 
    }
   
} ;