import { type Route } from '../route/types';
const safe={kind:'node' as const,nodeId:'node-t3-sanctuary'};
const recovered={type:'fullyRecovered' as const};
const common={version:'1.0.0',classRoot:'energy-root',frameId:'energy-heavy',stopOnFirstDeath:true,description:'Bounded named-checkpoint infrastructure demonstration, not a Volcano balance result.',completion:recovered,milestones:[]};
export const NAMED_CHECKPOINT_ROUTES: Route[]=[
  {...common,id:'checkpoint-pre-volcano-capture',startsFromTierEntry:3,steps:[
    {type:'farm',at:safe,until:recovered,observeForMs:2000,stepTimeoutMs:60000},
    {type:'captureCheckpoint',boundaryId:'pre-volcano-rested'},
    {type:'captureCheckpoint',boundaryId:'pre-volcano-rested-second'},
    {type:'assert',condition:recovered},
  ]},
  ...['baseline','desert-boots'].map((arm):Route=>({...common,id:`checkpoint-pre-volcano-${arm}`,
    progressionEntry:{boundaryId:'pre-volcano-rested',nodeId:safe.nodeId,tier:3,revisionPolicy:'same-revision',prerequisites:[{type:'playerTierAtLeast',tier:3},recovered]},
    steps:[
      ...(arm==='desert-boots'?[{type:'assert' as const,condition:{type:'canCraft' as const,recipeId:'desert-boots-t2'},code:'INVALID_TREATMENT' as const},{type:'craft' as const,recipeIds:['desert-boots-t2']},{type:'equip' as const,definitionIds:['desert-boots-t2']},{type:'assert' as const,condition:{type:'equipped' as const,definitionId:'desert-boots-t2'},code:'INVALID_TREATMENT' as const}]:[]),
      {type:'milestone',id:'measurement-start'},
      {type:'farm',at:safe,until:recovered,observeForMs:3000,stepTimeoutMs:30000},
      {type:'captureCheckpoint',boundaryId:`pre-volcano-${arm}-finished`},
      {type:'assert',condition:recovered},
    ]})),
];
