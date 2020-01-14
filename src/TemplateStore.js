import { nodes, edges } from './GraphStore.js';

export function sampleDocumentNode(docEditor) {
    return {shape: 'image',  nodeEditor:docEditor, size:45, image: './Austrian_ID_card.jpg'}
  }
   export function sampleLegalDocumentNode(docEditor) {
    return {shape: 'image',  nodeEditor:docEditor, size:45, image: './contract-signing.png'}
  }

export function   addNewSingleAccount(docEditor) {
    //  let x = `${someone} was looking for ${something} in the general vicinity of ${somewhere}`;
      nodes.add([
        {id: "sa_mandate", label: "New\nMandate"},
        {id: "sa_ah1", label: "Account\nHolder"},
        {id: "sa_bo1", label: "Beneficial\nOwner"},
        {id: "sa_np1", label: "Natural\nPerson"},
        {id: "sa_np1_id", label: "ID Card", ...sampleDocumentNode(docEditor)},
        {id: "sa_ah1_doc0", label: "Form 0", ...sampleLegalDocumentNode(docEditor)},
        {id: "sa_bo1_doc4", label: "Form 4", ...sampleLegalDocumentNode(docEditor)},
       
        
      ]);
      edges.add([
        {from: "sa_mandate", to:"sa_ah1"},
        {from: "sa_mandate", to:"sa_bo1"},
        {from: "sa_ah1", to:"sa_np1"},
        {from: "sa_bo1", to:"sa_np1"},
        {from: "sa_np1", to:"sa_np1_id"},
        {from: "sa_ah1", to:"sa_ah1_doc0"},
          {from: "sa_bo1", to:"sa_bo1_doc4"},
      ]);

    }
