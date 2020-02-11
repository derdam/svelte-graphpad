
let views = {
    Document: {view: { shape:'image' }, props: [{image:'./example-document.jpg'}, { size:45}]}
   
    ,Node: { view: {shape:'ellipse'}, props:[]}
    ,Data: { view: {'shape': 'box', 'font': {'face': 'monospace', 'align': 'left'}}, props:[]}
    ,Address: { view: {'shape': 'box', color:"#222222",  'font': {'face': 'monospace', size:10, 'align': 'left'}}, props:[]}
    ,Person: { view: {'shape': 'box', color:"#223344",  'font': {'face': 'monospace', size:10, 'align': 'left'}}, props:[]}
   
  //  ,Youtube: {view: { shape:'image' }, props: [{image:'./example-document.jpg'}, { size:45}]}
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